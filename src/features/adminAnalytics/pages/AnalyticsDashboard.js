import React, { useState } from "react";
import {
  Box,
  Button,
  ButtonGroup,
  useColorModeValue,
} from "@chakra-ui/react";
import { useAnalyticsFilters } from "../hooks/useAnalytics";
import OverviewPage from "./OverviewPage";
import ServicesPage from "./ServicesPage";
import UsersPage from "./UsersPage";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "services", label: "Services" },
  { id: "users", label: "Users" },
];

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedService, setSelectedService] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const { filters, updateFilters } = useAnalyticsFilters("last30days");
  const tabBorder = useColorModeValue("gray.200", "gray.600");

  const handleFilterChange = (patch) => {
    updateFilters(typeof patch === "function" ? patch(filters) : { ...filters, ...patch });
  };

  const navigateToService = (serviceKey) => {
    if (!serviceKey) return;
    setSelectedService(serviceKey);
    setActiveTab("services");
  };

  const navigateToUser = (userId) => {
    if (!userId) return;
    setSelectedUserId(userId);
    setActiveTab("users");
  };

  return (
    <Box maxW="1400px" mx="auto" pb={8}>
      <Box mb={6} pb={4} borderBottomWidth="1px" borderColor={tabBorder}>
        <ButtonGroup size="sm" isAttached variant="outline">
          {TABS.map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              colorScheme={activeTab === tab.id ? "brand" : "gray"}
              variant={activeTab === tab.id ? "solid" : "outline"}
              borderRadius="lg"
            >
              {tab.label}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {activeTab === "overview" && (
        <OverviewPage
          filters={filters}
          onFilterChange={handleFilterChange}
          onNavigateService={navigateToService}
          onNavigateUser={navigateToUser}
        />
      )}

      {activeTab === "services" && (
        <ServicesPage
          filters={filters}
          onFilterChange={handleFilterChange}
          initialServiceKey={selectedService}
          onServiceChange={setSelectedService}
        />
      )}

      {activeTab === "users" && (
        <UsersPage
          filters={filters}
          onFilterChange={handleFilterChange}
          initialUserId={selectedUserId}
          onUserChange={setSelectedUserId}
        />
      )}
    </Box>
  );
}
