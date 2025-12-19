'use client';

import {
  Button,
  FormControl,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

import { post } from '../utils/httpServices';
import { USER_ENDPOINTS } from '../services/apiService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  

  const handleSendResetLink = async () => {
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      const data = await post(`${USER_ENDPOINTS.FORGOT_PASSWORD}?email=${encodeURIComponent(email)}`);

      toast({
        title: 'Code Sent',
        description: data.message || 'A reset code has been sent to your email.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/forgot-password', { state: { from: 'profile-edit' } });
    } catch (err) {
      console.error('Forgot password error:', err);
      toast({
        title: 'Error',
        description: err.message || 'Something went wrong.',
        status: 'error',
        duration: 3000,
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
      <Stack
        spacing={4}
        w={'full'}
        maxW={'md'}
        bg={useColorModeValue('white', 'gray.700')}
        rounded={'xl'}
        boxShadow={'lg'}
        p={6}
        my={12}
      >
        <Heading color="brand.500" lineHeight={1.1} fontSize={{ base: '2xl', md: '3xl' }}>
          {from === 'profile-edit' ? 'Change your password' : 'Forgot your password?'}
        </Heading>
        <Text fontSize={{ base: 'sm', sm: 'md' }} color={'gray.600'}>
          You’ll get a verification code to reset your password
        </Text>
        <FormControl id="email" isRequired>
          <Input
            placeholder="your-email@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormControl>
        <Stack spacing={6}>
          <Button
            isLoading={loading}
            loadingText="Sending"
            bg={'brand.500'}
            color={'white'}
            _hover={{ bg: 'blue.500' }}
            onClick={handleSendResetLink}
          >
            Send Reset Code
          </Button>
          {from !== 'profile-edit' && (
            <Text fontSize="sm" textAlign="center">
              Remembered your password?{' '}
              <Link to="/login">
                <Text as="span" color="blue.400" fontWeight="medium">
                  Log in
                </Text>
              </Link>
            </Text>
          )}
        </Stack>
      </Stack>
    </Flex>
  );
};

export default ForgotPassword;
