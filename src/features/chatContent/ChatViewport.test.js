import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import ChatViewport from './ChatViewport';

test('keeps navigation outside the constrained chat area', () => {
  render(<ChakraProvider><ChatViewport navigation={<nav>Navigation</nav>}><div>Conversation</div></ChatViewport></ChakraProvider>);
  const chat = screen.getByRole('main', {name: 'Chat'});
  expect(chat).toHaveTextContent('Conversation');
  expect(chat).not.toContainElement(screen.getByRole('navigation'));
  expect(getComputedStyle(chat).overflow).toBe('hidden');
  expect(parseFloat(getComputedStyle(chat).minHeight)).toBe(0);
});
