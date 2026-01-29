import {
  Box,
  Progress,
  useToast,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../../components/Footer';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../../components/AuthContext';
import { get, post } from '../../../utils/httpServices';
import {
  BLOB_STORAGE_ENDPOINTS,
  JOB_MATCHING_ENDPOINTS,
} from '../../../services/apiService';
import UserInfoForm from './UserInfoForm';
import SkillsSelection from './SkillsSelection';
import JobsDisplay from './JobsDisplay';

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


  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      if (field === 'faculty') {
        return { ...prev, faculty: value, major: '' };
      }
      return { ...prev, [field]: value };
    });
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
          <UserInfoForm
            formData={formData}
            faculties={faculties}
            majors={majors}
            loading={loading}
            onInputChange={handleInputChange}
            onNext={handleNextToSkills}
            isLoadingSkills={loadingSkills}
          />
        )}

        {/* Step 2: Display Analysis Results and Select Skills */}
        {step === 2 && (
          <SkillsSelection
            majorSkillsResponse={majorSkillsResponse}
            selectedSkills={selectedSkills}
            loadingSkills={loadingSkills}
            onSkillToggle={handleSkillToggle}
            onBack={() => setStep(1)}
            onSearchJobs={handleSearchJobs}
            loadingJobs={loadingJobs}
          />
        )}

        {/* Step 3: Show Jobs */}
        {step === 3 && (
          <JobsDisplay
            jobs={jobs}
            loadingJobs={loadingJobs}
            onBack={() => setStep(2)}
            onStartOver={handleReset}
          />
        )}
      </Box>

      <Footer />
    </Box>
  );
};

export default JobMatchingTryPage;
