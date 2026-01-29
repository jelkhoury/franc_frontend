import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Input,
  Heading,
  VStack,
  HStack,
  useToast,
  Spinner,
  Text,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Divider,
  Flex,
  Avatar,
  SimpleGrid,
} from "@chakra-ui/react";
import { get } from "../../utils/httpServices";
import { USER_ENDPOINTS } from "../../services/apiService";

const ManageChatbot = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSession, setSelectedSession] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const toast = useToast();

  const {
    isOpen: isChatOpen,
    onOpen: onChatOpen,
    onClose: onChatClose,
  } = useDisclosure();

  // Fetch chats from API
  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const data = await get(USER_ENDPOINTS.GET_CHATS, { token });
      setChats(data);
    } catch (err) {
      console.error("Error fetching chats:", err);
      setError(err.message);
      toast({
        title: "Error loading chats",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = useMemo(() => {
    if (!searchTerm) return chats;

    const searchLower = searchTerm.toLowerCase();
    return chats.filter(
      (chat) =>
        chat.email.toLowerCase().includes(searchLower) ||
        chat.messages.some((msg) =>
          msg.content.toLowerCase().includes(searchLower)
        )
    );
  }, [chats, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredChats.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedChats = filteredChats.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleViewChat = (session) => {
    setSelectedSession(session);
    onChatOpen();
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.600">
          Loading chats...
        </Text>
      </Box>
    );
  }

  if (error && chats.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="red.500" fontSize="lg">
          Error: {error}
        </Text>
        <Button mt={4} colorScheme="blue" onClick={fetchChats}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Heading color="brand.500" size="lg" mb={6}>
        Manage Chatbot
      </Heading>

      <VStack spacing={4} align="stretch" mb={6}>
        <Input
          placeholder="Search by email or message content"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          maxW="400px"
        />
      </VStack>

      {filteredChats.length === 0 ? (
        <Box textAlign="center" py={10}>
          <Text color="gray.500" fontSize="lg">
            No chats found
          </Text>
        </Box>
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4} mb={4}>
            {paginatedChats.map((chat) => (
              <Card key={chat.sessionId} variant="outline" size="sm">
                <CardHeader pb={2}>
                  <VStack align="stretch" spacing={2}>
                    <HStack justify="space-between">
                      <Badge colorScheme="blue" fontSize="sm">
                        Chat
                      </Badge>
                      <Text fontSize="xs" color="gray.500">
                        {chat.messages.length} messages
                      </Text>
                    </HStack>
                  </VStack>
                </CardHeader>
                <CardBody pt={2}>
                  <VStack align="stretch" spacing={3}>
                    <Box>
                      <Text fontSize="xs" color="gray.500" mb={1}>
                        User Email
                      </Text>
                      <Text fontSize="sm" fontWeight="medium">
                        {chat.email}
                      </Text>
                    </Box>

                    {chat.messages.length > 0 && (
                      <Box>
                        <Text fontSize="xs" color="gray.500" mb={1}>
                          Last Message
                        </Text>
                        <Text fontSize="xs" color="gray.600" noOfLines={2}>
                          {chat.messages[chat.messages.length - 1].content}
                        </Text>
                      </Box>
                    )}

                    <Divider />

                    <Button
                      size="sm"
                      colorScheme="blue"
                      variant="outline"
                      onClick={() => handleViewChat(chat)}
                      isFullWidth
                    >
                      View Conversation
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Flex justify="space-between" align="center" mt={4} flexWrap="wrap" gap={2}>
              <Text fontSize="sm" color="gray.600">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredChats.length)} of{" "}
                {filteredChats.length} chats
              </Text>
              <HStack spacing={2}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  isDisabled={currentPage === 1}
                >
                  Previous
                </Button>
                <HStack spacing={1}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        size="sm"
                        variant={currentPage === pageNum ? "solid" : "outline"}
                        colorScheme={currentPage === pageNum ? "blue" : "gray"}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </HStack>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  isDisabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </HStack>
            </Flex>
          )}
        </>
      )}

      {/* Chat Conversation Modal */}
      <Modal
        isOpen={isChatOpen}
        onClose={onChatClose}
        size="xl"
      >
        <ModalOverlay />
        <ModalContent maxH="90vh">
          <ModalHeader>
            Chat Conversation
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack
              align="stretch"
              spacing={3}
              maxH="600px"
              overflowY="auto"
              p={2}
            >
              {selectedSession?.messages?.map((message, index) => (
                <Box
                  key={index}
                  alignSelf={
                    message.role === "user" ? "flex-end" : "flex-start"
                  }
                  maxW="80%"
                >
                  <Flex
                    direction={message.role === "user" ? "row-reverse" : "row"}
                    align="flex-start"
                    gap={2}
                  >
                    <Avatar
                      size="sm"
                      bg={message.role === "user" ? "blue.500" : "green.500"}
                      name={message.role === "user" ? "User" : "AI"}
                    />
                    <Box
                      bg={
                        message.role === "user"
                          ? "blue.50"
                          : "gray.100"
                      }
                      p={3}
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor={
                        message.role === "user"
                          ? "blue.200"
                          : "gray.300"
                      }
                    >
                      <Text fontSize="sm" mb={1}>
                        {message.content}
                      </Text>
                      <Text fontSize="xs" color="gray.500" mt={2}>
                        {formatDate(message.createdAt)}
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              ))}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onChatClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ManageChatbot;
