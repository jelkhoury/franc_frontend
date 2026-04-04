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
import { captureError } from '../../../utils/sentryUtils';
import {
  BLOB_STORAGE_ENDPOINTS,
  JOB_MATCHING_ENDPOINTS,
} from '../../../services/apiService';
import UserInfoForm from './UserInfoForm';
import SkillsSelection from './SkillsSelection';
import JobsDisplay from './JobsDisplay';
import { isMajorSkillsSelectable } from './majorSkillsPolicy';

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
    countryId: '',
    stateId: '',
    city: '',
  });
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [customSkillsInput, setCustomSkillsInput] = useState('');
  
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
        captureError(error);
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
      if (typeof field === 'object' && field !== null) {
        return { ...prev, ...field };
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

      const requestBody = {
        faculty: selectedFaculty?.name || formData.faculty,
        major: selectedMajor?.name || formData.major,
        level: formData.level, // API expects: Undergraduate, Graduate, Postgraduate, Professional
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
        
        // Remove duplicates; if no skills at all, use job titles (roles) so user can still select and search
        let uniqueSkills = [...new Set(allSkills)];
        if (uniqueSkills.length === 0 && response.roles && Array.isArray(response.roles)) {
          uniqueSkills = response.roles.map((r) => (typeof r === 'string' ? r : r.name || r.title)).filter(Boolean);
        }
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
      captureError(error);
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

  // Map form level to API experience_level values
  const getExperienceLevel = () => {
    const level = (formData.level || '').toLowerCase();
    if (level === 'undergraduate') return ['entry'];
    if (level === 'graduate') return ['entry', 'associate'];
    if (level === 'postgraduate') return ['associate', 'mid'];
    if (level === 'professional') return ['associate', 'mid', 'senior'];
    return ['entry', 'associate'];
  };

  const selectedMajorName =
    majors.find((m) => m.id === parseInt(formData.major, 10))?.name || '';
  const skillsSelectable = isMajorSkillsSelectable(selectedMajorName);

  const handleSearchJobs = async () => {
    const manualSkills = customSkillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const combinedSkills = [...selectedSkills, ...manualSkills];

    if (combinedSkills.length === 0) {
      toast({
        title: skillsSelectable ? 'No Skills Selected' : 'Nothing Selected',
        description: skillsSelectable
          ? 'Please select at least one skill or role, or enter your own (comma separated), to find matching jobs.'
          : 'Please select at least one job title, or enter extra keywords (comma separated), to find matching jobs.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoadingJobs(true);
    try {
      const skillsArray = Array.isArray(combinedSkills) ? combinedSkills : [];
      const roles = majorSkillsResponse?.roles && Array.isArray(majorSkillsResponse.roles)
        ? majorSkillsResponse.roles.map((r) => (typeof r === 'string' ? r : r.name || r.title))
        : [];

      const requestBody = {
        country: formData.country,
        city: formData.city || '',
        roles,
        selected_skills: skillsArray,
        experience_level: getExperienceLevel(),
        limit: 20,
        remote: false,
      };

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
      captureError(error);
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
    setFormData({ faculty: '', major: '', level: '', country: '', countryId: '', stateId: '', city: '' });
    setSelectedSkills([]);
    setCustomSkillsInput('');
    setSkills([]);
    setJobs([]);
    setMajorSkillsResponse(null);
  };

  const handleBackToLanding = () => {
    navigate('/job-matching');
  };

  const handleBackToDetails = () => {
    setSelectedSkills([]);
    setCustomSkillsInput('');
    setSkills([]);
    setMajorSkillsResponse(null);
    setStep(1);
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
            customSkillsInput={customSkillsInput}
            loadingSkills={loadingSkills}
            onSkillToggle={handleSkillToggle}
            onCustomSkillsChange={setCustomSkillsInput}
            onBack={handleBackToDetails}
            onSearchJobs={handleSearchJobs}
            loadingJobs={loadingJobs}
            skillsSelectable={skillsSelectable}
          />
        )}

        {/* Step 3: Show Jobs */}
        {step === 3 && (
          <JobsDisplay
            jobs={jobs}
            loadingJobs={loadingJobs}
            selectedSkills={selectedSkills}
            country={formData.country}
            city={formData.city}
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
