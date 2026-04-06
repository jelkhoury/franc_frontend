import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  Text,
  VStack,
  Badge,
  HStack,
  Icon,
} from "@chakra-ui/react";
import { CheckCircleIcon, WarningTwoIcon, StarIcon } from "@chakra-ui/icons";

const GameResultsView = ({ summary, onPlayAgain, onBackToLevels }) => {
  const passed = summary.passed === true || summary.passed === "true";
  const failed = summary.passed === false || summary.passed === "false";
  const ambiguous = !passed && !failed;

  return (
    <Box maxW="640px" mx="auto" textAlign="center">
      <Card
        overflow="hidden"
        borderWidth={2}
        borderColor={passed ? "green.200" : failed ? "orange.200" : "brand.100"}
        shadow="xl"
      >
        <CardBody py={10} px={8}>
          <VStack spacing={6}>
            <Icon
              as={passed ? CheckCircleIcon : failed ? WarningTwoIcon : StarIcon}
              boxSize={16}
              color={passed ? "green.400" : failed ? "orange.400" : "brand.400"}
            />
            <Heading size="lg" color="brand.500">
              {passed ? "Level complete!" : failed ? "Keep practicing" : "Session finished"}
            </Heading>
            {ambiguous && (
              <Text color="gray.600" fontSize="md">
                Review your outcome below. If your backend adds a clear pass/fail flag, this title will
                match automatically.
              </Text>
            )}

            <HStack spacing={4} flexWrap="wrap" justify="center">
              {summary.score != null && summary.score !== "" && (
                <Badge fontSize="lg" px={4} py={2} colorScheme="blue" borderRadius="md">
                  Score: {String(summary.score)}
                </Badge>
              )}
              {summary.badge != null && summary.badge !== "" && (
                <Badge fontSize="lg" px={4} py={2} colorScheme="yellow" borderRadius="md">
                  Badge: {String(summary.badge)}
                </Badge>
              )}
              {summary.pointsEarned != null && summary.pointsEarned !== "" && (
                <Badge fontSize="lg" px={4} py={2} colorScheme="purple" borderRadius="md">
                  +{String(summary.pointsEarned)} pts
                </Badge>
              )}
            </HStack>

            {summary.unlockedNextLevel != null && summary.unlockedNextLevel !== "" && (
              <Text color="green.600" fontWeight="semibold">
                Next level unlocked: {String(summary.unlockedNextLevel)}
              </Text>
            )}

            <VStack spacing={3} w="full" pt={4}>
              <Button colorScheme="brand" size="lg" w="full" onClick={onPlayAgain}>
                Play again
              </Button>
              <Button variant="ghost" w="full" onClick={onBackToLevels}>
                Back to levels
              </Button>
            </VStack>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
};

export default GameResultsView;
