import React from "react";
import { Badge } from "@chakra-ui/react";

const CategoryBadge = ({ category }) => {
  const getCategoryConfig = (cat) => {
    if (cat === "HEAD") {
      return {
        colorScheme: "blue",
        label: "HEAD",
        emoji: "🧠",
      };
    } else if (cat === "HEART") {
      return {
        colorScheme: "red",
        label: "HEART",
        emoji: "❤️",
      };
    }
    return {
      colorScheme: "gray",
      label: category,
      emoji: "📋",
    };
  };

  const config = getCategoryConfig(category);

  return (
    <Badge
      colorScheme={config.colorScheme}
      fontSize="md"
      px={3}
      py={1}
      w="80px"
      justifyContent="center"
      display="inline-flex"
    >
      {config.emoji} {config.label}
    </Badge>
  );
};

export default CategoryBadge;
