import React from "react";
import { Box, Heading, Text, Button } from "@chakra-ui/react";
import { CheckCircleIcon } from "@chakra-ui/icons";

/**
 * Thank you view shown after interview completion
 */
const ThankYouView = ({ onReturnHome }) => {
  return (
    <Box textAlign="center" py={10} px={6}>
      <CheckCircleIcon boxSize={"50px"} color={"green.500"} />
      <Heading as="h2" size="xl" mt={6} mb={2}>
        Interview Complete
      </Heading>
      <Text color={"gray.500"} mb={6}>
        Thank you! Your responses have been submitted successfully.
      </Text>
      <Button colorScheme="blue" onClick={onReturnHome}>
        Return to Home
      </Button>
    </Box>
  );
};

export default ThankYouView;

