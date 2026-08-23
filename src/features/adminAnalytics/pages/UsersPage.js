import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Spinner,
  Center,
  useDisclosure,
  IconButton,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import AnalyticsHeader from "../components/AnalyticsHeader";
import UserExplorer from "../components/UserExplorer";
import User360View from "../components/user360/User360View";
import { AnalyticsErrorState, AnalyticsPageLoader } from "../components/AnalyticsStates";
import { useUserSummaries, useUserProfile } from "../hooks/useAnalytics";

export default function UsersPage({ filters, onFilterChange, initialUserId, onUserChange }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const userFilters = useMemo(
    () => ({
      ...filters,
      search: filters.search,
      page: filters.page || 1,
      pageSize: filters.pageSize || 10,
    }),
    [filters]
  );

  const { data: usersData, loading: usersLoading, error: usersError, reload } = useUserSummaries(userFilters);

  const { data: profile, loading: profileLoading, error: profileError } = useUserProfile(
    selectedUser?.userId
  );

  const openUser360 = (user) => {
    setSelectedUser(user);
    onUserChange?.(user.userId);
    onOpen();
  };

  useEffect(() => {
    if (!initialUserId || !usersData?.items?.length) return;
    const user = usersData.items.find((u) => String(u.userId) === String(initialUserId));
    if (user) openUser360(user);
  }, [initialUserId, usersData?.items]);

  const handleSearchChange = (search) => {
    onFilterChange({ search, page: 1 });
  };

  const handlePageChange = (page) => {
    onFilterChange({ page });
  };

  if (usersError) {
    return <AnalyticsErrorState message={usersError} onRetry={reload} />;
  }

  return (
    <Box>
      <AnalyticsHeader
        title="User Activity Explorer"
        subtitle="Search users and inspect their complete Franc journey across all services."
      />

      {usersLoading && !usersData ? (
        <AnalyticsPageLoader label="Loading users..." />
      ) : (
        <UserExplorer
          users={usersData?.items}
          loading={usersLoading}
          search={filters.search || ""}
          onSearchChange={handleSearchChange}
          onUserSelect={openUser360}
          page={usersData?.page || 1}
          totalPages={usersData?.totalPages || 1}
          onPageChange={handlePageChange}
        />
      )}

      <Drawer isOpen={isOpen} onClose={onClose} size="full" placement="right">
        <DrawerOverlay bg="blackAlpha.600" />
        <DrawerContent maxW={{ base: "100%", lg: "900px" }} ml="auto" bg="gray.50">
          <IconButton
            icon={<CloseIcon />}
            aria-label="Close 360 view"
            position="absolute"
            top={4}
            right={4}
            zIndex={10}
            size="sm"
            borderRadius="full"
            bg="whiteAlpha.900"
            _hover={{ bg: "white" }}
            onClick={onClose}
          />
          <DrawerCloseButton display="none" />
          <DrawerBody p={0} overflowY="auto" sx={{ overscrollBehavior: "contain" }}>
            {profileLoading ? (
              <Center py={32} bg="gray.50">
                <Spinner size="xl" color="brand.500" thickness="3px" />
              </Center>
            ) : profileError ? (
              <Box p={8}>
                <AnalyticsErrorState message={profileError} />
              </Box>
            ) : profile ? (
              <User360View profile={profile} />
            ) : (
              <Box p={8}>
                <AnalyticsErrorState message="User not found" />
              </Box>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
