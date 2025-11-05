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
  HStack,
  Avatar,
  AvatarBadge,
  IconButton,
  Center,
} from '@chakra-ui/react';
import { SmallCloseIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';


export default function UserProfileEdit({ onClose ,onLogout  }) {
  const navigate = useNavigate();

  const handleChangePassword = () => {
    onClose();
    navigate('/forgot-password', { state: { from: 'profile-edit' } });
  };

  return (
    <Stack spacing={4}>
      <Heading color="brand.500" fontSize={{ base: '2xl', sm: '3xl' }} textAlign="center">
        Edit Your Profile
      </Heading>

      <FormControl id="avatar" isDisabled>
        <FormLabel>Profile Picture</FormLabel>
        <Stack direction={['column', 'row']} spacing={6}>
          <Center>
            <Avatar size="xl" icon={<FaUser fontSize="2rem" />} bg="brand.500" color="white">
              <AvatarBadge
                as={IconButton}
                size="sm"
                rounded="full"
                top="-10px"
                colorScheme="red"
                aria-label="Remove Image"
                icon={<SmallCloseIcon />}
                isDisabled
              />
            </Avatar>
          </Center>
          <Center w="full">
            <Button w="full" isDisabled>
              Change Icon
            </Button>
          </Center>
        </Stack>
      </FormControl>

      <FormControl id="userName" isRequired isDisabled>
        <FormLabel>Username</FormLabel>
        <Input placeholder="John Doe" type="text" />
      </FormControl>

      <FormControl id="email" isRequired isDisabled>
        <FormLabel>Email address</FormLabel>
        <Input placeholder="your-email@example.com" type="email" />
      </FormControl>

      <FormControl id="password" isRequired isDisabled>
        <FormLabel>Password</FormLabel>
        <Input placeholder="Enter new password" type="password" />
      </FormControl>

      <HStack spacing={4} pt={2}>
        <Button
          bg="gray.100"
          color="brand.500"
          w="full"
          _hover={{ bg: 'gray.200' }}
          onClick={handleChangePassword}
        >
          Change Password
        </Button>

        <Button
           bg="brand.500"
           color="white"
           w="full"
           _hover={{ bg: 'brand.700' }}
           onClick={() => {
            onClose();
            onLogout();
          }}
                  >
          Logout
        </Button>

      </HStack>

      <HStack spacing={4} pt={4}>
        <Button
          bg="red.400"
          color="white"
          w="full"
          _hover={{ bg: 'red.500' }}
          isDisabled
        >
          Cancel
        </Button>
        <Button
          bg="brand.500"
          color="white"
          w="full"
          _hover={{ bg: 'blue.500' }}
          isDisabled
        >
          Save Changes
        </Button>
      </HStack>
    </Stack>
  );
}
