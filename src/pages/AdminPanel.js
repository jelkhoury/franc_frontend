import React, { useState } from 'react';
import {

Box,
Button,
Heading,
Flex,
List,
ListItem,
Text,
Divider,
} from '@chakra-ui/react';

import ManageUsers from '../components/Admin/ManageUsers';
import ManageMockInterviews from '../components/Admin/ManageMockInterviews';
import ManageSelfTests from '../components/Admin/ManageSelfTests';

const AdminPanel = () => {
const [selectedTab, setSelectedTab] = useState('users');

return (
    <Flex>
        <Box width="250px" bg="gray.100" p={6} height="100vh">
            <Heading size="md" mb={4}>Admin Menu</Heading>
            <Divider mb={4} />
            <List spacing={3}>
                <ListItem cursor="pointer" _hover={{ color: "blue.500" }} onClick={() => setSelectedTab('users')} fontWeight={selectedTab === 'users' ? 'bold' : 'normal'}>
                    <Text>Manage Users</Text>
                </ListItem>
                <ListItem cursor="pointer" _hover={{ color: "blue.500" }} onClick={() => setSelectedTab('mockInterviews')} fontWeight={selectedTab === 'mockInterviews' ? 'bold' : 'normal'}>
                    <Text>Manage Mock Interviews</Text>
                </ListItem>
                <ListItem cursor="pointer" _hover={{ color: "blue.500" }} onClick={() => setSelectedTab('selfTests')} fontWeight={selectedTab === 'selfTests' ? 'bold' : 'normal'}>
                    <Text>Manage Self-Directed Tests</Text>
                </ListItem>
            </List>
        </Box>
        <Box flex="1" p={8}>
            <Heading mb={6}>Admin Panel</Heading>

            {selectedTab === 'users' && <ManageUsers />}

            {selectedTab === 'mockInterviews' && <ManageMockInterviews />}
            
            {selectedTab === 'selfTests' && <ManageSelfTests />}
        </Box>
    </Flex>
);
};

export default AdminPanel;