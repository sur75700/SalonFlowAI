import type {
  AppointmentItem,
  AppointmentStatus,
} from '../../types/models';
import { t } from '../../lib/i18n/index';

import type { BookingListItem } from './BookingCenterCompositionV2';

export type BookingClientStatus =
  | 'new'
  | 'active'
  | 'returning'
  | 'vip'
  | 'inactive';

export interface BuildBookingListItemV2Options {
  locale: string;
  clientStatus?: BookingClientStatus;
  serviceIconKey?: string | null;
  onOpen?: (appointment: AppointmentItem) => void;
  onEdit?: (appointment: AppointmentItem) => void;
  onComplete?: (appointment: AppointmentItem) => void;
  onCancel?: (appointment: AppointmentItem) => void;
  onDelete?: (appointment: AppointmentItem) => void;
}

function normalizeStatus(status: string): AppointmentStatus {
  if (
    status === 'scheduled' ||
    status === 'completed' ||
    status === 'cancelled'
  ) {
    return status;
  }

  return 'scheduled';
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateLabel(date: Date | null, locale: string): string {
  if (!date) return '—';

  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
    .format(date)
    .replace(/,/g, ' ·')
    .toUpperCase();
}

function formatTime(date: Date | null, locale: string): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatDuration(minutes?: number | null): string | undefined {
  if (!minutes || minutes <= 0) return undefined;
  return `${minutes} min`;
}

function formatPrice(
  amount: number | null | undefined,
  currency: string | null | undefined,
  locale: string,
): string | undefined {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    return undefined;
  }

  const normalizedCurrency = currency?.trim().toUpperCase() || 'AMD';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: normalizedCurrency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${Math.round(amount).toLocaleString(locale)} ${normalizedCurrency}`;
  }
}

function getStatusLabel(status: AppointmentStatus, locale: string): string {
  if (status === 'completed') return t('Completed', locale as any);
  if (status === 'cancelled') return t('Cancelled', locale as any);
  return t('Scheduled', locale as any);
}

export function buildBookingListItemV2(
  appointment: AppointmentItem,
  options: BuildBookingListItemV2Options
): BookingListItem {
  const { locale } = options;
  const startsAt = parseDate(appointment.starts_at);
  const endsAt = parseDate(appointment.ends_at);
  const status = normalizeStatus(appointment.status);

  return {
    id: appointment.id,
    dateLabel: formatDateLabel(startsAt, locale),
    time: formatTime(startsAt, locale),
    endTime: endsAt ? formatTime(endsAt, locale) : undefined,

    clientName: appointment.client_name,
    clientStatus: options.clientStatus,
    serviceName: appointment.service_name || undefined,
    serviceIconKey: options.serviceIconKey,
    durationLabel: formatDuration(appointment.duration_minutes_snapshot),
    priceLabel: formatPrice(
      appointment.price_snapshot,
      appointment.currency_snapshot,
      locale,
    ),

    status,
    statusLabel: getStatusLabel(status, locale),
    notes:
      [
        'Demo upcoming appointment.',
        'Demo historical appointment.',
      ].includes(appointment.notes?.trim() ?? '')
        ? undefined
        : appointment.notes || undefined,

    editLabel: t('Edit', locale as any),
    completeLabel: t('Complete', locale as any),
    cancelLabel: t('Cancel', locale as any),
    deleteLabel: t('Delete', locale as any),

    // Entire booking card opens the read-only appointment detail surface.
    // Editing remains an explicit, separate action through the Edit button.
    onPress: options.onOpen
      ? () => options.onOpen?.(appointment)
      : undefined,

    onEdit: options.onEdit
      ? () => options.onEdit?.(appointment)
      : undefined,

    onComplete:
      status === 'scheduled' && options.onComplete
        ? () => options.onComplete?.(appointment)
        : undefined,

    onCancel:
      status === 'scheduled' && options.onCancel
        ? () => options.onCancel?.(appointment)
        : undefined,

    onDelete: options.onDelete
      ? () => options.onDelete?.(appointment)
      : undefined,
  };
}

export function buildBookingListItemsV2(
  appointments: AppointmentItem[],
  options: BuildBookingListItemV2Options
): BookingListItem[] {
  return appointments.map((appointment) =>
    buildBookingListItemV2(appointment, options)
  );
}
