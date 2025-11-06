'use client';

import {
  Box,
  Button,
  Flex,
  FormLabel,
  Heading,
  Icon,
  Input,
  Text,
  VStack,
  useToast,
  Image,
  Progress,
  Spinner,
} from '@chakra-ui/react';
import { AttachmentIcon, CheckIcon } from '@chakra-ui/icons';
import { useRef, useState } from 'react';
import Footer from '../../components/Footer';

const CoverTryPage = () => {
  const coverLetterRef = useRef(null);
  const jobAdRef = useRef(null);
  const toast = useToast();

  const [coverLetterFile, setCoverLetterFile] = useState(null);
  const [jobAdFile, setJobAdFile] = useState(null);
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(33.3);
  const [evaluationResult, setEvaluationResult] = useState(null); // Store evaluation result
  const [loading, setLoading] = useState(false); 

  const handleFileChange = (e, setFile, allowedTypes, fileTypeMessage) => {
    const file = e.target.files[0];

    if (file && !allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: fileTypeMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      e.target.value = null;
      setFile(null);
    } else {
      setFile(file);
    }
  };

  const handleNext = () => {
    if (!coverLetterFile) {
      toast({
        title: 'Missing Cover Letter',
        description: 'Please upload a PDF or DOCX cover letter to continue.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setStep(2);
    setProgress(66.6);
  };

  const handleSubmit = async () => {
    if (!jobAdFile) {
      toast({
        title: 'Missing Job Ad',
        description: 'Please upload a job advertisement (PDF or DOCX).',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', coverLetterFile);
    formData.append('job_ad', jobAdFile);
    setLoading(true);
    const apiAiUrl = process.env.REACT_APP_API_AI_URL;
    try {
      const response = await fetch(`${apiAiUrl}/evaluate_cover_letter`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Evaluation Complete',
          description: 'Your cover letter has been analyzed successfully!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // Store the evaluation result in the state
        setEvaluationResult(data.evaluation_result);
      } else {
        toast({
          title: 'Evaluation Failed',
          description: data.error || 'Something went wrong!',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error submitting files:', error);
      toast({
        title: 'Network Error',
        description: 'Failed to connect to the server.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }

    setLoading(false);
    setStep(3);
    setProgress(100);
  };

  const handleBack = () => {
    setStep(step - 1);
    setProgress(progress - 33.3);
  };

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-r, white, #ebf8ff)"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      <Flex justify="center" align="center" flex="1" px={4} py={16}>
        <Box
          bg="white"
          p={10}
          borderRadius="2xl"
          boxShadow="lg"
          border="1px solid"
          borderColor="gray.100"
          maxW="600px"
          w="100%"
          textAlign="center"
        >
          <Image
            src="/assets/images/franc_avatar.jpg"
            alt="Franc Avatar"
            boxSize="100px"
            objectFit="cover"
            borderRadius="full"
            mx="auto"
            mb={4}
            transition="transform 0.3s"
            _hover={{ transform: 'scale(1.05)' }}
          />

          <Heading color="brand.500" size="lg" mb={4}>
            Upload Cover Letter & Job Ad
          </Heading>

          <Progress value={progress} size="sm" colorScheme="brand" mb={6} borderRadius="md" />

          {step === 1 && (
            <VStack spacing={5} align="stretch">
              <Box px={6} py={4} textAlign="center" bg="gray.50" borderRadius="2xl">
                <Heading color="brand.500" size="md" mb={4} color="gray.700">
                  📄 Cover Letter Tips
                </Heading>
                <VStack spacing={2} color="gray.600" fontSize="md">
                  <Text>✅ Make it <b>specific to the job</b></Text>
                  <Text>🌟 Highlight your <b>unique value</b></Text>
                  <Text>⏳ Keep it <b>concise and focused</b></Text>
                </VStack>
              </Box>

              <FormLabel fontWeight="bold">Upload Cover Letter (PDF or DOCX)</FormLabel>
              <Button
                leftIcon={<Icon as={AttachmentIcon} />}
                colorScheme="brand"
                onClick={() => coverLetterRef.current.click()}
              >
                {coverLetterFile ? coverLetterFile.name : 'Select Cover Letter (PDF or DOCX)'}
              </Button>
              <Input
                ref={coverLetterRef}
                type="file"
                accept=".pdf,.docx"
                display="none"
                onChange={(e) =>
                  handleFileChange(
                    e,
                    setCoverLetterFile,
                    ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                    'Only PDF and DOCX files are allowed for the Cover Letter.'
                  )
                }
              />

              <Button leftIcon={<CheckIcon />} colorScheme="green" onClick={handleNext}>
                Next
              </Button>
            </VStack>
          )}

          {step === 2 && (
            <VStack spacing={5} align="stretch">
              <Box px={6} py={4} textAlign="center" bg="gray.50" borderRadius="2xl">
                <Heading color="brand.500" size="md" mb={4} color="gray.700">
                  📰 Job Ad Tips
                </Heading>
                <VStack spacing={2} color="gray.600" fontSize="md">
                  <Text>🔍 Choose a <b>relevant and real job post</b></Text>
                  <Text>🎯 Ensure the ad contains <b>clear requirements</b></Text>
                  <Text>📌 Use recent postings for <b>best accuracy</b></Text>
                </VStack>
              </Box>

              <FormLabel fontWeight="bold">Upload Job Advertisement (PDF or DOCX)</FormLabel>
              <Button
                leftIcon={<Icon as={AttachmentIcon} />}
                colorScheme="brand"
                onClick={() => jobAdRef.current.click()}
              >
                {jobAdFile ? jobAdFile.name : 'Select Job Ad (PDF or DOCX)'}
              </Button>
              <Input
                ref={jobAdRef}
                type="file"
                accept=".pdf,.docx"
                display="none"
                onChange={(e) =>
                  handleFileChange(e, setJobAdFile, ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], 'Only PDF and DOCX files are allowed for the Job Ad.')
                }
              />

              <Button
                leftIcon={loading ? <Spinner size="sm" /> : <CheckIcon />}
                colorScheme="green"
                variant="solid"
                w="full"
                onClick={handleSubmit}
                isDisabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit'}
              </Button>
            </VStack>
          )}

          {step === 3 && (
            <VStack spacing={6}>
              <Text color="gray.600" fontSize="md">
                Franc is reviewing your cover letter and job ad for alignment and clarity.
              </Text>
              <Box bg="gray.50" p={5} borderRadius="lg" border="1px solid" borderColor="gray.200" w="full" textAlign="left" fontSize="sm" color="gray.600">
                ✅ Your documents have been submitted! Franc will provide insights shortly.
              </Box>
              
              {/* Display Evaluation Result */}
              {evaluationResult && (
                <Box bg="gray.50" p={5} borderRadius="lg" border="1px solid" borderColor="gray.200" w="full" textAlign="left" fontSize="sm" color="gray.600">
                  <Heading color="brand.500" size="md" mb={4}>Evaluation Result:</Heading>
                  <Text whiteSpace="pre-wrap">{evaluationResult}</Text>
                  </Box>
              )}
            </VStack>
          )}

          {step > 1 && (
            <Button variant="ghost" mt={6} colorScheme="gray" onClick={handleBack}>
              Back
            </Button>
          )}
        </Box>
      </Flex>

      <Footer />
    </Box>
  );
};

export default CoverTryPage;
