'use client';

import { useState } from 'react';
import { post } from '../utils/httpServices';
import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  Input,
  Checkbox,
  Stack,
  Button,
  Heading,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../components/AuthContext';
import { decodeToken, getUserRole, getUserName, getUserId } from '../utils/tokenUtils';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();


const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // ---- login request ----
    const data = await post("/api/users/sign-in", { email, password });

    // ---- store and decode token ----
    const { token } = data;
    if (!token) throw new Error("No token received from server");

    localStorage.setItem("token", token);

    const decoded = decodeToken(token);
    if (!decoded) throw new Error("Invalid token received");

    // ---- extract and store user details ----
    const userRole = getUserRole(token);
    const userName = getUserName(token);
    const userId = getUserId(token);

    localStorage.setItem("userRole", userRole);
    localStorage.setItem("userName", userName);
    localStorage.setItem("userId", userId);

    // ---- update context & navigate ----
    login();

    toast({
      title: "Login successful!",
      description: `Welcome back, ${userName}!`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });

    navigate(userRole === "Admin" ? "/admin" : "/");

  } catch (err) {
    console.error("Login error:", err);
    toast({
      title: "Login failed",
      description: err.message || "Invalid credentials",
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
      minH={'100vh'}
      align={'center'}
      justify={'center'}
      bg={useColorModeValue('gray.50', 'gray.800')}
    >
      <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6}>
        <Stack align={'center'}>
          <Heading color="brand.500" fontSize={'4xl'}>Log in to your account</Heading>
          <Text fontSize={'lg'} color={'gray.600'}>
            to access all Franc features ✌️
          </Text>
        </Stack>
        <Box
          rounded={'lg'}
          bg={useColorModeValue('white', 'gray.700')}
          boxShadow={'lg'}
          p={8}
        >
          <Stack spacing={4} as="form" onSubmit={handleSubmit}>
            <FormControl id="email" isRequired>
              <FormLabel>Email address</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormControl>
            <FormControl id="password" isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormControl>
            <Stack spacing={6}>
              <Stack
                direction={{ base: 'column', sm: 'row' }}
                align={'start'}
                justify={'space-between'}
              >
                <Checkbox>Remember me</Checkbox>
                <Link to="/forgot-password">
                  <Text color={'blue.400'}>Forgot password?</Text>
                </Link>
              </Stack>
              <Button
                bg={'brand.500'}
                color={'white'}
                _hover={{
                  bg: 'blue.500',
                }}
                type="submit"
                isLoading={loading}
              >
                Log in
              </Button>
            </Stack>
            <Stack pt={4}>
              <Text textAlign={'center'}>
                Don't have an account?{' '}
                <Link to="/signup">
                  <Text as="span" color={'blue.400'} fontWeight="medium">
                    Sign up
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

export default Login;
