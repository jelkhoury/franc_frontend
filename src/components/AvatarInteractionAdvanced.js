import React, { useState, useCallback, useContext } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import { Box, Button, VStack, HStack, Text, Select, useToast } from "@chakra-ui/react";
import { GLBAvatar } from "./Avatar/Avatar";
import { ChatContext } from "../contexts/ChatContext/ChatContext";

// Available animations for the avatar
const AVAILABLE_ANIMATIONS = [
  "Idle",
  "Talking",
  "Listening", 
  "Thinking",
  "Greeting",
  "Nodding",
  "Shaking"
];

// Available interviewers
const INTERVIEWERS = [
  {
    label: "The Jazzar",
    description: "Technical Interviewer with strict dialogue, and somehow, funny.",
    characteristics: "You sometimes make fun of the candidate, and you are strict with your answers.",
  },
  {
    label: "The Dev Lord", 
    description: "Be careful, don't mess with him in coding!",
    characteristics: "You do not accept false answers to coding question. Other then that act like a normal HR interviewer.",
  },
  {
    label: "The Recruitment General",
    description: "A sharp HR interviewer who values precision.",
    characteristics: "You pay full attention to details, and you are strict. You are not fun and you are picky",
  },
  {
    label: "The Color Queen",
    description: "You can feel her flowery vibe.",
    characteristics: "Very fun, a cool and lovely HR",
  },
  {
    label: "The Careerster",
    description: "Straight to the point questions? This one is for you.",
    characteristics: "You are energetic in a calm way, but you are also straight to the point",
  },
  {
    label: "WorkWise Interviewer",
    description: "The default interviewer avatar and tonality.",
    characteristics: "Default HR interviewer personality",
  },
];

export const AvatarInteractionAdvanced = () => {
  const [selectedInterviewer, setSelectedInterviewer] = useState("WorkWise Interviewer");
  const [currentAnimation, setCurrentAnimation] = useState("Idle");
  const [isLoading, setIsLoading] = useState(false);
  const [interactionHistory, setInteractionHistory] = useState([]);
  const toast = useToast();
  
  // Get audio functions from ChatContext
  const { playAudioFile, speakText } = useContext(ChatContext);

  // Handle animation completion
  const handleAnimationComplete = useCallback(() => {
    console.log("Animation completed:", currentAnimation);
    setIsLoading(false);
    
    // Add to interaction history
    setInteractionHistory(prev => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        animation: currentAnimation,
        interviewer: selectedInterviewer
      }
    ]);
    
    // Return to idle after a short delay
    setTimeout(() => {
      setCurrentAnimation("Idle");
    }, 1000);
  }, [currentAnimation, selectedInterviewer]);

  // Audio files for different animations
  const animationAudioMap = {
    "Talking": "/assets/audio/welcome.m4a",
    "Listening": null, // No audio for listening
    "Thinking": null, // No audio for thinking
    "Greeting": "/assets/audio/welcome.m4a",
    "Nodding": null, // No audio for nodding
    "Shaking": null, // No audio for shaking
  };

  // Trigger avatar interaction with audio
  const triggerInteraction = async (animationType) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setCurrentAnimation(animationType);
    
    // Play audio if available for this animation
    const audioPath = animationAudioMap[animationType];
    if (audioPath) {
      try {
        await playAudioFile(audioPath, `${selectedInterviewer} is ${animationType.toLowerCase()}`);
        console.log(`Playing audio for ${animationType}:`, audioPath);
      } catch (error) {
        console.error(`Failed to play audio for ${animationType}:`, error);
        // Fallback to text-to-speech
        speakText(`${selectedInterviewer} is ${animationType.toLowerCase()}`);
      }
    } else {
      // For animations without audio, use text-to-speech
      speakText(`${selectedInterviewer} is ${animationType.toLowerCase()}`);
    }
    
    toast({
      title: "Animation Started",
      description: `${selectedInterviewer} is now ${animationType.toLowerCase()}`,
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };

  // Simulate AI response with audio (you can replace this with your own logic)
  const simulateAIResponse = async () => {
    const responses = [
      { animation: "Talking", message: "Hello! Welcome to the interview.", audio: "/assets/audio/welcome.m4a" },
      { animation: "Listening", message: "I'm listening to your response...", audio: null },
      { animation: "Thinking", message: "Let me think about that...", audio: null },
      { animation: "Nodding", message: "That's a good point!", audio: null },
      { animation: "Shaking", message: "I see, let me ask another question.", audio: null }
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    setIsLoading(true);
    setCurrentAnimation(randomResponse.animation);
    
    // Play audio if available
    if (randomResponse.audio) {
      try {
        await playAudioFile(randomResponse.audio, randomResponse.message);
        console.log("AI Response with audio:", randomResponse.message);
      } catch (error) {
        console.error("Failed to play AI response audio:", error);
        speakText(randomResponse.message);
      }
    } else {
      speakText(randomResponse.message);
    }
    
    toast({
      title: "AI Response",
      description: randomResponse.message,
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box height="100vh" display="flex" flexDirection="column">
      {/* Control Panel */}
      <Box bg="gray.100" p={4} borderBottom="1px" borderColor="gray.200">
        <VStack spacing={4} align="stretch">
          <HStack spacing={4} wrap="wrap">
            {/* Interviewer Selection */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>Select Interviewer:</Text>
              <Select 
                value={selectedInterviewer} 
                onChange={(e) => setSelectedInterviewer(e.target.value)}
                bg="white"
                size="sm"
                maxW="200px"
              >
                {INTERVIEWERS.map(interviewer => (
                  <option key={interviewer.label} value={interviewer.label}>
                    {interviewer.label}
                  </option>
                ))}
              </Select>
            </Box>

            {/* Animation Controls */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>Trigger Animation:</Text>
              <HStack spacing={2} wrap="wrap">
                {AVAILABLE_ANIMATIONS.filter(anim => anim !== "Idle").map(animation => (
                  <Button
                    key={animation}
                    onClick={() => triggerInteraction(animation)}
                    disabled={isLoading}
                    size="sm"
                    colorScheme="blue"
                    variant="outline"
                  >
                    {animation}
                  </Button>
                ))}
              </HStack>
            </Box>

            {/* AI Response Simulation */}
            <Button
              onClick={simulateAIResponse}
              disabled={isLoading}
              size="sm"
              colorScheme="green"
              variant="solid"
            >
              Simulate AI Response
            </Button>

            {/* Test Audio Directly */}
            <Button
              onClick={() => playAudioFile("/assets/audio/welcome.m4a", "Testing audio with avatar")}
              disabled={isLoading}
              size="sm"
              colorScheme="purple"
              variant="solid"
            >
              Test Audio
            </Button>

            {/* Current Status */}
            <Box ml="auto">
              <Text fontSize="sm" color="gray.600">
                Current: {currentAnimation} | Loading: {isLoading ? "Yes" : "No"}
              </Text>
            </Box>
          </HStack>
        </VStack>
      </Box>

      {/* 3D Avatar Display */}
      <Box flex="1" position="relative">
        <Canvas
          shadows
          camera={{
            position: [0, 1.5, 2],
            fov: 30,
          }}
        >
          <Environment preset="office" />
          <ContactShadows opacity={0.4} scale={10} blur={2} far={4.5} />
          
          <GLBAvatar
            interviewerLabel={selectedInterviewer}
            currentAnimation={currentAnimation}
            onAnimationComplete={handleAnimationComplete}
          />
        </Canvas>
      </Box>

      {/* Interaction History */}
      <Box bg="gray.50" p={4} borderTop="1px" borderColor="gray.200" maxH="120px" overflowY="auto">
        <Text fontSize="sm" fontWeight="medium" mb={2}>Interaction History:</Text>
        <VStack spacing={1} align="stretch">
          {interactionHistory.slice(-5).map((interaction, index) => (
            <Text key={index} fontSize="xs" color="gray.600">
              {interaction.timestamp} - {interaction.interviewer}: {interaction.animation}
            </Text>
          ))}
        </VStack>
      </Box>
    </Box>
  );
};
