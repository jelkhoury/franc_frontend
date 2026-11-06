"use client";

import {
  Box,
  Button,
  Input,
  IconButton,
  VStack,
  HStack,
  Text,
  Link,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";
import { useState, useRef, useEffect } from "react";
import { ArrowForwardIcon, CloseIcon, ArrowDownIcon } from "@chakra-ui/icons";
import { post } from "../../utils/httpServices";
import { captureError } from "../../utils/sentryUtils";
import { safeLinks } from "../../features/chatContent/contentUtils";
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

const ChatBubble = ({ message, isUser, isTyping, links }) => {
  const botBackground = useColorModeValue("gray.100", "gray.700");
  const botColor = useColorModeValue("gray.800", "gray.200");
  if (isTyping) {
    return <TypingIndicator />;
  }

  return (
    <Flex justify={isUser ? "flex-end" : "flex-start"} w="100%">
      <Box
        bg={isUser ? "brand.500" : botBackground}
        color={isUser ? "white" : botColor}
        px={4}
        py={2}
        borderRadius="xl"
        maxW="75%"
        minW="20%"
        wordBreak="break-word"
      >
        <Text whiteSpace="pre-wrap">{message}</Text>{" "}
        {!isUser && <VStack align="start" mt={2} spacing={2}>{safeLinks(links).map(link => (
          <Link key={link.url} href={link.url} isExternal rel="noopener noreferrer" color="blue.500" fontWeight="semibold">{link.label || 'Open link'} ↗</Link>
        ))}</VStack>}
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
  const followLatestRef = useRef(true);
  const messagesContainerRef = useRef();
  const stopTypingRef = useRef(false);
  const typingTimeoutRef = useRef(null);

  const scrollToLatest = () => {
    followLatestRef.current = true;
    setIsUserScrolled(false);
    const node = messagesContainerRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  };

  useEffect(() => {
    const node = messagesContainerRef.current;
    if (node && followLatestRef.current) node.scrollTop = node.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const resize = () => {
      const node = messagesContainerRef.current;
      if (node && followLatestRef.current) node.scrollTop = node.scrollHeight;
    };
    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('resize', resize);
    };
  }, []);

  const handleScroll = () => {
    const node = messagesContainerRef.current;
    if (!node) return;
    const atBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 50;
    followLatestRef.current = atBottom;
    setIsUserScrolled(!atBottom);
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

    followLatestRef.current = true;
    setIsUserScrolled(false);
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
        { text: "", sender: "bot", isTyping: false, links: safeLinks(data.links) },
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
          updated[updated.length - 1] = { ...updated[updated.length - 1], text: currentText, sender: "bot" };
          return updated;
        });
      }

      setIsGenerating(false);
    } catch (error) {
      captureError(error);
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
      minH={0}
      display="flex"
      flexDirection="column"
      bgGradient="linear(to-r, white, #ebf8ff)"
      overflow="hidden"
      position="relative"
      height="100%"
      p={{ base: 0, md: 4 }}
    >
      {/* Chat container */}
      <Box
        w="100%"
        maxW="800px"
        mx="auto"
        bg="white"
        p={{ base: 4, md: 6 }}
        borderRadius={{ base: 0, md: "xl" }}
        boxShadow={{ base: "none", md: "lg" }}
        height="100%"
        minH={0}
        flex="1"
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        {/* Messages area */}
        <Box
          ref={messagesContainerRef}
          flex="1"
          minH={0}
          role="log"
          aria-label="Conversation"
          aria-live="polite"
          aria-relevant="additions"
          tabIndex={0}
          overscrollBehavior="contain"
          style={{ WebkitOverflowScrolling: "touch", overflowAnchor: "none" }}
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
                links={msg.links}
                isUser={msg.sender === "user"}
                isTyping={msg.isTyping || false}
              />
            ))}
          </VStack>
        </Box>

        {isUserScrolled && <Flex justify="center" flexShrink={0} pt={2}>
          <Button size="sm" variant="outline" leftIcon={<ArrowDownIcon />} onClick={scrollToLatest}>
            Latest messages
          </Button>
        </Flex>}

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
            aria-label="Message"
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


    </Box>
  );
};

export default Chatting;
