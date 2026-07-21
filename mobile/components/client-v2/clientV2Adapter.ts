import type { ClientItem } from '../../types/models';
import type { ClientRecord, ClientStatus } from './ClientCardV3';

export interface ClientV2AdapterLabels {
  unnamedClient: string;
  statusLabels: Record<ClientStatus, string>;
}

export interface ClientV2AdapterOptions {
  labels: ClientV2AdapterLabels;
  resolveStatus?: (client: ClientItem) => ClientStatus;
}

function normalizeOptional(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function buildInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return '—';
  }

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toLocaleUpperCase())
    .join('');
}

function buildNotesPreview(notes?: string): string | undefined {
  if (!notes) {
    return undefined;
  }

  const normalized = notes.replace(/\s+/g, ' ').trim();

  if (normalized.length <= 96) {
    return normalized;
  }

  return `${normalized.slice(0, 93).trimEnd()}…`;
}

export function buildClientRecordV2(
  client: ClientItem,
  options: ClientV2AdapterOptions
): ClientRecord {
  const normalizedName = client.full_name.trim();
  const name = normalizedName || options.labels.unnamedClient;

  const phone = normalizeOptional(client.phone);
  const email = normalizeOptional(client.email);
  const notes = normalizeOptional(client.notes);

  /*
   * ClientItem currently has no persisted lifecycle/status field.
   * Keep the fallback isolated here until the API exposes one.
   */
  const status = options.resolveStatus?.(client) ?? 'active';

  return {
    id: client.id,
    name,
    initials: buildInitials(name),
    phone,
    email,
    status,
    statusLabel: options.labels.statusLabels[status],
    notes,
    notesPreview: buildNotesPreview(notes),
  };
}

export function buildClientRecordsV2(
  clients: ClientItem[],
  options: ClientV2AdapterOptions
): ClientRecord[] {
  return clients.map((client) => buildClientRecordV2(client, options));
}
