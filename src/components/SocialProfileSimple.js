"use client";

import {
  Heading,
  Avatar,
  Box,
  Center,
  Text,
  Stack,
  Button,
  Badge,
  useColorModeValue,
  Link,
} from "@chakra-ui/react";

export default function SocialProfileSimple({
  name, // required
  role, // required
  contact, // required
  username,
  avatar,
  description,
  badges = [],
  linkedin,
}) {
  return (
    <Center py={4}>
      <Box
        maxW={"280px"}
        minW={"220px"}
        minH={"180px"}
        w={"full"}
        bg={useColorModeValue("white", "gray.900")}
        boxShadow={"lg"} // ⬅ lighter shadow
        rounded={"md"} // ⬅ smaller radius
        p={4} // ⬅ less padding
        textAlign={"left"}
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
      >
        {/* Avatar (optional) */}
        {avatar && (
          <Avatar
            size={"lg"} // ⬅ smaller avatar
            src={avatar}
            name={name}
            mb={3}
          />
        )}

        <Heading fontSize={"lg"} fontFamily={"body"}>
          {name}
        </Heading>

        <Text fontSize="sm" fontWeight={600} color={"gray.600"} mb={1}>
          {role}
        </Text>

        {username && (
          <Text fontSize="xs" fontWeight={500} color={"gray.500"} mb={2}>
            {username}
          </Text>
        )}

        {description && (
          <Text
            fontSize="sm"
            minH="40px"
            maxH={40}
            color={useColorModeValue("gray.700", "gray.400")}
            px={2}
          >
            {description}
          </Text>
        )}

        {badges.length > 0 && (
          <Stack
            align={"center"}
            justify={"center"}
            direction={"row"}
            mt={3}
            flexWrap="wrap"
            spacing={1}
          >
            {badges.map((badge, i) => (
              <Badge
                key={i}
                px={1.5}
                py={0.5}
                m={0.5}
                fontSize="0.7em"
                bg={useColorModeValue("gray.50", "gray.800")}
              >
                #{badge}
              </Badge>
            ))}
          </Stack>
        )}

        {/* Contact */}
        <Text mt={3} fontSize="sm" color={"blue.500"} fontWeight="bold">
          <Link href={contact} isExternal>
            {contact}
          </Link>
        </Text>

        {linkedin && (
          <Stack mt={3}>
            <Button
              fontSize="xs"
              rounded="full"
              size="sm"
              colorScheme="brand" // ✅ use brand, not brand.100
              variant="ghost" // ✅ solid = filled button
              onClick={() => window.open(linkedin, "_blank")}
            >
              LinkedIn
            </Button>
          </Stack>
        )}
      </Box>
    </Center>
  );
}
