import React from 'react';
import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import { AvatarInteractionAdvanced } from '../../components/AvatarInteractionAdvanced';
import { ChatProvider } from '../../contexts/ChatContext/ChatContext';
import Footer from '../../components/Footer';

const AvatarAdvancedDemoPage = () => {
  return (
    <Box minH="100vh" bgGradient="linear(to-r, white, #ebf8ff)">
      <VStack spacing={4} p={4}>
        <Heading color="brand.500" size="lg" textAlign="center">
          Advanced 3D Avatar Demo
        </Heading>
        <Text textAlign="center" color="gray.600" maxW="600px">
          Test the advanced avatar system with proper GLB models, animations, and professional interviewer personalities.
        </Text>
        
        <Box width="100%" height="calc(100vh - 200px)">
          <ChatProvider>
            <AvatarInteractionAdvanced />
          </ChatProvider>
        </Box>
      </VStack>
      
      <Footer />
    </Box>
  );
};

export default AvatarAdvancedDemoPage;
