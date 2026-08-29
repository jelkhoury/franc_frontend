import React, { useState } from "react";
import {
  Box,
  SimpleGrid,
  Heading,
  Spinner,
  Center,
  Button,
  HStack,
  Text,
  Alert,
  AlertIcon,
  useColorModeValue,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import AnalyticsHeader from "../components/AnalyticsHeader";
import AnalyticsFilters from "../components/AnalyticsFilters";
import ServiceOverviewCard from "../components/ServiceOverviewCard";
import { AnalyticsErrorState, AnalyticsPageLoader } from "../components/AnalyticsStates";
import { useAnalyticsOverview, useServiceAnalytics } from "../hooks/useAnalytics";
import { getActiveServices, getServiceByKey } from "../constants/serviceRegistry";
import MockInterviewAnalyticsView from "../components/services/MockInterviewAnalyticsView";
import SdsAnalyticsView from "../components/services/SdsAnalyticsView";
import JobComparisonAnalyticsView from "../components/services/JobComparisonAnalyticsView";
import GamificationAnalyticsView from "../components/services/GamificationAnalyticsView";
import GenericServiceAnalyticsView from "../components/services/GenericServiceAnalyticsView";
import { SERVICE_KEYS } from "../constants/serviceRegistry";

function ServiceDetailView({ serviceKey, filters, onFilterChange, onBack }) {
  const service = getServiceByKey(serviceKey);
  const { data, loading, error, reload } = useServiceAnalytics(serviceKey, filters);
  const border = useColorModeValue("gray.200", "gray.600");
  const Icon = service?.icon;

  if (error) return <AnalyticsErrorState message={error} onRetry={reload} />;

  const renderAnalytics = () => {
    if (!data) return null;
    switch (serviceKey) {
      case SERVICE_KEYS.MOCK_INTERVIEW:
        return <MockInterviewAnalyticsView data={data} />;
      case SERVICE_KEYS.SDS:
        return <SdsAnalyticsView data={data} filters={filters} />;
      case SERVICE_KEYS.JOB_COMPARISON:
        return <JobComparisonAnalyticsView data={data} />;
      case SERVICE_KEYS.GAMIFICATION:
        return <GamificationAnalyticsView data={data} />;
      case SERVICE_KEYS.RESUME:
        return <GenericServiceAnalyticsView title="Resume Feedback" data={data} type="resume" />;
      case SERVICE_KEYS.COVER_LETTER:
        return <GenericServiceAnalyticsView title="Cover Letter Feedback" data={data} type="coverLetter" />;
      case SERVICE_KEYS.CHAT:
        return <GenericServiceAnalyticsView title="Franc Chatbot" data={data} type="chat" />;
      case SERVICE_KEYS.JOB_MATCHING:
        return <GenericServiceAnalyticsView title="Job Matching" data={data} type="jobMatching" />;
      default:
        return <Text color="gray.500">Analytics not available for this service.</Text>;
    }
  };

  return (
    <Box>
      <Button
        leftIcon={<ArrowBackIcon />}
        variant="ghost"
        size="sm"
        mb={4}
        onClick={onBack}
        color="brand.500"
      >
        Back to all services
      </Button>

      <Box
        p={5}
        mb={6}
        borderRadius="xl"
        borderWidth="1px"
        borderColor={border}
        bg="gray.50"
      >
        <HStack spacing={3}>
          {Icon && (
            <Box p={3} borderRadius="lg" bg={`${service?.color}20`} color={service?.color} fontSize="xl" lineHeight={0}>
              <Icon />
            </Box>
          )}
          <Box>
            <Heading size="md" color="brand.500">{service?.name}</Heading>
            <Text color="gray.600" fontSize="sm">{service?.description}</Text>
          </Box>
        </HStack>
      </Box>

      <AnalyticsFilters filters={filters} onChange={onFilterChange} showServiceFilter={false} />

      {data?.phase2Note && (
        <Alert status="warning" mb={6} borderRadius="lg" fontSize="sm">
          <AlertIcon />
          {data.phase2Note}
        </Alert>
      )}

      {loading ? (
        <Center py={16}><Spinner size="lg" color="brand.500" thickness="3px" /></Center>
      ) : (
        renderAnalytics()
      )}
    </Box>
  );
}

export default function ServicesPage({ filters, onFilterChange, initialServiceKey, onServiceChange }) {
  const [selectedService, setSelectedService] = useState(initialServiceKey || null);
  const { data: overview, loading } = useAnalyticsOverview(filters);

  const handleSelect = (key) => {
    setSelectedService(key);
    onServiceChange?.(key);
  };

  const handleBack = () => {
    setSelectedService(null);
    onServiceChange?.(null);
  };

  if (selectedService) {
    return (
      <ServiceDetailView
        serviceKey={selectedService}
        filters={filters}
        onFilterChange={onFilterChange}
        onBack={handleBack}
      />
    );
  }

  return (
    <Box>
      <AnalyticsHeader
        title="Service Analytics"
        subtitle="Detailed performance and usage metrics for each Franc service."
      />

      <AnalyticsFilters filters={filters} onChange={onFilterChange} />

      {loading && !overview ? (
        <AnalyticsPageLoader label="Loading services..." />
      ) : (
        <>
          <Heading size="sm" mb={4} color="gray.700">
            All Services
          </Heading>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing={4} mb={8}>
            {(overview?.serviceUsage || getActiveServices().map((s) => ({
              serviceKey: s.key,
              serviceName: s.name,
              uniqueUsers: 0,
              activities: 0,
              completed: 0,
              completionRate: 0,
              activitySharePercent: 0,
            }))).map((item) => (
              <ServiceOverviewCard key={item.serviceKey} item={item} onClick={handleSelect} />
            ))}
          </SimpleGrid>
        </>
      )}
    </Box>
  );
}
