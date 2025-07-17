import {
  Box,
  Heading,
  Text,
  Button,
  Input,
  VStack,
  Textarea,
  FormControl,
  FormLabel,
  FormErrorMessage,
  useToast,
  Image,
  Flex,
} from '@chakra-ui/react';
import { useState } from 'react';
import Footer from '../components/Footer';

const ContactUsPage = () => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    subject: '',
    message: '',
    captcha: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.contact) newErrors.contact = "Contact number is required";
    if (!formData.subject) newErrors.subject = "Subject is required";
    if (!formData.message) newErrors.message = "Message cannot be empty";
    if (!formData.captcha) newErrors.captcha = "Captcha is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      toast({
        title: "Message Sent!",
        description: "We'll get back to you soon.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setFormData({ name: '', email: '', contact: '', subject: '', message: '', captcha: '' });
    }
  };

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-r, white, #ebf8ff)"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      <Flex justify="center" align="center" flex="1" px={4} py={16}>
        <Box
          bg="white"
          p={10}
          borderRadius="2xl"
          boxShadow="0 4px 20px rgba(4, 90, 171, 0.2)"
          border="1px solid"
          borderColor="gray.100"
          maxW="600px"
          w="100%"
          textAlign="center"
        >
          {/* Friendly Avatar */}
          <Image
            src="/assets/images/franc_white_blue bg-01.svg"
            alt="Franc Avatar"
            boxSize="180px"
            objectFit="cover"
            borderRadius="lg"
            mx="auto"
            mb={4}
            transition="transform 0.3s"
            _hover={{ transform: "scale(1.05)" }}
          />

          <Heading size="lg" mb={2} color="gray.700">
            Contact Us
          </Heading>
          <Text fontSize="md" color="gray.600" mb={6}>
            Reach out to us anytime!
          </Text>

          {/* Contact Info Section */}
          <Box
            px={6}
            py={4}
            textAlign="center"
            bg="gray.50"
            borderRadius="2xl"
            mb={6}
          >
            <Heading size="md" mb={3} color="gray.700">
              📍 Contact Details
            </Heading>
            <VStack spacing={2} color="gray.600" fontSize="md">
              <Text>Main Campus of Hadat-Baabda, Building A, Ground Floor</Text>
              <Text>PO Box 40016 Hadat-Baabda - Lebanon</Text>
              <Text>📞 +961 5 92 70 00 | Ext: 1130 – 1131-1133</Text>
              <Text>📞 +961 5 92 70 01</Text>
              <Text>
                📧{" "}
                <a href="mailto:ccd@ua.edu.lb" style={{ color: "#045aab" }}>
                  ccd@ua.edu.lb
                </a>
              </Text>
            </VStack>
          </Box>

          {/* Contact Form */}
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isInvalid={errors.name}>
                <FormLabel color="gray.700">Name</FormLabel>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  focusBorderColor="brand.400"
                  bg="gray.100"
                />
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={errors.email}>
                <FormLabel color="gray.700">Email</FormLabel>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  focusBorderColor="brand.400"
                  bg="gray.100"
                />
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={errors.contact}>
                <FormLabel color="gray.700">Contact Number</FormLabel>
                <Input
                  type="tel"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  placeholder="Enter your contact number"
                  focusBorderColor="brand.400"
                  bg="gray.100"
                />
                <FormErrorMessage>{errors.contact}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={errors.subject}>
                <FormLabel color="gray.700">Subject</FormLabel>
                <Input
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Enter the subject"
                  focusBorderColor="brand.400"
                  bg="gray.100"
                />
                <FormErrorMessage>{errors.subject}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={errors.message}>
                <FormLabel color="gray.700">Message</FormLabel>
                <Textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Enter your message"
                  focusBorderColor="brand.400"
                  bg="gray.100"
                />
                <FormErrorMessage>{errors.message}</FormErrorMessage>
              </FormControl>

              <Button
                type="submit"
                bg="#045aab" // Using the main color for the button background
                color="white" // Set text color to white for better contrast
                size="md"
                w="full"
                _hover={{ bg: "#03488c" }} // Darker shade for hover effect
              >
                Send Message
              </Button>
            </VStack>
          </form>
        </Box>
      </Flex>
      <Footer />
    </Box>
  );
};

export default ContactUsPage;
