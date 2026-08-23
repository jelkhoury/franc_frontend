import React from "react";
import {
  Box,
  Flex,
  Text,
  Collapse,
  useDisclosure,
  Icon,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { getServiceByKey } from "../../constants/serviceRegistry";

export default function User360ServiceCard({
  serviceKey,
  title,
  children,
  isHighlighted,
  defaultOpen = true,
}) {
  const service = getServiceByKey(serviceKey);
  const ServiceIcon = service?.icon;
  const color = service?.color ?? "#3E79BD";
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: defaultOpen });

  return (
    <Box
      id={`user360-service-${serviceKey}`}
      borderRadius="2xl"
      borderWidth="2px"
      borderColor={isHighlighted ? color : "gray.200"}
      bg="white"
      overflow="hidden"
      transition="all 0.25s"
      boxShadow={isHighlighted ? `0 4px 24px ${color}22` : "sm"}
      scrollMarginTop="80px"
    >
      <Flex
        align="center"
        gap={3}
        px={5}
        py={4}
        cursor="pointer"
        onClick={onToggle}
        bg={isHighlighted ? `${color}08` : "gray.50"}
        _hover={{ bg: `${color}12` }}
        transition="background 0.2s"
      >
        <Flex
          align="center"
          justify="center"
          w="44px"
          h="44px"
          borderRadius="xl"
          bg={`${color}18`}
          color={color}
          fontSize="lg"
          flexShrink={0}
        >
          {ServiceIcon && <ServiceIcon />}
        </Flex>
        <Box flex={1} minW={0}>
          <Text fontWeight="semibold" color="gray.800" fontSize="md">
            {title ?? service?.name}
          </Text>
          {service?.description && (
            <Text fontSize="xs" color="gray.500" noOfLines={1}>
              {service.description}
            </Text>
          )}
        </Box>
        <Icon
          as={ChevronDownIcon}
          boxSize={5}
          color="gray.400"
          transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"}
          transition="transform 0.2s"
        />
      </Flex>
      <Collapse in={isOpen} animateOpacity>
        <Box px={5} py={4} borderTopWidth="1px" borderColor="gray.100">
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}
