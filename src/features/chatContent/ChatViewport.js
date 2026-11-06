import React, { useEffect, useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';

// The navbar and composer share one viewport; only the transcript scrolls.
export default function ChatViewport({ navigation, children }) {
  const [height, setHeight] = useState(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    const resize = () => setHeight(viewport?.height || window.innerHeight);
    resize();
    viewport?.addEventListener('resize', resize);
    window.addEventListener('resize', resize);
    return () => {
      viewport?.removeEventListener('resize', resize);
      window.removeEventListener('resize', resize);
    };
  }, []);
  return <Flex position="fixed" inset={0} h={height ? `${height}px` : '100dvh'} maxH="100dvh" direction="column" overflow="hidden">
    <Box flexShrink={0}>{navigation}</Box>
    <Box as="main" aria-label="Chat" flex="1" minH={0} overflow="hidden">{children}</Box>
  </Flex>;
}
