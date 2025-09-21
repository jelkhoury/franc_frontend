import {
  Box,
  Container,
  Flex,
  Heading,
  Icon,
  Stack,
  Text,
  useColorModeValue,
  Image,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import {
  FcAssistant,
  FcCollaboration,
  FcManager,
  FcDonate,
} from 'react-icons/fc';

const MotionBox = motion(Box);

const services = [
  {
    heading: 'Job comparison',
    description: 'Try the shoes before you choose the path.',
    gif:"/assets/images/comparison.gif",
  },
  {
    heading: 'Job Matchmaking',
    description: 'The right key opens the right door.',
    gif:"/assets/images/job_matching.gif",
  },
  {
    heading: 'Values and Interests',
    description: 'Choose a job you love and you will never have to work a day in your life.',
    gif:"/assets/images/values.gif",
  },
  {
    heading: 'Gamification',
    description: 'Level up your skills, level up your future.',
    gif:"/assets/images/gamification.gif",
  },
];

const ServiceCard = ({ heading, description, icon, gif }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const frontBg = useColorModeValue('gray.50', 'gray.700');

  return (
    <Box
      w={{ base: '100%', sm: '47%', md: '300px' }}
      h="250px"
      // ensure perspective is applied at the parent level
      sx={{ perspective: '1000px' }}
      cursor="pointer"
    >
      <Box
        position="relative"
        w="100%"
        h="100%"
        transition="transform 0.6s"
        sx={{ transformStyle: 'preserve-3d' }}
        _hover={{ transform: 'rotateY(180deg)' }}
      >
        {/* Front Side */}
        <Box
          position="absolute"
          inset={0}
          bg={cardBg}
          borderRadius="lg"
          boxShadow="md"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          p={6}
          zIndex={2}
          // ✅ make sure the front face is truly front-facing and hidden when flipped
          sx={{
            transform: 'rotateY(0deg)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <Flex
            w={32}
            h={32}
            align="center"
            justify="center"
            rounded="full"
            bg={frontBg}
            mb={3}
            overflow="hidden"
          >
            {gif ? (
              <Image src={gif} alt={heading} boxSize="96px" objectFit="contain" />
            ) : (
              <Icon as={icon} w={10} h={10} />
            )}
          </Flex>
          <Heading size="md" textAlign="center">
            {heading}
          </Heading>
        </Box>

        {/* Back Side */}
        <Box
          position="absolute"
          inset={0}
          bg={cardBg}
          borderRadius="lg"
          boxShadow="md"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={6}
          // ✅ rotate the back so it faces correctly after parent rotates
          sx={{
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <Text fontSize="large" color="gray.600" textAlign="center">
            {description}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

const ComingSoonServices = () => (
  <Box py={20} px={6} bg={useColorModeValue('gray.50', 'gray.900')}>
      <Stack spacing={4} as={Container} maxW="4xl" textAlign="center" mb={12}>
      {/* Avatar Image */}
      <Box display="flex" justifyContent="center">
        <Image
          src="/assets/images/Ratatouille.png" // 🔥 replace with your image path
          alt="Cooking Avatar"
          boxSize="150px"
          borderRadius="md"       // ✅ makes it fully rounded
          objectFit="cover"
          shadow="md"
        />
      </Box>

      <Heading fontSize={{ base: '2xl', sm: '4xl' }} fontWeight="bold" mt={4}>
        Something is Cooking
      </Heading>

      <Text color="gray.600" fontSize={{ base: 'sm', sm: 'lg' }}>
        Upcoming items on the menu.
      </Text>
    </Stack>


    <Container maxW="100%">
      <Flex flexWrap="wrap" justify="center" gap={6} w="100%">
        {services.map((service, idx) => (
          <ServiceCard key={idx} {...service} />
        ))}
      </Flex>
    </Container>
  </Box>
);

export default ComingSoonServices;
