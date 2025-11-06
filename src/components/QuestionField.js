import React from "react";
import {
  Box,
  Text,
  Stack,
  RadioGroup,
  Radio,
  CheckboxGroup,
  Checkbox,
  Select,
  Input,
  Textarea,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  useColorModeValue,
} from "@chakra-ui/react";

/**
 * QuestionField
 * Generic question renderer.
 * Props:
 * - type: 'radio' | 'checkbox' | 'select' | 'slider' | 'textbox'
 * - label: string (optional, appears above the control)
 * - text: string (question text)
 * - value: any (string | string[] | number)
 * - options?: Array<{ id?: number|string, text: string, value: string }>
 * - onChange: (newValue) => void
 * - sliderProps?: { min?: number; max?: number; step?: number }
 * - highlightColor?: string (e.g. "#2563EB" or "teal.500")
 * - colorScheme?: Chakra color scheme (e.g. "teal", "orange")
 */
const QuestionField = ({
  type = "textbox",
  label,
  text,
  value,
  options = [],
  onChange,
  sliderProps = {},
  emojiChips = true,
  sliderFaces = true,
  helperText,
  required = false,

  // NEW (optional theming)
  highlightColor = "#6366F1", // fallback if parent doesn't pass a section color
  colorScheme = "purple",
}) => {
  // Support numeric type codes: 1=radio, 2=checkbox, 3=select, 4=slider, 5=textbox, 6=textarea
  const resolvedType = (() => {
    if (typeof type === "number") {
      switch (type) {
        case 1: return "radio";
        case 2: return "checkbox";
        case 3: return "select";
        case 4: return "slider";
        case 5: return "textbox";
        case 6: return "textarea";
        default: return "textbox";
      }
    }
    return type;
  })();

  const chipBorderDefault = useColorModeValue("gray.200", "gray.600");
  const chipBgDefault = useColorModeValue("white", "gray.800");
  const chipBgSelected = useColorModeValue(`${colorScheme}.50`, "rgba(0,0,0,0.3)");

  const upper = (text || label) ? (
    <Box mb={3}>
      {text && (
        <Text fontWeight="medium">
          {text}{required ? ' *' : ''}
        </Text>
      )}
      {label && !text && (
        <Text fontWeight="medium">
          {label}{required ? ' *' : ''}
        </Text>
      )}
      {helperText && (
        <Text fontSize="sm" color="gray.500" mt={1}>{helperText}</Text>
      )}
    </Box>
  ) : null;

  switch (resolvedType) {
    case "radio":
      return (
        <Box>
          {upper}
          <RadioGroup value={value ?? ""} onChange={onChange}>
            <Stack direction={{ base: "column", md: "row" }} spacing={3} wrap="wrap">
              {options.map((opt) => {
                const selected = String(value) === String(opt.value);
                return (
                  <Box
                    as="label"
                    key={opt.id ?? opt.value}
                    px={3}
                    py={2}
                    rounded="full"
                    borderWidth="1px"
                    borderColor={selected ? highlightColor : chipBorderDefault}
                    bg={selected ? chipBgSelected : chipBgDefault}
                    cursor="pointer"
                    _hover={{ shadow: "sm" }}
                    display="inline-flex"
                    alignItems="center"
                    gap={2}
                  >
                    {/* hide the native radio when using chips */}
                    <Radio
                      value={String(opt.value)}
                      colorScheme={colorScheme}
                      display={emojiChips ? "none" : "inline-flex"}
                      sx={{
                        ".chakra-radio__control[data-checked]": {
                          bg: highlightColor,
                          borderColor: highlightColor,
                        },
                      }}
                    />
                    <Stack direction="row" spacing={2} align="center">
                      <Text fontSize="sm" userSelect="none" color={selected ? highlightColor : undefined}>
                        {typeof opt.text === 'string' ? opt.text : opt.text.props.children[0].props.children}
                      </Text>
                      {typeof opt.text === 'string' && (
                        <Text fontSize="lg">
                          {opt.text.toLowerCase() === "like" && "👍"}
                          {opt.text.toLowerCase() === "dislike" && "👎"}
                        </Text>
                      )}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </RadioGroup>
        </Box>
      );

    case "checkbox":
      return (
        <Box>
          {upper}
          <CheckboxGroup value={value ?? []} onChange={onChange}>
            <Stack direction={{ base: "column", md: "row" }} spacing={4} wrap="wrap">
              {options.map((opt) => (
                <Checkbox
                  key={opt.id ?? opt.value}
                  value={String(opt.value)}
                  colorScheme={colorScheme}
                  sx={{
                    ".chakra-checkbox__control[data-checked]": {
                      bg: highlightColor,
                      borderColor: highlightColor,
                    },
                    ".chakra-checkbox__control:focus-visible": {
                      boxShadow: `0 0 0 2px ${highlightColor}55`,
                    },
                  }}
                >
                  {opt.text}
                </Checkbox>
              ))}
            </Stack>
          </CheckboxGroup>
        </Box>
      );

    case "select":
      return (
        <Box>
          {upper}
          <Select
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            borderColor={`${colorScheme}.300`}
            _focus={{
              borderColor: highlightColor,
              boxShadow: `0 0 0 1px ${highlightColor}`,
            }}
          >
            <option value="" disabled hidden>
              Select an option
            </option>
            {options.map((opt) => (
              <option key={opt.id ?? opt.value} value={String(opt.value)}>
                {opt.text}
              </option>
            ))}
          </Select>
        </Box>
      );

    case "slider": {
      const { min = 1, max = 7, step = 1 } = sliderProps || {};
      const num = typeof value === "number" ? value : Number(value ?? min);
      
      // Emoji and color mapping based on value
      const getSliderEmoji = (value) => {
        switch(value) {
          case 1: return "😫";
          case 2: return "😞";
          case 3: return "😕";
          case 4: return "😐";
          case 5: return "🙂";
          case 6: return "😊";
          case 7: return "😄";
          default: return "😐";
        }
      };

      const getSliderColor = (value) => {
        if (value <= 3) return "red.400";
        if (value <= 5) return "yellow.400";
        return "green.400";
      };

      // Generate number marks
      const marks = [];
      for (let i = min; i <= max; i += step) {
        marks.push(i);
      }
      
      return (
        <Box>
          {upper}
          <Box position="relative">
            <Slider
              value={num}
              min={min}
              max={max}
              step={step}
              onChange={(v) => onChange(v)}
            >
              <SliderTrack
                bg={useColorModeValue("gray.200", "gray.700")}
                h="10px"
                borderRadius="full"
              >
                <SliderFilledTrack bg={getSliderColor(num)} />
              </SliderTrack>
              <SliderThumb
                boxSize={10}
                bg={getSliderColor(num)}
                _focus={{ boxShadow: `0 0 0 3px ${getSliderColor(num)}40` }}
                transition="all 0.2s"
              >
                <Text fontSize="xl">
                  {getSliderEmoji(num)}
                </Text>
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
                      opacity={num === mark ? 1 : 0.7}
                      transform={num === mark ? "scale(1.1)" : "scale(1)"}
                      transition="all 0.2s"
                    >
                      {mark}
                    </Text>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      );
    }

    case "textarea":
      return (
        <Box>
          {upper}
          <Textarea
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            _focus={{
              borderColor: highlightColor,
              boxShadow: `0 0 0 1px ${highlightColor}`,
            }}
          />
        </Box>
      );

    case "textbox":
    default:
      return (
        <Box>
          {upper}
          <Input
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            _focus={{
              borderColor: highlightColor,
              boxShadow: `0 0 0 1px ${highlightColor}`,
            }}
          />
        </Box>
      );
  }
};

export default QuestionField;