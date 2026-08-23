import React from "react";
import { Box, Text, Stat, StatLabel, StatNumber, StatHelpText, useColorModeValue } from "@chakra-ui/react";
import { formatNumber, formatPercent } from "../utils/analytics.utils";

export default function KpiCard({ label, value, helpText, format = "number", icon, onClick, isClickable }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.600");

  let displayValue = value;
  if (format === "number") displayValue = formatNumber(value);
  else if (format === "percent") displayValue = formatPercent(value);
  else displayValue = value ?? "—";

  return (
    <Box
      p={5}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={border}
      bg={bg}
      transition="all 0.2s"
      cursor={isClickable ? "pointer" : "default"}
      onClick={isClickable ? onClick : undefined}
      _hover={isClickable ? { borderColor: "brand.500", shadow: "sm" } : undefined}
      h="100%"
    >
      <Stat>
        <StatLabel color="gray.500" fontSize="sm" fontWeight="medium">
          {icon && (
            <Box as="span" mr={2} display="inline-flex" verticalAlign="middle">
              {icon}
            </Box>
          )}
          {label}
        </StatLabel>
        <StatNumber color="gray.800" fontSize="2xl" fontWeight="bold" mt={1}>
          {displayValue}
        </StatNumber>
        {helpText && (
          <StatHelpText mb={0} color="gray.500" fontSize="xs">
            {helpText}
          </StatHelpText>
        )}
      </Stat>
    </Box>
  );
}

export function KpiGrid({ children }) {
  return (
    <Box
      display="grid"
      gridTemplateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)", xl: "repeat(6, 1fr)" }}
      gap={4}
      mb={8}
    >
      {children}
    </Box>
  );
}
