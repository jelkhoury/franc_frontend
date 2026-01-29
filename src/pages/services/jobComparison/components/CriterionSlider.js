import React from "react";
import {
  Box,
  Text,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  VStack,
  HStack,
  useColorModeValue,
} from "@chakra-ui/react";

const CriterionSlider = ({
  label,
  sublabel,
  value,
  onChange,
  min = 0,
  max = 10,
  leftLabel,
  rightLabel,
}) => {
  const getEmoji = (val) => {
    const ratio = (val - min) / (max - min);
    if (ratio < 0.2) return "😞";
    if (ratio < 0.4) return "😐";
    if (ratio < 0.6) return "🙂";
    if (ratio < 0.8) return "😊";
    return "😄";
  };

  const getColor = (val) => {
    const ratio = (val - min) / (max - min);
    if (ratio < 0.33) return "red.400";
    if (ratio < 0.66) return "yellow.400";
    return "green.400";
  };

  // Generate number marks
  const marks = [];
  for (let i = min; i <= max; i += 1) {
    marks.push(i);
  }

  return (
    <Box>
      <VStack align="stretch" spacing={2}>
        <Text fontWeight="semibold" fontSize="md" color="gray.800">
          {label}
        </Text>
        {sublabel && (
          <Text fontSize="sm" color="gray.600">
            {sublabel}
          </Text>
        )}

        <Box position="relative" pt={4}>
          <Slider
            value={value}
            min={min}
            max={max}
            step={1}
            onChange={onChange}
            size="lg"
          >
            <SliderTrack
              bg={useColorModeValue("gray.200", "gray.700")}
              h="10px"
              borderRadius="full"
            >
              <SliderFilledTrack bg={getColor(value)} />
            </SliderTrack>
            <SliderThumb
              boxSize={10}
              bg={getColor(value)}
              _focus={{ boxShadow: `0 0 0 3px ${getColor(value)}40` }}
              transition="all 0.2s"
            >
              <Text fontSize="xl">{getEmoji(value)}</Text>
            </SliderThumb>
          </Slider>

          {/* Number marks */}
          <Box position="relative" mt={4}>
            <Box position="relative" height="20px">
              {marks.map((mark) => (
                <Box
                  key={mark}
                  position="absolute"
                  left={`${((mark - min) / (max - min)) * 100}%`}
                  transform="translateX(-50%)"
                  textAlign="center"
                >
                  <Text
                    fontSize="sm"
                    color="gray.600"
                    fontWeight="medium"
                    opacity={value === mark ? 1 : 0.7}
                    transform={value === mark ? "scale(1.1)" : "scale(1)"}
                    transition="all 0.2s"
                  >
                    {mark}
                  </Text>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Value Display */}
          <HStack justify="space-between" mt={2}>
            <Text fontSize="xs" color="gray.600">
              {leftLabel || min}
            </Text>
            <Text fontSize="lg" fontWeight="bold" color={getColor(value)}>
              {value}
            </Text>
            <Text fontSize="xs" color="gray.600">
              {rightLabel || max}
            </Text>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default CriterionSlider;
