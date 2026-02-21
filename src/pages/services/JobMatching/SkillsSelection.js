import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  VStack,
  HStack,
  SimpleGrid,
  Checkbox,
  Spinner,
  Card,
  CardBody,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
const SkillsSelection = ({
  majorSkillsResponse,
  selectedSkills,
  loadingSkills,
  onSkillToggle,
  onBack,
  onSearchJobs,
  loadingJobs,
}) => {
  return (
    <Box maxW="1400px" mx="auto">
      <Heading color="brand.500" size="xl" mb={4} textAlign="center">
        Career Analysis & Skills Mapping
      </Heading>
      <Text color="gray.600" mb={4} textAlign="center">
        Review the analysis below and select the skills you have to find matching opportunities.
      </Text>
      <Box bg="blue.50" borderLeft="4px solid" borderColor="brand.500" p={4} mb={8} borderRadius="md" maxW="700px" mx="auto">
        <Text fontSize="sm" color="gray.700" mb={2}>
          <strong>Tip:</strong> Select skills based on priority for a better match—choose the ones most important to you first.
        </Text>
        <Text fontSize="sm" color="gray.600">
          You can match based on <strong>technical skills</strong> (e.g. tools, languages) or based on <strong>role</strong> (job title); both help us find the right positions.
        </Text>
      </Box>

      {loadingSkills ? (
        <Flex direction="column" justify="center" align="center" minH="400px" gap={4}>
          <Spinner size="xl" color="brand.500" />
          <Text color="gray.600" textAlign="center" maxW="320px">
            Checking positions you can work… Matching skills to your profile…
          </Text>
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
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Job Titles: selectable when no technical skills, otherwise display only */}
          {majorSkillsResponse.roles && majorSkillsResponse.roles.length > 0 && (() => {
            const hasTechnicalSkills = majorSkillsResponse.technical_skill_groups?.some(
              (g) => g.skills && Array.isArray(g.skills) && g.skills.length > 0
            );
            const showRolesAsSelectable = !hasTechnicalSkills;

            return (
              <Card boxShadow="md">
                <CardBody>
                  <Heading size="md" color="brand.500" mb={3}>
                    {showRolesAsSelectable ? 'Select your target job titles' : 'Job Titles & Career Opportunities'}
                  </Heading>
                  <Text fontSize="sm" color="gray.600" mb={4}>
                    {showRolesAsSelectable
                      ? 'No technical skills list for this major—select job titles to find matching positions. You can match by role or by technical skills when available.'
                      : 'Directly related roles for internships, entry-level, and full-time positions'}
                  </Text>
                  {showRolesAsSelectable ? (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
                      {majorSkillsResponse.roles.map((role, index) => {
                        const roleName = typeof role === 'string' ? role : role.name || role.title;
                        const isSelected = selectedSkills.includes(roleName);
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
                              value={roleName}
                              isChecked={isSelected}
                              onChange={() => onSkillToggle(roleName)}
                              colorScheme="brand"
                            >
                              <Text fontWeight="semibold" ml={2}>{roleName}</Text>
                            </Checkbox>
                          </Box>
                        );
                      })}
                    </SimpleGrid>
                  ) : (
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
                  )}
                </CardBody>
              </Card>
            );
          })()}

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
                                  onChange={() => onSkillToggle(skillName)}
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
                          onChange={() => onSkillToggle(skillName)}
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
                    <Text fontWeight="semibold" mb={2}>Market Skills:</Text>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                      {majorSkillsResponse.market_keywords.skills.map((skill, index) => {
                        const skillName = typeof skill === 'string' ? skill : skill.name;
                        const whyItMatters = skill.why_it_matters || '';
                        
                        return (
                          <Box key={index} p={2} bg="gray.50" borderRadius="md">
                            <Text fontWeight="semibold">{skillName}</Text>
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
                <VStack spacing={3} align="stretch">
                  {loadingJobs && (
                    <Text fontSize="sm" color="gray.600" textAlign="center">
                      Searching for positions you can work… Matching your skills to open roles…
                    </Text>
                  )}
                  <HStack spacing={4}>
                    <Button variant="ghost" onClick={onBack}>
                      Back
                    </Button>
                    <Button
                      colorScheme="brand"
                      onClick={onSearchJobs}
                      isLoading={loadingJobs}
                      isDisabled={selectedSkills.length === 0}
                      size="lg"
                    >
                      Find Matching Jobs ({selectedSkills.length})
                    </Button>
                  </HStack>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
        </VStack>
      )}
    </Box>
  );
};

export default SkillsSelection;
