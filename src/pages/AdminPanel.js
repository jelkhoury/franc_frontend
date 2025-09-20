import React, { useState, useContext } from 'react';
import {
  Box,
  Button,
  Heading,
  Divider,
  List,
  ListItem,
  Text,
  Flex,
  Avatar,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';
import ManageUsers from '../components/Admin/ManageUsers';
import ManageMockInterviews from '../components/Admin/ManageMockInterviews';
import ManageSelfTests from '../components/Admin/ManageSelfTests';
import { AuthContext } from '../components/AuthContext';
import UserProfileEdit from '../components/UserProfileEdit'; // Adjust path if necessary
import { FaUser } from 'react-icons/fa';

const AdminPanel = () => {
  const [selectedTab, setSelectedTab] = useState('users');
  const { isLoggedIn, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Profile modal controls
  const {
    isOpen: isProfileOpen,
    onOpen: onProfileOpen,
    onClose: onProfileClose,
  } = useDisclosure();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Flex>
      <Box
        width="250px"
        bg="gray.100"
        p={6}
        height="100vh"
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
      >
        <div>
          <Heading size="md" mb={4}>
            Admin Menu
          </Heading>
          <Divider mb={4} />
          <List spacing={3}>
            <ListItem
              cursor="pointer"
              _hover={{ color: 'blue.500' }}
              onClick={() => setSelectedTab('users')}
              fontWeight={selectedTab === 'users' ? 'bold' : 'normal'}
            >
              <Text>Manage Users</Text>
            </ListItem>
            <ListItem
              cursor="pointer"
              _hover={{ color: 'blue.500' }}
              onClick={() => setSelectedTab('mockInterviews')}
              fontWeight={selectedTab === 'mockInterviews' ? 'bold' : 'normal'}
            >
              <Text>Manage Mock Interviews</Text>
            </ListItem>
            <ListItem
              cursor="pointer"
              _hover={{ color: 'blue.500' }}
              onClick={() => setSelectedTab('selfTests')}
              fontWeight={selectedTab === 'selfTests' ? 'bold' : 'normal'}
            >
              <Text>Manage Self-Directed Tests</Text>
            </ListItem>
          </List>
        </div>

        <Box mt={4}>
          {!isLoggedIn ? (
            <Button
              as={Link}
              to="/login"
              colorScheme="blue"
              size="sm"
              width="100%"
            >
              Login
            </Button>
          ) : (
            <>
              <Avatar
                size="sm"
                icon={<FaUser fontSize="0.85rem" />}
                bg="brand.500"
                color="white"
                cursor="pointer"
                onClick={onProfileOpen}
                mb={2}
              />
              <Modal isOpen={isProfileOpen} onClose={onProfileClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                  <ModalHeader>Edit Profile</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    <UserProfileEdit onClose={onProfileClose} onLogout={handleLogout} />
                  </ModalBody>
                </ModalContent>
              </Modal>
              <Button
                colorScheme="red"
                size="sm"
                width="100%"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          )}
        </Box>
      </Box>

      <Box flex="1" p={8}>
        {selectedTab === 'users' && <ManageUsers />}
        {selectedTab === 'mockInterviews' && <ManageMockInterviews />}
        {selectedTab === 'selfTests' && <ManageSelfTests />}
      </Box>
    </Flex>
  );
};

export default AdminPanel;