import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, AlertIcon, Badge, Box, Button, Checkbox, FormControl, FormLabel, Heading, HStack,
  Input, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  Select, SimpleGrid, Spinner, Stack, Table, TableContainer, Tbody, Td, Text, Textarea, Th, Thead, Tr, useToast,
} from '@chakra-ui/react';
import { get, post, put } from '../../utils/httpServices';
import { CHAT_CONTENT_ENDPOINTS } from '../../services/apiService';
import { buildPayload, formFromRecord } from '../../features/chatContent/contentUtils';

const emptyForm = () => ({name: '', description: '', startsAt: '', endsAt: '', timeZone: 'Asia/Beirut',
  location: '', url: '', status: 'draft', isCancelled: false, eventId: ''});

export default function ManageChatContent({ type }) {
  const survey = type === 'survey';
  const title = survey ? 'Surveys' : 'Events';
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState(null);
  const [search, setSearch] = useState('');
  const load = useCallback(async () => {
    try {
      const data = await get(CHAT_CONTENT_ENDPOINTS.LIST(type), {params: {admin: true, page, pageSize: 20, query: search}});
      setRows(data.items); setTotal(data.total); setError('');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [type, page, search]);
  useEffect(() => { setLoading(true); load(); }, [load]);
  useEffect(() => {
    if (!rows.some(row => row.embeddingStatus === 'pending')) return undefined;
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [load, rows]);
  useEffect(() => {
    if (!survey) return;
    let active = true;
    (async () => {
      try {
        let collected = [], current = 1, count;
        do {
          const data = await get(CHAT_CONTENT_ENDPOINTS.LIST('event'), {params: {admin: true, page: current, pageSize: 100}});
          collected = [...collected, ...data.items]; count = data.total; current += 1;
          if (!data.items.length) break;
        } while (collected.length < count);
        if (active) setEvents(collected);
      } catch (e) { if (active) setError(e.message); }
    })();
    return () => { active = false; };
  }, [survey]);
  const change = (key, value) => setForm(current => ({...current, [key]: value}));
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setFormError('');
    try {
      const payload = buildPayload(form);
      if (form.id) await put(CHAT_CONTENT_ENDPOINTS.ITEM(type, form.id), payload);
      else await post(CHAT_CONTENT_ENDPOINTS.LIST(type), payload);
      setForm(null); await load();
      toast({title: `${survey ? 'Survey' : 'Event'} saved`, status: 'success'});
    } catch (e) { setFormError(e.message); }
    finally { setSaving(false); }
  };
  const retry = async row => {
    try { await post(CHAT_CONTENT_ENDPOINTS.RETRY(type, row.id), {}); await load(); }
    catch (e) { toast({title: 'Could not retry indexing', description: e.message, status: 'error'}); }
  };
  const open = row => { setFormError(''); setForm(row ? formFromRecord(row) : emptyForm()); };
  return <Box>
    <Stack direction={{base: 'column', md: 'row'}} justify="space-between" mb={6} spacing={4}>
      <Box><Heading size="lg" color="brand.500">{title}</Heading>
        <Text mt={2} color="gray.500">{survey ? 'Publish feedback forms and survey links for the chatbot.' : 'Keep the chatbot informed about university events.'}</Text></Box>
      <Button colorScheme="blue" onClick={() => open(null)}>Add {survey ? 'survey' : 'event'}</Button>
    </Stack>
    <HStack mb={4}><Input maxW="400px" aria-label={`Search ${title.toLowerCase()}`} placeholder="Search name or description" value={search} onChange={e => { setPage(1); setSearch(e.target.value); }}/><Button onClick={load}>Refresh</Button></HStack>
    {error && <Alert status="error" mb={4}><AlertIcon/>{error}</Alert>}
    {loading ? <Spinner/> : rows.length === 0 ? <Box borderWidth="1px" borderRadius="lg" p={8}><Text>No {title.toLowerCase()} found. Add one to get started.</Text></Box> :
      <TableContainer borderWidth="1px" borderRadius="lg"><Table size="sm"><Thead><Tr><Th>Name</Th><Th>Publication</Th><Th>Availability</Th><Th>Chatbot index</Th><Th>Actions</Th></Tr></Thead><Tbody>
        {rows.map(row => <Tr key={row.id}><Td py={4}><Text fontWeight="semibold">{row.name}</Text><Text fontSize="xs" color="gray.500">{row.startsAt ? new Date(row.startsAt).toLocaleString(undefined, {timeZone: row.timeZone}) + ` (${row.timeZone})` : 'No opening date'}</Text></Td>
          <Td><Badge colorScheme={row.status === 'published' ? 'green' : 'gray'}>{row.status}</Badge></Td><Td>{row.availability.replace('_', ' ')}</Td>
          <Td><Badge colorScheme={row.embeddingStatus === 'ready' ? 'green' : row.embeddingStatus === 'failed' ? 'red' : 'yellow'}>{row.embeddingStatus}</Badge></Td>
          <Td><HStack><Button size="sm" variant="outline" onClick={() => open(row)}>Edit</Button>{row.embeddingStatus !== 'ready' && <Button size="sm" onClick={() => retry(row)}>Retry index</Button>}</HStack></Td></Tr>)}
      </Tbody></Table></TableContainer>}
    <HStack mt={4} justify="space-between"><Text fontSize="sm">{total} {title.toLowerCase()} · Page {page}</Text><HStack><Button isDisabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button><Button isDisabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</Button></HStack></HStack>
    <Modal isOpen={Boolean(form)} onClose={() => !saving && setForm(null)} size="2xl" scrollBehavior="inside"><ModalOverlay/><ModalContent as="form" onSubmit={save}>
      <ModalHeader>{form?.id ? 'Edit' : 'Add'} {survey ? 'survey' : 'event'}</ModalHeader><ModalCloseButton isDisabled={saving}/><ModalBody>
        {form && <Stack spacing={4}>
          {formError && <Alert status="error"><AlertIcon/>{formError}</Alert>}
          <FormControl isRequired><FormLabel htmlFor="content-name">Name</FormLabel><Input id="content-name" maxLength={200} value={form.name} onChange={e => change('name', e.target.value)}/></FormControl>
          <FormControl isRequired><FormLabel htmlFor="content-description">Description</FormLabel><Textarea id="content-description" rows={5} maxLength={20000} value={form.description} onChange={e => change('description', e.target.value)}/></FormControl>
          <FormControl isRequired><FormLabel htmlFor="content-zone">Timezone</FormLabel><Input id="content-zone" value={form.timeZone} placeholder="Asia/Beirut" onChange={e => change('timeZone', e.target.value)}/><Text fontSize="xs" color="gray.500">Enter all dates below in this timezone.</Text></FormControl>
          <SimpleGrid columns={{base: 1, md: 2}} spacing={4}>
            <FormControl isRequired={!survey}><FormLabel htmlFor="content-start">{survey ? 'Opens at (optional)' : 'Starts at'}</FormLabel><Input id="content-start" type="datetime-local" value={form.startsAt} onChange={e => change('startsAt', e.target.value)}/></FormControl>
            <FormControl><FormLabel htmlFor="content-end">{survey ? 'Closes at (optional)' : 'Ends at (optional)'}</FormLabel><Input id="content-end" type="datetime-local" value={form.endsAt} onChange={e => change('endsAt', e.target.value)}/></FormControl>
          </SimpleGrid>
          {!survey && <FormControl><FormLabel htmlFor="content-location">Location or online meeting details</FormLabel><Input id="content-location" maxLength={500} value={form.location} onChange={e => change('location', e.target.value)}/></FormControl>}
          <FormControl isRequired={survey}><FormLabel htmlFor="content-url">{survey ? 'Survey URL' : 'Registration URL (optional)'}</FormLabel><Input id="content-url" type="url" maxLength={2000} value={form.url} placeholder="https://" onChange={e => change('url', e.target.value)}/></FormControl>
          {survey && <FormControl><FormLabel htmlFor="content-event">Associated event</FormLabel><Select id="content-event" value={form.eventId} onChange={e => change('eventId', e.target.value)}><option value="">Standalone survey</option>{events.map(item => <option key={item.id} value={item.id}>{item.name} ({item.status})</option>)}</Select></FormControl>}
          <FormControl><FormLabel htmlFor="content-status">Publication</FormLabel><Select id="content-status" value={form.status} onChange={e => change('status', e.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Select></FormControl>
          {!survey && <Checkbox isChecked={form.isCancelled} onChange={e => change('isCancelled', e.target.checked)}>This event is cancelled</Checkbox>}
        </Stack>}
      </ModalBody><ModalFooter gap={3}><Button isDisabled={saving} onClick={() => setForm(null)}>Cancel</Button><Button type="submit" colorScheme="blue" isLoading={saving}>Save {survey ? 'survey' : 'event'}</Button></ModalFooter>
    </ModalContent></Modal>
  </Box>;
}
