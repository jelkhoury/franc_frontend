import React, { useState } from 'react';
import {
  Box,
  Text,
  Heading,
  VStack,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';

const mockInterviews = [
  {
    userName: 'John Doe',
    submissions: [
      { question: 'Tell me about yourself.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { question: 'What are your strengths?', videoUrl: 'https://www.w3schools.com/html/movie.mp4' },
    ],
  },
  {
    userName: 'Jane Smith',
    submissions: [
      { question: 'Why should we hire you?', videoUrl: 'https://www.w3schools.com/html/movie.mp4' },
      { question: 'Describe a challenge you faced.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    ],
  },
];

const ManageMockInterviews = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [questionFilter, setQuestionFilter] = useState('all');

  if (selectedUser) {
    return (
      <Box>
        <Button mb={4} onClick={() => setSelectedUser(null)}>
          ← Back to Interviews
        </Button>
        <Heading size="md" mb={4}>
          {selectedUser.userName}'s Submissions
        </Heading>
        <VStack spacing={6} align="stretch">
          {selectedUser.submissions.map((submission, i) => (
            <Box key={i} p={4} borderWidth="1px" borderRadius="md">
              <Text fontWeight="bold" mb={2}>
                Question: {submission.question}
              </Text>
              <video width="600" controls>
                <source src={submission.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <FormControl mt={4}>
                <FormLabel>Rating (1-5)</FormLabel>
                <Select placeholder="Select rating">
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </Select>
              </FormControl>
              <FormControl mt={4}>
                <FormLabel>Comments</FormLabel>
                <Input placeholder="Add comments" />
              </FormControl>
              <FormControl mt={4}>
                <FormLabel>Recommendation</FormLabel>
                <Select placeholder="Select recommendation">
                  <option value="hire">Hire</option>
                  <option value="maybe">Maybe</option>
                  <option value="noHire">No Hire</option>
                </Select>
              </FormControl>
              <Button colorScheme="green" mt={4}>
                Submit Review
              </Button>
            </Box>
          ))}
        </VStack>
      </Box>
    );
  }

  const filteredUsers = mockInterviews.filter(user => {
    const matchesSearch = user.userName.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesFilter = true;
    if (questionFilter === '1') {
      matchesFilter = user.submissions.length === 1;
    } else if (questionFilter === '2+') {
      matchesFilter = user.submissions.length >= 2;
    }
    return matchesSearch && matchesFilter;
  });

  return (
    <VStack align="stretch" spacing={6}>
      <Heading size="md">Submitted Interviews</Heading>
      <Box display="flex" gap={4} mb={4}>
        <Input
          placeholder="Search by user name"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <Select
          width="150px"
          value={questionFilter}
          onChange={e => setQuestionFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="1">1 question</option>
          <option value="2+">2+ questions</option>
        </Select>
      </Box>
      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>User Name</Th>
              <Th>Number of Questions</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredUsers.map((user, index) => (
              <Tr key={index}>
                <Td fontWeight="bold">{user.userName}</Td>
                <Td>{user.submissions.length}</Td>
                <Td>
                  <Button colorScheme="blue" onClick={() => setSelectedUser(user)}>
                    Review
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </VStack>
  );
};

export default ManageMockInterviews;