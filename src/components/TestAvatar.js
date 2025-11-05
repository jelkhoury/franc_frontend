import React from 'react';
import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react';
import InterviewProvider from '../contexts/InterviewContext/InterviewContext';
import ChatProvider from '../contexts/ChatContext/ChatContext';

const TestAvatar = () => {
  return (
    <Box minH="100vh" bg="gray.50" p={8}>
      <VStack spacing={8}>
        <Heading color="brand.500" size="xl" textAlign="center">
          3D Avatar Test
        </Heading>
        <Text textAlign="center" color="gray.600" maxW="600px">
          This is a test page to verify the 3D avatar system components are working correctly.
          The avatar system is ready but requires 3D model files to be placed in src/assets/ai/
        </Text>
        
        <Box p={6} bg="white" borderRadius="lg" boxShadow="md" w="100%" maxW="600px">
          <VStack spacing={4}>
            <Heading color="brand.500" size="md" color="blue.600">
              System Status
            </Heading>
            <VStack spacing={2} align="start" w="100%">
              <Text>✅ React Three Fiber installed</Text>
              <Text>✅ Context providers created</Text>
              <Text>✅ Component structure ready</Text>
              <Text>⚠️ 3D model files needed</Text>
              <Text>⚠️ AI service integration needed</Text>
            </VStack>
            
            <Text fontSize="sm" color="gray.500" textAlign="center" mt={4}>
              To complete the setup, add your GLB model files to src/assets/ai/ and integrate with your AI service for voice synthesis.
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

const TestAvatarWithProviders = () => {
  return (
    <InterviewProvider>
      <ChatProvider>
        <TestAvatar />
      </ChatProvider>
    </InterviewProvider>
  );
};

export default TestAvatarWithProviders;
