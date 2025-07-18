import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  useToast,
  Image,
} from '@chakra-ui/react';
import { useState } from 'react';
import Footer from '../../components/Footer';
import { useNavigate } from 'react-router-dom';

const majors = [
  'Nursing',
  'Business',
  'Engineering',
  'Computer Science',
  'Education',
  'Psychology',
  'Biology',
  'Chemistry',
  'Physics',
  'Mathematics',
  'Law',
  'Architecture',
  'Pharmacy',
  'Marketing',
  'Finance',
  'Accounting',
  // Add more as needed
];

const MockInterviewMajorSelectPage = () => {
  const [selectedMajor, setSelectedMajor] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSelect = (major) => {
    setSelectedMajor(major);
  };

  const handleProceed = () => {
    if (!selectedMajor) {
      toast({
        title: 'Please select a major',
        status: 'warning',
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    navigate('/mock-interview/questions', { state: { major: selectedMajor } });
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
          maxW="700px"
          w="100%"
          textAlign="center"
        >
          <Image
            src="/assets/images/franc_avatar.jpg"
            alt="Franc Avatar"
            boxSize="80px"
            objectFit="cover"
            borderRadius="full"
            mx="auto"
            mb={4}
          />
          <Heading size="lg" mb={4}>
            Select Your Major
          </Heading>
          <Text color="gray.600" mb={6}>
            Choose your academic major or program to get a tailored set of interview questions.
          </Text>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4} mb={6}>
            {majors.map((major) => (
              <Button
                key={major}
                variant={selectedMajor === major ? 'solid' : 'outline'}
                colorScheme={selectedMajor === major ? 'brand' : 'gray'}
                onClick={() => handleSelect(major)}
                size="lg"
                borderRadius="xl"
                fontWeight="semibold"
              >
                {major}
              </Button>
            ))}
          </SimpleGrid>
          <Button colorScheme="green" size="lg" onClick={handleProceed}>
            Proceed
          </Button>
        </Box>
      </Flex>
      <Footer />
    </Box>
  );
};

export default MockInterviewMajorSelectPage; 