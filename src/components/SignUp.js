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
import { USER_ENDPOINTS } from "../services/apiService";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [passwordHash, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUpSuccessful, setIsSignUpSuccessful] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useContext(AuthContext);

  const validateEmail = (email) => {
    if (!email || email.trim() === "") {
      return { isValid: false, error: "Email is required" };
    }
    const emailRegex = /^[^\s@]+@ua\.edu\.lb$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: "Email must end with @ua.edu.lb" };
    }
    return { isValid: true, error: "" };
  };

  const validateName = (name, fieldName) => {
    if (!name || name.trim() === "") {
      return { isValid: false, error: `${fieldName} is required` };
    }
    if (name.trim().length < 2) {
      return {
        isValid: false,
        error: `${fieldName} must be at least 2 characters`,
      };
    }
    if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
      return {
        isValid: false,
        error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`,
      };
    }
    return { isValid: true, error: "" };
  };

  const validatePassword = (password) => {
    if (!password || password.trim() === "") {
      return { isValid: false, error: "Password is required" };
    }
    if (password.length < 8) {
      return {
        isValid: false,
        error: "Password must be at least 8 characters long",
      };
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return {
        isValid: false,
        error: "Password must contain at least one lowercase letter",
      };
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return {
        isValid: false,
        error: "Password must contain at least one uppercase letter",
      };
    }
    if (!/(?=.*\d)/.test(password)) {
      return {
        isValid: false,
        error: "Password must contain at least one number",
      };
    }
    return { isValid: true, error: "" };
  };

  const handleEmailChange = (e) => {
    const emailValue = e.target.value;
    setEmail(emailValue);
    const validation = validateEmail(emailValue);
    setEmailError(validation.error);
  };

  const handleFirstNameChange = (e) => {
    const firstNameValue = e.target.value;
    setFirstName(firstNameValue);
    const validation = validateName(firstNameValue, "First Name");
    setFirstNameError(validation.error);
  };

  const handleLastNameChange = (e) => {
    const lastNameValue = e.target.value;
    setLastName(lastNameValue);
    const validation = validateName(lastNameValue, "Last Name");
    setLastNameError(validation.error);
  };

  const handlePasswordChange = (e) => {
    const passwordValue = e.target.value;
    setPassword(passwordValue);
    const validation = validatePassword(passwordValue);
    setPasswordError(validation.error);
  };

  const handleSubmit = async () => {
    // Validate all fields before submitting
    const emailValidation = validateEmail(email);
    const firstNameValidation = validateName(firstName, "First Name");
    const lastNameValidation = validateName(lastName, "Last Name");
    const passwordValidation = validatePassword(passwordHash);

    // Set all error messages
    setEmailError(emailValidation.error);
    setFirstNameError(firstNameValidation.error);
    setLastNameError(lastNameValidation.error);
    setPasswordError(passwordValidation.error);

    // Check if any validation failed
    if (
      !emailValidation.isValid ||
      !firstNameValidation.isValid ||
      !lastNameValidation.isValid ||
      !passwordValidation.isValid
    ) {
      toast({
        title: "Validation failed",
        description: "Please fix all errors before submitting",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      await post(USER_ENDPOINTS.SIGNUP, {
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
                <FormControl
                  id="firstName"
                  isRequired
                  isInvalid={!!firstNameError}
                >
                  <FormLabel>First Name</FormLabel>
                  <Input
                    type="text"
                    value={firstName}
                    onChange={handleFirstNameChange}
                  />
                  <Text
                    color="red.500"
                    fontSize="xs"
                    mt={1}
                    noOfLines={1}
                    minH="16px"
                    visibility={firstNameError ? "visible" : "hidden"}
                  >
                    {firstNameError || "\u00A0"}
                  </Text>
                </FormControl>
              </Box>
              <Box>
                <FormControl
                  id="lastName"
                  isRequired
                  isInvalid={!!lastNameError}
                >
                  <FormLabel>Last Name</FormLabel>
                  <Input
                    type="text"
                    value={lastName}
                    onChange={handleLastNameChange}
                  />
                  <Text
                    color="red.500"
                    fontSize="xs"
                    mt={1}
                    noOfLines={1}
                    minH="16px"
                    visibility={lastNameError ? "visible" : "hidden"}
                  >
                    {lastNameError || "\u00A0"}
                  </Text>
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
              <Text
                color="red.500"
                fontSize="xs"
                mt={1}
                noOfLines={1}
                minH="16px"
                visibility={emailError ? "visible" : "hidden"}
              >
                {emailError || "\u00A0"}
              </Text>
            </FormControl>
            <FormControl id="password" isRequired isInvalid={!!passwordError}>
              <FormLabel>Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={passwordHash}
                  onChange={handlePasswordChange}
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
              <Text
                color="red.500"
                fontSize="xs"
                mt={1}
                noOfLines={1}
                minH="16px"
                visibility={passwordError ? "visible" : "hidden"}
              >
                {passwordError || "\u00A0"}
              </Text>
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
                isDisabled={
                  loading ||
                  !!emailError ||
                  !!firstNameError ||
                  !!lastNameError ||
                  !!passwordError ||
                  !firstName.trim() ||
                  !lastName.trim() ||
                  !email.trim() ||
                  !passwordHash.trim()
                }
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
