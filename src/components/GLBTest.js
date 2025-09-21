import React, { useState } from 'react';
import { Box, Button, Text, VStack, HStack } from '@chakra-ui/react';

const GLBTest = () => {
  const [testResults, setTestResults] = useState({});
  
  const testGLBFile = async (filename) => {
    try {
      const response = await fetch(`/assets/ai/${filename}`);
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        return {
          status: 'success',
          size: response.headers.get('content-length'),
          contentType: contentType
        };
      } else {
        return {
          status: 'error',
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  };

  const testAllFiles = async () => {
    const files = [
      'default.glb',
      'jazzar-transformed.glb',
      'taha-transformed.glb',
      'gheeda-transformed.glb',
      'nour-transformed.glb',
      'jane-transformed.glb',
      'animations.glb',
      'animations_man.glb'
    ];

    const results = {};
    for (const file of files) {
      results[file] = await testGLBFile(file);
    }
    setTestResults(results);
  };

  return (
    <Box p={8} maxW="800px" mx="auto">
      <VStack spacing={6}>
        <Text fontSize="xl" fontWeight="bold">
          GLB Files Test
        </Text>
        
        <Button onClick={testAllFiles} colorScheme="blue">
          Test All GLB Files
        </Button>
        
        {Object.keys(testResults).length > 0 && (
          <VStack spacing={3} align="stretch" w="100%">
            {Object.entries(testResults).map(([filename, result]) => (
              <Box
                key={filename}
                p={3}
                border="1px solid"
                borderColor={result.status === 'success' ? 'green.200' : 'red.200'}
                bg={result.status === 'success' ? 'green.50' : 'red.50'}
                borderRadius="md"
              >
                <HStack justify="space-between">
                  <Text fontWeight="bold">{filename}</Text>
                  <Text
                    color={result.status === 'success' ? 'green.600' : 'red.600'}
                    fontSize="sm"
                  >
                    {result.status === 'success' ? '✅ OK' : '❌ Error'}
                  </Text>
                </HStack>
                {result.status === 'success' && (
                  <Text fontSize="sm" color="gray.600">
                    Size: {result.size || 'Unknown'} | Type: {result.contentType || 'Unknown'}
                  </Text>
                )}
                {result.status === 'error' && (
                  <Text fontSize="sm" color="red.600">
                    {result.error}
                  </Text>
                )}
              </Box>
            ))}
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

export default GLBTest;
