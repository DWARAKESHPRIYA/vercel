import type { DNSRecord } from '@vercel-internals/types';
import Client from '../client.js';

export default async function getDNSRecordById(
  client: Client,
  id: string
): Promise<DNSRecord> {
  return client.fetch<DNSRecord>(`/v5/domains/records/${id}`);
}
