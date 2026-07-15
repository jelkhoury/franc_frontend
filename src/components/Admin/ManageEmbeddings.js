import React, { useCallback, useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Spinner,
  Text,
  useDisclosure,
  useToast,
  VStack,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import { FaFilePdf, FaPlus, FaTrash, FaEye, FaDownload, FaGlobe, FaYoutube, FaLink, FaUpload } from "react-icons/fa";
import { get, post, postForm, del } from "../../utils/httpServices";
import { EMBEDDINGS_ENDPOINTS } from "../../services/apiService";
import { captureError } from "../../utils/sentryUtils";

const DEFAULT_INDEX = "antonine-university";
const DEFAULT_LIMIT = "100";
const LIST_LIMIT_OPTIONS = ["100", "200", "300", "400", "500", "all"];
const EMBEDDINGS_CACHE_PREFIX = "franc_embeddings_cache_v3_";

const getEmbeddingsCacheKey = (indexName, limit) =>
  `${EMBEDDINGS_CACHE_PREFIX}${indexName || DEFAULT_INDEX}_${limit || DEFAULT_LIMIT}`;

const readEmbeddingsCache = (indexName, limit) => {
  try {
    const raw = sessionStorage.getItem(getEmbeddingsCacheKey(indexName, limit));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.data ?? null;
  } catch {
    return null;
  }
};

const writeEmbeddingsCache = (indexName, limit, data) => {
  try {
    sessionStorage.setItem(
      getEmbeddingsCacheKey(indexName, limit),
      JSON.stringify({ savedAt: Date.now(), data })
    );
  } catch {
    // ignore quota / private mode errors
  }
};

const clearEmbeddingsCache = (indexName) => {
  try {
    LIST_LIMIT_OPTIONS.forEach((limit) => {
      sessionStorage.removeItem(getEmbeddingsCacheKey(indexName, limit));
    });
  } catch {
    // ignore
  }
};

const ADD_MODES = {
  pdf: {
    id: "pdf",
    label: "PDF",
    description: "Upload a PDF file",
    placeholder: "",
    icon: FaFilePdf,
    accent: "red",
    submitLabel: "Upload PDF",
  },
  page: {
    id: "page",
    label: "Web page",
    description: "One page URL",
    placeholder: "https://example.com/page",
    icon: FaLink,
    accent: "blue",
    submitLabel: "Fetch page",
  },
  site: {
    id: "site",
    label: "Website",
    description: "Up to 5 linked pages",
    placeholder: "https://example.com",
    icon: FaGlobe,
    accent: "teal",
    submitLabel: "Fetch pages",
  },
  youtube: {
    id: "youtube",
    label: "YouTube",
    description: "Transcribe a video",
    placeholder: "https://www.youtube.com/watch?v=…",
    icon: FaYoutube,
    accent: "red",
    submitLabel: "Transcribe",
  },
};

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getChunkSortKey = (chunk) => {
  const id = chunk?.id || "";
  const pageMatch = id.match(/_page_(\d+)/i);
  if (pageMatch) return Number(pageMatch[1]);
  const chunkMatch = id.match(/_chunk_(\d+)/i);
  if (chunkMatch) return Number(chunkMatch[1]);
  return 0;
};

const getDocumentKey = (doc) => {
  if (doc?.document_key) return String(doc.document_key);
  const firstId = doc?.chunks?.[0]?.id;
  if (!firstId) return null;
  return String(firstId).replace(/_(?:page|chunk)_\d+$/i, "");
};

const getDocumentTitle = (doc) => {
  const metaTitle =
    doc?.title ||
    doc?.filename ||
    doc?.name ||
    doc?.metadata?.title ||
    doc?.metadata?.source ||
    doc?.metadata?.filename;
  if (metaTitle) return String(metaTitle);

  const firstText =
    doc?.chunks?.[0]?.text ||
    doc?.chunks?.[0]?.metadata?.page_content ||
    "";
  const firstLine = firstText
    .split("\n")
    .map((l) => l.trim())
    .find(Boolean);
  if (firstLine) {
    return firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine;
  }

  return getDocumentKey(doc) || "Untitled document";
};

const getDocumentFullText = (doc) => {
  const chunks = Array.isArray(doc?.chunks) ? [...doc.chunks] : [];
  chunks.sort((a, b) => getChunkSortKey(a) - getChunkSortKey(b));
  return chunks
    .map((c) => c?.text || c?.metadata?.page_content || "")
    .filter(Boolean)
    .join("\n\n");
};

const buildDocumentPdf = (doc) => {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 16;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed = 8) => {
    if (y + needed > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  const title = getDocumentTitle(doc);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  const titleLines = pdf.splitTextToSize(title, maxWidth);
  titleLines.forEach((line) => {
    ensureSpace(8);
    pdf.text(line, margin, y);
    y += 7;
  });

  y += 2;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(100);
  ensureSpace(6);
  pdf.text(`Document key: ${getDocumentKey(doc) || "—"}`, margin, y);
  y += 5;
  ensureSpace(6);
  pdf.text(`Chunks: ${doc?.chunk_count ?? doc?.chunks?.length ?? 0}`, margin, y);
  y += 8;
  pdf.setTextColor(0);

  pdf.setDrawColor(200);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  pdf.setFontSize(10);
  const body = getDocumentFullText(doc) || "No text content available.";
  const bodyLines = pdf.splitTextToSize(body, maxWidth);
  bodyLines.forEach((line) => {
    ensureSpace(6);
    pdf.text(line, margin, y);
    y += 5;
  });

  return pdf;
};

const ManageEmbeddings = () => {
  const toast = useToast();
  const fileInputRef = React.useRef(null);
  const cancelRef = React.useRef(null);
  const initialCache = React.useMemo(
    () => readEmbeddingsCache(DEFAULT_INDEX, DEFAULT_LIMIT),
    []
  );

  const [loading, setLoading] = useState(!initialCache);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [indexes, setIndexes] = useState(
    () => initialCache?.available_indexes || []
  );
  const [selectedIndex, setSelectedIndex] = useState(DEFAULT_INDEX);
  const [listLimit, setListLimit] = useState(DEFAULT_LIMIT);
  const [documents, setDocuments] = useState(
    () => initialCache?.documents || []
  );
  const [chunkCount, setChunkCount] = useState(
    () => initialCache?.chunk_count ?? 0
  );
  const [documentCount, setDocumentCount] = useState(
    () =>
      initialCache?.document_count ?? initialCache?.documents?.length ?? 0
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const [addMode, setAddMode] = useState("pdf");
  const [addUrl, setAddUrl] = useState("");
  const [selectedPdfFile, setSelectedPdfFile] = useState(null);

  const {
    isOpen: isViewerOpen,
    onOpen: onViewerOpen,
    onClose: onViewerClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isAddOpen,
    onOpen: onAddOpen,
    onClose: onAddClose,
  } = useDisclosure();

  const revokePdfUrl = useCallback(() => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  }, [pdfUrl]);

  const applyEmbeddingsData = useCallback((data, indexName) => {
    const available = Array.isArray(data?.available_indexes)
      ? data.available_indexes
      : [];
    setIndexes(available);
    if (available.length && !available.includes(indexName)) {
      setSelectedIndex(available[0]);
    }

    setDocuments(Array.isArray(data?.documents) ? data.documents : []);
    setChunkCount(data?.chunk_count ?? 0);
    setDocumentCount(data?.document_count ?? data?.documents?.length ?? 0);
  }, []);

  const fetchEmbeddings = useCallback(
    async (
      indexName = selectedIndex,
      { force = false, limit = listLimit } = {}
    ) => {
      if (!force) {
        const cached = readEmbeddingsCache(indexName, limit);
        if (cached) {
          applyEmbeddingsData(cached, indexName);
          setLoading(false);
          return;
        }
      }

      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const data = await get(EMBEDDINGS_ENDPOINTS.LIST, {
          base: "ai",
          token,
          params: { index: indexName, limit },
        });

        writeEmbeddingsCache(indexName, limit, data);
        applyEmbeddingsData(data, indexName);
      } catch (err) {
        captureError(err);
        const cached = readEmbeddingsCache(indexName, limit);
        if (cached) {
          applyEmbeddingsData(cached, indexName);
          toast({
            title: "Using cached documents",
            description: err.message || "Could not refresh from server",
            status: "warning",
            duration: 4000,
            isClosable: true,
          });
        } else {
          setDocuments([]);
          setChunkCount(0);
          setDocumentCount(0);
          toast({
            title: "Failed to load embeddings",
            description: err.message || "Could not reach embeddings service",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [selectedIndex, listLimit, toast, applyEmbeddingsData]
  );

  useEffect(() => {
    fetchEmbeddings(selectedIndex, { limit: listLimit });
  }, [selectedIndex, listLimit, fetchEmbeddings]);

  useEffect(() => () => revokePdfUrl(), [revokePdfUrl]);

  const filteredDocuments = useMemo(() => {
    if (!searchTerm.trim()) return documents;
    const q = searchTerm.toLowerCase();
    return documents.filter((doc) => {
      const key = (getDocumentKey(doc) || "").toLowerCase();
      const title = getDocumentTitle(doc).toLowerCase();
      const preview = getDocumentFullText(doc).slice(0, 500).toLowerCase();
      return key.includes(q) || title.includes(q) || preview.includes(q);
    });
  }, [documents, searchTerm]);

  const openDocumentPdf = (doc) => {
    try {
      revokePdfUrl();
      const pdf = buildDocumentPdf(doc);
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setSelectedDoc(doc);
      onViewerOpen();
    } catch (err) {
      captureError(err);
      toast({
        title: "Could not build PDF",
        description: err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const downloadDocumentPdf = (doc) => {
    try {
      const pdf = buildDocumentPdf(doc);
      const key = getDocumentKey(doc) || "document";
      pdf.save(`${key}.pdf`);
    } catch (err) {
      captureError(err);
      toast({
        title: "Download failed",
        description: err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleCloseViewer = () => {
    onViewerClose();
    setSelectedDoc(null);
    revokePdfUrl();
  };

  const resetAddForm = () => {
    setAddMode("pdf");
    setAddUrl("");
    setSelectedPdfFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCloseAdd = () => {
    if (uploading) return;
    onAddClose();
    resetAddForm();
  };

  const handleAddSubmit = async () => {
    const token = localStorage.getItem("token");
    const authOpts = { base: "ai", token };

    if (addMode === "pdf") {
      if (!selectedPdfFile) {
        toast({
          title: "PDF required",
          description: "Choose a .pdf file to upload",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    } else if (!addUrl.trim()) {
      toast({
        title: "URL required",
        description: "Enter a valid URL",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setUploading(true);

      if (addMode === "pdf") {
        const formData = new FormData();
        formData.append("file", selectedPdfFile);
        await postForm(EMBEDDINGS_ENDPOINTS.UPLOAD_PDF, formData, authOpts);
        toast({
          title: "PDF uploaded",
          description: `${selectedPdfFile.name} was added`,
          status: "success",
          duration: 4000,
          isClosable: true,
        });
      } else {
        const url = addUrl.trim();
        const endpoint =
          addMode === "page"
            ? EMBEDDINGS_ENDPOINTS.FETCH_AND_PROCESS
            : addMode === "site"
              ? EMBEDDINGS_ENDPOINTS.FETCH_URLS
              : EMBEDDINGS_ENDPOINTS.TRANSCRIBE;

        await post(endpoint, { url }, authOpts);

        const labels = {
          page: "Web page processed",
          site: "Site pages processed",
          youtube: "YouTube video transcribed",
        };
        toast({
          title: labels[addMode] || "Document added",
          description: url,
          status: "success",
          duration: 4000,
          isClosable: true,
        });
      }

      onAddClose();
      resetAddForm();
      clearEmbeddingsCache(selectedIndex);
      await fetchEmbeddings(selectedIndex, { force: true });
    } catch (err) {
      captureError(err);
      toast({
        title: "Add failed",
        description: err.message || "Could not add document",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = (doc) => {
    setDocToDelete(doc);
    onDeleteOpen();
  };

  const handleDelete = async () => {
    if (!docToDelete) return;
    const documentKey = getDocumentKey(docToDelete);
    if (!documentKey) {
      toast({
        title: "Missing document key",
        description: "Cannot delete a document without a document_key",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    try {
      setDeleting(true);
      const token = localStorage.getItem("token");
      await del(EMBEDDINGS_ENDPOINTS.DELETE, {
        base: "ai",
        token,
        params: { index: selectedIndex },
        data: { ids: [documentKey] },
      });

      toast({
        title: "Document deleted",
        description: `Removed ${documentKey}`,
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      onDeleteClose();
      setDocToDelete(null);
      if (selectedDoc && getDocumentKey(selectedDoc) === documentKey) {
        handleCloseViewer();
      }
      clearEmbeddingsCache(selectedIndex);
      await fetchEmbeddings(selectedIndex, { force: true });
    } catch (err) {
      captureError(err);
      toast({
        title: "Delete failed",
        description: err.message || "Could not delete document",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <Flex
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "stretch", md: "center" }}
        gap={4}
        mb={6}
      >
        <Box>
          <Heading size="lg" color="brand.500" mb={1}>
            Knowledge Documents
          </Heading>
          <Text color="gray.600" fontSize="sm">
            Browse embedding database content as PDF documents. Add or remove
            sources per index.
          </Text>
        </Box>
        <HStack spacing={3} flexWrap="wrap">
          <Button
            leftIcon={<FaPlus />}
            colorScheme="blue"
            onClick={onAddOpen}
            isLoading={uploading}
            loadingText="Adding"
          >
            Add document
          </Button>
          <Button
            variant="outline"
            onClick={() => fetchEmbeddings(selectedIndex, { force: true })}
            isDisabled={loading}
          >
            Refresh
          </Button>
        </HStack>
      </Flex>

      <Flex
        direction={{ base: "column", md: "row" }}
        gap={4}
        mb={6}
        align={{ base: "stretch", md: "flex-end" }}
      >
        <FormControl maxW={{ md: "280px" }}>
          <FormLabel fontSize="sm">Index</FormLabel>
          <Select
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(e.target.value)}
          >
            {(indexes.length ? indexes : [selectedIndex]).map((idx) => (
              <option key={idx} value={idx}>
                {idx}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl maxW={{ md: "140px" }}>
          <FormLabel fontSize="sm">Limit</FormLabel>
          <Select
            value={listLimit}
            onChange={(e) => setListLimit(e.target.value)}
          >
            {LIST_LIMIT_OPTIONS.map((limit) => (
              <option key={limit} value={limit}>
                {limit === "all" ? "All" : limit}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl flex="1">
          <FormLabel fontSize="sm">Search</FormLabel>
          <Input
            placeholder="Search by title, key, or content…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </FormControl>
      </Flex>

      <HStack spacing={3} mb={6} flexWrap="wrap">
        <Badge colorScheme="blue" px={3} py={1} borderRadius="md">
          {documentCount} documents
        </Badge>
        <Badge colorScheme="purple" px={3} py={1} borderRadius="md">
          {chunkCount} chunks
        </Badge>
        <Badge colorScheme="gray" px={3} py={1} borderRadius="md">
          showing {filteredDocuments.length}
        </Badge>
      </HStack>

      {loading ? (
        <Flex justify="center" align="center" minH="240px">
          <Spinner size="xl" color="brand.500" />
        </Flex>
      ) : filteredDocuments.length === 0 ? (
        <Box
          border="1px dashed"
          borderColor="gray.300"
          borderRadius="lg"
          p={10}
          textAlign="center"
        >
          <Icon as={FaFilePdf} boxSize={10} color="gray.400" mb={3} />
          <Text color="gray.600">
            No documents found in this index. Upload a file to get started.
          </Text>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
          {filteredDocuments.map((doc, index) => {
            const key = getDocumentKey(doc) || `doc-${index}`;
            const title = getDocumentTitle(doc);
            const chunks = doc?.chunk_count ?? doc?.chunks?.length ?? 0;
            const preview = getDocumentFullText(doc).slice(0, 180);

            return (
              <Box
                key={key}
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                p={4}
                bg="white"
                _hover={{ borderColor: "blue.300", shadow: "sm" }}
                transition="all 0.15s"
              >
                <HStack align="flex-start" spacing={3} mb={3}>
                  <Flex
                    align="center"
                    justify="center"
                    w="44px"
                    h="44px"
                    borderRadius="md"
                    bg="red.50"
                    color="red.500"
                    flexShrink={0}
                  >
                    <Icon as={FaFilePdf} boxSize={5} />
                  </Flex>
                  <Box minW={0} flex="1">
                    <Text fontWeight="semibold" noOfLines={2} title={title}>
                      {title}
                    </Text>
                    <Text fontSize="xs" color="gray.500" noOfLines={1} mt={1}>
                      {key}
                    </Text>
                  </Box>
                </HStack>

                <Text fontSize="sm" color="gray.600" noOfLines={3} mb={3}>
                  {preview || "No preview text"}
                </Text>

                <HStack justify="space-between" mb={3}>
                  <Badge>{chunks} chunks</Badge>
                </HStack>

                <HStack spacing={2}>
                  <Button
                    size="sm"
                    leftIcon={<FaEye />}
                    colorScheme="blue"
                    variant="solid"
                    flex="1"
                    onClick={() => openDocumentPdf(doc)}
                  >
                    View PDF
                  </Button>
                  <Button
                    size="sm"
                    leftIcon={<FaDownload />}
                    variant="outline"
                    onClick={() => downloadDocumentPdf(doc)}
                    aria-label="Download PDF"
                  />
                  <Button
                    size="sm"
                    leftIcon={<FaTrash />}
                    colorScheme="red"
                    variant="outline"
                    onClick={() => confirmDelete(doc)}
                    aria-label="Delete document"
                  />
                </HStack>
              </Box>
            );
          })}
        </SimpleGrid>
      )}

      <Modal
        isOpen={isAddOpen}
        onClose={handleCloseAdd}
        size="xl"
        closeOnOverlayClick={!uploading}
        isCentered
      >
        <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(2px)" />
        <ModalContent borderRadius="xl" overflow="hidden" mx={4}>
          <ModalHeader
            pb={2}
            borderBottomWidth="1px"
            borderColor="gray.100"
            bg="gray.50"
          >
            <Text fontSize="lg" fontWeight="semibold">
              Add document
            </Text>
            <Text fontSize="sm" fontWeight="normal" color="gray.500" mt={1}>
              Choose a source, then provide the file or URL to index.
            </Text>
          </ModalHeader>
          <ModalCloseButton isDisabled={uploading} top={3} />
          <ModalBody py={5}>
            <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={2} textTransform="uppercase" letterSpacing="wider">
              Source type
            </Text>
            <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={3} mb={6}>
              {Object.values(ADD_MODES).map((mode) => {
                const isActive = addMode === mode.id;
                return (
                  <Box
                    key={mode.id}
                    as="button"
                    type="button"
                    textAlign="left"
                    p={3}
                    borderWidth="2px"
                    borderColor={isActive ? `${mode.accent}.400` : "gray.200"}
                    borderRadius="lg"
                    bg={isActive ? `${mode.accent}.50` : "white"}
                    _hover={{
                      borderColor: isActive ? `${mode.accent}.400` : "gray.300",
                      bg: isActive ? `${mode.accent}.50` : "gray.50",
                    }}
                    transition="all 0.15s"
                    onClick={() => {
                      if (uploading) return;
                      setAddMode(mode.id);
                      setAddUrl("");
                      setSelectedPdfFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    disabled={uploading}
                  >
                    <Flex
                      align="center"
                      justify="center"
                      w="36px"
                      h="36px"
                      borderRadius="md"
                      bg={isActive ? `${mode.accent}.100` : "gray.100"}
                      color={isActive ? `${mode.accent}.600` : "gray.500"}
                      mb={2}
                    >
                      <Icon as={mode.icon} boxSize={4} />
                    </Flex>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                      {mode.label}
                    </Text>
                    <Text fontSize="xs" color="gray.500" mt={0.5} noOfLines={2}>
                      {mode.description}
                    </Text>
                  </Box>
                );
              })}
            </SimpleGrid>

            {addMode === "pdf" ? (
              <Box>
                <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={2} textTransform="uppercase" letterSpacing="wider">
                  PDF file
                </Text>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  display="none"
                  onChange={(e) =>
                    setSelectedPdfFile(e.target.files?.[0] || null)
                  }
                />
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  gap={3}
                  py={8}
                  px={4}
                  borderWidth="2px"
                  borderStyle="dashed"
                  borderColor={selectedPdfFile ? "green.300" : "gray.300"}
                  borderRadius="xl"
                  bg={selectedPdfFile ? "green.50" : "gray.50"}
                  cursor="pointer"
                  _hover={{ borderColor: "blue.300", bg: "blue.50" }}
                  transition="all 0.15s"
                  onClick={() => !uploading && fileInputRef.current?.click()}
                >
                  {selectedPdfFile ? (
                    <>
                      <Flex
                        align="center"
                        justify="center"
                        w="48px"
                        h="48px"
                        borderRadius="full"
                        bg="red.100"
                        color="red.500"
                      >
                        <Icon as={FaFilePdf} boxSize={5} />
                      </Flex>
                      <Box textAlign="center">
                        <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                          {selectedPdfFile.name}
                        </Text>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {formatFileSize(selectedPdfFile.size)} · Click to replace
                        </Text>
                      </Box>
                    </>
                  ) : (
                    <>
                      <Flex
                        align="center"
                        justify="center"
                        w="48px"
                        h="48px"
                        borderRadius="full"
                        bg="white"
                        color="blue.500"
                        borderWidth="1px"
                        borderColor="gray.200"
                      >
                        <Icon as={FaUpload} boxSize={5} />
                      </Flex>
                      <Box textAlign="center">
                        <Text fontWeight="semibold" fontSize="sm">
                          Click to choose a PDF
                        </Text>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          Only .pdf files are accepted
                        </Text>
                      </Box>
                    </>
                  )}
                </Flex>
              </Box>
            ) : (
              <FormControl>
                <FormLabel
                  fontSize="xs"
                  fontWeight="semibold"
                  color="gray.500"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  mb={2}
                >
                  {ADD_MODES[addMode].label} URL
                </FormLabel>
                <InputGroup size="lg">
                  <InputLeftElement pointerEvents="none" h="full">
                    <Icon
                      as={ADD_MODES[addMode].icon}
                      color={`${ADD_MODES[addMode].accent}.400`}
                    />
                  </InputLeftElement>
                  <Input
                    pl={10}
                    placeholder={ADD_MODES[addMode].placeholder}
                    value={addUrl}
                    onChange={(e) => setAddUrl(e.target.value)}
                    bg="white"
                    borderRadius="lg"
                    isDisabled={uploading}
                  />
                </InputGroup>
                {addMode === "site" && (
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    The service will discover and process up to 5 linked pages.
                  </Text>
                )}
              </FormControl>
            )}
          </ModalBody>
          <ModalFooter
            borderTopWidth="1px"
            borderColor="gray.100"
            bg="gray.50"
            gap={2}
          >
            <Button
              variant="ghost"
              onClick={handleCloseAdd}
              isDisabled={uploading}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              leftIcon={<FaPlus />}
              onClick={handleAddSubmit}
              isLoading={uploading}
              loadingText="Processing…"
              isDisabled={
                addMode === "pdf" ? !selectedPdfFile : !addUrl.trim()
              }
            >
              {ADD_MODES[addMode]?.submitLabel || "Add"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isViewerOpen}
        onClose={handleCloseViewer}
        size="6xl"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader pr={12}>
            <Text noOfLines={1}>
              {selectedDoc ? getDocumentTitle(selectedDoc) : "Document"}
            </Text>
            <Text fontSize="sm" fontWeight="normal" color="gray.500" mt={1}>
              {selectedDoc ? getDocumentKey(selectedDoc) : ""}
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {pdfUrl ? (
              <Box
                as="iframe"
                title="Document PDF"
                src={pdfUrl}
                w="100%"
                h="70vh"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
              />
            ) : (
              <Text>Preparing PDF…</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              mr={3}
              leftIcon={<FaDownload />}
              onClick={() => selectedDoc && downloadDocumentPdf(selectedDoc)}
            >
              Download
            </Button>
            <Button variant="ghost" onClick={handleCloseViewer}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete document
            </AlertDialogHeader>
            <AlertDialogBody>
              <VStack align="stretch" spacing={2}>
                <Text>
                  This will remove the document from the{" "}
                  <strong>{selectedIndex}</strong> index.
                </Text>
                <Text fontSize="sm" color="gray.600">
                  ID: {docToDelete ? getDocumentKey(docToDelete) : "—"}
                </Text>
              </VStack>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDelete}
                ml={3}
                isLoading={deleting}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ManageEmbeddings;
