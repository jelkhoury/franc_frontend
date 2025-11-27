import { useState, useContext } from "react";
import {
  Button,
  FormControl,
  Flex,
  Input,
  Stack,
  useColorModeValue,
  HStack,
  Center,
  Heading,
  useToast,
  PinInput,
  PinInputField,
  Text,
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../components/AuthContext";
import { decodeToken, getUserRole, getUserName, getUserId } from "../utils/tokenUtils";
import { post } from "../utils/httpServices";
import { USER_ENDPOINTS } from "../services/apiService";

const OTPVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { email } = location.state || {};
  const { login } = useContext(AuthContext);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleChange = (value) => {
    setOtp(value);
  };

  const handleSubmit = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Email not provided. Please go back and try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (otp.length !== 4) return;

    setLoading(true);

    try {
      const data = await post(
        `${USER_ENDPOINTS.VERIFY_CODE}?email=${encodeURIComponent(email)}&code=${otp}`
      );

      // Store token in localStorage after successful verification
      if (data.token) {
        localStorage.setItem('token', data.token);
        
        // Decode token to get user role
        const decodedToken = decodeToken(data.token);
        
        if (decodedToken) {
          const userRole = getUserRole(data.token);
          const userName = getUserName(data.token);
          const userId = getUserId(data.token);
          
          // Store user info in localStorage
          localStorage.setItem('userRole', userRole);
          localStorage.setItem('userName', userName);
          localStorage.setItem('userId', userId);
          
          // Update auth context
          login();
          
          toast({
            title: "Verification Successful!",
            description: `Welcome, ${userName}! Your email has been verified successfully.`,
            status: "success",
            duration: 3000,
            isClosable: true,
          });
          
          // Navigate based on role
          if (userRole === 'Admin') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        } else {
          throw new Error('Invalid token received');
        }
      } else {
        // If no token in response, just show success message
        toast({
          title: "Verification Successful!",
          description: "Your email has been verified successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        navigate('/login');
      }
    } catch (err) {
      toast({
        title: "Verification Failed",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setOtp(""); // Clear OTP on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex
      minH={"100vh"}
      align={"center"}
      justify={"center"}
      bg={useColorModeValue("gray.50", "gray.800")}
    >
      <Stack
        spacing={4}
        w={"full"}
        maxW={"sm"}
        bg={useColorModeValue("white", "gray.700")}
        rounded={"xl"}
        boxShadow={"lg"}
        p={6}
        my={12}
      >
        <Center>
          <Heading color="brand.500" size={"lg"}>Verify your email</Heading>
        </Center>
        <Center fontSize={"md"}>
          We have sent a code to your email
        </Center>
        <Center fontSize={"sm"} color={"gray.500"}>
          {email}
        </Center>
        <FormControl>
          <Center>
            <HStack>
              <PinInput otp size="lg" value={otp} onChange={handleChange}>
                <PinInputField />
                <PinInputField />
                <PinInputField />
                <PinInputField />
              </PinInput>
            </HStack>
          </Center>
        </FormControl>
        <Button
          colorScheme="blue"
          size="lg"
          fontSize="md"
          onClick={handleSubmit}
          isLoading={loading}
          isDisabled={otp.length !== 4}
        >
          Verify
        </Button>
        <Stack pt={6}>
          <Text textAlign={"center"}>
            Didn't receive the code?{" "}
            <Text as="span" color={"blue.400"} fontWeight="medium">
              Resend
            </Text>
          </Text>
        </Stack>
      </Stack>
    </Flex>
  );
};

export default OTPVerification;
