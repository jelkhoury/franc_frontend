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
  Stack,
  Input,
  InputGroup,
  Select,
  Spinner,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import Footer from "../../components/Footer";
import { useNavigate } from "react-router-dom";

const FeaturedCard = () => (
  <Box
    bg="white"
    borderRadius="xl"
    boxShadow="md"
    p={6}
    mb={8}
    display="flex"
    justifyContent="space-between"
    alignItems="center"
    flexWrap="wrap"
  >
    <Box maxW="500px">
      <Text fontWeight="bold" fontSize="xl" mb={2} color="brand.500">
        Tips: Must Check for Mock Interviews
      </Text>
      <Text color="gray.600" fontSize="md">
        - Prepare for common questions
        <br />
        - Check your internet connection
        <br />
        - Check your audio and video setup
        <br />
        - Focus on clear communication
        <br />- Dress professionally, even if it's a video interview
      </Text>
    </Box>
    <Image
      src="/assets/images/mock_interview.svg"
      alt="Brain"
      borderRadius="md"
      boxSize="300px"
      ml={{ base: 0, md: 4 }}
      mt={{ base: 4, md: 0 }}
    />
  </Box>
);

const MajorCard = ({ major, selected, onClick }) => (
  <Box
    p={4}
    borderRadius="lg"
    border={selected ? "2px solid #3182CE" : "1px solid #E2E8F0"}
    bg="white"
    cursor="pointer"
    onClick={onClick}
    _hover={{ boxShadow: "lg" }}
  >
    <Image 
      src={major.urlImage || major.img} 
      alt={major.name || major.title} 
      mb={4} 
      boxSize="100px" 
      mx="auto"
      fallbackSrc="/assets/images/cs_major.svg"
    />
    <Text fontWeight="bold" textAlign="center" mb={1}>
      {major.name || major.title}
    </Text>
    <Text fontSize="sm" color="gray.600" textAlign="center">
      {major.description || major.desc}
    </Text>
  </Box>
);

const MockInterviewMajorSelectPage = () => {
  const [selectedMajor, setSelectedMajor] = useState(null);
  const [faculties, setFaculties] = useState([]);
  const [majors, setMajors] = useState([]);
  const [filteredMajors, setFilteredMajors] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  // Fetch faculties and majors from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5121/api';
        
        // Fetch faculties
        const facultiesResponse = await fetch(`${baseUrl}/BlobStorage/get-faculties`);
        if (!facultiesResponse.ok) {
          throw new Error('Failed to fetch faculties');
        }
        const facultiesData = await facultiesResponse.json();
        setFaculties(facultiesData);

        // Fetch majors
        const majorsResponse = await fetch(`${baseUrl}/BlobStorage/get-majors`);
        if (!majorsResponse.ok) {
          throw new Error('Failed to fetch majors');
        }
        const majorsData = await majorsResponse.json();
        setMajors(majorsData);
        setFilteredMajors(majorsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        toast({
          title: "Error loading data",
          description: err.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Filter majors based on faculty and search term
  useEffect(() => {
    let filtered = majors;

    // Filter by faculty
    if (selectedFaculty) {
      const facultyId = parseInt(selectedFaculty);
      filtered = filtered.filter(major => major.facultyId === facultyId);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(major => 
        major.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        major.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredMajors(filtered);
  }, [majors, selectedFaculty, searchTerm]);

  const handleSelect = (major) => {
    setSelectedMajor(major);
  };

  const handleProceed = () => {
    if (!selectedMajor) {
      toast({
        title: "Please select a major",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    navigate("/mock-interview/questions", { state: { major: selectedMajor.name || selectedMajor.title } });
  };

  const handleFacultyChange = (e) => {
    setSelectedFaculty(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  if (loading) {
    return (
      <Box
        minH="100vh"
        bgGradient="linear(to-r, white, #ebf8ff)"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
      >
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.600">Loading majors...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        minH="100vh"
        bgGradient="linear(to-r, white, #ebf8ff)"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
      >
        <Text color="red.500" fontSize="lg">Error: {error}</Text>
        <Button mt={4} colorScheme="blue" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-r, white, #ebf8ff)"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      <Box px={4} py={16}>
        <Stack spacing={8} mb={12} textAlign="center">
          <Heading size="2xl">Mock Interview</Heading>
          <Text fontSize="lg" color="gray.600">
            Tailor your interview practice to your academic major. Select your
            major to get started!
          </Text>
        </Stack>
        <FeaturedCard />
        <Heading size="lg" mb={4} textAlign="center">
          Select Your Major
        </Heading>
        <Text color="gray.600" mb={6} textAlign="center">
          Choose your academic major or program to get a tailored set of
          interview questions.
        </Text>
        <Flex
          direction={{ base: "column", md: "row" }}
          gap={4}
          justify="center"
          align="center"
          mb={6}
        >
          <Select
            placeholder="Filter by faculty"
            maxW="300px"
            bg="white"
            value={selectedFaculty}
            onChange={handleFacultyChange}
          >
            {faculties.map((faculty) => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.name}
              </option>
            ))}
          </Select>
          <InputGroup maxW="400px">
            <Input 
              placeholder="Search majors..." 
              bg="white" 
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </InputGroup>
        </Flex>
        
        {filteredMajors.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Text color="gray.500" fontSize="lg">
              {searchTerm || selectedFaculty 
                ? "No majors found matching your criteria." 
                : "No majors available at the moment."}
            </Text>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={6} mb={6}>
            {filteredMajors.map((major) => (
              <MajorCard
                key={major.id}
                major={major}
                selected={selectedMajor?.id === major.id}
                onClick={() => handleSelect(major)}
              />
            ))}
          </SimpleGrid>
        )}
        
        <Button
          colorScheme="green"
          size="lg"
          onClick={handleProceed}
          display="block"
          mx="auto"
          isDisabled={!selectedMajor}
        >
          Proceed
        </Button>
      </Box>
      <Footer />
    </Box>
  );
};

export default MockInterviewMajorSelectPage;
