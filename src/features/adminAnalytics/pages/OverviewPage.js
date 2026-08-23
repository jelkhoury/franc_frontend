import React, { useMemo } from "react";
import {
  Box,
  Heading,
  SimpleGrid,
  Spinner,
  Center,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaUsers, FaChartLine, FaCheckCircle, FaTrophy } from "react-icons/fa";
import AnalyticsHeader from "../components/AnalyticsHeader";
import AnalyticsFilters from "../components/AnalyticsFilters";
import KpiCard, { KpiGrid } from "../components/KpiCard";
import ActivityTrendChart from "../components/ActivityTrendChart";
import ServiceUsageChart from "../components/ServiceUsageChart";
import ServiceOverviewCard from "../components/ServiceOverviewCard";
import RecentActivityTable from "../components/RecentActivityTable";
import { AnalyticsErrorState, AnalyticsLoadingGrid, AnalyticsPageLoader } from "../components/AnalyticsStates";
import {
  useAnalyticsOverview,
  useActivityTrend,
  useRecentActivity,
} from "../hooks/useAnalytics";

export default function OverviewPage({ filters, onFilterChange, onNavigateService, onNavigateUser }) {
  const recentFilters = useMemo(
    () => ({ ...filters, pageSize: 8 }),
    [filters]
  );

  const { data: overview, loading: overviewLoading, error: overviewError, reload: reloadOverview } = useAnalyticsOverview(filters);
  const { data: trend, loading: trendLoading } = useActivityTrend(filters);
  const { data: recent, loading: recentLoading } = useRecentActivity(recentFilters);

  const border = useColorModeValue("gray.200", "gray.600");
  const isInitialLoad = overviewLoading && !overview;

  if (overviewError) {
    return <AnalyticsErrorState message={overviewError} onRetry={reloadOverview} />;
  }

  return (
    <Box>
      <AnalyticsHeader
        title="Franc Analytics"
        subtitle="Monitor platform usage, service engagement and user outcomes."
      />

      <AnalyticsFilters
        filters={filters}
        onChange={onFilterChange}
        showGroupBy
      />

      {isInitialLoad ? (
        <AnalyticsPageLoader />
      ) : (
        <>
      {overviewLoading ? (
        <AnalyticsLoadingGrid count={6} />
      ) : overview ? (
        <KpiGrid>
          <KpiCard label="Total Users" value={overview.totalUsers} icon={<FaUsers />} />
          <KpiCard label="Active Users" value={overview.activeUsers} helpText="In selected period" icon={<FaUsers />} />
          <KpiCard label="Total Activities" value={overview.totalActivities} icon={<FaChartLine />} />
          <KpiCard label="Completed Activities" value={overview.completedActivities} icon={<FaCheckCircle />} />
          <KpiCard label="Completion Rate" value={overview.completionRate} format="percent" />
          <KpiCard
            label="Most Used Service"
            value={overview.mostUsedService?.serviceName ?? "—"}
            helpText={overview.mostUsedService ? `${overview.mostUsedService.activityCount} activities` : undefined}
            format="text"
            icon={<FaTrophy />}
            isClickable={!!overview.mostUsedService}
            onClick={() => onNavigateService?.(overview.mostUsedService?.serviceKey)}
          />
        </KpiGrid>
      ) : null}

      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={6} mb={8}>
        <Box p={5} borderRadius="xl" borderWidth="1px" borderColor={border} minH="420px">
          <Heading size="sm" mb={4} color="gray.700">
            Activity Over Time
          </Heading>
          {trendLoading ? (
            <Center h="320px"><Spinner color="brand.500" size="lg" thickness="3px" /></Center>
          ) : (
            <ActivityTrendChart data={trend} />
          )}
        </Box>

        <Box p={5} borderRadius="xl" borderWidth="1px" borderColor={border} minH="460px">
          <Heading size="sm" mb={4} color="gray.700">
            Service Usage
          </Heading>
          {overviewLoading ? (
            <Center h="360px"><Spinner color="brand.500" size="lg" thickness="3px" /></Center>
          ) : (
            <ServiceUsageChart
              data={overview?.serviceUsage}
              onBarClick={onNavigateService}
            />
          )}
        </Box>
      </SimpleGrid>

      {overview?.serviceUsage && (
        <>
          <Heading size="sm" mb={4} color="gray.700">
            Service Overview
          </Heading>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing={4} mb={8}>
            {overview.serviceUsage.map((item) => (
              <ServiceOverviewCard key={item.serviceKey} item={item} onClick={onNavigateService} />
            ))}
          </SimpleGrid>
        </>
      )}

      <Box p={5} borderRadius="xl" borderWidth="1px" borderColor={border}>
        <Heading size="sm" mb={4} color="gray.700">
          Recent Activity
        </Heading>
        {recentLoading ? (
          <Center py={8}><Spinner color="brand.500" size="lg" thickness="3px" /></Center>
        ) : (
          <RecentActivityTable
            items={recent?.items}
            onUserClick={onNavigateUser}
          />
        )}
      </Box>
        </>
      )}
    </Box>
  );
}
