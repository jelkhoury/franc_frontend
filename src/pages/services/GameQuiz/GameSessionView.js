import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  IconButton,
  Progress,
  Text,
  VStack,
  Badge,
  Alert,
  AlertIcon,
  Tooltip,
} from "@chakra-ui/react";
import {
  TimeIcon,
  RepeatIcon,
  ViewIcon,
  InfoOutlineIcon,
} from "@chakra-ui/icons";
import { FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import {
  OPTION_KEYS,
  GAME_ABILITIES,
  hasSessionAnswerId,
  hasQuestionContent,
} from "./gameSessionUtils";

const ABILITY_HINTS = {
  Skip: "Skip the current question",
  FiftyFifty: "Remove two wrong answers",
  DoubleChance: "Answer again if your first try was wrong",
  TimeFreeze: "Add extra time on this question",
  Hint: "Reveal a hint for this question",
};

const GameSessionView = ({
  levelNumber,
  questionIndex,
  questionTotal,
  currentAnswer,
  hiddenOptionKeys,
  hintRevealed,
  submitting,
  abilityLoading,
  abilityCounts,
  onSelectOption,
  onUseAbility,
  questionSecondsLeft,
  sessionSecondsLeft,
  questionUrgency,
  sessionUrgency,
  soundEnabled,
  onToggleSound,
  doubleChanceNotice,
  onExit,
}) => {
  const hiddenSet = new Set(hiddenOptionKeys || []);
  const qMax = 30;
  const sMax = 15 * 60;
  const qPct = Math.min(100, (questionSecondsLeft / qMax) * 100);
  const sPct = Math.min(100, (sessionSecondsLeft / sMax) * 100);

  const qScheme =
    questionUrgency === "critical" ? "red" : questionUrgency === "warning" ? "orange" : "brand";
  const sScheme =
    sessionUrgency === "critical" ? "red" : sessionUrgency === "warning" ? "orange" : "purple";

  const canInteract = hasSessionAnswerId(currentAnswer);
  const canShowQuestion =
    currentAnswer &&
    (hasQuestionContent(currentAnswer) || canInteract);

  if (!canShowQuestion) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="gray.600">Loading question…</Text>
      </Box>
    );
  }

  return (
    <Box maxW="900px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
          <VStack align="start" spacing={0}>
            <Text fontSize="sm" color="gray.500" fontWeight="semibold">
              Level {levelNumber}
            </Text>
            <Heading size="md" color="brand.500">
              Question {questionIndex} of {questionTotal}
            </Heading>
          </VStack>
          <HStack>
            <Tooltip label={soundEnabled ? "Mute sounds" : "Enable sounds"}>
              <IconButton
                aria-label="Toggle sound"
                icon={<Icon as={soundEnabled ? FaVolumeUp : FaVolumeMute} />}
                variant="ghost"
                onClick={onToggleSound}
              />
            </Tooltip>
            <Button variant="outline" size="sm" onClick={onExit}>
              Exit to levels
            </Button>
          </HStack>
        </Flex>

        <Card
          borderWidth={2}
          borderColor={questionUrgency === "critical" ? "red.200" : "brand.100"}
          shadow="lg"
          bg="white"
        >
          <CardBody>
            <VStack spacing={5} align="stretch">
              <HStack spacing={4} align="stretch" flexWrap="wrap">
                <VStack flex="1" minW="200px" align="stretch" spacing={1}>
                  <HStack>
                    <Icon as={TimeIcon} color={`${qScheme}.500`} />
                    <Text fontWeight="bold" fontSize="sm">
                      Question timer
                    </Text>
                  </HStack>
                  <Progress
                    value={qPct}
                    size="sm"
                    colorScheme={qScheme}
                    borderRadius="full"
                    hasStripe={questionUrgency !== "normal"}
                    isAnimated={questionUrgency === "critical"}
                  />
                  <Text fontSize="2xl" fontWeight="extrabold" color={`${qScheme}.600`}>
                    {Math.ceil(questionSecondsLeft)}s
                  </Text>
                </VStack>
                <VStack flex="1" minW="200px" align="stretch" spacing={1}>
                  <HStack>
                    <Icon as={RepeatIcon} color={`${sScheme}.500`} />
                    <Text fontWeight="bold" fontSize="sm">
                      Session timer
                    </Text>
                  </HStack>
                  <Progress
                    value={sPct}
                    size="sm"
                    colorScheme={sScheme}
                    borderRadius="full"
                    hasStripe={sessionUrgency !== "normal"}
                    isAnimated={sessionUrgency === "critical"}
                  />
                  <Text fontSize="lg" fontWeight="bold" color={`${sScheme}.600`}>
                    {formatSessionClock(sessionSecondsLeft)}
                  </Text>
                </VStack>
              </HStack>

              <Box>
                <Text fontSize="lg" fontWeight="semibold" color="gray.800" lineHeight="tall">
                  {currentAnswer.questionText || "Question"}
                </Text>
              </Box>

              {!canInteract && hasQuestionContent(currentAnswer) && (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  Question loaded, but no answer id was found in the response. Answers and abilities stay
                  disabled until the API includes a session answer identifier.
                </Alert>
              )}

              {doubleChanceNotice && (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  {doubleChanceNotice}
                </Alert>
              )}

              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
                {OPTION_KEYS.map((key) => {
                  const hidden = hiddenSet.has(key);
                  const label = currentAnswer.options[key] || `Option ${key}`;
                  return (
                    <Button
                      key={key}
                      size="lg"
                      height="auto"
                      py={4}
                      px={4}
                      whiteSpace="normal"
                      textAlign="left"
                      colorScheme="brand"
                      variant={hidden ? "ghost" : "outline"}
                      isDisabled={hidden || submitting || !canInteract}
                      opacity={hidden ? 0.35 : 1}
                      onClick={() => !hidden && canInteract && onSelectOption(key)}
                    >
                      <HStack align="start" w="full">
                        <Badge colorScheme="purple" fontSize="md" px={2}>
                          {key}
                        </Badge>
                        <Text flex="1">{hidden ? "—" : label}</Text>
                      </HStack>
                    </Button>
                  );
                })}
              </Grid>

              {hintRevealed && currentAnswer.hint != null && String(currentAnswer.hint).trim() !== "" && (
                <Alert status="success" variant="subtle" borderRadius="md">
                  <AlertIcon as={InfoOutlineIcon} />
                  <Box>
                    <Text fontWeight="bold">Hint</Text>
                    <Text fontSize="sm">{String(currentAnswer.hint)}</Text>
                  </Box>
                </Alert>
              )}
            </VStack>
          </CardBody>
        </Card>

        <Card variant="outline" bg="purple.50" borderColor="purple.100">
          <CardBody>
            <HStack mb={3}>
              <Icon as={ViewIcon} color="purple.500" />
              <Heading size="sm" color="purple.700">
                Abilities
              </Heading>
            </HStack>
            <SimpleAbilityGrid>
              {GAME_ABILITIES.map((ability) => {
                const left = abilityCounts[ability] ?? 0;
                const busy = abilityLoading === ability;
                return (
                  <Tooltip key={ability} label={ABILITY_HINTS[ability] || ""} hasArrow>
                    <Button
                      size="sm"
                      variant="solid"
                      colorScheme="purple"
                      isDisabled={left <= 0 || !!abilityLoading || submitting || !canInteract}
                      isLoading={busy}
                      onClick={() => onUseAbility(ability)}
                    >
                      {ability} ({left})
                    </Button>
                  </Tooltip>
                );
              })}
            </SimpleAbilityGrid>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

function SimpleAbilityGrid({ children }) {
  return (
    <Flex gap={2} flexWrap="wrap">
      {children}
    </Flex>
  );
}

function formatSessionClock(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export default GameSessionView;
