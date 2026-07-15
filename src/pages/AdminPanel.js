import React, { useState, useContext, useEffect } from "react";
import {
  Box,
  Button,
  Heading,
  Divider,
  Text,
  Flex,
  VStack,
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
  useColorModeValue,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { HamburgerIcon } from "@chakra-ui/icons";
import ManageUsers from "../components/Admin/ManageUsers";
import ManageMockInterviews from "../components/Admin/ManageMockInterviews";
import ManageSelfTests from "../components/Admin/ManageSelfTests";
import ManagePersonalityTestQuestions from "../components/Admin/ManagePersonalityTestQuestions";
import ManageMockInterviewQuestions from "../components/Admin/ManageMockInterviewQuestions";
import ManageFiles from "../components/Admin/ManageFiles";
import ManageChatbot from "../components/Admin/ManageChatbot";
import ManageJobComparisons from "../components/Admin/ManageJobComparisons";
import ManageEmbeddings from "../components/Admin/ManageEmbeddings";
import { AuthContext } from "../components/AuthContext";
import UserProfileEdit from "../components/UserProfileEdit"; // Adjust path if necessary
import {
  FaUser,
  FaHome,
  FaUsers,
  FaVideo,
  FaListOl,
  FaClipboardList,
  FaTasks,
  FaFolder,
  FaRobot,
  FaBalanceScale,
  FaBook,
} from "react-icons/fa";
import { getStoredToken, getUserRole, getStoredUserRole } from "../utils/tokenUtils";

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

  const menuItemBg = useColorModeValue("white", "gray.700");
  const menuItemBgActive = useColorModeValue("blue.50", "blue.900");
  const menuItemHover = useColorModeValue("gray.50", "gray.600");
  const sidebarBorder = useColorModeValue("gray.200", "gray.600");
  const userSectionBg = useColorModeValue("gray.50", "gray.800");

  const menuItems = [
    { id: "users", icon: FaUsers, label: "Manage Users" },
    { id: "mockInterviews", icon: FaVideo, label: "Manage Mock Interviews" },
    { id: "mockInterviewQuestions", icon: FaListOl, label: "Mock Interview Questions" },
    { id: "selfTests", icon: FaClipboardList, label: "Personality Test" },
    { id: "personalityQuestions", icon: FaTasks, label: "Personality Test Questions" },
    { id: "files", icon: FaFolder, label: "Manage Files" },
    { id: "chatbot", icon: FaRobot, label: "Manage Chatbot" },
    { id: "jobComparisons", icon: FaBalanceScale, label: "Job Comparisons" },
    { id: "embeddings", icon: FaBook, label: "Knowledge Documents" },
  ];

  const SidebarContent = () => (
    <Flex direction="column" flex="1" minH="0">
      <Box
        flex="1"
        overflowY="auto"
        minH="0"
        sx={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        <Flex align="center" gap={2} mb={4} px={1}>
          <Box
            p={2}
            borderRadius="lg"
            bg="brand.500"
            color="white"
            fontSize="lg"
            lineHeight={0}
          >
            <FaUsers />
          </Box>
          <Heading color="brand.500" size="sm" fontWeight="semibold" letterSpacing="tight">
            Admin Menu
          </Heading>
        </Flex>
        <Divider borderColor={sidebarBorder} mb={4} />
        <VStack spacing={1} align="stretch">
          {menuItems.map(({ id, icon: Icon, label }) => {
            const isActive = selectedTab === id;
            return (
              <Flex
                key={id}
                align="flex-start"
                gap={3}
                py={2.5}
                px={3}
                borderRadius="lg"
                cursor="pointer"
                bg={isActive ? menuItemBgActive : "transparent"}
                color={isActive ? "blue.600" : "gray.700"}
                fontWeight={isActive ? "semibold" : "medium"}
                borderLeft="3px solid"
                borderLeftColor={isActive ? "brand.500" : "transparent"}
                _hover={{
                  bg: isActive ? menuItemBgActive : menuItemHover,
                }}
                transition="all 0.2s"
                onClick={() => handleTabChange(id)}
              >
                <Box color={isActive ? "brand.500" : "gray.500"} fontSize="md" flexShrink={0} pt={0.5}>
                  <Icon />
                </Box>
                <Text fontSize="sm" flex={1} minW={0} lineHeight="tall">
                  {label}
                </Text>
              </Flex>
            );
          })}
        </VStack>
        <Divider borderColor={sidebarBorder} my={4} />
        <Button
          as={Link}
          to="/franc"
          leftIcon={<FaHome />}
          variant="outline"
          colorScheme="blue"
          size="sm"
          width="100%"
          borderRadius="lg"
          _hover={{ bg: "blue.50" }}
        >
          Go to Franc
        </Button>
      </Box>

      <Box
        mt="auto"
        pt={4}
        borderTopWidth="1px"
        borderColor={sidebarBorder}
        bg={userSectionBg}
        borderRadius="lg"
        p={3}
      >
        {!isLoggedIn ? (
          <Button
            as={Link}
            to="/login"
            colorScheme="blue"
            size="sm"
            width="100%"
            borderRadius="lg"
          >
            Login
          </Button>
        ) : (
          <VStack spacing={2} align="stretch">
            <Button
              variant="ghost"
              size="sm"
              width="100%"
              borderRadius="lg"
              justifyContent="flex-start"
              leftIcon={
                <Avatar
                  size="xs"
                  icon={<FaUser fontSize="0.6rem" />}
                  bg="brand.500"
                  color="white"
                />
              }
              onClick={onProfileOpen}
              _hover={{ bg: menuItemHover }}
            >
              <Text fontSize="sm" fontWeight="medium" noOfLines={1} flex="1" textAlign="left">
                {localStorage.getItem("userName") || "Admin"}
              </Text>
            </Button>
            <Modal
              isOpen={isProfileOpen}
              onClose={onProfileClose}
              size={{ base: "full", md: "lg" }}
            >
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>View Profile</ModalHeader>
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
              variant="outline"
              size="sm"
              width="100%"
              borderRadius="lg"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </VStack>
        )}
      </Box>
    </Flex>
  );

  return (
    <Flex
      direction={{ base: "column", md: "row" }}
      h="100vh"
      maxH="100vh"
      overflow="hidden"
      bg="gray.50"
    >
      {/* Desktop Sidebar — stays in view; only main pane scrolls */}
      <Box
        width={{ base: "100%", md: "280px" }}
        minW={{ md: "280px" }}
        flexShrink={0}
        bg="gray.100"
        p={{ base: 4, md: 6 }}
        h={{ md: "100vh" }}
        maxH={{ md: "100vh" }}
        display={{ base: "none", md: "flex" }}
        flexDirection="column"
        overflow="hidden"
        borderRight="1px solid"
        borderColor="gray.200"
      >
        <SidebarContent />
      </Box>

      {/* Mobile Header with Hamburger */}
      <Box
        display={{ base: "flex", md: "none" }}
        flexShrink={0}
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

      {/* Main Content — sole scroll area on desktop & mobile */}
      <Box
        flex="1"
        minW={0}
        minH={0}
        p={{ base: 4, md: 8 }}
        overflowY="auto"
        overflowX="auto"
        bg="white"
      >
        {selectedTab === "users" && <ManageUsers />}
        {selectedTab === "mockInterviews" && <ManageMockInterviews />}
        {selectedTab === "mockInterviewQuestions" && <ManageMockInterviewQuestions />}
        {selectedTab === "selfTests" && <ManageSelfTests />}
        {selectedTab === "personalityQuestions" && <ManagePersonalityTestQuestions />}
        {selectedTab === "files" && <ManageFiles />}
        {selectedTab === "chatbot" && <ManageChatbot />}
        {selectedTab === "jobComparisons" && <ManageJobComparisons />}
        {selectedTab === "embeddings" && <ManageEmbeddings />}
      </Box>
    </Flex>
  );
};

export default AdminPanel;
