import React from "react";
import { Box, Text, Button } from "@chakra-ui/react";

/**
 * Error state view
 */
const ErrorView = ({ error }) => {
  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-r, white, #ebf8ff)"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Text color="red.500" fontSize="lg">
        Error: {error}
      </Text>
      <Button
        mt={4}
        colorScheme="blue"
        onClick={() => window.location.reload()}
      >
        Retry
      </Button>
    </Box>
  );
};

export default ErrorView;

