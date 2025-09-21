import {
  Box,
  Heading,
  Text,
  Flex,
  Image,
  Stack,
  SimpleGrid 
} from '@chakra-ui/react';
import Footer from '../components/Footer';
import SocialProfileSimple from '../components/SocialProfileSimple';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const teamMembers = [
  {
    name: "Fouad Abdallah",
    role: "CCD Director – at Antonine University ",
    image: "/assets/images/Fouad.jpg",
    contact: <>fouad.abdallah@ua.edu.lb<br />Ext: 1130</>,
  },
  {
    name: "Elie Najem",
    role: "CCD Coordinator – at Antonine University",
    image: "/assets/images/Elie.jpg",
    contact: <>e.najem@ua.edu.lb<br />Ext: 1131</>,

  },
    {
    name: "Karen Souki",
    role: "CCD Officer – at Antonine University",
    image: "/assets/images/Elie.jpg",
    contact: <>karen.souki@ua.edu.lb<br />Ext: 1133</>,

  },
  {
    name: "Charbel Gemayel",
    role: "Head of CS Department – at Antonine University",
    image: "/assets/images/Charbel.jpg",
    contact: <>c.gemayel@ua.edu.lb<br />Ext: 1100</>,
  },
  {
    name: "Wadih Issa",
    role: "Developer",
    image: "/assets/images/Wadih Issa.jpg",
    contact: "wadih_issa@outlook.com",
    linkedin: "https://www.linkedin.com/in/wadih-issa-6b2a801a8/",
  },
  {
    name: "Rani Hijazi",
    role: "Developer",
    image: "/assets/images/Rani Hijazi.jpg",
    contact: "rani_hijazy@outlook.com",
    linkedin: "https://www.linkedin.com/in/rani-hijazi-903181270/",
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
            src="/assets/images/about_us.gif"
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
              About Franc
            </Heading>

            <Text fontSize="lg" color="gray.600" lineHeight="1.8">
              FRANC is the first digital career advisor in Lebanon, created by the Center for Career Development (CCD) in collaboration with the Department of Computer Science at the Faculty of Engineering and Technology (FET) and its alumni

            </Text>
          </Box>
        </Flex>
      </Box>

      {/* Team Section with Motion */}
      <Box px={6} py={16} bg="white">
        <Heading size="lg" textAlign="center" mb={10} color="gray.700">
          Members
        </Heading>

         <SimpleGrid
            columns={{ base: 1, sm: 2, md: 6 }}  
            spacing={6}
            justifyItems="center"
          >
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
                role={member.role}
                contact={member.contact}
                linkedin={member.linkedin}
              />
            </MotionBox>
          ))}
       </SimpleGrid>
      </Box>

      <Footer />
    </Box>
  );
};

export default AboutUsPage;
