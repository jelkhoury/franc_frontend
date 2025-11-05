import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Select,
  Box,
  Text,
  Heading,
  VStack,
  HStack,
  useToast,
} from "@chakra-ui/react";
import React, { useState, useContext } from "react";
import { InterviewContext } from "../contexts/InterviewContext/InterviewContext";

const InterviewSetup = ({ isOpen, onClose, onInterviewSelect }) => {
  const { interviewers, selectInterviewer } = useContext(InterviewContext);
  const [selectedInterviewer, setSelectedInterviewer] = useState(null);
  const [selectedInterviewType, setSelectedInterviewType] = useState("");
  const toast = useToast();

  const interviewTypes = [
    "Software Developer at Murex",
    "Data Analyst Position at Google",
    "Digital Marketer at HubSpot",
    "Accountant at Deloitte",
    "AI Engineer at OpenAI",
    "Cybersecurity Officer at Cisco",
  ];

  const handleInterviewerClick = (interviewer) => {
    setSelectedInterviewer(interviewer);
  };

  const handleInterviewTypeChange = (e) => {
    setSelectedInterviewType(e.target.value);
  };

  const handleSubmit = () => {
    if (selectedInterviewer && selectedInterviewType) {
      selectInterviewer(selectedInterviewer);
      onInterviewSelect(selectedInterviewer);
      onClose();
    } else {
      toast({
        title: "Please complete your selection",
        description: "Please select both an interviewer and interview type.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleClose = () => {
    setSelectedInterviewer(null);
    setSelectedInterviewType("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" isCentered>
      <ModalOverlay />
      <ModalContent borderRadius="lg" p={4}>
        <ModalHeader>
          <Heading color="brand.500" size="lg" color="blue.600">
            Choose Your Interview Setup
          </Heading>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6}>
            <Text color="gray.600" textAlign="center">
              Select an interviewer personality and interview type to begin your 3D avatar interview experience.
            </Text>
            
            <Box w="100%">
              <Heading color="brand.500" size="md" mb={4} color="gray.700">
                Select Interviewer Personality
              </Heading>
              <VStack spacing={3}>
                {interviewers.map((interviewer, index) => (
                  <Box
                    key={index}
                    w="100%"
                    p={4}
                    border="2px solid"
                    borderColor={selectedInterviewer?.label === interviewer.label ? "blue.500" : "gray.200"}
                    borderRadius="lg"
                    bg={selectedInterviewer?.label === interviewer.label ? "blue.50" : "white"}
                    cursor="pointer"
                    _hover={{ 
                      borderColor: "blue.300",
                      bg: selectedInterviewer?.label === interviewer.label ? "blue.50" : "gray.50"
                    }}
                    onClick={() => handleInterviewerClick(interviewer)}
                    transition="all 0.2s"
                  >
                    <VStack spacing={2} align="start">
                      <Heading color="brand.500" size="sm" color="blue.600">
                        {interviewer.label}
                      </Heading>
                      <Text fontSize="sm" color="gray.600">
                        {interviewer.description}
                      </Text>
                    </VStack>
                  </Box>
                ))}
              </VStack>
            </Box>

            <Box w="100%">
              <Heading color="brand.500" size="md" mb={4} color="gray.700">
                Select Interview Type
              </Heading>
              <Select
                placeholder="Choose interview type..."
                value={selectedInterviewType}
                onChange={handleInterviewTypeChange}
                bg="white"
                borderColor="gray.300"
                _hover={{ borderColor: "blue.300" }}
                _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
              >
                {interviewTypes.map((type, index) => (
                  <option key={index} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isDisabled={!selectedInterviewer || !selectedInterviewType}
            >
              Start Interview
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default InterviewSetup;
