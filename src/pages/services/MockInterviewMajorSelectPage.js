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
} from "@chakra-ui/react";
import { useState } from "react";
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

const majorsWithInfo = [
  {
    title: "Engineering",
    desc: "Focus on problem-solving and coding excellence.",
    img: "/assets/images/cs_major.svg",
    faculty: "Engineering",
  },
  {
    title: "Marketing Strategy",
    desc: "Master digital campaigns and brand positioning.",
    img: "/assets/images/marketing_major.svg",
    faculty: "Business",
  },
  {
    title: "Finance & Banking",
    desc: "Navigate market dynamics and financial analysis.",
    img: "/assets/images/business_major.svg",
    faculty: "Business",
  },
  {
    title: "Nursing & Healthcare",
    desc: "Prepare for patient care and medical scenarios.",
    img: "/assets/images/nursing_major.svg",
    faculty: "Health",
  },
  {
    title: "Audio & Visual Arts",
    desc: "Explore creative expression through media.",
    img: "/assets/images/av_major.svg",
    faculty: "Arts",
  },
];

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
    <Image src={major.img} alt={major.title} mb={4} boxSize="100px" mx="auto" />
    <Text fontWeight="bold" textAlign="center" mb={1}>
      {major.title}
    </Text>
    <Text fontSize="sm" color="gray.600" textAlign="center">
      {major.desc}
    </Text>
  </Box>
);

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
        title: "Please select a major",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    navigate("/mock-interview/questions", { state: { major: selectedMajor.title } });
  };

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
            isDisabled
          />
          <InputGroup maxW="400px">
            <Input placeholder="Search majors..." bg="white" isDisabled />
          </InputGroup>
        </Flex>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={6} mb={6}>
          {majorsWithInfo.map((major) => (
            <MajorCard
              key={major.title}
              major={major}
              selected={selectedMajor?.title === major.title}
              onClick={() => handleSelect(major)}
            />
          ))}
        </SimpleGrid>
        <Button
          colorScheme="green"
          size="lg"
          onClick={handleProceed}
          display="block"
          mx="auto"
        >
          Proceed
        </Button>
      </Box>
      <Footer />
    </Box>
  );
};

export default MockInterviewMajorSelectPage;
