import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  VStack,
  Heading,
  Text,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  HStack,
  Icon,
  Flex,
  Image,
  Link,
  Button,
  useColorModeValue,
} from "@chakra-ui/react";
import { TimeIcon, InfoIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";

/**
 * SDS Onboarding
 * - Matches the UI style in the screenshot: large title, card-like expandable rows, CTA button
 * - First row expands to a YouTube "hero" with a big player and a horizontal scroll of thumbnails
 * - Uses Chakra UI only; expects a YouTube API key in REACT_APP_YOUTUBE_API_KEY
 *
 * Props (all optional):
 * - playlistId: YouTube playlist id to load (preferred)
 * - searchQuery: fallback text to search for if no playlistId provided
 * - maxResults: how many videos to fetch (default 6)
 */
const SdsOnBoarding = ({ playlistId, searchQuery = "RIASEC Holland Code", maxResults = 6, embedSrcs = [] }) => {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [videos, setVideos] = useState([]);
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [selectedEmbedSrc, setSelectedEmbedSrc] = useState(null);
  const apiKey = useMemo(() => process.env.REACT_APP_YOUTUBE_API_KEY, []);
  const navigate = useNavigate();

  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");

  const getYouTubeId = (url) => {
    try {
      const u = new URL(url);
      // Handle /embed/{id}
      const embedMatch = u.pathname.match(/\/embed\/([^/]+)/);
      if (embedMatch && embedMatch[1]) return embedMatch[1];
      // Handle youtu.be/{id}
      if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
      // Handle watch?v=
      const v = u.searchParams.get("v");
      if (v) return v;
    } catch (_) {}
    return null;
  };

  // Fetch videos only when the first item is opened the first time
  useEffect(() => {
    // If explicit embed sources are provided, use them and skip API
    if (activeIndex === 0 && videos.length === 0 && Array.isArray(embedSrcs) && embedSrcs.length > 0) {
      const items = embedSrcs.map((src) => {
        const id = getYouTubeId(src);
        return {
          id,
          title: "",
          thumb: id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : undefined,
          channelTitle: "YouTube",
          embedSrc: src,
        };
      });
      setVideos(items);
      setSelectedEmbedSrc(items[0]?.embedSrc || null);
      setSelectedVideoId(items[0]?.id || null);
      return;
    }

    // Otherwise, fall back to YouTube API when first item is opened
    const shouldFetch = activeIndex === 0 && videos.length === 0 && apiKey;
    if (!shouldFetch) return;

    const fetchVideos = async () => {
      try {
        let url = "";
        if (playlistId) {
          url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${maxResults}&playlistId=${playlistId}&key=${apiKey}`;
        } else {
          const q = encodeURIComponent(searchQuery);
          url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${maxResults}&q=${q}&key=${apiKey}`;
        }
        const res = await fetch(url);
        const data = await res.json();

        const items = (data.items || []).map((it) => {
          const sn = it.snippet || {};
          const videoId = it.contentDetails?.videoId || it.id?.videoId || it.resourceId?.videoId || sn?.resourceId?.videoId;
          const embedSrc = videoId ? `https://www.youtube.com/embed/${videoId}` : null;
          return {
            id: videoId,
            title: sn.title,
            thumb: sn.thumbnails?.medium?.url || sn.thumbnails?.default?.url,
            channelTitle: sn.channelTitle,
            embedSrc,
          };
        }).filter(v => !!v.id);

        setVideos(items);
        if (items.length > 0) {
          setSelectedVideoId(items[0].id);
          setSelectedEmbedSrc(items[0].embedSrc);
        }
      } catch (e) {
        console.error("Failed to load YouTube videos", e);
      }
    };

    fetchVideos();
  }, [activeIndex, videos.length, apiKey, playlistId, searchQuery, maxResults, embedSrcs]);

  return (
    <Box minH="100vh" bgGradient="linear(to-r, white, #ebf8ff)">
      <Box maxW="1000px" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 6, md: 10 }}>
        <Heading textAlign="center" mb={{ base: 6, md: 8 }}>
          About the SDS Assessment
        </Heading>

        <Accordion
          allowToggle
          index={activeIndex}
          onChange={(idx) => {
            // Chakra passes number or array; normalize
            const next = Array.isArray(idx) ? (idx[0] ?? -1) : (typeof idx === "number" ? idx : -1);
            setActiveIndex(next);
          }}
        >
          {/* Item 1: Videos hero */}
          <AccordionItem border="1px" borderColor={cardBorder} rounded="md" bg={cardBg} mb={4}>
            <h2>
              <AccordionButton py={5} px={6} _expanded={{ bg: useColorModeValue("blue.50", "blue.900") }}>
                <HStack spacing={3} flex="1" textAlign="left">
                  <Box
                    boxSize="28px"
                    rounded="full"
                    border="2px"
                    borderColor={useColorModeValue("blue.400", "blue.300")}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {/* Play icon approximation using triangle */}
                    <Box w="0" h="0" borderTop="7px solid transparent" borderBottom="7px solid transparent" borderLeft="12px solid"
                         borderLeftColor={useColorModeValue("blue.500", "blue.300")} ml="2px" />
                  </Box>
                  <Text fontWeight="semibold">View the 6 videos explaining the R.I.A.S.E.C meaning</Text>
                </HStack>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={6} px={{ base: 0, md: 6 }}>
              {/* Hero player */}
              {selectedVideoId || selectedEmbedSrc ? (
                <Box mb={4} rounded="md" overflow="hidden" border="1px" borderColor={cardBorder}>
                  <Box position="relative" pt="56.25%">
                    <Box
                      as="iframe"
                      title="SDS Video"
                      src={selectedEmbedSrc || (selectedVideoId ? `https://www.youtube.com/embed/${selectedVideoId}` : undefined)}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      position="absolute"
                      inset={0}
                      w="100%"
                      h="100%"
                      border={0}
                    />
                  </Box>
                </Box>
              ) : (
                <Text color="gray.500" px={6} py={4}>
                  {apiKey ? "Loading videos…" : "Set REACT_APP_YOUTUBE_API_KEY to load videos."}
                </Text>
              )}

              {/* Horizontal thumbnails */}
              {videos.length > 0 && (
                <Box overflowX="auto" px={{ base: 2, md: 0 }}>
                  <HStack spacing={4} minW="max-content" pb={2}>
                    {videos.map((v) => (
                      <Box
                        key={v.id}
                        role="button"
                        onClick={() => { setSelectedVideoId(v.id); if (v.embedSrc) setSelectedEmbedSrc(v.embedSrc); else if (v.id) setSelectedEmbedSrc(`https://www.youtube.com/embed/${v.id}`); }}
                        borderWidth={selectedVideoId === v.id ? "2px" : "1px"}
                        borderColor={selectedVideoId === v.id ? "blue.400" : cardBorder}
                        rounded="md"
                        overflow="hidden"
                        minW="240px"
                      >
                        <Image src={v.thumb || (v.id ? `https://img.youtube.com/vi/${v.id}/mqdefault.jpg` : undefined)} alt={v.title} w="240px" h="135px" objectFit="cover" />
                        <Box p={3}>
                          <Text noOfLines={2} fontSize="sm" fontWeight="semibold">{v.title}</Text>
                          <HStack spacing={2} mt={1} color="gray.500" fontSize="xs">
                            <Text noOfLines={1}>{v.channelTitle}</Text>
                            <Box as="span">•</Box>
                            <Link href={v.id ? `https://youtu.be/${v.id}` : v.embedSrc} isExternal color="blue.500">
                              Watch on YouTube
                            </Link>
                          </HStack>
                        </Box>
                      </Box>
                    ))}
                  </HStack>
                </Box>
              )}
            </AccordionPanel>
          </AccordionItem>

          {/* Item 2: Brief overview */}
          <AccordionItem border="1px" borderColor={cardBorder} rounded="md" bg={cardBg} mb={4}>
            <h2>
              <AccordionButton py={5} px={6}>
                <HStack spacing={3} flex="1" textAlign="left">
                  <Icon as={InfoIcon} boxSize={5} color={useColorModeValue("blue.500", "blue.300")} />
                  <Text fontWeight="semibold">
                    Brief overview of the test’s 5 sections: each section covers different types of interest (activities, competencies, occupations, etc.)
                  </Text>
                </HStack>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={6} px={6}>
              <VStack align="start" spacing={3}>
                <Text>• Activities</Text>
                <Text>• Competencies</Text>
                <Text>• Occupations</Text>
                <Text>• Self-assessment</Text>
                <Text>• Results & next steps</Text>
              </VStack>
            </AccordionPanel>
          </AccordionItem>

          {/* Item 3: Duration */}
          <AccordionItem border="1px" borderColor={cardBorder} rounded="md" bg={cardBg}>
            <h2>
              <AccordionButton py={5} px={6}>
                <HStack spacing={3} flex="1" textAlign="left">
                  <Icon as={TimeIcon} boxSize={5} color={useColorModeValue("blue.500", "blue.300")} />
                  <Text fontWeight="semibold">Test duration: approximately 20–25 minutes</Text>
                </HStack>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={6} px={6}>
              <Text color="gray.600">
                Set aside around 25 minutes in a quiet place without interruptions. You can pause between sections if needed.
              </Text>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>

        {/* CTA */}
        <Flex justify="center">
          <Button
            mt={8}
            backgroundColor="brand.500"
            color="white"
            size="lg"
            onClick={() => navigate("/self-directed-search/try")}
          >
            Continue
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default SdsOnBoarding;