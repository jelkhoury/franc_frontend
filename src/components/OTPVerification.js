import { useState, useContext, useEffect, useCallback } from "react";
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
  const { email, shouldSendCode } = location.state || {};
  const { login } = useContext(AuthContext);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const toast = useToast();

  const sendVerificationCode = useCallback(async () => {
    if (!email) return;

    setSendingCode(true);
    try {
      await post(
        `${USER_ENDPOINTS.SEND_VERIFICATION_CODE}?email=${encodeURIComponent(email)}`
      );
      toast({
        title: "Verification code sent",
        description: "Please check your email for the verification code.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Failed to send code",
        description: err.message || "Could not send verification code. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSendingCode(false);
    }
  }, [email, toast]);

  // Automatically send verification code if coming from login
  useEffect(() => {
    if (shouldSendCode && email) {
      sendVerificationCode();
    }
  }, [shouldSendCode, email, sendVerificationCode]);

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

      // Check if verification was successful
      const isSuccess = data.message && 
        data.message.toLowerCase().includes("verification successful");

      if (isSuccess) {
        // If token is already in response, use it
        if (data.token) {
          localStorage.setItem('token', data.token);
          
          const decodedToken = decodeToken(data.token);
          
          if (decodedToken) {
            const userRole = getUserRole(data.token);
            const userName = getUserName(data.token);
            const userId = getUserId(data.token);
            
            localStorage.setItem('userRole', userRole);
            localStorage.setItem('userName', userName);
            localStorage.setItem('userId', userId);
            
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
            return;
          }
        }

        // If no token but verification successful, generate token using email
        const tokenData = await post(
          `${USER_ENDPOINTS.GENERATE_TOKEN_BY_EMAIL}?email=${encodeURIComponent(email)}`
        );
        
        if (!tokenData.token) {
          throw new Error('Failed to generate token');
        }

        // Store token and decode user info
        localStorage.setItem('token', tokenData.token);
        
        const decodedToken = decodeToken(tokenData.token);
        
        if (decodedToken) {
          const userRole = getUserRole(tokenData.token);
          const userName = getUserName(tokenData.token);
          const userId = getUserId(tokenData.token);
          
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
          
          // Navigate to home page
          if (userRole === 'Admin') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        } else {
          throw new Error('Invalid token received');
        }
      } else {
        throw new Error(data.message || 'Verification failed');
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
            <Text 
              as="span" 
              color={"blue.400"} 
              fontWeight="medium"
              cursor="pointer"
              onClick={sendVerificationCode}
              _hover={{ textDecoration: "underline" }}
            >
              Resend
            </Text>
          </Text>
        </Stack>
      </Stack>
    </Flex>
  );
};

export default OTPVerification;
