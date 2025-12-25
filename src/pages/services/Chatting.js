"use client";

import {
  Box,
  Input,
  IconButton,
  VStack,
  HStack,
  Text,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";
import { useState, useRef, useEffect } from "react";
import { ArrowForwardIcon, CloseIcon } from "@chakra-ui/icons";
import Footer from "../../components/Footer";
import { post } from "../../utils/httpServices";
import { AI_ENDPOINTS } from "../../services/apiService";

const TypingIndicator = () => {
  const dotColor = useColorModeValue("gray.500", "gray.400");

  return (
    <Flex justify="flex-start" w="100%">
      <Box
        bg={useColorModeValue("gray.100", "gray.700")}
        px={4}
        py={3}
        borderRadius="xl"
        minW="60px"
        sx={{
          "@keyframes typingBounce": {
            "0%, 60%, 100%": {
              transform: "translateY(0)",
              opacity: 0.7,
            },
            "30%": {
              transform: "translateY(-10px)",
              opacity: 1,
            },
          },
        }}
      >
        <HStack spacing={1.5}>
          <Box
            as="span"
            w="8px"
            h="8px"
            bg={dotColor}
            borderRadius="full"
            display="inline-block"
            sx={{
              animation: "typingBounce 1.4s ease-in-out infinite",
              animationDelay: "0s",
            }}
          />
          <Box
            as="span"
            w="8px"
            h="8px"
            bg={dotColor}
            borderRadius="full"
            display="inline-block"
            sx={{
              animation: "typingBounce 1.4s ease-in-out infinite",
              animationDelay: "0.2s",
            }}
          />
          <Box
            as="span"
            w="8px"
            h="8px"
            bg={dotColor}
            borderRadius="full"
            display="inline-block"
            sx={{
              animation: "typingBounce 1.4s ease-in-out infinite",
              animationDelay: "0.4s",
            }}
          />
        </HStack>
      </Box>
    </Flex>
  );
};

const ChatBubble = ({ message, isUser, isTyping }) => {
  if (isTyping) {
    return <TypingIndicator />;
  }

  return (
    <Flex justify={isUser ? "flex-end" : "flex-start"} w="100%">
      <Box
        bg={isUser ? "brand.500" : useColorModeValue("gray.100", "gray.700")}
        color={isUser ? "white" : useColorModeValue("gray.800", "gray.200")}
        px={4}
        py={2}
        borderRadius="xl"
        maxW="75%"
        minW="20%"
        wordBreak="break-word"
      >
        <Text whiteSpace="pre-wrap">{message}</Text>{" "}
        {/* <-- This enables \n line breaks */}
      </Box>
    </Flex>
  );
};

const Chatting = () => {
  const [messages, setMessages] = useState([
    { text: "Hello! How can I help you today?", sender: "bot" },
  ]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUserScrolled, setIsUserScrolled] = useState(false);
  const messagesEndRef = useRef();
  const messagesContainerRef = useRef();
  const stopTypingRef = useRef(false);
  const typingTimeoutRef = useRef(null);

  // Smart auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current && !isUserScrolled) {
      // Scroll to bottom only if user hasn't scrolled up manually
      setTimeout(() => {
        messagesContainerRef.current.scrollTop =
          messagesContainerRef.current.scrollHeight;
      }, 0);
    }
  }, [messages, isUserScrolled]);

  // Handle keyboard visibility on mobile
  useEffect(() => {
    const handleResize = () => {
      // When keyboard disappears, scroll back to default
      if (messagesContainerRef.current && !isUserScrolled) {
        setTimeout(() => {
          messagesContainerRef.current.scrollTop =
            messagesContainerRef.current.scrollHeight;
        }, 100);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isUserScrolled]);

  // Track manual scroll
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // 50px threshold
      setIsUserScrolled(!isAtBottom);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleStop = () => {
    stopTypingRef.current = true;
    setIsGenerating(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);

    setInput("");
    setIsGenerating(true);
    stopTypingRef.current = false;

    // Show typing indicator
    setMessages((prev) => [
      ...prev,
      { text: "", sender: "bot", isTyping: true },
    ]);

    try {
      // ✅ Using httpService now
      const data = await post(
        AI_ENDPOINTS.ASK,
        { question: userMessage.text },
        { base: "ai" } // 👈 tells httpService to use your AI base URL
      );

      const botResponse = data.response || "No response";

      // Remove typing indicator and prepare for typing animation
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { text: "", sender: "bot", isTyping: false },
      ]);

      // Simulate typing effect
      let currentText = "";
      for (let i = 0; i < botResponse.length; i++) {
        if (stopTypingRef.current) {
          // If stopped, keep the current text and break
          break;
        }

        await new Promise((resolve) => {
          typingTimeoutRef.current = setTimeout(resolve, 30); // typing speed
        });

        if (stopTypingRef.current) {
          break;
        }

        currentText += botResponse[i];
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { text: currentText, sender: "bot" };
          return updated;
        });
      }

      setIsGenerating(false);
    } catch (error) {
      console.error("Error fetching response:", error);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          text: "Sorry, I couldn't get a response.",
          sender: "bot",
          isTyping: false,
        },
      ]);
      setIsGenerating(false);
    }
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      flexDirection="column"
      bgGradient="linear(to-r, white, #ebf8ff)"
      overflow="hidden"
      position="relative"
      height="100vh"
    >
      {/* Chat container */}
      <Box
        w="100%"
        maxW="800px"
        mx="auto"
        bg="white"
        mt={{ base: 0, md: 6 }}
        mb={{ base: 0, md: 4 }}
        p={{ base: 4, md: 6 }}
        borderRadius={{ base: 0, md: "xl" }}
        boxShadow={{ base: "none", md: "lg" }}
        height={{ base: "calc(100vh - 0px)", md: "calc(100vh - 100px)" }}
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        {/* Messages area */}
        <Box
          ref={messagesContainerRef}
          flex="1"
          overflowY="auto"
          overflowX="hidden"
          pr={2}
          onScroll={handleScroll}
          sx={{
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background: "#f1f1f1",
              borderRadius: "10px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#888",
              borderRadius: "10px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "#555",
            },
          }}
        >
          <VStack spacing={3} align="stretch" pb={2}>
            {messages.map((msg, idx) => (
              <ChatBubble
                key={idx}
                message={msg.text}
                isUser={msg.sender === "user"}
                isTyping={msg.isTyping || false}
              />
            ))}
            <div ref={messagesEndRef} />
          </VStack>
        </Box>

        {/* Input area */}
        <HStack 
          mt={4} 
          spacing={3} 
          align="flex-end" 
          flexShrink={0}
          position={{ base: "relative", md: "relative" }}
          pb={{ base: "env(safe-area-inset-bottom)", md: 0 }}
        >
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isGenerating) {
                handleSend();
              }
            }}
            bg="gray.50"
            borderRadius="full"
            flex="1"
            h={{ base: "40px", md: "45px" }}
            px={4}
            fontSize="md"
            isDisabled={isGenerating}
          />
          <IconButton
            icon={isGenerating ? <CloseIcon /> : <ArrowForwardIcon />}
            colorScheme="brand"
            onClick={isGenerating ? handleStop : handleSend}
            borderRadius="full"
            aria-label={isGenerating ? "Stop" : "Send"}
            h={{ base: "40px", md: "50px" }}
            minW={{ base: "40px", md: "50px" }}
            isDisabled={!isGenerating && !input.trim()}
          />
        </HStack>
      </Box>

      {/* Footer */}
      <Box flexShrink={0} mt={4} display={{ base: "none", md: "block" }}>
        <Footer />
      </Box>
    </Box>
  );
};

export default Chatting;
