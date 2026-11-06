import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import Chatting from './Chatting';

jest.mock('../../utils/httpServices', () => ({post: jest.fn()}));
jest.mock('../../utils/sentryUtils', () => ({captureError: jest.fn()}));

test('lets the reader return to latest messages without scrolling the page', () => {
  render(<ChakraProvider><Chatting/></ChakraProvider>);
  const history = screen.getByRole('log', {name: 'Conversation'});
  Object.defineProperties(history, {scrollHeight: {value: 1000, configurable: true}, clientHeight: {value: 200, configurable: true}, scrollTop: {value: 100, writable: true, configurable: true}});
  fireEvent.scroll(history);
  fireEvent.click(screen.getByRole('button', {name: /Latest messages/i}));
  expect(history.scrollTop).toBe(1000);
  expect(screen.queryByRole('button', {name: /Latest messages/i})).not.toBeInTheDocument();
  expect(screen.getByRole('textbox', {name: 'Message'})).toBeVisible();
});

test('incoming text does not pull the reader away from older messages', async () => {
  const { post } = require('../../utils/httpServices');
  let finish;
  post.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  render(<ChakraProvider><Chatting/></ChakraProvider>);
  const history = screen.getByRole('log', {name: 'Conversation'});
  Object.defineProperties(history, {scrollHeight: {value: 1000, configurable: true}, clientHeight: {value: 200, configurable: true}, scrollTop: {value: 800, writable: true, configurable: true}});
  fireEvent.change(screen.getByRole('textbox', {name: 'Message'}), {target: {value: 'Hello'}});
  fireEvent.click(screen.getByRole('button', {name: 'Send'}));
  history.scrollTop = 100;
  fireEvent.scroll(history);
  const { act } = require('@testing-library/react');
  await act(async () => finish({response: 'Reply', links: []}));
  await screen.findByText('Reply');
  expect(history.scrollTop).toBe(100);
  expect(screen.getByRole('button', {name: /Latest messages/i})).toBeVisible();
});
