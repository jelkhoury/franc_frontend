import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Textarea
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [overallComment, setOverallComment] = useState('');

  // Review state per question (can be enhanced with more fields and real save)
  const [reviews, setReviews] = useState({});

  useEffect(() => {
    if (selectedUser) {
      setCurrentQuestionIndex(0);
      setShowSummary(false);
      setReviews({});
      setOverallComment('');
    }
  }, [selectedUser]);

  if (selectedUser) {
    if (showSummary) {
      return (
        <Box>
          <Button size="sm" mb={2} onClick={() => {
            setShowSummary(false);
            setCurrentQuestionIndex(selectedUser.submissions.length - 1);
          }}>
            ← Back to Last Question
          </Button>
          <Text fontWeight="bold" mb={4}>
            Summary of Reviews for {selectedUser.userName}
          </Text>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>#</Th>
                <Th>Question</Th>
                <Th>Your Rating</Th>
                <Th>Your Comments</Th>
                <Th>Your Recommendation</Th>
                <Th>Edit</Th>
              </Tr>
            </Thead>
            <Tbody>
              {selectedUser.submissions.map((submission, i) => {
                const review = reviews[i] || {};
                return (
                  <Tr key={i}>
                    <Td>{i + 1}</Td>
                    <Td>{submission.question}</Td>
                    <Td>{review.rating || '-'}</Td>
                    <Td>{review.comments || '-'}</Td>
                    <Td>{review.recommendation || '-'}</Td>
                    <Td>
                      <Button
                        size="xs"
                        onClick={() => {
                          setCurrentQuestionIndex(i);
                          setShowSummary(false);
                        }}
                      >
                        Edit
                      </Button>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
          <FormControl mt={6}>
            <FormLabel>Overall Comment</FormLabel>
            <Textarea
              placeholder="Enter overall comments..."
              value={overallComment}
              onChange={e => setOverallComment(e.target.value)}
              minHeight="100px"
            />
          </FormControl>
          <Button mt={4} colorScheme="green" onClick={() => {
            // Here you can add a final submission handler if needed
            setSelectedUser(null);
          }}>
            Finish Review
          </Button>
        </Box>
      );
    }

    const currentSubmission = selectedUser.submissions[currentQuestionIndex];
    const currentReview = reviews[currentQuestionIndex] || {};

    const updateReview = (field, value) => {
      setReviews(prev => ({
        ...prev,
        [currentQuestionIndex]: {
          ...prev[currentQuestionIndex],
          [field]: value,
        },
      }));
    };

    const onNext = () => {
      if (currentQuestionIndex === selectedUser.submissions.length - 1) {
        setShowSummary(true);
      } else {
        setCurrentQuestionIndex(i => i + 1);
      }
    };

    const onPrevious = () => {
      if (showSummary) {
        setShowSummary(false);
        setCurrentQuestionIndex(selectedUser.submissions.length - 1);
      } else if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(i => i - 1);
      }
    };

    return (
      <Box>
        <Button size="sm" mb={2} onClick={() => setSelectedUser(null)}>
          ← Back to Interviews
        </Button>
        <Box p={4} borderWidth="1px" borderRadius="md">
          <Text fontWeight="bold" mb={2}>
            Question {currentQuestionIndex + 1} of {selectedUser.submissions.length}: {currentSubmission.question}
          </Text>
          <Box display="flex" justifyContent="center" my={2}>
            <video width="600" controls>
              <source src={currentSubmission.videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </Box>
          <FormControl mt={4}>
            <FormLabel>Rating (1-5)</FormLabel>
            <Select
              placeholder="Select rating"
              value={currentReview.rating || ''}
              onChange={e => updateReview('rating', e.target.value)}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </Select>
          </FormControl>
          <FormControl mt={4}>
            <FormLabel>Comments</FormLabel>
            <Input
              placeholder="Add comments"
              value={currentReview.comments || ''}
              onChange={e => updateReview('comments', e.target.value)}
            />
          </FormControl>
          <FormControl mt={4}>
            <FormLabel>Recommendation</FormLabel>
            <Select
              placeholder="Select recommendation"
              value={currentReview.recommendation || ''}
              onChange={e => updateReview('recommendation', e.target.value)}
            >
              <option value="hire">Hire</option>
              <option value="maybe">Maybe</option>
              <option value="noHire">No Hire</option>
            </Select>
          </FormControl>
          <Box mt={6} display="flex" justifyContent="space-between" alignItems="center">
            <Button onClick={onPrevious} isDisabled={currentQuestionIndex === 0}>
              ← Previous
            </Button>
            <Button colorScheme="green" onClick={onNext}>
              {currentQuestionIndex === selectedUser.submissions.length - 1 ? 'Summary →' : 'Next →'}
            </Button>
          </Box>
        </Box>
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