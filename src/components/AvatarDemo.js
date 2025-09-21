import React from 'react';
import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react';
import InterviewProvider from '../contexts/InterviewContext/InterviewContext';
import ChatProvider from '../contexts/ChatContext/ChatContext';
import UI from './UI/UIScreen';

const AvatarDemo = () => {
  return (
    <Box minH="100vh" bg="gray.50" p={8}>
      <VStack spacing={8}>
        <Heading size="xl" textAlign="center">
          3D Avatar Demo
        </Heading>
        <Text textAlign="center" color="gray.600" maxW="600px">
          This is a demo of the 3D avatar system. Click "Click to Start" to begin interacting with the avatar.
          The avatar will demonstrate the interview question system with animations and audio.
        </Text>
        <Box height="600px" width="100%" border="2px solid" borderColor="gray.200" borderRadius="lg" overflow="hidden">
          <UI />
        </Box>
        <Text fontSize="sm" color="gray.500" textAlign="center">
          Note: This demo uses placeholder audio data. In production, this would connect to your AI service for real voice synthesis.
        </Text>
      </VStack>
    </Box>
  );
};

const AvatarDemoWithProviders = () => {
  return (
    <InterviewProvider>
      <ChatProvider>
        <AvatarDemo />
      </ChatProvider>
    </InterviewProvider>
  );
};

export default AvatarDemoWithProviders;
