import React, { useState, useContext, useEffect } from "react";
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
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useBreakpointValue,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { HamburgerIcon } from "@chakra-ui/icons";
import ManageUsers from "../components/Admin/ManageUsers";
import ManageMockInterviews from "../components/Admin/ManageMockInterviews";
import ManageSelfTests from "../components/Admin/ManageSelfTests";
import ManagePersonalityTestQuestions from "../components/Admin/ManagePersonalityTestQuestions";
import ManageMockInterviewQuestions from "../components/Admin/ManageMockInterviewQuestions";
import { AuthContext } from "../components/AuthContext";
import UserProfileEdit from "../components/UserProfileEdit"; // Adjust path if necessary
import { FaUser } from "react-icons/fa";
import { getStoredUserRole, getUserRole, getStoredToken } from "../utils/tokenUtils";

const AdminPanel = () => {
  const [selectedTab, setSelectedTab] = useState("users");
  const { isLoggedIn, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user has Admin role
  useEffect(() => {
    const checkAdminRole = () => {
      const token = getStoredToken();
      let userRole = null;

      // First try to get role from token
      if (token) {
        userRole = getUserRole(token);
      }

      // Fallback to localStorage
      if (!userRole) {
        userRole = getStoredUserRole();
      }

      // Only allow access if role is "Admin"
      if (userRole === "Admin") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        // Redirect if no role (not logged in) or role is not Admin
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
      setIsCheckingRole(false);
    };

    checkAdminRole();
  }, [navigate]);

  // Profile modal controls
  const {
    isOpen: isProfileOpen,
    onOpen: onProfileOpen,
    onClose: onProfileClose,
  } = useDisclosure();

  // Sidebar drawer controls for mobile
  const {
    isOpen: isDrawerOpen,
    onOpen: onDrawerOpen,
    onClose: onDrawerClose,
  } = useDisclosure();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    if (isMobile) {
      onDrawerClose();
    }
  };

  // Show loading or access denied message
  if (isCheckingRole) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="100vh"
        flexDirection="column"
        gap={4}
      >
        <Spinner size="xl" color="blue.500" />
        <Text color="gray.600">Checking permissions...</Text>
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="100vh"
        p={4}
      >
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          maxW="500px"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Access Denied
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            You do not have permission to access the admin panel. Only users with
            Admin role can access this page. Redirecting to home page...
          </AlertDescription>
        </Alert>
      </Box>
    );
  }

  const SidebarContent = () => (
    <>
      <div>
        <Heading color="brand.500" size="md" mb={4}>
          Admin Menu
        </Heading>
        <Divider mb={4} />
        <List spacing={3}>
          <ListItem
            cursor="pointer"
            _hover={{ color: "blue.500" }}
            onClick={() => handleTabChange("users")}
            fontWeight={selectedTab === "users" ? "bold" : "normal"}
            p={2}
            borderRadius="md"
            bg={selectedTab === "users" ? "blue.50" : "transparent"}
          >
            <Text>Manage Users</Text>
          </ListItem>
          <ListItem
            cursor="pointer"
            _hover={{ color: "blue.500" }}
            onClick={() => handleTabChange("mockInterviews")}
            fontWeight={selectedTab === "mockInterviews" ? "bold" : "normal"}
            p={2}
            borderRadius="md"
            bg={selectedTab === "mockInterviews" ? "blue.50" : "transparent"}
          >
            <Text>Manage Mock Interviews</Text>
          </ListItem>
          <ListItem
            cursor="pointer"
            _hover={{ color: "blue.500" }}
            onClick={() => handleTabChange("mockInterviewQuestions")}
            fontWeight={selectedTab === "mockInterviewQuestions" ? "bold" : "normal"}
            p={2}
            borderRadius="md"
            bg={selectedTab === "mockInterviewQuestions" ? "blue.50" : "transparent"}
          >
            <Text>Manage Mock Interview Questions</Text>
          </ListItem>
          <ListItem
            cursor="pointer"
            _hover={{ color: "blue.500" }}
            onClick={() => handleTabChange("selfTests")}
            fontWeight={selectedTab === "selfTests" ? "bold" : "normal"}
            p={2}
            borderRadius="md"
            bg={selectedTab === "selfTests" ? "blue.50" : "transparent"}
          >
            <Text>Manage Personality Test</Text>
          </ListItem>
          <ListItem
            cursor="pointer"
            _hover={{ color: "blue.500" }}
            onClick={() => handleTabChange("personalityQuestions")}
            fontWeight={selectedTab === "personalityQuestions" ? "bold" : "normal"}
            p={2}
            borderRadius="md"
            bg={selectedTab === "personalityQuestions" ? "blue.50" : "transparent"}
          >
            <Text>Manage Personality Test Questions</Text>
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
            <Flex align="center" gap={2} mb={2}>
              <Avatar
                size="sm"
                icon={<FaUser fontSize="0.85rem" />}
                bg="brand.500"
                color="white"
                cursor="pointer"
                onClick={onProfileOpen}
              />
              <Text fontSize="sm" fontWeight="medium" flex="1">
                {localStorage.getItem("userName") || "Admin"}
              </Text>
            </Flex>
            <Modal
              isOpen={isProfileOpen}
              onClose={onProfileClose}
              size={{ base: "full", md: "lg" }}
            >
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Edit Profile</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                  <UserProfileEdit
                    onClose={onProfileClose}
                    onLogout={handleLogout}
                  />
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
    </>
  );

  return (
    <Flex direction={{ base: "column", md: "row" }} minH="100vh">
      {/* Desktop Sidebar */}
      <Box
        width={{ base: "100%", md: "250px" }}
        bg="gray.100"
        p={{ base: 4, md: 6 }}
        height={{ base: "auto", md: "100vh" }}
        display={{ base: "none", md: "flex" }}
        flexDirection="column"
        justifyContent="space-between"
        borderRight="1px solid"
        borderColor="gray.200"
      >
        <SidebarContent />
      </Box>

      {/* Mobile Header with Hamburger */}
      <Box
        display={{ base: "flex", md: "none" }}
        bg="gray.100"
        p={4}
        align="center"
        justify="space-between"
        borderBottom="1px solid"
        borderColor="gray.200"
      >
        <Heading color="brand.500" size="md">
          Admin Panel
        </Heading>
        <IconButton
          icon={<HamburgerIcon />}
          aria-label="Open menu"
          onClick={onDrawerOpen}
          variant="ghost"
        />
      </Box>

      {/* Mobile Drawer */}
      <Drawer isOpen={isDrawerOpen} placement="left" onClose={onDrawerClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Admin Menu</DrawerHeader>
          <DrawerBody>
            <Box
              display="flex"
              flexDirection="column"
              justifyContent="space-between"
              height="calc(100% - 60px)"
            >
              <SidebarContent />
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main Content */}
      <Box flex="1" p={{ base: 4, md: 8 }} overflowX="auto">
        {selectedTab === "users" && <ManageUsers />}
        {selectedTab === "mockInterviews" && <ManageMockInterviews />}
        {selectedTab === "mockInterviewQuestions" && <ManageMockInterviewQuestions />}
        {selectedTab === "selfTests" && <ManageSelfTests />}
        {selectedTab === "personalityQuestions" && <ManagePersonalityTestQuestions />}
      </Box>
    </Flex>
  );
};

export default AdminPanel;
