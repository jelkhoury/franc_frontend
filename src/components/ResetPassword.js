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
import { post } from '../utils/httpServices';

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
      const data = await post('/api/users/reset-password', {
        email,
        verificationCode: otp,
        newPassword,
      });

      toast({
        title: 'Password Reset Successful',
        description: data.message || 'Your password has been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate('/login');
    } catch (error) {
      console.error('Reset password error:', error);
      toast({
        title: 'Reset Failed',
        description: error.message || 'Something went wrong.',
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
