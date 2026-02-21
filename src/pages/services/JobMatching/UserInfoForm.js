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
import { CountrySelect, StateSelect, CitySelect } from 'react-country-state-city';
import 'react-country-state-city/dist/react-country-state-city.css';

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

  // Filter majors based on selected faculty (support both facultyId and faculty_id from API)
  const filteredMajors = formData.faculty
    ? majors.filter(
        (major) =>
          (major.facultyId ?? major.faculty_id) === parseInt(formData.faculty)
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
        <Flex direction="column" justify="center" align="center" minH="400px" gap={4}>
          <Spinner size="xl" color="brand.500" />
          <Text color="gray.600" textAlign="center">
            Loading faculties and majors…
          </Text>
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
              <FormLabel>Select Your Level</FormLabel>
              <Select
                placeholder="Select your level"
                value={formData.level}
                onChange={(e) => onInputChange('level', e.target.value)}
                bg="gray.100"
              >
                <option value="Undergraduate">Undergraduate</option>
                <option value="Graduate">Graduate</option>
                <option value="Postgraduate">Postgraduate</option>
                <option value="Professional">Professional</option>
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Country</FormLabel>
              <Box
                sx={{
                  '& .stdropdown-container': { border: '1px solid', borderColor: 'gray.200' },
                  '& .stdropdown-menu': { border: '1px solid', borderColor: 'gray.200' },
                  '& input': { bg: 'white', border: 'none !important', boxShadow: 'none !important' },
                }}
              >
                <CountrySelect
                  placeHolder="Search country or capital"
                  defaultValue={formData.countryId ? { id: parseInt(formData.countryId), name: formData.country } : null}
                  onChange={(country) => {
                    onInputChange({
                      countryId: country?.id ?? '',
                      country: country?.name ?? '',
                      stateId: '',
                      city: '',
                    });
                  }}
                  showFlag={true}
                />
              </Box>
            </FormControl>

            <FormControl isDisabled={!formData.countryId}>
              <FormLabel>State/Province (Optional)</FormLabel>
              {formData.countryId ? (
                <Box
                  sx={{
                    '& .stdropdown-container': { border: '1px solid', borderColor: 'gray.200' },
                    '& .stdropdown-menu': { border: '1px solid', borderColor: 'gray.200' },
                    '& input': { bg: 'white', border: 'none !important', boxShadow: 'none !important' },
                  }}
                >
                  <StateSelect
                    countryid={parseInt(formData.countryId)}
                    placeHolder="Search state or province"
                    onChange={(state) => {
                      onInputChange({
                        stateId: state?.id ?? '',
                        city: '',
                      });
                    }}
                  />
                </Box>
              ) : (
                <Input
                  placeholder="Select country first"
                  isDisabled
                  bg="gray.50"
                  opacity={0.6}
                />
              )}
            </FormControl>

            <FormControl isDisabled={!formData.countryId}>
              <FormLabel>City (Optional)</FormLabel>
              {formData.countryId && formData.stateId ? (
                <Box
                  sx={{
                    '& .stdropdown-container': { border: '1px solid', borderColor: 'gray.200' },
                    '& .stdropdown-menu': { border: '1px solid', borderColor: 'gray.200' },
                    '& input': { bg: 'white', border: 'none !important', boxShadow: 'none !important' },
                  }}
                >
                  <CitySelect
                    countryid={parseInt(formData.countryId)}
                    stateid={parseInt(formData.stateId)}
                    placeHolder="Search city or capital"
                    onChange={(city) => onInputChange('city', city?.name ?? '')}
                  />
                </Box>
              ) : (
                <Input
                  placeholder={formData.countryId ? 'Enter your city or capital' : 'Select country first'}
                  value={formData.city}
                  onChange={(e) => onInputChange('city', e.target.value)}
                  bg={formData.countryId ? 'white' : 'gray.50'}
                  isDisabled={!formData.countryId}
                />
              )}
            </FormControl>

            <VStack spacing={3} w="100%" align="stretch">
              {isLoadingSkills && (
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Analyzing your profile and matching skills to your major…
                </Text>
              )}
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
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default UserInfoForm;
