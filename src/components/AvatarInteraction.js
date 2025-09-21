import React, { useContext, useState } from 'react';
import { Box, Button, VStack, Text, HStack, Input, Textarea } from '@chakra-ui/react';
import { ChatContext } from '../contexts/ChatContext/ChatContext';

const AvatarInteraction = () => {
  const { interviewer, speakText, playAudioFile, message, loading } = useContext(ChatContext);
  const [customText, setCustomText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const sampleQuestions = [
    {
      text: "Hello! Welcome to your mock interview. I'm excited to learn more about you today.",
      audioFile: "/assets/audio/welcome.m4a"
    },
    {
      text: "Can you tell me about yourself and your background?",
      audioFile: "/assets/audio/question1.m4a"
    },
    {
      text: "What are your greatest strengths and how do they apply to this role?",
      audioFile: "/assets/audio/question2.m4a"
    },
    {
      text: "Describe a challenging situation you faced and how you overcame it.",
      audioFile: "/assets/audio/question3.m4a"
    },
    {
      text: "Where do you see yourself in 5 years?",
      audioFile: "/assets/audio/question4.m4a"
    },
    {
      text: "Do you have any questions for us about the company or the position?",
      audioFile: "/assets/audio/question5.m4a"
    }
  ];

  const handleSpeak = async (question) => {
    setIsSpeaking(true);
    try {
      // Try to play audio file first, fallback to TTS
      if (question.audioFile) {
        try {
          await playAudioFile(question.audioFile, question.text);
        } catch (audioError) {
          console.warn('Audio file failed, falling back to TTS:', audioError);
          await speakText(question.text, interviewer?.voiceId);
        }
      } else {
        await speakText(question.text, interviewer?.voiceId);
      }
    } catch (error) {
      console.error('Speech failed:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleCustomSpeak = () => {
    if (customText.trim()) {
      handleSpeak({ text: customText });
    }
  };

  return (
    <Box p={6} bg="white" borderRadius="lg" boxShadow="md" maxW="600px" mx="auto">
      <VStack spacing={6}>
        <Text fontSize="xl" fontWeight="bold" color="purple.600">
          🎭 Avatar Interaction Demo
        </Text>
        
        <Text fontSize="sm" color="gray.600" textAlign="center">
          Click any button below to make the avatar speak. The avatar will use audio files 
          (if available) or text-to-speech to say the question out loud while showing talking animations.
        </Text>

        {interviewer && (
          <Box p={3} bg="purple.50" borderRadius="md" w="100%">
            <Text fontSize="sm" color="purple.700">
              <strong>Current Interviewer:</strong> {interviewer.label}
            </Text>
            <Text fontSize="xs" color="purple.600">
              {interviewer.description}
            </Text>
          </Box>
        )}

        <VStack spacing={3} w="100%">
          <Text fontWeight="bold" color="gray.700">Sample Interview Questions:</Text>
          {sampleQuestions.map((question, index) => (
            <Box key={index} w="100%">
              <Button
                size="sm"
                variant="outline"
                colorScheme="purple"
                onClick={() => handleSpeak(question)}
                isLoading={isSpeaking}
                loadingText="Speaking..."
                w="100%"
                textAlign="left"
                justifyContent="flex-start"
                h="auto"
                py={3}
                px={4}
              >
                <Text fontSize="sm" noOfLines={3}>
                  {question.text}
                </Text>
              </Button>
              <Text fontSize="xs" color="gray.500" mt={1} ml={2}>
                Audio: {question.audioFile ? '🎵 Audio File' : '🔊 TTS'}
              </Text>
            </Box>
          ))}
        </VStack>

        <Box w="100%">
          <Text fontWeight="bold" color="gray.700" mb={2}>Custom Text:</Text>
          <VStack spacing={3}>
            <Textarea
              placeholder="Type any text you want the avatar to say..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={3}
              resize="vertical"
            />
            <Button
              colorScheme="purple"
              onClick={handleCustomSpeak}
              isDisabled={!customText.trim() || isSpeaking}
              isLoading={isSpeaking}
              loadingText="Speaking..."
            >
              Make Avatar Speak
            </Button>
          </VStack>
        </Box>

        {message && (
          <Box p={3} bg="green.50" borderRadius="md" w="100%">
            <Text fontSize="sm" color="green.700">
              <strong>Last Message:</strong> {message.text}
            </Text>
          </Box>
        )}

        <Text fontSize="xs" color="gray.500" textAlign="center">
          💡 The avatar will show talking animations while speaking. 
          Audio files provide better quality than text-to-speech. 
          Make sure your browser allows audio for the best experience.
        </Text>
      </VStack>
    </Box>
  );
};

export default AvatarInteraction;
