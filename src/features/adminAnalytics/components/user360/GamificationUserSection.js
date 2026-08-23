import React from "react";
import { Box, SimpleGrid, Text, Badge, HStack } from "@chakra-ui/react";
import { formatPercent } from "../../utils/analytics.utils";
import User360ServiceCard from "./User360ServiceCard";
import { SERVICE_KEYS } from "../../constants/serviceRegistry";

function StatPill({ label, value }) {
  return (
    <Box textAlign="center" p={3} borderRadius="xl" bg="gray.50">
      <Text fontSize="xs" color="gray.500" mb={1}>{label}</Text>
      <Text fontWeight="bold" color="gray.800">{value}</Text>
    </Box>
  );
}

export default function GamificationUserSection({ data, serviceKey = SERVICE_KEYS.GAMIFICATION, isHighlighted }) {
  return (
    <User360ServiceCard serviceKey={serviceKey} isHighlighted={isHighlighted}>
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={4}>
        <StatPill label="Current Level" value={data.currentLevel} />
        <StatPill label="Total Points" value={data.totalPoints} />
        <StatPill label="Accuracy" value={formatPercent(data.accuracy)} />
        <StatPill label="Sessions" value={data.sessionsCompleted} />
      </SimpleGrid>
      {data.badgesEarned?.length > 0 && (
        <Box mb={4} p={3} borderRadius="xl" bg="yellow.50" borderWidth="1px" borderColor="yellow.200">
          <Text fontSize="xs" color="yellow.800" fontWeight="semibold" mb={2}>Badges Earned</Text>
          <HStack spacing={2} flexWrap="wrap">
            {data.badgesEarned.map((b) => (
              <Badge key={b} colorScheme="yellow" px={2} py={1}>{b}</Badge>
            ))}
          </HStack>
        </Box>
      )}
      {data.abilitiesUsed && (
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
          {Object.entries(data.abilitiesUsed).map(([ability, count]) => (
            <StatPill key={ability} label={ability} value={`${count} uses`} />
          ))}
        </SimpleGrid>
      )}
    </User360ServiceCard>
  );
}
