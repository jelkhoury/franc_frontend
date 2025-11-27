import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Input,
  Heading,
  VStack,
  HStack,
  useToast,
  Spinner,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Flex,
} from "@chakra-ui/react";
import { get, post, put, del } from "../../utils/httpServices";
import { USER_ENDPOINTS } from "../../services/apiService";
import UserForm from "./UserForm";
import UserTable from "./UserTable";
import UserCardList from "./UserCardList";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [editingUser, setEditingUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  // Modal controls
  const {
    isOpen: isAddOpen,
    onOpen: onAddOpen,
    onClose: onAddClose,
  } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "User",
    canDoMockInterview: true,
    mockAttempts: 0,
  });

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const data = await get(USER_ENDPOINTS.GET_ALL_USERS, { token });
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.message);
      toast({
        title: "Error loading users",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "User",
      canDoMockInterview: true,
      mockAttempts: 0,
    });
    onAddOpen();
  };

  const handleEditUser = (user) => {
    // Split fullName into firstName and lastName
    const nameParts = user.fullName.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    setEditingUser(user);
    setFormData({
      firstName,
      lastName,
      email: user.email,
      password: "", // Don't pre-fill password
      role: user.role,
      canDoMockInterview: user.canDoMockInterview,
      mockAttempts: user.mockAttempts || 0,
    });
    onEditOpen();
  };

  const handleDeleteUser = (user) => {
    setDeleteUser(user);
    onDeleteOpen();
  };

  const submitAddUser = async () => {
    if (isSubmitting) return;
    
    try {
      if (!formData.email || !formData.password) {
        toast({
          title: "Validation Error",
          description: "Email and password are required",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      const result = await post(USER_ENDPOINTS.ADD_USER, formData, { token });

      toast({
        title: "Success",
        description: result.message || "User added successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onAddClose();
      fetchUsers();
    } catch (err) {
      console.error("Error adding user:", err);
      toast({
        title: "Error",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitEditUser = async () => {
    if (isSubmitting) return;
    
    try {
      if (!formData.email) {
        toast({
          title: "Validation Error",
          description: "Email is required",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      // Only include password if it's provided
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }

      const result = await put(
        USER_ENDPOINTS.UPDATE_USER(editingUser.id),
        updateData,
        { token }
      );

      toast({
        title: "Success",
        description: result.message || "User updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onEditClose();
      fetchUsers();
    } catch (err) {
      console.error("Error updating user:", err);
      toast({
        title: "Error",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      const token = localStorage.getItem("token");
      const result = await del(USER_ENDPOINTS.DELETE_USER(deleteUser.id), {
        token,
      });

      toast({
        title: "Success",
        description: result.message || "User deleted successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onDeleteClose();
      setDeleteUser(null);
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      toast({
        title: "Error",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.fullName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    });
  }, [users, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.600">
          Loading users...
        </Text>
      </Box>
    );
  }

  if (error && users.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="red.500" fontSize="lg">
          Error: {error}
        </Text>
        <Button mt={4} colorScheme="blue" onClick={fetchUsers}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Heading color="brand.500" size="lg" mb={6}>
        Manage Users
      </Heading>

      <VStack spacing={4} align="stretch" mb={8}>
        <HStack spacing={2}>
          <Input
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            flex="1"
          />
          <Button colorScheme="blue" onClick={handleAddUser}>
            Add User
          </Button>
        </HStack>
      </VStack>

      <UserTable
        users={paginatedUsers}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
      />

      <UserCardList
        users={paginatedUsers}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Flex justify="space-between" align="center" mt={4} flexWrap="wrap" gap={2}>
          <Text fontSize="sm" color="gray.600">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} of{" "}
            {filteredUsers.length} users
          </Text>
          <HStack spacing={2}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              isDisabled={currentPage === 1}
            >
              Previous
            </Button>
            <HStack spacing={1}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    size="sm"
                    variant={currentPage === pageNum ? "solid" : "outline"}
                    colorScheme={currentPage === pageNum ? "blue" : "gray"}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </HStack>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              isDisabled={currentPage === totalPages}
            >
              Next
            </Button>
          </HStack>
        </Flex>
      )}

      {/* Add User Modal */}
      <Modal isOpen={isAddOpen} onClose={onAddClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New User</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <UserForm
              formData={formData}
              setFormData={setFormData}
              isEdit={false}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddClose} isDisabled={isSubmitting}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={submitAddUser} isLoading={isSubmitting} loadingText="Adding...">
              Add User
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit User</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <UserForm
              formData={formData}
              setFormData={setFormData}
              isEdit={true}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose} isDisabled={isSubmitting}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={submitEditUser} isLoading={isSubmitting} loadingText="Updating...">
              Update User
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={undefined}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete User
            </AlertDialogHeader>

            <AlertDialogBody>
              <Text mb={3}>
                Are you sure you want to delete this user?
              </Text>
              <Text color="gray.600" fontSize="sm">
                This will permanently remove all the user's activity, including answers, SDS results, mock interviews, and evaluation reports.
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button onClick={onDeleteClose} isDisabled={isDeleting}>Cancel</Button>
              <Button
                colorScheme="red"
                onClick={confirmDeleteUser}
                ml={3}
                isLoading={isDeleting}
                loadingText="Deleting..."
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ManageUsers;
