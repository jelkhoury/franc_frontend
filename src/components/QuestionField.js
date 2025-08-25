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
                    borderColor={selected ? "blue.400" : useColorModeValue("gray.200", "gray.600")}
                    bg={selected ? useColorModeValue("blue.50", "blue.900") : useColorModeValue("white", "gray.800")}
                    cursor="pointer"
                    _hover={{ shadow: "sm" }}
                    display="inline-flex"
                    alignItems="center"
                    gap={2}
                  >
                    {/* hide the native radio when using chips */}
                    <Radio value={String(opt.value)} display={emojiChips ? "none" : "inline-flex"} />
                    <Text fontSize="sm" userSelect="none">{opt.text}</Text>
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
                <Checkbox key={opt.id ?? opt.value} value={String(opt.value)}>
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
          <Select value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
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
    case "slider":
      {
        const { min = 0, max = 10, step = 1 } = sliderProps || {};
        const num = typeof value === "number" ? value : Number(value ?? min);
        return (
          <Box>
            {upper}
            <Slider value={num} min={min} max={max} step={step} onChange={(v) => onChange(v)}>
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb boxSize={sliderFaces ? 8 : 4}>
                {sliderFaces && (
                  <Text fontSize="lg">
                    {num >= max * 0.8 ? "🤩" : num >= max * 0.6 ? "🙂" : num >= max * 0.4 ? "😐" : num >= max * 0.2 ? "🙁" : "😣"}
                  </Text>
                )}
              </SliderThumb>
            </Slider>
            <Text mt={2} fontSize="sm" color="gray.600">{num}</Text>
          </Box>
        );
      }
    case "textarea":
      return (
        <Box>
          {upper}
          <Textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
        </Box>
      );
    case "textbox":
    default:
      return (
        <Box>
          {upper}
          <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
        </Box>
      );
  }
};

export default QuestionField;