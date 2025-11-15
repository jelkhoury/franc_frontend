import { get, post, postForm } from "../../../../utils/httpServices";
import { getStoredToken, decodeToken } from "../../../../utils/tokenUtils";

/**
 * Check if user can do a mock interview
 * @param {Function} setCheckingMockStatus - Setter for checking status
 * @param {Function} setCanDoMock - Setter for canDoMock state
 * @param {Function} toast - Toast function from Chakra UI
 */
export const checkMockInterviewStatus = async (
  setCheckingMockStatus,
  setCanDoMock,
  toast
) => {
  try {
    setCheckingMockStatus(true);
    const token = getStoredToken();
    if (!token) throw new Error("User not authenticated");
    const decoded = decodeToken(token);
    if (!decoded) throw new Error("Invalid token");
    const userId = parseInt(
      decoded[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ]
    );
    const data = await get(`/api/Evaluation/can-do-mock/${userId}`, {
      token,
    });
    setCanDoMock(data.canDoMock);
    if (!data.canDoMock) {
      toast({
        title: "Cannot Start Interview",
        description:
          "You cannot do another interview right now. Please try again later.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
    }
  } catch (err) {
    console.error(err);
    toast({
      title: "Error",
      description: err.message,
      status: "error",
      duration: 5000,
      isClosable: true,
    });
  } finally {
    setCheckingMockStatus(false);
  }
};

/**
 * Fetch questions for a major
 * @param {string} major - Major name
 * @param {Function} setLoading - Setter for loading state
 * @param {Function} setError - Setter for error state
 * @param {Function} setQuestions - Setter for questions state
 * @param {Function} setInterviewQuestions - Setter for interview questions state
 * @param {Function} setCommonQuestions - Setter for common questions state
 * @param {Function} setSpecialQuestions - Setter for special questions state
 * @param {Function} toast - Toast function from Chakra UI
 * @param {string} fallbackVoiceover - Fallback voiceover URL
 */
export const fetchQuestions = async (
  major,
  setLoading,
  setError,
  setQuestions,
  setInterviewQuestions,
  setCommonQuestions,
  setSpecialQuestions,
  toast,
  fallbackVoiceover
) => {
  try {
    setLoading(true);
    const data = await get("/api/BlobStorage/random-questions", {
      params: { majorName: major, count: 5 },
    });
    if (!Array.isArray(data) || data.length === 0) {
      setQuestions([
        {
          questionId: "fallback-1",
          title: "Tell me about yourself.",
          videoUrl: fallbackVoiceover,
        },
      ]);
    } else {
      setQuestions(data);

      // Filter questions into three categories
      const specialTitles = [
        "Opening Message",
        "Candidate Question",
        "Closing Message",
      ];
      const specialQuestionsObj = {};
      const commonQuestionsList = [];
      const interviewQuestionsList = [];

      data.forEach((question) => {
        if (specialTitles.includes(question.title)) {
          specialQuestionsObj[question.title] = question;
        } else if (question.title === "Common Question") {
          commonQuestionsList.push(question);
        } else {
          interviewQuestionsList.push(question);
        }
      });

      setSpecialQuestions(specialQuestionsObj);
      setCommonQuestions(commonQuestionsList);
      setInterviewQuestions(interviewQuestionsList);
    }
  } catch (err) {
    console.error(err);
    setError(err.message);
    const fallbackQuestion = {
      questionId: "fallback-1",
      title: "Tell me about yourself.",
      videoUrl: fallbackVoiceover,
    };
    setQuestions([fallbackQuestion]);
    setInterviewQuestions([fallbackQuestion]);
    setCommonQuestions([]);
    setSpecialQuestions({});
    toast({
      title: "Error loading questions",
      description: err.message,
      status: "error",
      duration: 5000,
      isClosable: true,
    });
  } finally {
    setLoading(false);
  }
};

/**
 * Increase attempt count for user
 */
export const increaseAttemptCount = async () => {
  try {
    const token = getStoredToken();
    if (!token) throw new Error("User not authenticated");
    const decoded = decodeToken(token);
    if (!decoded) throw new Error("Invalid token");
    const userId = parseInt(
      decoded[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ]
    );

    await post(`/api/Evaluation/increase-attempt/${userId}`, {});
  } catch (err) {
    // Don't block interview start if this fails
    console.error("Error incrementing attempt count:", err);
  }
};

/**
 * Submit mock interview videos
 * @param {Array} recordedAnswers - Array of recorded answers
 * @param {number} interviewDuration - Interview duration in seconds
 * @param {number} totalReplayCount - Total replay count
 * @param {Function} setSubmitting - Setter for submitting state
 * @param {Function} setShowThankYou - Setter for showThankYou state
 * @param {Function} setInterviewStartTime - Setter for interview start time
 * @param {Function} setInterviewDuration - Setter for interview duration
 * @param {Function} setIsInterviewActive - Setter for interview active state
 * @param {Function} toast - Toast function from Chakra UI
 */
export const handleSubmitVideos = async (
  recordedAnswers,
  interviewDuration,
  totalReplayCount,
  setSubmitting,
  setShowThankYou,
  setInterviewStartTime,
  setInterviewDuration,
  setIsInterviewActive,
  toast
) => {
  if (recordedAnswers.length === 0) {
    toast({
      title: "No recordings to submit",
      description: "Record at least one answer.",
      status: "warning",
      duration: 3000,
      isClosable: true,
    });
    return;
  }
  setSubmitting(true);
  try {
    const token = getStoredToken();
    if (!token) throw new Error("User not authenticated");
    const decoded = decodeToken(token);
    if (!decoded) throw new Error("Invalid token");
    const userId = parseInt(
      decoded[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ]
    );

    const formData = new FormData();
    const validAnswers = recordedAnswers.filter(
      (a) => a.blob && a.blob.size > 0
    );
    if (validAnswers.length === 0)
      throw new Error("No valid video recordings found");

    validAnswers.forEach((answer, index) => {
      const fileName =
        answer.questionType === "common"
          ? `common_question_${answer.questionIdx + 1}.webm`
          : answer.questionType === "major"
          ? `major_question_${answer.questionIdx + 1}.webm`
          : `candidate_question.webm`;
      const file = new File([answer.blob], fileName, { type: "video/webm" });
      formData.append("Videos", file);
    });

    const duration = interviewDuration;
    const durationString = `${Math.floor(duration / 60)}:${(duration % 60)
      .toString()
      .padStart(2, "0")}`;
    formData.append("Duration", durationString);
    formData.append("UserId", String(userId));
    formData.append("NbOfTry", String(totalReplayCount));

    // Add question IDs from both common and major questions
    validAnswers.forEach((answer) => {
      if (answer.questionId) {
        formData.append("QuestionIds", String(answer.questionId));
      }
    });

    const result = await postForm(
      "/api/BlobStorage/upload-mock-interview",
      formData,
      { token }
    );
    toast({
      title: "Mock Interview completed successfully!",
      description: `Interview ID: ${result.mockInterviewId}. Duration: ${durationString}. Uploaded ${result.videoUrls.length} videos. Replays used: ${totalReplayCount}.`,
      status: "success",
      duration: 5000,
      isClosable: true,
    });
    setShowThankYou(true);
    setInterviewStartTime(null);
    setInterviewDuration(0);
    setIsInterviewActive(false); // Interview completed, allow navigation
  } catch (err) {
    console.error(err);
    toast({
      title: "Upload failed",
      description: err.message,
      status: "error",
      duration: 5000,
      isClosable: true,
    });
  } finally {
    setSubmitting(false);
  }
};
