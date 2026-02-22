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
  valueLabels,
}) => {
  const getEmoji = (val) => {
    // For 0-5 scale, assign unique emoji to each value
    if (min === 0 && max === 5) {
      const emojiMap = {
        0: "😞",
        1: "😐",
        2: "🙂",
        3: "😊",
        4: "😄",
        5: "🤩"
      };
      return emojiMap[val] || "😐";
    }
    // For other scales, use ratio-based approach
    const ratio = (val - min) / (max - min);
    if (ratio <= 0.16) return "😞";
    if (ratio <= 0.33) return "😐";
    if (ratio <= 0.5) return "🙂";
    if (ratio <= 0.66) return "😊";
    if (ratio <= 0.83) return "😄";
    return "🤩";
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

  const useWeightScale = valueLabels && Object.keys(valueLabels).length > 0;

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

          {useWeightScale ? (
            <>
              {/* Numbers only under slider, aligned with thumb; no labels under numbers */}
              <Box position="relative" mt={4} height="20px">
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
              {/* Not Important / Extremely Important at ends only, not under numbers */}
              <HStack justify="space-between" mt={2}>
                <Text fontSize="xs" color="gray.600">
                  {leftLabel || "Not Important"}
                </Text>
                <Text fontSize="xs" color="gray.600">
                  {rightLabel || "Extremely Important"}
                </Text>
              </HStack>
            </>
          ) : (
            <>
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
            </>
          )}
        </Box>
      </VStack>
    </Box>
  );
};

export default CriterionSlider;
