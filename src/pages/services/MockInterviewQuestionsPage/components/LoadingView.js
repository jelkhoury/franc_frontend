import React from "react";
import { Box, Spinner, Text } from "@chakra-ui/react";

/**
 * Loading state view
 */
const LoadingView = () => {
  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-r, white, #ebf8ff)"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Spinner size="xl" color="blue.500" />
      <Text mt={4} color="gray.600">
        Loading questions...
      </Text>
    </Box>
  );
};

export default LoadingView;

