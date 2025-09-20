import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import { decodeToken, getUserRole, getUserName, getUserId } from '../utils/tokenUtils';

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [passwordHash, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUpSuccessful, setIsSignUpSuccessful] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useContext(AuthContext);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5121/api';
      const response = await fetch(`${baseUrl}/users/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          passwordHash,
        }),
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        console.error('API Error:', data.error);
        throw new Error(data.error || 'Something went wrong');
      }

      // Store token in localStorage
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
        
        // Navigate based on role
        if (userRole === 'Admin') {
          navigate('/admin');
          toast({
            title: "Signup successful!",
            description: `Welcome, ${userName}!`,
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        } else {
          navigate('/');
          toast({
            title: "Signup successful!",
            description: `Welcome, ${userName}!`,
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        }
      } else {
        throw new Error('Invalid token received');
      }
    } catch (error) {
      console.error('Error during sign-up:', error);
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
      minH={'100vh'}
      align={'center'}
      justify={'center'}
      bg={useColorModeValue('gray.50', 'gray.800')}
    >
      <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6}>
        <Stack align={'center'}>
          <Heading fontSize={'4xl'}>Create your account</Heading>
          <Text fontSize={'lg'} color={'gray.600'}>
            to start using <Text as="span" color={'brand.500'}>Franc</Text> ✌️
          </Text>
        </Stack>
        <Box
          rounded={'lg'}
          bg={useColorModeValue('white', 'gray.700')}
          boxShadow={'lg'}
          p={8}
        >
          <Stack spacing={4}>
            <HStack>
              <Box>
                <FormControl id="firstName" isRequired>
                  <FormLabel>First Name</FormLabel>
                  <Input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </FormControl>
              </Box>
              <Box>
                <FormControl id="lastName" isRequired>
                  <FormLabel>Last Name</FormLabel>
                  <Input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </FormControl>
              </Box>
            </HStack>
            <FormControl id="email" isRequired>
              <FormLabel>Email address</FormLabel>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </FormControl>
            <FormControl id="password" isRequired>
              <FormLabel>Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordHash}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <InputRightElement h={'full'}>
                  <Button
                    variant={'ghost'}
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
                bg={'brand.500'}
                color={'white'}
                _hover={{
                  bg: 'blue.500',
                }}
                onClick={handleSubmit}
                isLoading={loading}
                isDisabled={loading}
              >
                Sign up
              </Button>
            </Stack>
            <Stack pt={4}>
              <Text textAlign={'center'}>
                Already have an account?{' '}
                <Link to="/login">
                  <Text as="span" color={'blue.400'} fontWeight="medium">
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
