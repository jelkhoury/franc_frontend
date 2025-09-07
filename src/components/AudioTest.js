import React, { useState } from 'react';
import { Box, Button, Text, VStack, HStack, useToast } from '@chakra-ui/react';

const AudioTest = () => {
  const [testResults, setTestResults] = useState({});
  const [testing, setTesting] = useState(false);
  const toast = useToast();

  const audioFiles = [
    '/assets/audio/welcome.m4a',
    '/assets/audio/question1.m4a',
    '/assets/audio/question2.m4a',
  ];

  const testAudioFile = async (audioPath) => {
    return new Promise((resolve) => {
      const audio = new Audio(audioPath);
      let result = { status: 'unknown', message: '' };

      audio.onloadeddata = () => {
        result = { status: 'success', message: 'File loaded successfully' };
        resolve(result);
      };

      audio.onerror = (error) => {
        result = { 
          status: 'error', 
          message: `Error: ${audio.error?.code || 'Unknown error'}` 
        };
        resolve(result);
      };

      audio.onabort = () => {
        result = { status: 'error', message: 'Loading aborted' };
        resolve(result);
      };

      // Timeout after 5 seconds
      setTimeout(() => {
        if (result.status === 'unknown') {
          result = { status: 'timeout', message: 'Loading timeout' };
          resolve(result);
        }
      }, 5000);

      audio.load();
    });
  };

  const runTests = async () => {
    setTesting(true);
    const results = {};

    for (const audioPath of audioFiles) {
      const result = await testAudioFile(audioPath);
      results[audioPath] = result;
      setTestResults({ ...results });
    }

    setTesting(false);
    
    toast({
      title: "Audio Test Complete",
      description: "Check the results below",
      status: "info",
      duration: 3000,
    });
  };

  const playAudio = (audioPath) => {
    const audio = new Audio(audioPath);
    audio.play().catch(error => {
      toast({
        title: "Playback Failed",
        description: error.message,
        status: "error",
        duration: 3000,
      });
    });
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" boxShadow="sm" bg="white">
      <Text fontSize="xl" fontWeight="bold" mb={4}>Audio Files Test</Text>
      
      <VStack spacing={4} align="stretch">
        <Button 
          onClick={runTests} 
          isLoading={testing}
          colorScheme="blue"
          size="lg"
        >
          {testing ? 'Testing...' : 'Test Audio Files'}
        </Button>

        {Object.entries(testResults).map(([path, result]) => (
          <Box key={path} p={3} borderWidth="1px" borderRadius="md">
            <HStack justify="space-between" mb={2}>
              <Text fontWeight="bold" fontSize="sm">
                {path.split('/').pop()}
              </Text>
              <Text 
                fontSize="sm" 
                color={result.status === 'success' ? 'green.500' : 'red.500'}
                fontWeight="bold"
              >
                {result.status.toUpperCase()}
              </Text>
            </HStack>
            <Text fontSize="sm" color="gray.600" mb={2}>
              {result.message}
            </Text>
            {result.status === 'success' && (
              <Button 
                size="sm" 
                colorScheme="green" 
                onClick={() => playAudio(path)}
              >
                ▶ Play Audio
              </Button>
            )}
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default AudioTest;
