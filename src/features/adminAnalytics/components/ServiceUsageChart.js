import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { Box, Text, useColorModeValue } from "@chakra-ui/react";
import { serviceColor } from "../utils/analytics.utils";
import ChartContainer from "./ChartContainer";

function ServiceTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  return (
    <Box bg="white" p={3} borderRadius="md" shadow="md" borderWidth="1px" borderColor="gray.200" maxW="240px">
      <Text fontWeight="semibold" fontSize="sm" mb={2}>
        {item?.serviceName}
      </Text>
      <Text fontSize="xs" color="gray.600">
        {item?.activities ?? 0} activities · {item?.uniqueUsers ?? 0} unique users
      </Text>
      <Text fontSize="xs" color="gray.600">
        Completed: {item?.completed ?? 0} ({item?.completionRate?.toFixed?.(1) ?? 0}%)
      </Text>
      <Text fontSize="xs" color="gray.600">
        Share of platform activity: {item?.activitySharePercent?.toFixed?.(1) ?? 0}%
      </Text>
    </Box>
  );
}

export default function ServiceUsageChart({ data, onBarClick, height = 360 }) {
  const gridColor = useColorModeValue("#E2E8F0", "#4A5568");
  const sorted = [...(data || [])].sort((a, b) => b.activities - a.activities);

  if (!sorted.length) return null;

  return (
    <ChartContainer height={height}>
      <ResponsiveContainer width="100%" height={height} debounce={100}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="serviceName"
            width={140}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<ServiceTooltip />} cursor={{ fill: "rgba(62, 121, 189, 0.08)" }} />
          <Bar
            dataKey="activities"
            radius={[0, 6, 6, 0]}
            cursor={onBarClick ? "pointer" : "default"}
            onClick={(entry) => onBarClick?.(entry?.serviceKey)}
          >
            {sorted.map((entry) => (
              <Cell key={entry.serviceKey} fill={serviceColor(entry.serviceKey)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
