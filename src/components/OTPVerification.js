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
import { decodeToken, getUserRole, getUserName, getUserId, isTokenExpired } from "../utils/tokenUtils";
import { post } from "../utils/httpServices";
import { captureError } from "../utils/sentryUtils";
import { USER_ENDPOINTS } from "../services/apiService";

const OTPVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, shouldSendCode } = location.state || {};
  const { login } = useContext(AuthContext);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [resendAfter, setResendAfter] = useState(shouldSendCode ? 0 : 60);
  const toast = useToast();

  const sendVerificationCode = useCallback(async () => {
    if (!email) return;

    setSendingCode(true);
    try {
      await post(
        `${USER_ENDPOINTS.SEND_VERIFICATION_CODE}?email=${encodeURIComponent(email)}`, undefined, { token: "" }
      );
      setResendAfter(60);
      toast({
        title: "Verification code sent",
        description: "Please check your email for the verification code.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      captureError(err);
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

  useEffect(() => {
    if (resendAfter <= 0) return undefined;
    const timer = setTimeout(() => setResendAfter(value => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [resendAfter]);

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

    if (!/^\d{6}$/.test(otp)) return;

    setLoading(true);

    try {
      const data = await post(
        `${USER_ENDPOINTS.VERIFY_CODE}?email=${encodeURIComponent(email)}&code=${otp}`, undefined, { token: "" }
      );

      const token = data.token;
      if (!token || !decodeToken(token) || isTokenExpired(token)) {
        throw new Error('No valid login token was returned. Please sign in again.');
      }
      const userRole = getUserRole(token);
      const userName = getUserName(token);
      const userId = getUserId(token);
      if (!userRole || !userId) throw new Error('Invalid login token received.');

      localStorage.setItem('token', token);
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('userName', userName || '');
      localStorage.setItem('userId', userId);
      login();
      toast({title: 'Verification Successful!', description: 'Your email has been verified.', status: 'success', duration: 3000, isClosable: true});
      navigate(userRole === 'Admin' ? '/admin' : '/');
    } catch (err) {
      captureError(err);
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
                {Array.from({length: 6}, (_, index) => <PinInputField key={index} aria-label={`Verification digit ${index + 1}`} />)}
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
          isDisabled={otp.length !== 6}
        >
          Verify
        </Button>
        <Stack pt={6}>
          <Text textAlign={"center"}>
            Didn't receive the code?{" "}
            <Button variant="link" color="blue.400" onClick={sendVerificationCode}
              isDisabled={sendingCode || resendAfter > 0}>
              {resendAfter > 0 ? `Resend in ${resendAfter}s` : 'Resend'}
            </Button>
          </Text>
        </Stack>
      </Stack>
    </Flex>
  );
};

export default OTPVerification;
