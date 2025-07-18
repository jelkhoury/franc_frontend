import {
  Box,
  Heading,
  Text,
  Flex,
  Image,
  Stack,
} from '@chakra-ui/react';
import Footer from '../components/Footer';
import SocialProfileSimple from '../components/SocialProfileSimple';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const teamMembers = [
  {
    name: "Fouad Abdallah",
    role: "CCD Director",
    image: "/assets/images/Fouad.jpg",
    description: "Leading the CCD Department.",
    linkedin: "https://www.linkedin.com/in/fouad-r-abdallah/",
    badges: ["Leadership", "CCD"],
  },
  {
    name: "Elie Najem",
    role: "CCD Officer",
    image: "/assets/images/Elie.jpg",
    description: "Facilitating collaboration between CCD and CS.",
    linkedin: "https://www.linkedin.com/in/elienajm/",
    badges: ["CCD", "Advising"],
  },
  {
    name: "Charbel Gemayel",
    role: "Head of CS Department",
    image: "/assets/images/Charbel.jpg",
    description: "Supervising the development of Franc.",
    linkedin: "https://www.linkedin.com/in/charbel-el-gemayel-1105ab203/",
    badges: ["Supervision", "Academic"],
  },
  {
    name: "Rani Hijazi",
    role: "Developer",
    image: "/assets/images/Rani Hijazi.jpg",
    description: "One of the developers behind the Franc project.",
    linkedin: "https://www.linkedin.com/in/rani-hijazi-903181270/",
    badges: ["React", "AI", "Backend"],
  },
  {
    name: "Wadih Issa",
    role: "Developer",
    image: "/assets/images/Wadih Issa.jpg",
    description: "One of the developers behind the Franc project.",
    linkedin: "https://www.linkedin.com/in/wadih-issa-6b2a801a8/",
    badges: ["Frontend", "UI/UX", "AI"],
  },
];

const AboutUsPage = () => {
  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      {/* Intro Section with Gradient */}
      <Box
        bgGradient="linear(to-r, white, #ebf8ff)"
        py={{ base: 20, md: 32 }}
        px={{ base: 6, md: 20 }}
      >
        <Flex
          direction={{ base: "column", md: "row" }}
          align="center"
          justify="space-between"
          gap={10}
        >
          {/* Right - Image */}
          <Image
            src="/assets/images/about_us.svg"
            alt="Team Illustration"
            maxW="450px"
            objectFit="contain"
            borderRadius="lg"
            alignSelf="flex-end"
          />

          {/* Left - Card with Content */}
          <Box
            flex="1"
            maxW={{ base: "100%", md: "60%" }}
            p={8}
            bg="white"
            borderRadius="2xl"
            boxShadow="0 4px 12px rgba(4, 90, 171, 0.2)"
            border="1px solid"
            borderColor="gray.100"
          >
            <Heading size="xl" mb={4}>
              About the Project Team - Franc
            </Heading>

            <Text fontSize="lg" color="gray.600" lineHeight="1.8">
              Franc is a project developed through collaboration between the CCD
              and CS departments. It was supported by Mr. Fouad Abdallah and
              Instructor Elie Najem from CCD, and supervised by Dr. Charbel
              Gemayel, Head of CS. The development was carried out by alumni
              Rani Hijazi and Wadih Issa.
            </Text>
          </Box>
        </Flex>
      </Box>

      {/* Team Section with Motion */}
      <Box px={6} py={16} bg="white">
        <Heading size="lg" textAlign="center" mb={10} color="gray.700">
          Meet Our Team Members
        </Heading>

        <Flex wrap="wrap" justify="center" gap={6}>
          {teamMembers.map((member, idx) => (
            <MotionBox
              key={idx}
              flexBasis={{ base: "100%", sm: "48%", md: "22%" }}
              maxW="270px"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <SocialProfileSimple
                name={member.name}
                username={member.role}
                avatar={member.image}
                description={member.description}
                badges={member.badges}
                linkedin={member.linkedin}
              />
            </MotionBox>
          ))}
        </Flex>
      </Box>

      <Footer />
    </Box>
  );
};

export default AboutUsPage;
