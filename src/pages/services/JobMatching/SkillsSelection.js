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
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { InfoIcon, CheckCircleIcon } from '@chakra-ui/icons';

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
              </HStack>
            </CardBody>
          </Card>
        </VStack>
      )}
    </Box>
  );
};

export default SkillsSelection;
