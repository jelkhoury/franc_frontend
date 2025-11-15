import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  HStack,
  InputRightElement,
  Stack,
  Button,
  Heading,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./AuthContext";
import {
  decodeToken,
  getUserRole,
  getUserName,
  getUserId,
} from "../utils/tokenUtils";
import { post } from "../utils/httpServices";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [passwordHash, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUpSuccessful, setIsSignUpSuccessful] = useState(false);
  const [emailError, setEmailError] = useState("");
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useContext(AuthContext);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@ua\.edu\.lb$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const emailValue = e.target.value;
    setEmail(emailValue);

    if (emailValue && !validateEmail(emailValue)) {
      setEmailError("Email must end with @ua.edu.lb");
    } else {
      setEmailError("");
    }
  };

  const handleSubmit = async () => {
    // Validate email before submitting
    if (!validateEmail(email)) {
      setEmailError("Email must end with @ua.edu.lb");
      return;
    }

    setLoading(true);
    try {
      await post("/api/users/signup", {
        firstName,
        lastName,
        email,
        passwordHash,
      });

      // Don't log in immediately - user needs to verify email first
      // Navigate to OTP verification page
      navigate("/otp-verification", {
        state: {
          email: email,
          message:
            "Please check your email and enter the verification code to complete your registration.",
        },
      });

      toast({
        title: "Signup successful!",
        description: "Please check your email for verification code.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error during sign-up:", error);
      toast({
        title: "Signup failed",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
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
      <Stack spacing={8} mx={"auto"} maxW={"lg"} py={12} px={6}>
        <Stack align={"center"}>
          <Heading color="brand.500" fontSize={"4xl"}>
            Create your account
          </Heading>
          <Text fontSize={"lg"} color={"gray.600"}>
            to start using{" "}
            <Text as="span" color={"brand.500"}>
              Franc
            </Text>{" "}
            ✌️
          </Text>
        </Stack>
        <Box
          rounded={"lg"}
          bg={useColorModeValue("white", "gray.700")}
          boxShadow={"lg"}
          p={8}
        >
          <Stack spacing={4}>
            <HStack>
              <Box>
                <FormControl id="firstName" isRequired>
                  <FormLabel>First Name</FormLabel>
                  <Input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </FormControl>
              </Box>
              <Box>
                <FormControl id="lastName" isRequired>
                  <FormLabel>Last Name</FormLabel>
                  <Input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </FormControl>
              </Box>
            </HStack>
            <FormControl id="email" isRequired isInvalid={!!emailError}>
              <FormLabel>Email address</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="example@ua.edu.lb"
              />
              {emailError && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {emailError}
                </Text>
              )}
            </FormControl>
            <FormControl id="password" isRequired>
              <FormLabel>Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={passwordHash}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <InputRightElement h={"full"}>
                  <Button
                    variant={"ghost"}
                    onClick={() =>
                      setShowPassword((showPassword) => !showPassword)
                    }
                  >
                    {showPassword ? <ViewIcon /> : <ViewOffIcon />}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>
            <Stack spacing={10} pt={4}>
              <Button
                size="lg"
                bg={"brand.500"}
                color={"white"}
                _hover={{
                  bg: "blue.500",
                }}
                onClick={handleSubmit}
                isLoading={loading}
                isDisabled={loading || !!emailError}
              >
                Sign up
              </Button>
            </Stack>
            <Stack pt={4}>
              <Text textAlign={"center"}>
                Already have an account?{" "}
                <Link to="/login">
                  <Text as="span" color={"blue.400"} fontWeight="medium">
                    Log in
                  </Text>
                </Link>
              </Text>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Flex>
  );
};

export default Signup;
