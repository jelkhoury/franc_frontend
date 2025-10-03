'use client';

import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const { email } = location.state || {};

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !otp || !newPassword) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all fields.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL;
      const response = await fetch(`${baseUrl}/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          verificationCode: otp,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Password Reset Successful',
          description: data.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        navigate('/login');
      } else {
        toast({
          title: 'Reset Failed',
          description: data.error || 'Something went wrong.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Network Error',
        description: 'Failed to connect to the server.',
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
        <Heading lineHeight={1.1} fontSize={{ base: '2xl', md: '3xl' }}>
          Reset your password
        </Heading>

        <FormControl id="otp" isRequired>
          <FormLabel>Verification Code</FormLabel>
          <Input
            placeholder="Enter the code sent to your email"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
        </FormControl>

        <FormControl id="newPassword" isRequired>
          <FormLabel>New Password</FormLabel>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </FormControl>

        <Stack spacing={6}>
          <Button
            isLoading={loading}
            loadingText="Submitting"
            bg={'brand.500'}
            color={'white'}
            _hover={{ bg: 'blue.500' }}
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </Stack>
      </Stack>
    </Flex>
  );
};

export default ResetPassword;
