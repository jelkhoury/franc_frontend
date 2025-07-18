"use client";

import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Text,
  IconButton,
  Button,
  Stack,
  Collapse,
  useColorModeValue,
  useDisclosure,
  Image,
  Avatar,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons";
import UserProfileEdit from "../components/UserProfileEdit";
import { AuthContext } from "../components/AuthContext"; // Import AuthContext
import { FaUser } from "react-icons/fa";

const Navbar = () => {
  const { isOpen: isMenuOpen, onToggle: onMenuToggle } = useDisclosure();
  const {
    isOpen: isProfileOpen,
    onOpen: onProfileOpen,
    onClose: onProfileClose,
  } = useDisclosure();
  const navigate = useNavigate();

  const authContext = useContext(AuthContext);

  if (!authContext) {
    console.error(
      "AuthContext is undefined! Make sure AuthProvider is wrapping the app."
    );
    return null; // Prevents breaking the entire app
  }

  const { isLoggedIn, logout } = authContext; // Access authentication state

  const handleLogout = () => {
    logout(); // Logout the user and update state
    navigate("/login"); // Immediately navigate to login after logout
  };

  return (
    <Box>
      <Flex
        position="relative"
        bg={useColorModeValue("whiteAlpha.800", "gray.900")}
        color={useColorModeValue("gray.600", "white")}
        backdropFilter="saturate(180%) blur(10px)"
        zIndex="10"
        minH={"60px"}
        py={{ base: 2 }}
        px={{ base: 4 }}
        borderBottom={1}
        borderStyle={"solid"}
        borderColor={useColorModeValue("gray.200", "gray.900")}
        align={"center"}
        justify="center"
      >
        {/* Mobile Toggle Button */}
        <IconButton
          onClick={onMenuToggle}
          icon={
            isMenuOpen ? (
              <CloseIcon w={3} h={3} />
            ) : (
              <HamburgerIcon w={5} h={5} />
            )
          }
          variant={"ghost"}
          aria-label={"Toggle Navigation"}
          display={{ base: "flex", md: "none" }}
          position="absolute"
          left="1rem"
        />

        {/* Logo */}
        <Link to="/">
          <Box
            height={{ base: "40px", md: "50px" }}
            width="auto"
            display="flex"
            alignItems="center"
            marginRight={{ base: "28px", md: 0 }}
          >
            <Image
              src="/assets/images/francyellow_transparentbg-01.svg"
              alt="Logo"
              height="100%" // fills the 60px height
              width="auto"
              objectFit="contain"
              ignoreFallback
            />
          </Box>
        </Link>

        {/* Desktop Nav Items */}
        <Flex display={{ base: "none", md: "flex" }} ml={10} flex={1}>
          <DesktopNav />
        </Flex>

        {/* Right Section (Login/Profile) */}
        <Flex align="center" gap={4} position="absolute" right="1rem">
          {!isLoggedIn ? (
            <Button
              as={Link}
              to="/login"
              fontSize={"sm"}
              fontWeight={600}
              color={"white"}
              bg={"brand.500"}
              _hover={{ bg: "brand.600" }}
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
              />
            </>
          )}
        </Flex>
      </Flex>

      {/* Profile Modal */}
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

      {/* Mobile Nav Collapse */}
      <Collapse in={isMenuOpen} animateOpacity>
        <MobileNav />
      </Collapse>
    </Box>
  );
};

const DesktopNav = () => {
  const linkColor = useColorModeValue("black", "gray.200");
  const linkHoverColor = useColorModeValue("brand.500", "brand.300");

  return (
    <Stack direction={"row"} spacing={4}>
      {NAV_ITEMS.map((navItem) => (
        <Link key={navItem.label} to={navItem.href}>
          <Text
            p={2}
            fontSize={"md"}
            fontWeight={400}
            color={linkColor}
            _hover={{
              textDecoration: "none",
              color: linkHoverColor,
            }}
          >
            {navItem.label}
          </Text>
        </Link>
      ))}
    </Stack>
  );
};

const MobileNav = () => (
  <Stack
    bg={useColorModeValue("white", "gray.800")}
    p={4}
    display={{ md: "none" }}
  >
    {NAV_ITEMS.map((navItem) => (
      <MobileNavItem key={navItem.label} {...navItem} />
    ))}
  </Stack>
);

const MobileNavItem = ({ label, href }) => (
  <Box as={Link} to={href} py={2}>
    <Text fontWeight={600} color={useColorModeValue("gray.600", "gray.200")}>
      {label}
    </Text>
  </Box>
);

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Franc", href: "/franc" },
  { label: "About Us", href: "/about-us" },
  { label: "Contact Us", href: "/contact-us" },
];

export default Navbar;
