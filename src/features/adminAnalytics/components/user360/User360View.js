import React, { useState, useRef, useCallback, useMemo } from "react";
import { Box, SimpleGrid, Text, VStack } from "@chakra-ui/react";
import User360Hero, { User360StatsBar } from "./User360Hero";
import User360Orbit from "./User360Orbit";
import User360Timeline from "./User360Timeline";
import { getActiveProfileServices } from "./user360.utils";
import { SERVICE_KEYS } from "../../constants/serviceRegistry";
import MockInterviewUserSection from "./MockInterviewUserSection";
import SdsUserSection from "./SdsUserSection";
import JobComparisonUserSection from "./JobComparisonUserSection";
import GamificationUserSection from "./GamificationUserSection";
import GenericServiceUserSection from "./GenericServiceUserSection";

export default function User360View({ profile }) {
  const [highlightedService, setHighlightedService] = useState(null);
  const servicesRef = useRef(null);

  const activeServices = useMemo(
    () => getActiveProfileServices(profile?.services),
    [profile?.services]
  );

  const handleOrbitClick = useCallback((serviceKey) => {
    setHighlightedService(serviceKey);
    const el = document.getElementById(`user360-service-${serviceKey}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  if (!profile) return null;

  const { summary, services } = profile;

  return (
    <Box bg="gray.50" minH="100%">
      <User360Hero profile={profile} />
      <User360StatsBar summary={summary} />

      <Box px={{ base: 4, md: 6 }} py={6}>
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
          <User360Orbit
            activeServices={activeServices}
            onServiceClick={handleOrbitClick}
            selectedServiceKey={highlightedService}
          />
          <User360Timeline items={profile.recentActivity} />
        </SimpleGrid>

        <Box ref={servicesRef}>
          <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={4}>
            Service Deep Dive
          </Text>
          <VStack align="stretch" spacing={4}>
            {services.mockInterview && (
              <MockInterviewUserSection
                data={services.mockInterview}
                serviceKey={SERVICE_KEYS.MOCK_INTERVIEW}
                isHighlighted={highlightedService === SERVICE_KEYS.MOCK_INTERVIEW}
              />
            )}
            {services.sds && (
              <SdsUserSection
                data={services.sds}
                serviceKey={SERVICE_KEYS.SDS}
                isHighlighted={highlightedService === SERVICE_KEYS.SDS}
              />
            )}
            {services.jobComparison && (
              <JobComparisonUserSection
                data={services.jobComparison}
                serviceKey={SERVICE_KEYS.JOB_COMPARISON}
                isHighlighted={highlightedService === SERVICE_KEYS.JOB_COMPARISON}
              />
            )}
            {services.gamification && (
              <GamificationUserSection
                data={services.gamification}
                serviceKey={SERVICE_KEYS.GAMIFICATION}
                isHighlighted={highlightedService === SERVICE_KEYS.GAMIFICATION}
              />
            )}
            {services.resume && (
              <GenericServiceUserSection
                title="Resume Feedback"
                data={services.resume}
                type="resume"
                serviceKey={SERVICE_KEYS.RESUME}
                isHighlighted={highlightedService === SERVICE_KEYS.RESUME}
              />
            )}
            {services.coverLetter && (
              <GenericServiceUserSection
                title="Cover Letter Feedback"
                data={services.coverLetter}
                type="coverLetter"
                serviceKey={SERVICE_KEYS.COVER_LETTER}
                isHighlighted={highlightedService === SERVICE_KEYS.COVER_LETTER}
              />
            )}
            {services.chat && (
              <GenericServiceUserSection
                title="Franc Chatbot"
                data={services.chat}
                type="chat"
                serviceKey={SERVICE_KEYS.CHAT}
                isHighlighted={highlightedService === SERVICE_KEYS.CHAT}
              />
            )}
            {services.jobMatching && (
              <GenericServiceUserSection
                title="Job Matching"
                data={services.jobMatching}
                type="jobMatching"
                serviceKey={SERVICE_KEYS.JOB_MATCHING}
                isHighlighted={highlightedService === SERVICE_KEYS.JOB_MATCHING}
              />
            )}
          </VStack>

          {activeServices.length === 0 && (
            <Box py={12} textAlign="center" color="gray.500" fontSize="sm">
              This user hasn&apos;t started any Franc services yet.
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
