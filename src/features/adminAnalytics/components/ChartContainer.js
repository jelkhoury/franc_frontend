import React from "react";
import { Box } from "@chakra-ui/react";

/**
 * Fixed-size wrapper for Recharts to prevent ResponsiveContainer resize loops
 * and layout height jumps inside scrollable admin panels.
 */
export default function ChartContainer({ height = 320, children }) {
  return (
    <Box
      w="100%"
      h={`${height}px`}
      minH={`${height}px`}
      maxH={`${height}px`}
      overflow="hidden"
      position="relative"
      flexShrink={0}
    >
      {children}
    </Box>
  );
}
