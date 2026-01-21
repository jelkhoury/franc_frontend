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
  SimpleGrid,
  Checkbox,
  CheckboxGroup,
  Spinner,
  useToast,
  Card,
  CardBody,
  Badge,
  Progress,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { InfoIcon, CheckCircleIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../components/AuthContext';
import { get, post } from '../../utils/httpServices';
import {
  BLOB_STORAGE_ENDPOINTS,
  JOB_MATCHING_ENDPOINTS,
} from '../../services/apiService';

const JobMatchingTryPage = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
  }, [isLoggedIn, navigate]);

  // Form state
  const [step, setStep] = useState(1);
  const [faculties, setFaculties] = useState([]);
  const [majors, setMajors] = useState([]);
  const [skills, setSkills] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    faculty: '',
    major: '',
    level: '',
    country: '',
    city: '', // Add city field
  });
  const [selectedSkills, setSelectedSkills] = useState([]);
  
  // Store Phase 1 response data for Phase 2
  const [majorSkillsResponse, setMajorSkillsResponse] = useState(null);

  // Fetch faculties and majors on mount
  useEffect(() => {
    if (!isLoggedIn) return; // Don't fetch if not logged in

    const fetchData = async () => {
      try {
        setLoading(true);
        const facultiesData = await get(BLOB_STORAGE_ENDPOINTS.GET_FACULTIES,);
        const majorsData = await get(BLOB_STORAGE_ENDPOINTS.GET_MAJORS);

        if (facultiesData && facultiesData.length > 0) {
          setFaculties(facultiesData);
        }
        if (majorsData && majorsData.length > 0) {
          setMajors(majorsData);
        }
      } catch (error) {
        console.error('Error fetching faculties/majors:', error);
        toast({
          title: 'Error',
          description: 'Failed to load faculties and majors. Please try again.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isLoggedIn, toast]);

  // Filter majors based on selected faculty
  const filteredMajors = formData.faculty
    ? majors.filter(
        (major) => major.facultyId === parseInt(formData.faculty)
      )
    : majors;

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (field === 'faculty') {
      setFormData({ ...formData, faculty: value, major: '' });
    }
  };

  const handleNextToSkills = async () => {
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

    setLoadingSkills(true);
    try {
      const selectedFaculty = faculties.find((f) => f.id === parseInt(formData.faculty));
      const selectedMajor = majors.find((m) => m.id === parseInt(formData.major));
      
      // Normalize level to API format (undergrad, grad, postgrad, professional)
      let normalizedLevel = formData.level.toLowerCase();
      if (normalizedLevel === 'undergraduate') {
        normalizedLevel = 'undergrad';
      } else if (normalizedLevel === 'graduate') {
        normalizedLevel = 'grad';
      } else if (normalizedLevel === 'postgraduate') {
        normalizedLevel = 'postgrad';
      }
      
      const requestBody = {
        faculty: selectedFaculty?.name || formData.faculty,
        major: selectedMajor?.name || formData.major,
        level: normalizedLevel,
        country: formData.country,
      };

      const response = await post(
        JOB_MATCHING_ENDPOINTS.MAJOR_SKILLS,
        requestBody,
        { base: 'ai' }
      );

      if (response) {
        // Store the full response for Phase 2
        setMajorSkillsResponse(response);
        
        // Extract skills from technical_skill_groups and soft_skills
        const allSkills = [];
        
        // Extract from technical_skill_groups (array of groups, each with skills)
        if (response.technical_skill_groups && Array.isArray(response.technical_skill_groups)) {
          response.technical_skill_groups.forEach((group) => {
            if (group.skills && Array.isArray(group.skills)) {
              group.skills.forEach((skill) => {
                if (typeof skill === 'string') {
                  allSkills.push(skill);
                } else if (skill.name) {
                  allSkills.push(skill.name);
                }
              });
            }
          });
        }
        
        // Extract from soft_skills
        if (response.soft_skills && Array.isArray(response.soft_skills)) {
          response.soft_skills.forEach((skill) => {
            if (typeof skill === 'string') {
              allSkills.push(skill);
            } else if (skill.name) {
              allSkills.push(skill.name);
            }
          });
        }
        
        // Remove duplicates
        const uniqueSkills = [...new Set(allSkills)];
        setSkills(uniqueSkills);
        setStep(2);
      } else {
        toast({
          title: 'No Skills Found',
          description: 'No skills found for this major. Please try another major.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch skills. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingSkills(false);
    }
  };

  const handleSkillToggle = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const handleSearchJobs = async () => {
    if (selectedSkills.length === 0) {
      toast({
        title: 'No Skills Selected',
        description: 'Please select at least one skill to find matching jobs.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoadingJobs(true);
    try {
      // Ensure selectedSkills is an array (safety check)
      const skillsArray = Array.isArray(selectedSkills) ? selectedSkills : [];

      // Build request body - enhanced with Phase 1 data if available
      const requestBody = {
        selected_skills: skillsArray, // Must be named selected_skills, not skills
        country: formData.country,
        city: formData.city || undefined, // Optional
        remote: false, // Default to false, can be made configurable later
        limit: 20,
      };

      // Add roles from Phase 1 response if available
      if (majorSkillsResponse?.roles && Array.isArray(majorSkillsResponse.roles)) {
        requestBody.roles = majorSkillsResponse.roles.map((role) => 
          typeof role === 'string' ? role : role.name || role.title
        );
      }

      // Add enhanced data from Phase 1 if available
      if (majorSkillsResponse) {
        // Add market_skills (from market_keywords.skills)
        if (majorSkillsResponse.market_keywords?.skills && Array.isArray(majorSkillsResponse.market_keywords.skills)) {
          requestBody.market_skills = majorSkillsResponse.market_keywords.skills.map((skill) => {
            if (typeof skill === 'string') {
              return { name: skill, aliases: [] };
            }
            return {
              name: skill.name || skill,
              aliases: skill.aliases || [],
            };
          });
        }

        // Add market_search_terms
        if (majorSkillsResponse.market_keywords?.search_terms && Array.isArray(majorSkillsResponse.market_keywords.search_terms)) {
          requestBody.market_search_terms = majorSkillsResponse.market_keywords.search_terms;
        }

        // Add domain_profile with scoring_weights
        if (majorSkillsResponse.domain_profile?.scoring_weights) {
          requestBody.domain_profile = {
            scoring_weights: majorSkillsResponse.domain_profile.scoring_weights,
          };
        }
      }

      const response = await post(
        JOB_MATCHING_ENDPOINTS.SEARCH_OPPORTUNITIES,
        requestBody,
        { base: 'ai' }
      );

      if (response && response.results && Array.isArray(response.results)) {
        setJobs(response.results);
        setStep(3);
      } else if (response && Array.isArray(response)) {
        // Fallback: if response is directly an array
        setJobs(response);
        setStep(3);
      } else {
        toast({
          title: 'No Jobs Found',
          description: 'No matching jobs found. Try selecting different skills.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error searching jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to search for jobs. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setFormData({ faculty: '', major: '', level: '', country: '', city: '' });
    setSelectedSkills([]);
    setSkills([]);
    setJobs([]);
    setMajorSkillsResponse(null);
  };

  const handleBackToLanding = () => {
    navigate('/job-matching');
  };

  // Don't render anything if not logged in (will redirect)
  if (!isLoggedIn) {
    return null;
  }

  // Form View - Multi-step
  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-r, white, #ebf8ff)"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      <Box px={{ base: 4, md: 16 }} py={8}>
        {/* Progress Bar */}
        <Progress
          value={(step / 3) * 100}
          colorScheme="brand"
          mb={8}
          borderRadius="full"
        />

        {/* Step 1: Enter Details */}
        {step === 1 && (
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
                      onChange={(e) => handleInputChange('faculty', e.target.value)}
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
                      onChange={(e) => handleInputChange('major', e.target.value)}
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
                      onChange={(e) => handleInputChange('level', e.target.value)}
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
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      bg="white"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>City (Optional)</FormLabel>
                    <Input
                      placeholder="Enter your city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      bg="white"
                    />
                  </FormControl>

                  <HStack spacing={4} w="100%" justify="flex-end">
                    <Button variant="ghost" onClick={handleBackToLanding}>
                      Cancel
                    </Button>
                    <Button
                      colorScheme="brand"
                      onClick={handleNextToSkills}
                      isLoading={loadingSkills}
                    >
                      Next: Select Skills
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            )}
          </Box>
        )}

        {/* Step 2: Display Analysis Results and Select Skills */}
        {step === 2 && (
          <Box maxW="1400px" mx="auto">
            <Heading color="brand.500" size="xl" mb={4} textAlign="center">
              Career Analysis & Skills Mapping
            </Heading>
            <Text color="gray.600" mb={8} textAlign="center">
              Review the analysis below and select the skills you have to find matching opportunities.
            </Text>

            {loadingSkills ? (
              <Flex justify="center" align="center" minH="400px">
                <Spinner size="xl" color="brand.500" />
              </Flex>
            ) : !majorSkillsResponse ? (
              <Box textAlign="center" py={8}>
                <Text color="gray.500">No analysis data available.</Text>
              </Box>
            ) : (
              <VStack spacing={6} align="stretch">
                {/* Domain Profile */}
                {majorSkillsResponse.domain_profile && (
                  <Card boxShadow="md">
                    <CardBody>
                      <Heading size="md" color="brand.500" mb={3}>
                        Domain Profile
                      </Heading>
                      <VStack align="stretch" spacing={2}>
                        <HStack>
                          <Text fontWeight="bold">Domain:</Text>
                          <Badge colorScheme="blue" fontSize="md">
                            {majorSkillsResponse.domain_profile.domain}
                          </Badge>
                        </HStack>
                        {majorSkillsResponse.domain_profile.rationale && (
                          <Box bg="blue.50" p={3} borderRadius="md">
                            <Text fontSize="sm" color="gray.700">
                              <strong>Rationale:</strong> {majorSkillsResponse.domain_profile.rationale}
                            </Text>
                          </Box>
                        )}
                        {majorSkillsResponse.domain_profile.scoring_weights && (
                          <Box>
                            <Text fontWeight="bold" mb={2}>Scoring Weights:</Text>
                            <HStack spacing={4} flexWrap="wrap">
                              <Badge colorScheme="green">
                                Skills: {(majorSkillsResponse.domain_profile.scoring_weights.skills * 100).toFixed(0)}%
                              </Badge>
                              <Badge colorScheme="blue">
                                Role: {(majorSkillsResponse.domain_profile.scoring_weights.role * 100).toFixed(0)}%
                              </Badge>
                              <Badge colorScheme="purple">
                                Location/Remote: {(majorSkillsResponse.domain_profile.scoring_weights.location_remote * 100).toFixed(0)}%
                              </Badge>
                            </HStack>
                          </Box>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                )}

                {/* Job Titles & Career Opportunities */}
                {majorSkillsResponse.roles && majorSkillsResponse.roles.length > 0 && (
                  <Card boxShadow="md">
                    <CardBody>
                      <Heading size="md" color="brand.500" mb={3}>
                        Job Titles & Career Opportunities
                      </Heading>
                      <Text fontSize="sm" color="gray.600" mb={4}>
                        Directly related roles for internships, entry-level, and full-time positions
                      </Text>
                      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
                        {majorSkillsResponse.roles.map((role, index) => (
                          <Badge
                            key={index}
                            colorScheme="blue"
                            fontSize="md"
                            px={4}
                            py={2}
                            borderRadius="full"
                          >
                            {typeof role === 'string' ? role : role.name || role.title}
                          </Badge>
                        ))}
                      </SimpleGrid>
                    </CardBody>
                  </Card>
                )}

                {/* Technical Skills - Grouped */}
                {majorSkillsResponse.technical_skill_groups && majorSkillsResponse.technical_skill_groups.length > 0 && (
                  <Card boxShadow="md">
                    <CardBody>
                      <Heading size="md" color="brand.500" mb={3}>
                        Technical Skills
                      </Heading>
                      <Text fontSize="sm" color="gray.600" mb={4}>
                        Select the technical skills you have. Each skill includes a description and proficiency level.
                      </Text>
                      <Accordion allowMultiple defaultIndex={[]}>
                        {majorSkillsResponse.technical_skill_groups.map((group, groupIndex) => (
                          <AccordionItem key={groupIndex}>
                            <AccordionButton>
                              <Box flex="1" textAlign="left">
                                <Text fontWeight="bold">{group.group}</Text>
                              </Box>
                              <AccordionIcon />
                            </AccordionButton>
                            <AccordionPanel pb={4}>
                              <VStack align="stretch" spacing={3}>
                                {group.skills && Array.isArray(group.skills) && group.skills.map((skill, skillIndex) => {
                                  const skillName = typeof skill === 'string' ? skill : skill.name;
                                  const skillDescription = skill.description || '';
                                  const skillLevel = skill.level || '';
                                  const isSelected = selectedSkills.includes(skillName);
                                  
                                  return (
                                    <Box
                                      key={skillIndex}
                                      p={3}
                                      border="1px solid"
                                      borderColor={isSelected ? 'brand.500' : 'gray.200'}
                                      borderRadius="md"
                                      bg={isSelected ? 'brand.50' : 'white'}
                                    >
                                      <Checkbox
                                        value={skillName}
                                        isChecked={isSelected}
                                        onChange={() => handleSkillToggle(skillName)}
                                        colorScheme="brand"
                                      >
                                        <VStack align="start" spacing={1} ml={2}>
                                          <HStack>
                                            <Text fontWeight="semibold">{skillName}</Text>
                                            {skillLevel && (
                                              <Badge
                                                colorScheme={
                                                  skillLevel === 'advanced' ? 'green' :
                                                  skillLevel === 'intermediate' ? 'blue' : 'gray'
                                                }
                                                fontSize="xs"
                                              >
                                                {skillLevel}
                                              </Badge>
                                            )}
                                          </HStack>
                                          {skillDescription && (
                                            <Text fontSize="sm" color="gray.600" pl={6}>
                                              {skillDescription}
                                            </Text>
                                          )}
                                        </VStack>
                                      </Checkbox>
                                    </Box>
                                  );
                                })}
                              </VStack>
                            </AccordionPanel>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardBody>
                  </Card>
                )}

                {/* Soft Skills */}
                {majorSkillsResponse.soft_skills && majorSkillsResponse.soft_skills.length > 0 && (
                  <Card boxShadow="md">
                    <CardBody>
                      <Heading size="md" color="brand.500" mb={3}>
                        Soft Skills
                      </Heading>
                      <Text fontSize="sm" color="gray.600" mb={4}>
                        Select the soft skills you possess. These are important for internships and full-time positions.
                      </Text>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                        {majorSkillsResponse.soft_skills.map((skill, index) => {
                          const skillName = typeof skill === 'string' ? skill : skill.name;
                          const skillDescription = skill.description || '';
                          const skillLevel = skill.level || '';
                          const isSelected = selectedSkills.includes(skillName);
                          
                          return (
                            <Box
                              key={index}
                              p={3}
                              border="1px solid"
                              borderColor={isSelected ? 'brand.500' : 'gray.200'}
                              borderRadius="md"
                              bg={isSelected ? 'brand.50' : 'white'}
                            >
                              <Checkbox
                                value={skillName}
                                isChecked={isSelected}
                                onChange={() => handleSkillToggle(skillName)}
                                colorScheme="brand"
                              >
                                <VStack align="start" spacing={1} ml={2}>
                                  <HStack>
                                    <Text fontWeight="semibold">{skillName}</Text>
                                    {skillLevel && (
                                      <Badge
                                        colorScheme={
                                          skillLevel === 'advanced' ? 'green' :
                                          skillLevel === 'intermediate' ? 'blue' : 'gray'
                                        }
                                        fontSize="xs"
                                      >
                                        {skillLevel}
                                      </Badge>
                                    )}
                                  </HStack>
                                  {skillDescription && (
                                    <Text fontSize="sm" color="gray.600" pl={6}>
                                      {skillDescription}
                                    </Text>
                                  )}
                                </VStack>
                              </Checkbox>
                            </Box>
                          );
                        })}
                      </SimpleGrid>
                    </CardBody>
                  </Card>
                )}

                {/* Market Keywords */}
                {majorSkillsResponse.market_keywords && (
                  <Card boxShadow="md">
                    <CardBody>
                      <Heading size="md" color="brand.500" mb={3}>
                        Market Keywords
                      </Heading>
                      {majorSkillsResponse.market_keywords.search_terms && majorSkillsResponse.market_keywords.search_terms.length > 0 && (
                        <Box mb={4}>
                          <Text fontWeight="semibold" mb={2}>Search Terms:</Text>
                          <HStack flexWrap="wrap" spacing={2}>
                            {majorSkillsResponse.market_keywords.search_terms.map((term, index) => (
                              <Badge key={index} colorScheme="purple" fontSize="sm">
                                {term}
                              </Badge>
                            ))}
                          </HStack>
                        </Box>
                      )}
                      {majorSkillsResponse.market_keywords.skills && majorSkillsResponse.market_keywords.skills.length > 0 && (
                        <Box>
                          <Text fontWeight="semibold" mb={2}>Market Skills (with aliases):</Text>
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                            {majorSkillsResponse.market_keywords.skills.map((skill, index) => {
                              const skillName = typeof skill === 'string' ? skill : skill.name;
                              const aliases = skill.aliases || [];
                              const whyItMatters = skill.why_it_matters || '';
                              
                              return (
                                <Box key={index} p={2} bg="gray.50" borderRadius="md">
                                  <Text fontWeight="semibold">{skillName}</Text>
                                  {aliases.length > 0 && (
                                    <Text fontSize="xs" color="gray.600" mt={1}>
                                      Aliases: {aliases.join(', ')}
                                    </Text>
                                  )}
                                  {whyItMatters && (
                                    <Text fontSize="xs" color="gray.500" mt={1} fontStyle="italic">
                                      {whyItMatters}
                                    </Text>
                                  )}
                                </Box>
                              );
                            })}
                          </SimpleGrid>
                        </Box>
                      )}
                    </CardBody>
                  </Card>
                )}

                {/* Notes */}
                {majorSkillsResponse.notes && majorSkillsResponse.notes.length > 0 && (
                  <Card boxShadow="md" bg="yellow.50">
                    <CardBody>
                      <HStack mb={2}>
                        <InfoIcon color="yellow.600" />
                        <Heading size="sm" color="yellow.700">
                          Notes
                        </Heading>
                      </HStack>
                      <List spacing={2}>
                        {majorSkillsResponse.notes.map((note, index) => (
                          <ListItem key={index}>
                            <ListIcon as={CheckCircleIcon} color="yellow.600" />
                            {note}
                          </ListItem>
                        ))}
                      </List>
                    </CardBody>
                  </Card>
                )}

                {/* Action Buttons */}
                <Card boxShadow="md" bg="brand.50">
                  <CardBody>
                    <HStack spacing={4} justify="space-between" flexWrap="wrap">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold">
                          Selected Skills: {selectedSkills.length}
                        </Text>
                        {selectedSkills.length > 0 && (
                          <HStack flexWrap="wrap" spacing={2}>
                            {selectedSkills.slice(0, 5).map((skill, idx) => (
                              <Badge key={idx} colorScheme="green">
                                {skill}
                              </Badge>
                            ))}
                            {selectedSkills.length > 5 && (
                              <Badge colorScheme="green">
                                +{selectedSkills.length - 5} more
                              </Badge>
                            )}
                          </HStack>
                        )}
                      </VStack>
                      <HStack spacing={4}>
                        <Button variant="ghost" onClick={() => setStep(1)}>
                          Back
                        </Button>
                        <Button
                          colorScheme="brand"
                          onClick={handleSearchJobs}
                          isLoading={loadingJobs}
                          isDisabled={selectedSkills.length === 0}
                          size="lg"
                        >
                          Find Matching Jobs ({selectedSkills.length})
                        </Button>
                      </HStack>
                    </HStack>
                  </CardBody>
                </Card>
              </VStack>
            )}
          </Box>
        )}

        {/* Step 3: Show Jobs */}
        {step === 3 && (
          <Box maxW="1200px" mx="auto">
            <Heading color="brand.500" size="xl" mb={4} textAlign="center">
              Matching Job Opportunities
            </Heading>
            <Text color="gray.600" mb={8} textAlign="center">
              Here are the job opportunities that match your profile.
            </Text>

            {loadingJobs ? (
              <Flex justify="center" align="center" minH="400px">
                <Spinner size="xl" color="brand.500" />
              </Flex>
            ) : jobs.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Text color="gray.500" fontSize="lg" mb={4}>
                  No matching jobs found at this time.
                </Text>
                <Button colorScheme="brand" onClick={() => setStep(2)}>
                  Try Different Skills
                </Button>
              </Box>
            ) : (
              <VStack spacing={4} align="stretch">
                {jobs.map((job, index) => (
                  <Card key={index} boxShadow="md">
                    <CardBody>
                      <Flex justify="space-between" align="start" flexWrap="wrap">
                        <Box flex="1">
                          <Flex align="center" justify="space-between" mb={2}>
                            <Heading size="md" color="brand.500">
                              {job.title || job.jobTitle || 'Job Title'}
                            </Heading>
                            {job.match_score !== undefined && (
                              <Badge
                                colorScheme={
                                  job.match_score >= 70
                                    ? 'green'
                                    : job.match_score >= 50
                                    ? 'yellow'
                                    : 'orange'
                                }
                                fontSize="md"
                                px={3}
                                py={1}
                              >
                                {job.match_score.toFixed(0)}% Match
                              </Badge>
                            )}
                          </Flex>
                          <Text color="gray.600" mb={2}>
                            {job.company || job.companyName || 'Company Name'}
                          </Text>
                          {job.location && (
                            <Text fontSize="sm" color="gray.500" mb={2}>
                              📍 {job.location}
                            </Text>
                          )}
                          {job.description && (
                            <Text fontSize="sm" color="gray.700" mt={2}>
                              {job.description}
                            </Text>
                          )}
                          
                          {/* Matched Skills */}
                          {job.matched_skills && Array.isArray(job.matched_skills) && job.matched_skills.length > 0 && (
                            <Box mt={3}>
                              <Text fontSize="sm" fontWeight="bold" color="green.600" mb={1}>
                                Matched Skills:
                              </Text>
                              <HStack flexWrap="wrap" spacing={2}>
                                {job.matched_skills.map((skill, idx) => (
                                  <Badge key={idx} colorScheme="green">
                                    {skill}
                                  </Badge>
                                ))}
                              </HStack>
                            </Box>
                          )}
                          
                          {/* Missing Skills */}
                          {job.missing_skills && Array.isArray(job.missing_skills) && job.missing_skills.length > 0 && (
                            <Box mt={3}>
                              <Text fontSize="sm" fontWeight="bold" color="orange.600" mb={1}>
                                Missing Skills:
                              </Text>
                              <HStack flexWrap="wrap" spacing={2}>
                                {job.missing_skills.map((skill, idx) => (
                                  <Badge key={idx} colorScheme="orange">
                                    {skill}
                                  </Badge>
                                ))}
                              </HStack>
                            </Box>
                          )}
                          
                          {/* Fallback: show skills if matched_skills/missing_skills not available */}
                          {(!job.matched_skills || job.matched_skills.length === 0) &&
                            (!job.missing_skills || job.missing_skills.length === 0) &&
                            job.skills &&
                            Array.isArray(job.skills) && (
                              <Box mt={3}>
                                <HStack flexWrap="wrap" spacing={2}>
                                  {job.skills.map((skill, idx) => (
                                    <Badge key={idx} colorScheme="blue">
                                      {skill}
                                    </Badge>
                                  ))}
                                </HStack>
                              </Box>
                            )}
                        </Box>
                        {job.url && (
                          <Button
                            as="a"
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            colorScheme="brand"
                            size="sm"
                            ml={4}
                          >
                            View Job
                          </Button>
                        )}
                      </Flex>
                    </CardBody>
                  </Card>
                ))}

                <HStack spacing={4} mt={8} justify="center">
                  <Button variant="ghost" onClick={() => setStep(2)}>
                    Back to Skills
                  </Button>
                  <Button colorScheme="brand" onClick={handleReset}>
                    Start Over
                  </Button>
                </HStack>
              </VStack>
            )}
          </Box>
        )}
      </Box>

      <Footer />
    </Box>
  );
};

export default JobMatchingTryPage;
