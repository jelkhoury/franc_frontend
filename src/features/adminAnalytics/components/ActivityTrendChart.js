import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Box, Text, useColorModeValue } from "@chakra-ui/react";
import ChartContainer from "./ChartContainer";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  return (
    <Box bg="white" p={3} borderRadius="md" shadow="md" borderWidth="1px" borderColor="gray.200">
      <Text fontWeight="semibold" fontSize="sm" mb={2}>
        {label}
      </Text>
      <Text fontSize="xs" color="gray.600">
        Active users: <strong>{point?.activeUsers ?? 0}</strong>
      </Text>
      <Text fontSize="xs" color="gray.600">
        Activities: <strong>{point?.activities ?? 0}</strong>
      </Text>
      <Text fontSize="xs" color="gray.600">
        Completed: <strong>{point?.completed ?? 0}</strong>
      </Text>
    </Box>
  );
}

export default function ActivityTrendChart({ data, height = 320 }) {
  const gridColor = useColorModeValue("#E2E8F0", "#4A5568");

  if (!data?.length) return null;

  return (
    <ChartContainer height={height}>
      <ResponsiveContainer width="100%" height={height} debounce={100}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorActivities" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3E79BD" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3E79BD" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38A169" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#38A169" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="activities"
            name="Activities"
            stroke="#3E79BD"
            fillOpacity={1}
            fill="url(#colorActivities)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="completed"
            name="Completed"
            stroke="#38A169"
            fillOpacity={1}
            fill="url(#colorCompleted)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
