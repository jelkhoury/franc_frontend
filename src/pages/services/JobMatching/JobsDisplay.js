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
  selectedSkills = [],
  country = '',
  city = '',
  onBack,
  onStartOver,
}) => {
  const skillPart = [].concat(selectedSkills).filter(Boolean).join(' ');
  const locationPart = [city, country].filter(Boolean).join(', ');
  const googleSearchQuery = [skillPart, 'jobs', locationPart].filter(Boolean).join(' ').trim() || 'jobs';
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(googleSearchQuery)}`;
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
        <Box py={8} maxW="520px" mx="auto">
          <Text color="gray.600" fontSize="lg" textAlign="center" mb={6}>
            We're sorry—we couldn't find any matching jobs at this time.
          </Text>

          <HStack spacing={3} justify="center" flexWrap="wrap" mb={3}>
            <Button colorScheme="brand" variant="outline" onClick={onBack}>
              Try Different Skills
            </Button>
            <Button colorScheme="brand" onClick={onStartOver}>
              Start Over
            </Button>
          </HStack>

          <Text color="gray.600" fontSize="md" fontWeight="semibold" textAlign="center" mb={4}>
            OR
          </Text>

          <Card variant="outline" borderColor="gray.200" overflow="hidden">
            <Box bg="gray.50" px={5} py={4}>
              <Text fontSize="sm" color="gray.600" mb={3} textAlign="center">
                Try searching your skills or role on Google for more opportunities.
              </Text>
              <Flex justify="center">
                <Button
                  as="a"
                  href={googleSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  colorScheme="brand"
                  size="md"
                >
                  Search on Google
                </Button>
              </Flex>
            </Box>
          </Card>
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
                    {(job.posted_at != null || job.posted_at_days_ago != null || job.remote) && (
                      <Text fontSize="xs" color="gray.500" mb={1}>
                        {[
                          job.posted_at_days_ago != null &&
                            (job.posted_at_days_ago === 0
                              ? 'Posted today'
                              : `Posted ${job.posted_at_days_ago} day(s) ago`),
                          job.posted_at_days_ago == null && job.posted_at && `Posted ${job.posted_at}`,
                          job.remote && 'Remote',
                        ]
                          .filter(Boolean)
                          .join(' • ')}
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
                  {(job.url || job.apply_url) && (
                    <Button
                      as="a"
                      href={job.url || job.apply_url}
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
