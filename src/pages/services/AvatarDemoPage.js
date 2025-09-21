import React from 'react';
import { Box, Heading, Text, VStack, Button, HStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import InterviewProvider from '../../contexts/InterviewContext/InterviewContext';
import ChatProvider from '../../contexts/ChatContext/ChatContext';
import UI from '../../components/UI/UIScreen';
import Footer from '../../components/Footer';
import GLBTest from '../../components/GLBTest';
import AvatarInteraction from '../../components/AvatarInteraction';
import AudioTest from '../../components/AudioTest';

const AvatarDemoPage = () => {
  const navigate = useNavigate();

  return (
    <Box minH="100vh" bgGradient="linear(to-r, white, #ebf8ff)" display="flex" flexDirection="column">
      <Box p={8} textAlign="center">
        <VStack spacing={6}>
          <Heading size="xl" color="purple.600">
            🎭 3D Avatar Interview Demo
          </Heading>
          <Text fontSize="lg" color="gray.600" maxW="800px">
            Experience the future of mock interviews with our interactive 3D avatar system. 
            Click "Click to Start" below to begin interacting with the avatar interviewer.
          </Text>
          
          <Box 
            height="600px" 
            width="100%" 
            maxW="1000px"
            border="2px solid" 
            borderColor="purple.200" 
            borderRadius="xl" 
            overflow="hidden"
            boxShadow="lg"
            bg="white"
          >
            <UI />
          </Box>
          
          <VStack spacing={4}>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              <strong>Note:</strong> This is a demo version. The avatar will demonstrate the interview system with placeholder audio.
              In production, this would connect to your AI service for real voice synthesis.
            </Text>
            
            <HStack spacing={4}>
              <Button 
                colorScheme="purple" 
                onClick={() => window.location.reload()}
                size="sm"
              >
                Restart Demo
              </Button>
              <Button 
                variant="outline" 
                colorScheme="purple"
                onClick={() => navigate('/mock-interview')}
                size="sm"
              >
                Back to Mock Interview
              </Button>
            </HStack>
            
            <Box w="100%" mt={8}>
              <AvatarInteraction />
            </Box>
            
          <Box w="100%" mt={8}>
            <AudioTest />
          </Box>
          <Box w="100%" mt={8}>
            <GLBTest />
          </Box>
          </VStack>
        </VStack>
      </Box>
      
      <Footer />
    </Box>
  );
};

const AvatarDemoPageWithProviders = () => {
  return (
    <InterviewProvider>
      <ChatProvider>
        <AvatarDemoPage />
      </ChatProvider>
    </InterviewProvider>
  );
};

export default AvatarDemoPageWithProviders;
