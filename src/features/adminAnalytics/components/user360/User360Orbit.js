import React from "react";
import { Box, Text, Tooltip, VStack } from "@chakra-ui/react";
import { getServiceByKey } from "../../constants/serviceRegistry";

/**
 * Visual "360° orbit" — services positioned around a central user hub.
 */
export default function User360Orbit({ activeServices, onServiceClick, selectedServiceKey }) {
  const count = activeServices.length;
  if (count === 0) {
    return (
      <Box
        p={8}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="gray.200"
        bg="gray.50"
        textAlign="center"
      >
        <Text color="gray.500" fontSize="sm">
          No Franc services used yet
        </Text>
      </Box>
    );
  }

  const orbitSize = 280;
  const nodeSize = 52;
  const radius = (orbitSize - nodeSize) / 2 - 8;

  return (
    <Box
      p={6}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="gray.200"
      bg="white"
      position="relative"
    >
      <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={4} textAlign="center">
        Franc Service Orbit
      </Text>

      <Box
        mx="auto"
        position="relative"
        w={`${orbitSize}px`}
        h={`${orbitSize}px`}
        maxW="100%"
      >
        {/* Orbit rings */}
        <Box
          position="absolute"
          inset={`${nodeSize / 2 - 4}px`}
          borderRadius="full"
          border="2px dashed"
          borderColor="gray.200"
        />
        <Box
          position="absolute"
          inset={`${nodeSize / 2 + 20}px`}
          borderRadius="full"
          border="1px solid"
          borderColor="gray.100"
        />

        {/* Center hub */}
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          w="72px"
          h="72px"
          borderRadius="full"
          bg="brand.500"
          color="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
          boxShadow="0 4px 20px rgba(62, 121, 189, 0.4)"
          zIndex={2}
        >
          <Text fontSize="2xs" fontWeight="bold" opacity={0.9}>
            FRANC
          </Text>
          <Text fontSize="lg" fontWeight="bold" lineHeight={1}>
            360°
          </Text>
        </Box>

        {/* Service nodes */}
        {activeServices.map(({ registryKey }, index) => {
          const service = getServiceByKey(registryKey);
          if (!service) return null;
          const Icon = service.icon;
          const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
          const x = orbitSize / 2 + radius * Math.cos(angle) - nodeSize / 2;
          const y = orbitSize / 2 + radius * Math.sin(angle) - nodeSize / 2;
          const isSelected = selectedServiceKey === registryKey;

          return (
            <Tooltip key={registryKey} label={service.name} placement="top" hasArrow>
              <Box
                position="absolute"
                left={`${x}px`}
                top={`${y}px`}
                w={`${nodeSize}px`}
                h={`${nodeSize}px`}
                borderRadius="full"
                bg={isSelected ? service.color : "white"}
                color={isSelected ? "white" : service.color}
                border="2px solid"
                borderColor={service.color}
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="lg"
                cursor="pointer"
                transition="all 0.2s"
                boxShadow={isSelected ? `0 4px 12px ${service.color}66` : "sm"}
                transform={isSelected ? "scale(1.12)" : "scale(1)"}
                zIndex={isSelected ? 3 : 1}
                onClick={() => onServiceClick?.(registryKey)}
                _hover={{
                  transform: "scale(1.1)",
                  boxShadow: `0 4px 12px ${service.color}55`,
                }}
              >
                <Icon />
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      <VStack mt={4} spacing={1}>
        <Text fontSize="xs" color="gray.500" textAlign="center">
          {count} service{count !== 1 ? "s" : ""} in this user&apos;s journey
        </Text>
        <Text fontSize="2xs" color="gray.400" textAlign="center">
          Click a node to jump to service details
        </Text>
      </VStack>
    </Box>
  );
}
