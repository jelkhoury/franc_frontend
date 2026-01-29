import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Select,
  Input,
  Spinner,
  useToast,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const UserInfoForm = ({
  formData,
  faculties,
  majors,
  loading,
  onInputChange,
  onNext,
  isLoadingSkills,
}) => {
  const navigate = useNavigate();
  const toast = useToast();

  // Filter majors based on selected faculty
  const filteredMajors = formData.faculty
    ? majors.filter(
        (major) => major.facultyId === parseInt(formData.faculty)
      )
    : majors;

  const handleNext = () => {
    if (!formData.faculty || !formData.major || !formData.level || !formData.country) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields before proceeding.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    onNext();
  };

  const handleBackToLanding = () => {
    navigate('/job-matching');
  };

  return (
    <Box maxW="800px" mx="auto">
      <Heading color="brand.500" size="xl" mb={4} textAlign="center">
        Enter Your Details
      </Heading>
      <Text color="gray.600" mb={8} textAlign="center">
        Please provide your academic information to get started.
      </Text>

      {loading ? (
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" color="brand.500" />
        </Flex>
      ) : (
        <Box
          bg="white"
          p={8}
          borderRadius="xl"
          boxShadow="md"
          maxW="600px"
          mx="auto"
        >
          <VStack spacing={6}>
            <FormControl isRequired>
              <FormLabel>Faculty</FormLabel>
              <Select
                placeholder="Select your faculty"
                value={formData.faculty}
                onChange={(e) => onInputChange('faculty', e.target.value)}
                bg="white"
              >
                {faculties.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Major</FormLabel>
              <Select
                placeholder="Select your major"
                value={formData.major}
                onChange={(e) => onInputChange('major', e.target.value)}
                bg="white"
                isDisabled={!formData.faculty}
              >
                {filteredMajors.map((major) => (
                  <option key={major.id} value={major.id}>
                    {major.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Level</FormLabel>
              <Select
                placeholder="Select your level"
                value={formData.level}
                onChange={(e) => onInputChange('level', e.target.value)}
                bg="white"
              >
                <option value="Undergraduate">Undergraduate</option>
                <option value="Graduate">Graduate</option>
                <option value="Postgraduate">Postgraduate</option>
                <option value="Professional">Professional</option>
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Country</FormLabel>
              <Input
                placeholder="Enter your country"
                value={formData.country}
                onChange={(e) => onInputChange('country', e.target.value)}
                bg="white"
              />
            </FormControl>

            <FormControl>
              <FormLabel>City (Optional)</FormLabel>
              <Input
                placeholder="Enter your city"
                value={formData.city}
                onChange={(e) => onInputChange('city', e.target.value)}
                bg="white"
              />
            </FormControl>

            <HStack spacing={4} w="100%" justify="flex-end">
              <Button variant="ghost" onClick={handleBackToLanding}>
                Cancel
              </Button>
              <Button
                colorScheme="brand"
                onClick={handleNext}
                isLoading={isLoadingSkills}
              >
                Next: Select Skills
              </Button>
            </HStack>
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default UserInfoForm;
