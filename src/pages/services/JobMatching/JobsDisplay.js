import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  VStack,
  HStack,
  Spinner,
  Card,
  CardBody,
  Badge,
} from '@chakra-ui/react';

const JobsDisplay = ({
  jobs,
  loadingJobs,
  onBack,
  onStartOver,
}) => {
  return (
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
          <Button colorScheme="brand" onClick={onBack}>
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
            <Button variant="ghost" onClick={onBack}>
              Back to Skills
            </Button>
            <Button colorScheme="brand" onClick={onStartOver}>
              Start Over
            </Button>
          </HStack>
        </VStack>
      )}
    </Box>
  );
};

export default JobsDisplay;
