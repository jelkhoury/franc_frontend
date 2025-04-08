'use client';

import {
  Box,
  Input,
  IconButton,
  VStack,
  HStack,
  Text,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react';
import { useState, useRef } from 'react';
import { ArrowForwardIcon } from '@chakra-ui/icons';
import Footer from '../../components/Footer';

const ChatBubble = ({ message, isUser }) => (
  <Flex justify={isUser ? 'flex-end' : 'flex-start'} w="100%">
    <Box
      bg={isUser ? 'brand.500' : useColorModeValue('gray.100', 'gray.700')}
      color={isUser ? 'white' : useColorModeValue('gray.800', 'gray.200')}
      px={4}
      py={2}
      borderRadius="xl"
      maxW="75%"
      minW="20%"
      wordBreak="break-word"
    >
      <Text whiteSpace="pre-wrap">{message}</Text> {/* <-- This enables \n line breaks */}
      </Box>
  </Flex>
);

const Chatting = () => {
  const [messages, setMessages] = useState([
    { text: 'Hello! How can I help you today?', sender: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef();

  const handleSend = async () => {
    if (!input.trim()) return;

    // Append user message
    const userMessage = { text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);

    // Clear input field
    setInput('');

    // Show typing indicator
    setMessages((prev) => [...prev, { text: '...', sender: 'bot' }]);

    try {
      // Send request to backend
      const response = await fetch('http://20.49.30.0:5000/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage.text }),
      });

      const data = await response.json();
      const botResponse = data.response;

      // Remove typing indicator & Add an empty bot response placeholder
      setMessages((prev) => [...prev.slice(0, -1), { text: '', sender: 'bot' }]);

      // Simulate typing effect
      let currentText = '';
      for (let i = 0; i < botResponse.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 30)); // Typing speed
        currentText += botResponse[i];
        setMessages((prev) => {
          const updatedMessages = [...prev];
          updatedMessages[updatedMessages.length - 1] = { text: currentText, sender: 'bot' };
          return updatedMessages;
        });
      }

    } catch (error) {
      console.error('Error fetching response:', error);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { text: "Sorry, I couldn't get a response.", sender: 'bot' }
      ]);
    }
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      flexDirection="column"
      bgGradient="linear(to-r, white, #ebf8ff)"
      overflow="hidden"
    >
      {/* Chat container */}
      <Box
        w="100%"
        maxW="800px"
        mx="auto"
        bg="white"
        mt={6}
        p={6}
        borderRadius="xl"
        boxShadow="lg"
        flexShrink={0}
        height="calc(100vh - 100px)"
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        {/* Messages area */}
        <VStack spacing={3} align="stretch" flex="1" overflowY="auto" pr={2}>
          {messages.map((msg, idx) => (
            <ChatBubble key={idx} message={msg.text} isUser={msg.sender === 'user'} />
          ))}
          <div ref={messagesEndRef} />
        </VStack>

        {/* Input area */}
        <HStack mt={4} spacing={3} align="flex-end">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            bg="gray.50"
            borderRadius="full"
            flex="1"
            h="45px"
            px={4}
            fontSize="md"
          />
          <IconButton
            icon={<ArrowForwardIcon />}
            colorScheme="brand"
            onClick={handleSend}
            borderRadius="full"
            aria-label="Send"
            h="50px"
            minW="50px"
          />
        </HStack>
      </Box>

      {/* Footer */}
      <Box flexShrink={0} mt={6}>
        <Footer />
      </Box>
    </Box>
  );
};

export default Chatting;
