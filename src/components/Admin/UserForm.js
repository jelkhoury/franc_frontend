import React from "react";
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  NumberInput,
  NumberInputField,
} from "@chakra-ui/react";

const UserForm = ({ formData, setFormData, isEdit = false }) => {
  return (
    <VStack spacing={4} align="stretch">
      <FormControl isRequired>
        <FormLabel>First Name</FormLabel>
        <Input
          placeholder="Enter first name"
          value={formData.firstName}
          onChange={(e) =>
            setFormData({ ...formData, firstName: e.target.value })
          }
        />
      </FormControl>

      <FormControl isRequired>
        <FormLabel>Last Name</FormLabel>
        <Input
          placeholder="Enter last name"
          value={formData.lastName}
          onChange={(e) =>
            setFormData({ ...formData, lastName: e.target.value })
          }
        />
      </FormControl>

      <FormControl isRequired>
        <FormLabel>Email</FormLabel>
        <Input
          type="email"
          placeholder="Enter email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </FormControl>

      <FormControl isRequired={!isEdit}>
        <FormLabel>Password {isEdit && "(leave blank to keep current)"}</FormLabel>
        <Input
          type="password"
          placeholder={isEdit ? "Enter new password (optional)" : "Enter password"}
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
        />
      </FormControl>

      <FormControl isRequired>
        <FormLabel>Role</FormLabel>
        <Select
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
        >
          <option value="User">User</option>
          <option value="Admin">Admin</option>
        </Select>
      </FormControl>

      <FormControl display="flex" alignItems="center">
        <FormLabel mb={0}>Can Do Mock Interview</FormLabel>
        <Switch
          isChecked={formData.canDoMockInterview}
          onChange={(e) =>
            setFormData({
              ...formData,
              canDoMockInterview: e.target.checked,
            })
          }
        />
      </FormControl>

      <FormControl>
        <FormLabel>Mock Attempts</FormLabel>
        <NumberInput
          value={formData.mockAttempts}
          onChange={(valueString) =>
            setFormData({
              ...formData,
              mockAttempts: parseInt(valueString) || 0,
            })
          }
          min={0}
        >
          <NumberInputField />
        </NumberInput>
      </FormControl>
    </VStack>
  );
};

export default UserForm;

