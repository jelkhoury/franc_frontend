import React, { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import { get, post, postForm } from "../../utils/httpServices";
import { captureError } from "../../utils/sentryUtils";
import { BLOB_STORAGE_ENDPOINTS, MOCK_INTERVIEW_ENDPOINTS, USER_ENDPOINTS } from "../../services/apiService";
import {
  Box,
  Text,
  VStack,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  Heading,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Textarea,
  Spinner,
  useToast,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  HStack,
  Flex,
  Badge,
  Divider,
} from "@chakra-ui/react";

/** Split multiline tips into bullet lines (non-empty, trimmed). */
function parseTipsLines(raw) {
  if (raw == null || String(raw).trim() === "") return [];
  return String(raw)
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function filenameFromContentDisposition(disposition, fallback) {
  if (!disposition) return fallback;

  const encodedMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1].replace(/["']/g, ""));
    } catch {
      return encodedMatch[1].replace(/["']/g, "");
    }
  }

  const plainMatch = disposition.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] || fallback;
}

/**
 * Parse GET GetEvaluationsByMockInterviewId / merged-evaluations payloads.
 * Rows use evaluateQuestionId, rating, comment, tips (null until evaluated).
 */
function pickMergedEvaluationRows(payload) {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload;
  const tryArrays = [
    payload.evaluations,
    payload.Evaluations,
    payload.evaluateQuestions,
    payload.EvaluateQuestions,
    payload.mergedEvaluations,
    payload.MergedEvaluations,
    payload.answerEvaluations,
    payload.items,
    payload.Items,
  ];
  for (const arr of tryArrays) {
    if (Array.isArray(arr)) return arr;
  }
  const answers = payload.answers ?? payload.Answers;
  if (Array.isArray(answers)) return answers;
  return [];
}

function getMergedRowAnswerId(row) {
  if (row == null) return null;
  return (
    row.answerId ??
    row.AnswerId ??
    row.answer?.answerId ??
    row.Answer?.AnswerId ??
    null
  );
}

/** Map merged API rows onto `reviews` keys (answer index → { rating, comments, tips }). */
function evaluationsMergedToReviewsMap(orderedAnswers, rows) {
  const byAnswerId = new Map();
  for (const row of rows) {
    const aid = getMergedRowAnswerId(row);
    if (aid === null || aid === undefined) continue;
    const n = Number(aid);
    if (!Number.isFinite(n)) continue;
    byAnswerId.set(n, row);
  }
  const reviews = {};
  orderedAnswers.forEach((answer, index) => {
    const row = byAnswerId.get(Number(answer.answerId));
    if (!row) return;

    const evaluateQuestionId = row.evaluateQuestionId ?? row.EvaluateQuestionId;
    const hasEvaluateRow =
      evaluateQuestionId !== null &&
      evaluateQuestionId !== undefined &&
      `${evaluateQuestionId}`.trim() !== "";
    const ratingRaw = row.rating ?? row.Rating ?? null;
    const commentRaw = row.comment ?? row.Comment ?? null;
    const tipsRaw = row.tips ?? row.Tips ?? null;

    const hasNumericRating =
      ratingRaw !== null &&
      ratingRaw !== undefined &&
      ratingRaw !== "" &&
      Number.isFinite(parseInt(String(ratingRaw), 10));

    /** Row saved in EvaluateQuestions (FK) or has a persisted numeric rating */
    if (!hasEvaluateRow && !hasNumericRating) return;

    const ratingStr =
      ratingRaw !== null && ratingRaw !== undefined && ratingRaw !== ""
        ? String(Number(parseInt(String(ratingRaw), 10)))
        : "";

    reviews[index] = {
      ...(ratingStr ? { rating: ratingStr } : {}),
      comments: commentRaw != null ? String(commentRaw) : "",
      ...(tipsRaw != null && String(tipsRaw).trim() !== ""
        ? { tips: String(tipsRaw).trim() }
        : {}),
    };
  });
  return reviews;
}

function mergeSummaryAndSkillsFromMergedPayload(payload, { setOverallComment, setSkillRatings }) {
  const summary =
    payload?.summaryComment ??
    payload?.SummaryComment ??
    payload?.overallComment ??
    payload?.OverallComment ??
    null;
  if (summary != null && String(summary).trim() !== "") {
    setOverallComment(String(summary).trim());
  }

  const skillsArr = payload?.skillScores ?? payload?.SkillScores;
  if (!Array.isArray(skillsArr) || skillsArr.length === 0) return;
  const next = {};
  for (const s of skillsArr) {
    const code = s.skillCode ?? s.SkillCode;
    const ratingVal = s.rating ?? s.Rating;
    if (code === null || code === undefined || ratingVal === null || ratingVal === undefined) {
      continue;
    }
    const codeKey = String(code).trim().toUpperCase();
    const n = parseInt(String(ratingVal), 10);
    if (!Number.isFinite(n)) continue;
    next[codeKey] = n;
  }
  if (Object.keys(next).length === 0) return;
  setSkillRatings((prev) => {
    const out = { ...prev };
    for (const def of MOCK_INTERVIEW_SKILL_RUBRIC) {
      const key = String(def.skillCode).trim();
      const u = key.toUpperCase();
      const v = next[u] ?? next[key];
      if (v !== undefined && Number.isFinite(v)) out[def.skillCode] = v;
    }
    return out;
  });
}

/** Rubric aligned with POST /api/evaluation/create-report `skillScores`. */
const MOCK_INTERVIEW_SKILL_RUBRIC = [
  {
    skillCode: "A1",
    heading: "A.1 Verbal Communication",
    skillName: "Communication Clarity",
  },
  {
    skillCode: "A2",
    heading: "A.2 Verbal Communication",
    skillName: "Confidence / Tone of Voice",
  },
  {
    skillCode: "B1",
    heading: "B.1 Non Verbal Communication",
    skillName: "Posture",
  },
  {
    skillCode: "B2",
    heading: "B.2 Non Verbal Communication",
    skillName: "Body Language",
  },
  {
    skillCode: "C",
    heading: "C",
    skillName: "Engagement & Enthusiasm",
  },
  {
    skillCode: "D",
    heading: "D",
    skillName: "Time Management",
  },
  {
    skillCode: "E",
    heading: "E",
    skillName: "Critical Thinking",
  },
];

const ManageMockInterviews = () => {
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [questionFilter, setQuestionFilter] = useState("all");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSkillScores, setShowSkillScores] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [skillRatings, setSkillRatings] = useState({});
  const [overallComment, setOverallComment] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingEvaluations, setLoadingEvaluations] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmittingEvaluation, setIsSubmittingEvaluation] = useState(false);
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const toast = useToast();
  const videoRef = useRef(null);

  // Review state per question (can be enhanced with more fields and real save)
  const [reviews, setReviews] = useState({});

  // Function definitions
  const updateReview = (field, value) => {
    setReviews((prev) => ({
      ...prev,
      [currentQuestionIndex]: {
        ...prev[currentQuestionIndex],
        [field]: value,
      },
    }));
  };

  const submitAllEvaluations = async () => {
    if (isSubmittingAll) return false;

    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "Please log in again",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return false;
    }

    let evaluatorId;
    try {
      const tokenData = JSON.parse(atob(token.split(".")[1]));
      evaluatorId = parseInt(
        tokenData[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ]
      );
    } catch {
      toast({
        title: "Authentication Error",
        description: "Invalid session token. Please log in again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return false;
    }

    const evaluations = selectedInterview.answers
      .map((answer, index) => {
        const review = reviews[index] || {};
        if (review.rating && review.comments) {
          const tipsText =
            review.tips != null && String(review.tips).trim() !== ""
              ? String(review.tips).trim()
              : null;
          return {
            answerId: answer.answerId,
            rating: parseInt(review.rating),
            comment: review.comments,
            ...(tipsText ? { tips: tipsText } : {}),
          };
        }
        return null;
      })
      .filter((evaluation) => evaluation !== null);

    if (evaluations.length === 0) {
      toast({
        title: "No Evaluations",
        description:
          "Please provide ratings and comments for at least one question",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    try {
      setIsSubmittingAll(true);
      const result = await post(
        MOCK_INTERVIEW_ENDPOINTS.EVALUATE_MULTIPLE,
        {
          evaluatorId: evaluatorId,
          evaluations: evaluations,
        },
        { token }
      );
      toast({
        title: "All Evaluations Saved",
        description: result.message,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      return true;
    } catch (error) {
      captureError(error);
      console.error("Error submitting evaluations:", error);
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return false;
    } finally {
      setIsSubmittingAll(false);
    }
  };

  const submitSingleEvaluation = async (answerId, rating, comment) => {
    if (isSubmittingEvaluation) return;
    
    try {
      setIsSubmittingEvaluation(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setIsSubmittingEvaluation(false);
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Decode token to get evaluator ID
      const tokenData = JSON.parse(atob(token.split(".")[1]));
      const evaluatorId = parseInt(
        tokenData[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ]
      );

      const tipsRaw = reviews[currentQuestionIndex]?.tips;
      const tipsPayload =
        tipsRaw != null && String(tipsRaw).trim() !== "" ? String(tipsRaw).trim() : null;

      const result = await post(
        MOCK_INTERVIEW_ENDPOINTS.EVALUATE,
        {
          answerId: answerId,
          evaluatorId: evaluatorId,
          rating: rating,
          comment: comment,
          ...(tipsPayload ? { tips: tipsPayload } : {}),
        },
        { token }
      );
      toast({
        title: "Evaluation Saved",
        description: result.message,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Return to summary after successful submission
      setEditMode(false);
      setShowSummary(true);
    } catch (error) {
      captureError(error);
      console.error("Error submitting evaluation:", error);
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmittingEvaluation(false);
    }
  };

  const generateEvaluationReport = async () => {
    if (isGeneratingReport) return;
    
    try {
      setIsGeneratingReport(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setIsGeneratingReport(false);
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Get user ID from the selected interview
      const userId = selectedInterview.userId;
      const answerIds = selectedInterview.answers.map(
        (answer) => answer.answerId
      );

      // Build per-answer ratings/comments from local review state (matches API answer shape)
      const answersPayload = selectedInterview.answers.map((answer, i) => {
        const rev = reviews[i] || {};
        const rawRating = rev.rating;
        const rating =
          rawRating !== undefined &&
          rawRating !== null &&
          rawRating !== ""
            ? parseInt(String(rawRating), 10)
            : null;
        const commentText = rev.comments != null ? String(rev.comments).trim() : "";
        const tipsText = rev.tips != null ? String(rev.tips).trim() : "";
        return {
          answerId: answer.answerId,
          questionId: answer.questionId,
          questionTitle: answer.questionTitle,
          videoUrl: answer.videoUrl,
          rating: Number.isFinite(rating) ? rating : null,
          comment: commentText ? commentText : null,
          tips: tipsText ? tipsText : null,
        };
      });

      const numericRatings = answersPayload
        .map((a) => a.rating)
        .filter((r) => r != null && !Number.isNaN(r));
      const overallRating =
        numericRatings.length > 0
          ? Math.round(
              (numericRatings.reduce((s, x) => s + x, 0) /
                numericRatings.length) *
                10
            ) / 10
          : null;

      if (numericRatings.length === 0) {
        toast({
          title: "Add ratings first",
          description:
            "Enter a rating for each question on the summary screen (or save evaluations) before generating the report.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const incompleteSkills = MOCK_INTERVIEW_SKILL_RUBRIC.filter(({ skillCode }) => {
        const r = skillRatings[skillCode];
        const n =
          r !== undefined && r !== null && r !== ""
            ? parseInt(String(r), 10)
            : NaN;
        return !Number.isFinite(n) || n < 1 || n > 5;
      });

      if (incompleteSkills.length > 0) {
        toast({
          title: "Complete skill scores",
          description:
            "Rate each interview skill from 1–5 before generating the report. Use Back to skill scores if needed.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const skillScores = MOCK_INTERVIEW_SKILL_RUBRIC.map(
        ({ skillCode, skillName }) => ({
          skillCode,
          skillName,
          rating: parseInt(String(skillRatings[skillCode]), 10),
        })
      );

      const mockInterviewId =
        selectedInterview.mockInterviewId ?? selectedInterview.MockInterviewId;

      const payload = {
        userId,
        answerIds,
        summaryComment: overallComment?.trim() || null,
        overallRating,
        answers: answersPayload,
        skillScores,
        ...(mockInterviewId != null ? { mockInterviewId } : {}),
      };

      const apiBaseUrl = (process.env.REACT_APP_API_BASE_URL || "").replace(/\/+$/, "");
      const reportResponse = await fetch(
        `${apiBaseUrl}${MOCK_INTERVIEW_ENDPOINTS.CREATE_REPORT}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!reportResponse.ok) {
        const contentType = reportResponse.headers.get("content-type") || "";
        let message = `Request failed with status ${reportResponse.status}`;
        if (contentType.includes("application/json")) {
          const err = await reportResponse.json();
          message = err?.error || err?.message || message;
        } else {
          const text = await reportResponse.text();
          message = text || message;
        }
        throw new Error(message);
      }

      const reportBlob = await reportResponse.blob();
      const fallbackFileName =
        mockInterviewId != null
          ? `MockInterviewReport_${mockInterviewId}.docx`
          : "MockInterviewReport.docx";
      const fileName = filenameFromContentDisposition(
        reportResponse.headers.get("content-disposition"),
        fallbackFileName
      );
      const reportFile = new File([reportBlob], fileName, {
        type:
          reportBlob.type ||
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      const emailSent = await sendReportToUser(reportFile, selectedInterview.userId);

      const url = window.URL.createObjectURL(reportBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Report Generated",
        description: emailSent
          ? "Evaluation report document has been generated, emailed, and downloaded"
          : "Evaluation report document has been generated and downloaded, but email sending failed",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      captureError(error);
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const generatePDF = (report) => {
    const tipsByAnswerId = {};
    if (selectedInterview?.answers?.length) {
      selectedInterview.answers.forEach((a, i) => {
        const raw = reviews[i]?.tips;
        if (raw != null && String(raw).trim() !== "") {
          tipsByAnswerId[a.answerId] = String(raw).trim();
        }
      });
    }

    // Create PDF content using jsPDF
    const doc = new jsPDF();

    // Set font
    doc.setFont("helvetica");
    doc.setFontSize(16);

    // Title
    doc.text("Mock Interview Evaluation Report", 105, 20, { align: "center" });

    // Generation date
    doc.setFontSize(10);
    doc.text(
      `Generated on: ${new Date(report.generatedAt).toLocaleString()}`,
      105,
      30,
      { align: "center" }
    );

    // Report Information
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Report Information", 20, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Report ID: ${report.id}`, 20, 60);
    doc.text(`User ID: ${selectedInterview.userId}`, 20, 70);
    doc.text(`Email: ${selectedInterview.email}`, 20, 80);
    doc.text(`Interview: ${selectedInterview.mockInterviewTitle}`, 20, 90);

    // Overall Rating + interview competency scores (layout uses shared vertical cursor pdfY)
    let pdfY = 110;
    doc.setFont("helvetica", "bold");
    doc.text("Overall Rating", 20, pdfY);
    pdfY += 10;
    doc.setFont("helvetica", "normal");
    if (report.overallRating) {
      doc.text(`${report.overallRating.toFixed(1)} / 5.0`, 20, pdfY);
    } else {
      doc.text("No ratings available", 20, pdfY);
    }

    const skillScoresForPdf =
      Array.isArray(report.skillScores) && report.skillScores.length > 0
        ? report.skillScores
        : MOCK_INTERVIEW_SKILL_RUBRIC.map(({ skillCode, skillName }) => ({
            skillCode,
            skillName,
            rating: parseInt(String(skillRatings[skillCode] ?? ""), 10),
          })).filter((x) => Number.isFinite(x.rating));

    pdfY += 14;
    doc.setFont("helvetica", "bold");
    doc.text("Interview skill scores (competencies, 1–5)", 20, pdfY);
    pdfY += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    if (skillScoresForPdf.length === 0) {
      if (pdfY > 270) {
        doc.addPage();
        pdfY = 20;
      }
      doc.text("Not recorded.", 20, pdfY);
      pdfY += 10;
    } else {
      skillScoresForPdf.forEach(({ skillCode, skillName, rating }) => {
        const line = `[${skillCode}] ${skillName}: ${rating} / 5`;
        const wrapped = doc.splitTextToSize(line, 172);
        wrapped.forEach((ln) => {
          if (pdfY > 270) {
            doc.addPage();
            pdfY = 20;
          }
          doc.text(ln, 20, pdfY);
          pdfY += 5;
        });
        pdfY += 4;
      });
    }

    pdfY += 6;
    if (pdfY > 260) {
      doc.addPage();
      pdfY = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.text("Question Evaluations", 20, pdfY);
    doc.setFont("helvetica", "normal");

    let yPosition = pdfY + 10;
    report.answers.forEach((answer, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.text(`Question ${index + 1}: ${answer.questionTitle}`, 20, yPosition);
      doc.setFont("helvetica", "normal");

      yPosition += 10;
      doc.text(
        `Rating: ${answer.rating ? `${answer.rating} / 5` : "Not rated"}`,
        20,
        yPosition
      );

      yPosition += 10;
      doc.setFont("helvetica", "bold");
      doc.text("Comment", 20, yPosition);
      yPosition += 7;
      doc.setFont("helvetica", "normal");
      const commentBlock = answer.comment || "No comment provided";
      const wrappedComment = doc.splitTextToSize(commentBlock, 170);
      wrappedComment.forEach((line) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, 20, yPosition);
        yPosition += 5;
      });

      const tipsMerged =
        tipsByAnswerId[answer.answerId] ||
        answer.tips ||
        answer.Tips ||
        "";
      const tipLines = parseTipsLines(tipsMerged);
      if (tipLines.length > 0) {
        yPosition += 4;
        if (yPosition > 245) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.text("Tips for improvement", 20, yPosition);
        yPosition += 8;
        doc.setFont("helvetica", "normal");
        tipLines.forEach((tip) => {
          const bulletLines = doc.splitTextToSize(`• ${tip}`, 165);
          bulletLines.forEach((line) => {
            if (yPosition > 250) {
              doc.addPage();
              yPosition = 20;
            }
            doc.text(line, 22, yPosition);
            yPosition += 5;
          });
        });
      }

      yPosition += 12;
    });

    // Summary Comment
    if (overallComment) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.text("Summary Comment", 20, yPosition);
      doc.setFont("helvetica", "normal");
      yPosition += 10;

      // Split long comments into multiple lines
      const words = overallComment.split(" ");
      let line = "";
      for (let word of words) {
        const testLine = line + word + " ";
        if (doc.getTextWidth(testLine) > 170) {
          doc.text(line, 20, yPosition);
          yPosition += 5;
          line = word + " ";
        } else {
          line = testLine;
        }
      }
      if (line) {
        doc.text(line, 20, yPosition);
      }
    }

    // Save PDF
    const pdfBlob = doc.output("blob");
    const pdfFile = new File(
      [pdfBlob],
      `evaluation-report-${report.id}-${selectedInterview.email}.pdf`,
      { type: "application/pdf" }
    );

    // Send PDF via email (disabled for testing — only local download below)
    // sendPDFToUser(pdfFile, selectedInterview.userId);

    // Download locally
    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `evaluation-report-${report.id}-${selectedInterview.email}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const sendReportToUser = async (reportFile, userId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return false;
      }

      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("reportFile", reportFile);

      const result = await postForm(USER_ENDPOINTS.SEND_PDF, formData, { token });
      toast({
        title: "Report Sent",
        description: result.message,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      return true;
    } catch (error) {
      captureError(error);
      console.error("Error sending report:", error);
      toast({
        title: "Email send failed",
        description: error.message,
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
  };

  const onNext = async () => {
    if (currentQuestionIndex === selectedInterview.answers.length - 1) {
      const saved = await submitAllEvaluations();
      if (saved) {
        setShowSkillScores(true);
      }
    } else {
      setCurrentQuestionIndex((i) => i + 1);
    }
  };

  const onPrevious = () => {
    if (showSummary) {
      setShowSummary(false);
      setShowSkillScores(true);
    } else if (showSkillScores) {
      setShowSkillScores(false);
      setCurrentQuestionIndex(selectedInterview.answers.length - 1);
    } else if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((i) => i - 1);
    }
  };

  const goToSummaryFromSkillScores = () => {
    const missing = MOCK_INTERVIEW_SKILL_RUBRIC.filter(({ skillCode }) => {
      const r = skillRatings[skillCode];
      const n =
        r !== undefined && r !== null && r !== ""
          ? parseInt(String(r), 10)
          : NaN;
      return !Number.isFinite(n) || n < 1 || n > 5;
    });

    if (missing.length > 0) {
      toast({
        title: "Complete skill scores",
        description:
          "Select a rating from 1–5 for every skill before continuing to the summary.",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setShowSkillScores(false);
    setShowSummary(true);
  };

  // Fetch interviews from API
  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoading(true);
        const data = await get(BLOB_STORAGE_ENDPOINTS.GET_ALL_GROUPED);
        setInterviews(data);
      } catch (err) {
        captureError(err);
        console.error("Error fetching interviews:", err);
        setError(err.message);
        toast({
          title: "Error loading interviews",
          description: err.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, [toast]);

  useEffect(() => {
    if (!selectedInterview) return undefined;

    setCurrentQuestionIndex(0);
    setShowSummary(false);
    setShowSkillScores(false);
    setEditMode(false);
    setReviews({});
    setOverallComment("");
    setSkillRatings({});

    const mockInterviewId =
      selectedInterview.mockInterviewId ?? selectedInterview.MockInterviewId;
    const hasMockId =
      mockInterviewId !== undefined &&
      mockInterviewId !== null &&
      `${mockInterviewId}`.trim() !== "";
    const answers = Array.isArray(selectedInterview.answers)
      ? selectedInterview.answers
      : [];

    let cancelled = false;

    const fetchMergedEvaluations = async () => {
      if (!hasMockId || answers.length === 0) return;

      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Can't load saved grades",
          description: "Please log in to load evaluations from the server.",
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      setLoadingEvaluations(true);
      try {
        const raw = await get(
          MOCK_INTERVIEW_ENDPOINTS.GET_EVALUATIONS_BY_MOCK_INTERVIEW_ID(mockInterviewId),
          { token }
        );
        if (cancelled) return;

        const payload = raw?.data ?? raw?.result ?? raw;
        const rows = pickMergedEvaluationRows(payload);
        const nextReviews = evaluationsMergedToReviewsMap(answers, rows);
        setReviews(nextReviews);
        mergeSummaryAndSkillsFromMergedPayload(payload, {
          setOverallComment,
          setSkillRatings,
        });
      } catch (err) {
        if (cancelled) return;
        captureError(err);
        console.warn("Merged evaluations unavailable:", err);
        toast({
          title: "Could not load saved evaluations",
          description: err.message ?? "Continuing with blank forms.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        if (!cancelled) {
          setLoadingEvaluations(false);
        }
      }
    };

    void fetchMergedEvaluations();

    return () => {
      cancelled = true;
      setLoadingEvaluations(false);
    };
  }, [selectedInterview, toast]);

  // Force video reload when answer changes
  useEffect(() => {
    if (
      selectedInterview &&
      selectedInterview.answers[currentQuestionIndex] &&
      videoRef.current
    ) {
      videoRef.current.load();
    }
  }, [currentQuestionIndex, selectedInterview]);

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.600">
          Loading interviews...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="red.500" fontSize="lg">
          Error: {error}
        </Text>
        <Button
          mt={4}
          colorScheme="blue"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Box>
    );
  }

  if (selectedInterview) {
    const mergedMockInterviewId =
      selectedInterview.mockInterviewId ?? selectedInterview.MockInterviewId;
    const needsMergedPayload =
      mergedMockInterviewId !== undefined &&
      mergedMockInterviewId !== null &&
      `${mergedMockInterviewId}`.trim() !== "";

    if (loadingEvaluations && needsMergedPayload) {
      return (
        <Box textAlign="center" py={16}>
          <Spinner size="xl" color="blue.500" />
          <Text mt={4} color="gray.600">
            Loading saved evaluations…
          </Text>
        </Box>
      );
    }

    if (showSummary) {
      return (
        <Box>
          <Button
            size="sm"
            mb={4}
            onClick={() => {
              setShowSummary(false);
              setShowSkillScores(true);
            }}
          >
            ← Back to skill scores
          </Button>
          <Heading color="brand.500" size="md" mb={2}>
            Summary of reviews
          </Heading>
          <Text fontSize="sm" color="gray.600" mb={6}>
            {selectedInterview.email} · {selectedInterview.mockInterviewTitle}
          </Text>
          {/* Desktop Table View */}
          <Box
            display={{ base: "none", md: "block" }}
            overflowX="auto"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="lg"
            boxShadow="sm"
          >
            <Table variant="simple" size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th w="48px">#</Th>
                  <Th minW="160px">Question</Th>
                  <Th w="88px">Rating</Th>
                  <Th minW="200px">Comments</Th>
                  <Th minW="200px">Tips</Th>
                  <Th w="72px"> </Th>
                </Tr>
              </Thead>
              <Tbody>
                {selectedInterview.answers.map((answer, i) => {
                  const review = reviews[i] || {};
                  const tipLines = parseTipsLines(review.tips);
                  return (
                    <Tr key={i}>
                      <Td>{i + 1}</Td>
                      <Td fontWeight="medium">{answer.questionTitle}</Td>
                      <Td>
                        {review.rating ? (
                          <Badge colorScheme="blue" variant="solid">
                            {review.rating}/5
                          </Badge>
                        ) : (
                          <Text color="gray.400">—</Text>
                        )}
                      </Td>
                      <Td whiteSpace="pre-wrap" maxW="280px" fontSize="sm">
                        {review.comments || "—"}
                      </Td>
                      <Td maxW="260px" verticalAlign="top">
                        {tipLines.length > 0 ? (
                          <Box as="ul" pl={4} m={0} fontSize="sm" sx={{ listStyleType: "disc" }}>
                            {tipLines.map((t, j) => (
                              <Box as="li" key={j} mb={0.5}>
                                {t}
                              </Box>
                            ))}
                          </Box>
                        ) : (
                          <Text color="gray.400" fontSize="sm">
                            —
                          </Text>
                        )}
                      </Td>
                      <Td>
                        <Button
                          size="xs"
                          colorScheme="brand"
                          onClick={() => {
                            setCurrentQuestionIndex(i);
                            setShowSummary(false);
                            setEditMode(true);
                          }}
                        >
                          Edit
                        </Button>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>

          {/* Mobile Card View */}
          <SimpleGrid
            columns={{ base: 1 }}
            spacing={4}
            display={{ base: "grid", md: "none" }}
          >
            {selectedInterview.answers.map((answer, i) => {
              const review = reviews[i] || {};
              return (
                <Card key={i} variant="outline">
                  <CardBody>
                    <VStack align="stretch" spacing={3}>
                      <Box>
                        <Text fontSize="xs" color="gray.500">
                          Question #{i + 1}
                        </Text>
                        <Text fontWeight="semibold" fontSize="sm">
                          {answer.questionTitle}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="xs" color="gray.500">
                          Rating
                        </Text>
                        {review.rating ? (
                          <Badge colorScheme="blue" variant="solid" fontSize="0.75rem">
                            {review.rating}/5
                          </Badge>
                        ) : (
                          <Text fontSize="sm">—</Text>
                        )}
                      </Box>
                      <Box>
                        <Text fontSize="xs" color="gray.500">
                          Comments
                        </Text>
                        <Text fontSize="sm" whiteSpace="pre-wrap">
                          {review.comments || "—"}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="xs" color="gray.500">
                          Tips
                        </Text>
                        {parseTipsLines(review.tips).length > 0 ? (
                          <Box as="ul" pl={4} fontSize="sm" sx={{ listStyleType: "disc" }}>
                            {parseTipsLines(review.tips).map((t, j) => (
                              <Box as="li" key={j} mb={0.5}>
                                {t}
                              </Box>
                            ))}
                          </Box>
                        ) : (
                          <Text fontSize="sm" color="gray.400">
                            —
                          </Text>
                        )}
                      </Box>
                      <Button
                        size="sm"
                        colorScheme="brand"
                        onClick={() => {
                          setCurrentQuestionIndex(i);
                          setShowSummary(false);
                          setEditMode(true);
                        }}
                      >
                        Edit
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              );
            })}
          </SimpleGrid>

          <Divider my={6} />
          <Heading size="sm" color="gray.800" mb={3}>
            Interview competency scores (1–5)
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mb={6}>
            {MOCK_INTERVIEW_SKILL_RUBRIC.map((def) => {
              const raw = skillRatings[def.skillCode];
              const n =
                raw !== undefined && raw !== null && raw !== ""
                  ? parseInt(String(raw), 10)
                  : NaN;
              return (
                <Flex
                  key={def.skillCode}
                  justify="space-between"
                  align="center"
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="md"
                  px={3}
                  py={2}
                  bg="gray.50"
                >
                  <Box pr={3}>
                    <Text fontWeight="bold" fontSize="xs" color="gray.600">
                      {def.heading}
                    </Text>
                    <Text fontSize="sm">{def.skillName}</Text>
                  </Box>
                  {Number.isFinite(n) ? (
                    <Badge colorScheme="purple" variant="solid" fontSize="0.75rem">
                      {n}/5
                    </Badge>
                  ) : (
                    <Text color="gray.400" fontSize="sm">
                      —
                    </Text>
                  )}
                </Flex>
              );
            })}
          </SimpleGrid>

          {MOCK_INTERVIEW_SKILL_RUBRIC.some(({ skillCode }) => {
            const raw = skillRatings[skillCode];
            const n =
              raw !== undefined && raw !== null && raw !== ""
                ? parseInt(String(raw), 10)
                : NaN;
            return !Number.isFinite(n) || n < 1 || n > 5;
          }) && (
            <Box
              mb={6}
              p={3}
              borderRadius="md"
              bg="orange.50"
              borderWidth="1px"
              borderColor="orange.200"
            >
              <Text fontSize="sm" color="gray.700">
                Rate all competency skills before generating the report. This step is skipped if you return here from editing a question.
              </Text>
              <Button
                size="sm"
                mt={2}
                colorScheme="orange"
                variant="solid"
                onClick={() => {
                  setShowSummary(false);
                  setShowSkillScores(true);
                }}
              >
                Score interview skills
              </Button>
            </Box>
          )}

          <FormControl mt={6}>
            <FormLabel fontWeight="semibold">Overall comment</FormLabel>
            <Textarea
              value={overallComment}
              onChange={(e) => setOverallComment(e.target.value)}
              minHeight="100px"
              borderRadius="md"
            />
          </FormControl>
          <Flex direction={{ base: "column", md: "row" }} gap={2} mt={4}>
            <Button
              colorScheme="green"
              onClick={generateEvaluationReport}
              flex={{ base: "1", md: "0 1 auto" }}
              isLoading={isGeneratingReport}
              loadingText="Generating..."
            >
              Generate Report
            </Button>
            <Button
              colorScheme="gray"
              onClick={() => {
                setSelectedInterview(null);
              }}
              flex={{ base: "1", md: "0 1 auto" }}
            >
              Finish Review
            </Button>
          </Flex>
        </Box>
      );
    }

    if (showSkillScores) {
      const skillScoreLabels = {
        1: "1 — Needs improvement",
        2: "2 — Below expectations",
        3: "3 — Adequate",
        4: "4 — Good",
        5: "5 — Excellent",
      };

      return (
        <Box>
          <Button
            size="sm"
            mb={4}
            variant="ghost"
            onClick={() => {
              setShowSkillScores(false);
              setCurrentQuestionIndex(selectedInterview.answers.length - 1);
            }}
          >
            ← Back to last question
          </Button>

          <Heading color="brand.500" size="md" mb={2}>
            Interview skill scores
          </Heading>
          <Text fontSize="sm" color="gray.600" mb={6}>
            {selectedInterview.email} · {selectedInterview.mockInterviewTitle}. Rate each competency from{" "}
            <strong>1</strong> to <strong>5</strong>. These scores are included when you generate the report.
          </Text>

          <VStack align="stretch" spacing={4}>
            {MOCK_INTERVIEW_SKILL_RUBRIC.map((row) => {
              const current = skillRatings[row.skillCode];
              const selectedRating =
                current !== undefined && current !== null && current !== ""
                  ? Number(current)
                  : null;
              return (
                <Card key={row.skillCode} variant="outline" borderColor="gray.200">
                  <CardBody>
                    <VStack align="stretch" spacing={4}>
                      <HStack spacing={3} align="flex-start" flexWrap="wrap">
                        <Badge colorScheme="brand" variant="outline" fontSize="0.7rem">
                          {row.skillCode}
                        </Badge>
                        <Box flex="1" minW="200px">
                          <Text fontWeight="semibold" fontSize="sm" color="gray.800">
                            {row.heading}
                          </Text>
                          <Text fontSize="sm" color="gray.700">
                            {row.skillName}
                          </Text>
                        </Box>
                      </HStack>
                      <FormControl>
                        <FormLabel fontWeight="semibold" color="gray.700" mb={2}>
                          Rating (1–5)
                        </FormLabel>
                        <SimpleGrid columns={5} spacing={2}>
                          {[1, 2, 3, 4, 5].map((n) => {
                            const pressed = selectedRating === n;
                            return (
                              <Button
                                key={n}
                                size="md"
                                px={0}
                                variant={pressed ? "solid" : "outline"}
                                colorScheme="brand"
                                borderWidth="2px"
                                borderColor={pressed ? "brand.500" : "gray.200"}
                                bg={pressed ? undefined : "white"}
                                color={pressed ? "white" : "gray.700"}
                                _hover={{
                                  bg: pressed ? "brand.600" : "gray.100",
                                  borderColor: pressed ? "brand.600" : "brand.400",
                                }}
                                onClick={() =>
                                  setSkillRatings((prev) => ({
                                    ...prev,
                                    [row.skillCode]: n,
                                  }))
                                }
                                aria-pressed={pressed}
                                fontWeight="bold"
                              >
                                {n}
                              </Button>
                            );
                          })}
                        </SimpleGrid>
                        <Text fontSize="sm" color="gray.600" mt={3} minH="1.25rem">
                          {selectedRating ? skillScoreLabels[selectedRating] : "Select a score from 1 to 5."}
                        </Text>
                      </FormControl>
                    </VStack>
                  </CardBody>
                </Card>
              );
            })}
          </VStack>

          <Flex mt={8} justify="flex-end">
            <Button colorScheme="green" size="lg" onClick={goToSummaryFromSkillScores}>
              Continue to summary →
            </Button>
          </Flex>
        </Box>
      );
    }

    const currentAnswer = selectedInterview.answers[currentQuestionIndex];
    const currentReview = reviews[currentQuestionIndex] || {};
    const ratingLabels = {
      1: "1 — Needs improvement",
      2: "2 — Below expectations",
      3: "3 — Adequate",
      4: "4 — Good",
      5: "5 — Excellent",
    };

    return (
      <Box>
        <Button
          size="sm"
          mb={4}
          variant="ghost"
          onClick={() => {
            if (editMode) {
              setEditMode(false);
              setShowSummary(true);
            } else {
              setSelectedInterview(null);
            }
          }}
        >
          ← {editMode ? "Back to summary" : "Back to interviews"}
        </Button>
        <Card variant="outline" shadow="md" borderColor="gray.200" overflow="hidden">
          <CardHeader bg="gray.50" borderBottomWidth="1px" py={4}>
            <VStack align="stretch" spacing={2}>
              <HStack flexWrap="wrap" spacing={2} align="center">
                <Badge colorScheme="brand" fontSize="0.65rem" textTransform="uppercase">
                  {editMode ? "Edit evaluation" : "Evaluate"}
                </Badge>
                {!editMode && (
                  <Text fontSize="xs" color="gray.600">
                    Question {currentQuestionIndex + 1} of {selectedInterview.answers.length}
                  </Text>
                )}
              </HStack>
              <Heading size="sm" color="gray.800" fontWeight="semibold">
                {currentAnswer.questionTitle}
              </Heading>
            </VStack>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={6}>
              <Box rounded="lg" overflow="hidden" bg="black">
                <Box
                  as="video"
                  ref={videoRef}
                  width="100%"
                  maxW="720px"
                  mx="auto"
                  display="block"
                  controls
                  key={currentAnswer.answerId}
                >
                  <source src={currentAnswer.videoUrl} type="video/webm" />
                  Your browser does not support the video tag.
                </Box>
              </Box>
              <Text fontSize="xs" color="gray.500" noOfLines={1} fontFamily="mono">
                {currentAnswer.videoUrl}
              </Text>

              <Card
                bg="gray.50"
                borderColor="gray.200"
                variant="outline"
                shadow="none"
                borderRadius="lg"
              >
                <CardBody>
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    color="gray.600"
                    letterSpacing="wider"
                    mb={4}
                  >
                    EVALUATION
                  </Text>
                  <VStack align="stretch" spacing={5}>
                    <FormControl>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        Rating
                      </FormLabel>
                      <SimpleGrid columns={5} spacing={2}>
                        {[1, 2, 3, 4, 5].map((n) => {
                          const selected = String(currentReview.rating) === String(n);
                          return (
                            <Button
                              key={n}
                              size="md"
                              px={0}
                              variant={selected ? "solid" : "outline"}
                              colorScheme="brand"
                              borderWidth="2px"
                              borderColor={selected ? "brand.500" : "gray.200"}
                              bg={selected ? undefined : "white"}
                              color={selected ? "white" : "gray.700"}
                              _hover={{
                                bg: selected ? "brand.600" : "gray.100",
                                borderColor: selected ? "brand.600" : "brand.400",
                              }}
                              onClick={() => updateReview("rating", String(n))}
                              aria-pressed={selected}
                              fontWeight="bold"
                            >
                              {n}
                            </Button>
                          );
                        })}
                      </SimpleGrid>
                      <Text fontSize="sm" color="gray.600" mt={3} minH="1.25rem">
                        {currentReview.rating
                          ? ratingLabels[Number(currentReview.rating)]
                          : "Select a score from 1 to 5."}
                      </Text>
                    </FormControl>
                    <Divider borderColor="gray.200" />
                    <FormControl>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        Comments
                      </FormLabel>
                      <Textarea
                        value={currentReview.comments || ""}
                        onChange={(e) => updateReview("comments", e.target.value)}
                        minH="100px"
                        bg="white"
                        borderColor="gray.200"
                        _hover={{ borderColor: "gray.300" }}
                        _focusVisible={{ borderColor: "brand.500", boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)" }}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontWeight="semibold" color="gray.700">
                        Tips for the candidate
                      </FormLabel>
                      <FormHelperText mt={0} mb={2} color="gray.600">
                        Enter one tip per line. Each line is shown as a bullet point in the summary and PDF.
                      </FormHelperText>
                      <Textarea
                        value={currentReview.tips || ""}
                        onChange={(e) => updateReview("tips", e.target.value)}
                        minH="100px"
                        bg="white"
                        borderColor="gray.200"
                        _hover={{ borderColor: "gray.300" }}
                        _focusVisible={{ borderColor: "brand.500", boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)" }}
                      />
                      {parseTipsLines(currentReview.tips).length > 0 && (
                        <Box
                          mt={3}
                          p={3}
                          bg="white"
                          borderRadius="md"
                          borderWidth="1px"
                          borderColor="gray.200"
                        >
                          <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>
                            Bullet preview
                          </Text>
                          <VStack align="stretch" spacing={2}>
                            {parseTipsLines(currentReview.tips).map((line, idx) => (
                              <HStack key={idx} align="start" spacing={2}>
                                <Text color="brand.500" fontWeight="bold" lineHeight="1.25">
                                  •
                                </Text>
                                <Text fontSize="sm" color="gray.700">
                                  {line}
                                </Text>
                              </HStack>
                            ))}
                          </VStack>
                        </Box>
                      )}
                    </FormControl>
                  </VStack>
                </CardBody>
              </Card>

              {editMode ? (
                <Flex justify="center" pt={2}>
                  <Button
                    colorScheme="brand"
                    size="lg"
                    onClick={() => {
                      const rev = reviews[currentQuestionIndex] || {};
                      if (rev.rating && rev.comments) {
                        submitSingleEvaluation(
                          currentAnswer.answerId,
                          parseInt(rev.rating, 10),
                          rev.comments
                        );
                      } else {
                        toast({
                          title: "Missing information",
                          description: "Add a rating and comments before submitting.",
                          status: "warning",
                          duration: 3000,
                          isClosable: true,
                        });
                      }
                    }}
                    isLoading={isSubmittingEvaluation}
                    loadingText="Submitting..."
                  >
                    Save evaluation
                  </Button>
                </Flex>
              ) : (
                <Flex
                  direction={{ base: "column", md: "row" }}
                  gap={3}
                  justify="space-between"
                  align="stretch"
                  pt={2}
                >
                  <Button
                    onClick={onPrevious}
                    isDisabled={currentQuestionIndex === 0}
                    flex={{ base: "1", md: "0 1 auto" }}
                  >
                    ← Previous
                  </Button>
                  <Button
                    colorScheme="green"
                    onClick={onNext}
                    flex={{ base: "1", md: "0 1 auto" }}
                    isLoading={
                      isSubmittingAll &&
                      currentQuestionIndex === selectedInterview.answers.length - 1
                    }
                    loadingText="Saving…"
                  >
                    {currentQuestionIndex === selectedInterview.answers.length - 1
                      ? "Save all & skill scores →"
                      : "Next →"}
                  </Button>
                </Flex>
              )}
            </VStack>
          </CardBody>
        </Card>
      </Box>
    );
  }

  const filteredInterviews = interviews.filter((interview) => {
    const term = (searchTerm || "").toLowerCase();
    const email = (interview.email ?? "").toString().toLowerCase();
    const title = (interview.mockInterviewTitle ?? "").toString().toLowerCase();
    const matchesSearch = email.includes(term) || title.includes(term);
    let matchesFilter = true;
    if (questionFilter === "1") {
      matchesFilter = interview.answers.length === 1;
    } else if (questionFilter === "2+") {
      matchesFilter = interview.answers.length >= 2;
    }
    return matchesSearch && matchesFilter;
  });

  return (
    <VStack align="stretch" spacing={6}>
      <Heading color="brand.500" size="lg" mb={6}>
        Submitted Interviews
      </Heading>
      <VStack spacing={4} align="stretch" mb={4}>
        <FormControl>
          <FormLabel fontSize="sm" color="gray.700" mb={1}>
            Search by email or interview title
          </FormLabel>
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm" color="gray.700" mb={1}>
            Questions filter
          </FormLabel>
          <Select
            value={questionFilter}
            onChange={(e) => setQuestionFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="1">1 question</option>
            <option value="2+">2+ questions</option>
          </Select>
        </FormControl>
      </VStack>

      {/* Desktop Table View */}
      <Box
        display={{ base: "none", md: "block" }}
        overflowX="auto"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
      >
        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th>Email</Th>
              <Th>Interview</Th>
              <Th>Questions Count</Th>
              <Th>Replays Used</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredInterviews.map((interview, index) => (
              <Tr key={index}>
                <Td fontWeight="bold">{interview.email}</Td>
                <Td>{interview.mockInterviewTitle}</Td>
                <Td>{interview.answers.length}</Td>
                <Td>
                  <Text
                    fontWeight="semibold"
                    color={interview.nbOfTry > 0 ? "orange.500" : "green.500"}
                  >
                    {interview.nbOfTry || 0}
                  </Text>
                </Td>
                <Td>
                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={() => setSelectedInterview(interview)}
                  >
                    Review
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Mobile Card View */}
      <SimpleGrid
        columns={{ base: 1 }}
        spacing={4}
        display={{ base: "grid", md: "none" }}
      >
        {filteredInterviews.map((interview, index) => (
          <Card key={index} variant="outline">
            <CardBody>
              <VStack align="stretch" spacing={3}>
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    Email
                  </Text>
                  <Text fontWeight="bold" fontSize="sm">
                    {interview.email}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    Interview
                  </Text>
                  <Text fontSize="sm">{interview.mockInterviewTitle}</Text>
                </Box>
                <HStack justify="space-between">
                  <Box>
                    <Text fontSize="xs" color="gray.500">
                      Questions
                    </Text>
                    <Text fontWeight="semibold">
                      {interview.answers.length}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.500">
                      Replays
                    </Text>
                    <Text
                      fontWeight="semibold"
                      color={interview.nbOfTry > 0 ? "orange.500" : "green.500"}
                    >
                      {interview.nbOfTry || 0}
                    </Text>
                  </Box>
                </HStack>
                <Button
                  colorScheme="blue"
                  size="sm"
                  width="100%"
                  onClick={() => setSelectedInterview(interview)}
                >
                  Review
                </Button>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </VStack>
  );
};

export default ManageMockInterviews;
