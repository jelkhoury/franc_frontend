import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Heading,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Badge,
  Spinner,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { LockIcon, UnlockIcon } from "@chakra-ui/icons";
import { LEVEL_BADGE_ORDER } from "./gameSessionUtils";

const GameLevelsView = ({
  totalPoints,
  maxUnlockedLevel,
  loading,
  startingLevel,
  resumingSession,
  activeSessionId,
  onStartLevel,
  onResumeSession,
  onBack,
}) => {
  return (
    <Box maxW="1100px" mx="auto">
      <VStack spacing={6} align="stretch">
        {activeSessionId && onResumeSession && (
          <Alert status="info" variant="subtle" borderRadius="lg" flexDirection="column" alignItems="stretch">
            <HStack>
              <AlertIcon />
              <Box flex="1">
                <AlertTitle>Quiz in progress</AlertTitle>
                <AlertDescription>
                  You already have a run started. Continue where you left off, or finish it from the quiz
                  screen before starting another level.
                </AlertDescription>
              </Box>
            </HStack>
            <Button
              colorScheme="brand"
              mt={3}
              alignSelf={{ base: "stretch", sm: "flex-start" }}
              isLoading={resumingSession}
              isDisabled={!!startingLevel}
              onClick={() => onResumeSession(activeSessionId)}
            >
              Continue quiz
            </Button>
          </Alert>
        )}

        <Box textAlign="center">
          <Heading color="brand.500" size="xl" mb={2}>
            Career Quest
          </Heading>
          <Text color="gray.600" fontSize="md" maxW="lg" mx="auto">
            Clear five levels, earn badges from Bronze to Diamond, and stack points. Start any unlocked
            level when you are ready.
          </Text>
        </Box>

        <HStack justify="center" spacing={8} flexWrap="wrap" py={2}>
          <VStack spacing={0}>
            <Text fontSize="sm" color="gray.500" fontWeight="semibold">
              Total points
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="brand.500">
              {loading ? "—" : totalPoints}
            </Text>
          </VStack>
          <VStack spacing={0}>
            <Text fontSize="sm" color="gray.500" fontWeight="semibold">
              Highest unlocked
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="purple.500">
              Level {maxUnlockedLevel}
            </Text>
          </VStack>
        </HStack>

        {loading ? (
          <FlexCentered>
            <Spinner size="xl" color="brand.500" />
          </FlexCentered>
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 5 }} spacing={4}>
            {LEVEL_BADGE_ORDER.map(({ level, label, colorScheme }) => {
              const unlocked = level <= maxUnlockedLevel;
              const busy = startingLevel === level;
              return (
                <Card
                  key={level}
                  variant="outline"
                  borderWidth={2}
                  borderColor={unlocked ? `${colorScheme}.300` : "gray.200"}
                  bg={unlocked ? `${colorScheme}.50` : "gray.50"}
                  shadow={unlocked ? "md" : "sm"}
                  transition="transform 0.2s ease, box-shadow 0.2s ease"
                  _hover={
                    unlocked
                      ? { transform: "translateY(-4px)", shadow: "lg" }
                      : undefined
                  }
                >
                  <CardBody>
                    <VStack spacing={4}>
                      <Badge colorScheme={colorScheme} fontSize="0.85em" px={2} py={1} borderRadius="md">
                        {label}
                      </Badge>
                      <Text fontWeight="bold" fontSize="lg">
                        Level {level}
                      </Text>
                      <HStack color={unlocked ? "green.600" : "gray.400"}>
                        <Icon as={unlocked ? UnlockIcon : LockIcon} />
                        <Text fontSize="sm">{unlocked ? "Unlocked" : "Locked"}</Text>
                      </HStack>
                      <Button
                        colorScheme={unlocked ? "brand" : "gray"}
                        size="sm"
                        w="full"
                        isDisabled={!unlocked || !!startingLevel || !!activeSessionId}
                        isLoading={busy}
                        onClick={() => onStartLevel(level)}
                      >
                        {!unlocked
                          ? "Locked"
                          : activeSessionId
                            ? "Finish current run first"
                            : "Play level"}
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              );
            })}
          </SimpleGrid>
        )}

        {onBack && (
          <Box textAlign="center">
            <Button variant="ghost" onClick={onBack}>
              Back
            </Button>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

function FlexCentered({ children }) {
  return (
    <Flex justify="center" align="center" minH="200px">
      {children}
    </Flex>
  );
}

export default GameLevelsView;
