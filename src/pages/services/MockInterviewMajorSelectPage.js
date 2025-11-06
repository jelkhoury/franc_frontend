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
import { useState, useEffect, useContext } from "react";
import Footer from "../../components/Footer";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../components/AuthContext";

// Dummy faculties
const dummyFaculties = [
  { id: 1, name: "Faculty of Engineering" },
  { id: 2, name: "Faculty of Business" },
  { id: 3, name: "Faculty of Arts & Sciences" },
];

// Dummy majors
const dummyMajors = [
  {
    id: 1,
    facultyId: 1,
    name: "Computer Science",
    description: "Focus on software development, algorithms, and systems.",
    urlImage: "/assets/images/cs_major.svg",
  },
  {
    id: 2,
    facultyId: 1,
    name: "Electrical Engineering",
    description: "Learn about circuits, electronics, and power systems.",
    urlImage: "/assets/images/ee_major.svg",
  },
  {
    id: 3,
    facultyId: 2,
    name: "Business Administration",
    description: "Study management, finance, and entrepreneurship.",
    urlImage: "/assets/images/business_major.svg",
  },
  {
    id: 4,
    facultyId: 3,
    name: "Psychology",
    description: "Explore human behavior, cognition, and mental health.",
    urlImage: "/assets/images/psych_major.svg",
  },
];

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
    <Box maxW="900px">
      <Text fontWeight="bold" fontSize="xl" mb={2} color="brand.500">
        Tips for Mock Interviews
      </Text>
      <VStack align="flex-start" spacing={3}>
        <Text color="gray.600" fontSize="md">
          <Text as="span" fontWeight="bold">
            1. Set the scene:
          </Text>{" "}
          test the lighting and make sure the background isn't distracting,
          messy or cluttered.
        </Text>
        <Text color="gray.600" fontSize="md">
          <Text as="span" fontWeight="bold">
            2. Frame your face:
          </Text>{" "}
          Adjust your webcam to show you from mid-torso to just the top of your
          head.
        </Text>
        <Text color="gray.600" fontSize="md">
          <Text as="span" fontWeight="bold">
            3. Make eye contact:
          </Text>{" "}
          Look directly into the camera when you are talking
        </Text>
        <Text color="gray.600" fontSize="md">
          <Text as="span" fontWeight="bold">
            4. Dress professionally
          </Text>
        </Text>
        <Text color="gray.600" fontSize="md">
          <Text as="span" fontWeight="bold">
            5. Node your head
          </Text>{" "}
          to show patience and understanding and smile genuinely to express
          positivity and warmth
        </Text>
      </VStack>
    </Box>
    <Image
      src="/assets/images/chat_service.svg"
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
  const { isLoggedIn } = useContext(AuthContext);
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

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
  }, [isLoggedIn, navigate]);

  // Fetch faculties and majors from API with fallback to dummy data
  useEffect(() => {
    if (!isLoggedIn) return; // Don't fetch if not logged in
    const fetchData = async () => {
      try {
        setLoading(true);
        const baseUrl = process.env.REACT_APP_API_BASE_URL;

        let facultiesData = [];
        let majorsData = [];
        let apiSuccess = false;

        try {
          // Try to fetch faculties
          const facultiesResponse = await fetch(
            `${baseUrl}/api/BlobStorage/get-faculties`
          );
          if (facultiesResponse.ok) {
            facultiesData = await facultiesResponse.json();
            if (facultiesData && facultiesData.length > 0) {
              apiSuccess = true;
            }
          }

          // Try to fetch majors
          const majorsResponse = await fetch(
            `${baseUrl}/api/BlobStorage/get-majors`
          );
          if (majorsResponse.ok) {
            majorsData = await majorsResponse.json();
            if (majorsData && majorsData.length > 0) {
              apiSuccess = true;
            }
          }
        } catch (apiError) {
          console.warn(
            "API endpoints not available, using dummy data:",
            apiError.message
          );
        }

        // Use API data if available, otherwise fallback to dummy data
        if (apiSuccess && facultiesData.length > 0 && majorsData.length > 0) {
          setFaculties(facultiesData);
          setMajors(majorsData);
          setFilteredMajors(majorsData);
          console.log("Using API data for faculties and majors");
        } else {
          // Fallback to dummy data
          setFaculties(dummyFaculties);
          setMajors(dummyMajors);
          setFilteredMajors(dummyMajors);
          console.log("Using dummy data for faculties and majors");

          // Show a subtle notification that dummy data is being used
          toast({
            title: "Using sample data",
            description:
              "API endpoints are not available. Showing sample majors for demonstration.",
            status: "info",
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (err) {
        console.error("Error in data loading:", err);
        // Final fallback to dummy data
        setFaculties(dummyFaculties);
        setMajors(dummyMajors);
        setFilteredMajors(dummyMajors);
        setError(null); // Clear any previous errors since we have fallback data
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast, isLoggedIn]);

  // Filter majors based on faculty and search term
  useEffect(() => {
    let filtered = majors;

    // Filter by faculty
    if (selectedFaculty) {
      const facultyId = parseInt(selectedFaculty);
      filtered = filtered.filter((major) => major.facultyId === facultyId);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (major) =>
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
    navigate("/mock-interview/questions", {
      state: { major: selectedMajor.name || selectedMajor.title },
    });
  };

  const handleFacultyChange = (e) => {
    setSelectedFaculty(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Don't render anything if not logged in (will redirect)
  if (!isLoggedIn) {
    return null;
  }

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
        <Text mt={4} color="gray.600">
          Loading majors...
        </Text>
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
        <Text color="red.500" fontSize="lg">
          Error: {error}
        </Text>
        <Button
          mt={4}
          colorScheme="blue"
          onClick={() => window.location.reload()}
        >
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
          <Heading color="brand.500" size="2xl">Mock Interview</Heading>
          <Text fontSize="lg" color="gray.600">
            Tailor your interview practice to your academic major. Select your
            major to get started!
          </Text>
        </Stack>
        <FeaturedCard />
        <Heading color="brand.500" size="lg" mb={4} textAlign="center">
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
