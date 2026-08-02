import type {
  AppointmentItem,
  AppointmentStatus,
} from '../../types/models';
import { t } from '../../lib/i18n/index';

import type { BookingListItem } from './BookingCenterCompositionV2';

export interface BuildBookingListItemV2Options {
  locale: string;
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

function getStatusLabel(
  status: AppointmentStatus,
  locale: string
): string {
  if (status === 'completed') {
    return t('Completed', locale as any);
  }

  if (status === 'cancelled') {
    return t('Cancelled', locale as any);
  }

  return t('Scheduled', locale as any);
}

/**
 * Converts the backend AppointmentItem DTO into the presentation-only model
 * consumed by BookingCardV3 through BookingCenterCompositionV2.
 *
 * Date/time formatting and backend-field normalization remain outside the UI.
 */
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
    serviceName: appointment.service_name || undefined,
    durationLabel: formatDuration(
      appointment.duration_minutes_snapshot
    ),

    status,
    statusLabel: getStatusLabel(status, locale),
    notes:
      [
        'Demo upcoming appointment.',
        'Demo historical appointment.',
      ].includes(
        appointment.notes?.trim() ?? ''
      )
        ? undefined
        : appointment.notes || undefined,

    editLabel: t('Edit', locale as any),
    completeLabel: t('Complete', locale as any),
    cancelLabel: t('Cancel', locale as any),
    deleteLabel: t('Delete', locale as any),

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
