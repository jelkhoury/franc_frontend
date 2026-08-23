import React from "react";
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  HStack,
  Input,
  Select,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { getDateRangePreset } from "../utils/analytics.utils";
import { getActiveServices } from "../constants/serviceRegistry";

const PRESETS = [
  { id: "today", label: "Today" },
  { id: "last7days", label: "Last 7 days" },
  { id: "last30days", label: "Last 30 days" },
  { id: "thisMonth", label: "This month" },
];

export default function AnalyticsFilters({
  filters,
  onChange,
  showServiceFilter = true,
  showStatusFilter = false,
  showGroupBy = false,
  showUserSearch = false,
}) {
  const bg = useColorModeValue("gray.50", "gray.700");
  const border = useColorModeValue("gray.200", "gray.600");

  const handlePreset = (presetId) => {
    const range = getDateRangePreset(presetId);
    onChange({
      preset: range.preset,
      fromDate: range.fromDate,
      toDate: range.toDate,
    });
  };

  return (
    <Box
      p={4}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={border}
      bg={bg}
      mb={6}
    >
      <Flex direction={{ base: "column", lg: "row" }} gap={4} align={{ lg: "center" }} flexWrap="wrap">
        <Box>
          <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={2} textTransform="uppercase">
            Date range
          </Text>
          <ButtonGroup size="sm" isAttached variant="outline">
            {PRESETS.map((p) => (
              <Button
                key={p.id}
                onClick={() => handlePreset(p.id)}
                colorScheme={filters.preset === p.id ? "brand" : "gray"}
                variant={filters.preset === p.id ? "solid" : "outline"}
              >
                {p.label}
              </Button>
            ))}
          </ButtonGroup>
        </Box>

        <HStack spacing={2}>
          <Box>
            <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={1}>
              From
            </Text>
            <Input
              type="date"
              size="sm"
              bg="white"
              value={filters.fromDate ? filters.fromDate.slice(0, 10) : ""}
              onChange={(e) =>
                onChange({
                  fromDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                  preset: "custom",
                })
              }
              maxW="160px"
            />
          </Box>
          <Box>
            <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={1}>
              To
            </Text>
            <Input
              type="date"
              size="sm"
              bg="white"
              value={filters.toDate ? filters.toDate.slice(0, 10) : ""}
              onChange={(e) =>
                onChange({
                  toDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                  preset: "custom",
                })
              }
              maxW="160px"
            />
          </Box>
        </HStack>

        {showServiceFilter && (
          <Box minW="180px">
            <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={1}>
              Service
            </Text>
            <Select
              size="sm"
              bg="white"
              value={filters.serviceKey || ""}
              onChange={(e) => onChange({ serviceKey: e.target.value })}
            >
              <option value="">All services</option>
              {getActiveServices().map((s) => (
                <option key={s.key} value={s.key}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Box>
        )}

        {showStatusFilter && (
          <Box minW="160px">
            <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={1}>
              Status
            </Text>
            <Select
              size="sm"
              bg="white"
              value={filters.status || ""}
              onChange={(e) => onChange({ status: e.target.value })}
            >
              <option value="">All statuses</option>
              <option value="completed">Completed</option>
              <option value="in progress">In progress</option>
              <option value="evaluated">Evaluated</option>
              <option value="draft">Draft</option>
            </Select>
          </Box>
        )}

        {showGroupBy && (
          <Box minW="140px">
            <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={1}>
              Group by
            </Text>
            <Select
              size="sm"
              bg="white"
              value={filters.groupBy || "daily"}
              onChange={(e) => onChange({ groupBy: e.target.value })}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </Select>
          </Box>
        )}

        {showUserSearch && (
          <Box flex="1" minW="200px">
            <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={1}>
              Search users
            </Text>
            <Input
              size="sm"
              bg="white"
              placeholder="Name or email..."
              value={filters.search || ""}
              onChange={(e) => onChange({ search: e.target.value, page: 1 })}
            />
          </Box>
        )}
      </Flex>
    </Box>
  );
}
