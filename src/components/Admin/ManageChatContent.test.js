import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ManageChatContent from './ManageChatContent';
import { get, post } from '../../utils/httpServices';

jest.mock('../../utils/httpServices', () => ({get: jest.fn(), post: jest.fn(), put: jest.fn()}));
beforeEach(() => {
  jest.clearAllMocks();
  get.mockResolvedValue({items: [], total: 0});
  post.mockResolvedValue({id: 1});
});
test('admin creates an event with dates converted from its timezone', async () => {
  render(<ChakraProvider><ManageChatContent type="event"/></ChakraProvider>);
  await screen.findByText('No events found. Add one to get started.');
  fireEvent.click(screen.getByRole('button', {name: 'Add event'}));
  fireEvent.change(screen.getByLabelText(/Name/), {target: {value: 'Robotics workshop'}});
  fireEvent.change(screen.getByLabelText(/Description/), {target: {value: 'Build a robot with the engineering faculty.'}});
  fireEvent.change(screen.getByLabelText(/Starts at/), {target: {value: '2026-11-10T10:30'}});
  fireEvent.change(screen.getByLabelText(/Publication/), {target: {value: 'published'}});
  fireEvent.click(screen.getByRole('button', {name: 'Save event'}));
  await waitFor(() => expect(post).toHaveBeenCalledWith('/api/chat-content/event', expect.objectContaining({
    name: 'Robotics workshop', status: 'published', startsAt: '2026-11-10T08:30:00.000Z', timeZone: 'Asia/Beirut',
  })));
});
test('failed saves keep the form open and explain the error', async () => {
  post.mockRejectedValue(new Error('This record changed. Reload before saving.'));
  render(<ChakraProvider><ManageChatContent type="survey"/></ChakraProvider>);
  await screen.findByText('No surveys found. Add one to get started.');
  fireEvent.click(screen.getByRole('button', {name: 'Add survey'}));
  fireEvent.change(screen.getByLabelText(/Name/), {target: {value: 'Feedback'}});
  fireEvent.change(screen.getByLabelText(/Description/), {target: {value: 'Your feedback'}});
  fireEvent.change(screen.getByLabelText(/Survey URL/), {target: {value: 'https://example.org/form'}});
  fireEvent.click(screen.getByRole('button', {name: 'Save survey'}));
  expect(await screen.findByText('This record changed. Reload before saving.')).toBeInTheDocument();
  expect(screen.getByLabelText(/Survey URL/)).toHaveValue('https://example.org/form');
});
