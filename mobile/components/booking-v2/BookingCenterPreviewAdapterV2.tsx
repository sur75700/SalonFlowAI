import React, { useMemo, useState } from 'react';

import BookingCenterCompositionV2, { BookingListItem } from './BookingCenterCompositionV2';
import { BookingFilterValue } from './BookingStatusFilterV2';

// mobile/lib/i18n.ts (flat file) and mobile/lib/i18n/ (folder) both exist.
// Only the folder's index.ts was inspected; an explicit "/index" path
// unambiguously targets the verified file (same reasoning applied
// throughout Dashboard V2's real wiring).
import { t } from '../../lib/i18n/index';
import { useAppPreferences } from '../../hooks/useAppPreferences';
import {
  nextHourDateTimeInput,
  todayEveningDateTimeInput,
  tomorrowMorningDateTimeInput,
} from '../../utils/formatters';

/**
 * BookingCenterPreviewAdapterV2 — visual QA only.
 *
 * This is the ONLY file in the Booking V2 set that owns local state,
 * calls t(), or contains sample data — and the sample data below uses
 * ONLY the 3 confirmed-real statuses (scheduled/completed/cancelled),
 * clearly labeled as preview content, never claimed as real business
 * data. Must never be imported by the production appointments route;
 * that route should render <BookingCenterCompositionV2 /> directly with
 * its own real props.
 */

// ---- preview data — visual QA only, NOT real business data ----
type PreviewStatus = 'scheduled' | 'completed' | 'cancelled';

const previewClientOptions = [
  { id: 'c1', label: 'Lilit Hakobyan' },
  { id: 'c2', label: 'Sona Avagyan' },
  { id: 'c3', label: 'Elina Martirosyan' },
];

const previewServiceOptions = [
  { id: 's1', label: 'Manicure Gel' },
  { id: 's2', label: 'Hair Coloring' },
  { id: 's3', label: 'Keratin Treatment' },
];

function buildPreviewToday(locale: string): BookingListItem[] {
  return [
    {
      id: 'pv-1',
      dateLabel: 'TODAY · JUL 15 · 2026',
      time: '4:30 PM',
      endTime: '5:30 PM',
      clientName: 'Lilit Hakobyan',
      serviceName: 'Manicure Gel',
      durationLabel: '60 min',
      status: 'scheduled' as PreviewStatus,
      statusLabel: t('Scheduled', locale as any),
      editLabel: t('Edit', locale as any),
      completeLabel: t('Complete', locale as any),
      cancelLabel: t('Cancel', locale as any),
      deleteLabel: t('Delete', locale as any),
      onEdit: () => {},
      onComplete: () => {},
      onCancel: () => {},
      onDelete: () => {},
    },
  ];
}

function buildPreviewUpcoming(locale: string): BookingListItem[] {
  return [
    {
      id: 'pv-2',
      dateLabel: 'THURSDAY · JUL 16 · 2026',
      time: '6:30 PM',
      endTime: '9:00 PM',
      clientName: 'Sona Avagyan',
      serviceName: 'Hair Coloring',
      status: 'scheduled' as PreviewStatus,
      statusLabel: t('Scheduled', locale as any),
      editLabel: t('Edit', locale as any),
      deleteLabel: t('Delete', locale as any),
    },
    {
      id: 'pv-3',
      dateLabel: 'FRIDAY · JUL 17 · 2026',
      time: '10:30 AM',
      endTime: '11:30 AM',
      clientName: 'Elina Martirosyan',
      serviceName: 'Manicure Gel',
      status: 'scheduled' as PreviewStatus,
      statusLabel: t('Scheduled', locale as any),
      editLabel: t('Edit', locale as any),
      deleteLabel: t('Delete', locale as any),
    },
  ];
}

function buildPreviewRegistry(locale: string): BookingListItem[] {
  return [
    {
      id: 'pv-4',
      dateLabel: 'FRIDAY · APR 17 · 2026',
      time: '—',
      clientName: 'Ani Petrosyan',
      serviceName: 'Hair Coloring',
      status: 'cancelled' as PreviewStatus,
      statusLabel: t('Cancelled', locale as any),
      notes: undefined,
      editLabel: t('Edit', locale as any),
      deleteLabel: t('Delete', locale as any),
    },
    {
      id: 'pv-5',
      dateLabel: 'SATURDAY · APR 18 · 2026',
      time: '—',
      clientName: 'Mariam Sargsyan',
      serviceName: 'Keratin Treatment',
      status: 'completed' as PreviewStatus,
      statusLabel: t('Completed', locale as any),
      notes: undefined,
      editLabel: t('Edit', locale as any),
      deleteLabel: t('Delete', locale as any),
    },
  ];
}

function BookingCenterPreviewAdapterV2() {
  const { locale } = useAppPreferences();

  const [filter, setFilter] = useState<BookingFilterValue>('all');
  const [search, setSearch] = useState('');
  const [createPanelVisible, setCreatePanelVisible] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(undefined);
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined);
  const [bookingTime, setBookingTime] = useState('2026-07-15T09:00');
  const [notes, setNotes] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filterOptions = useMemo(
    () => [
      { value: 'all' as const, label: t('All', locale as any) },
      { value: 'scheduled' as const, label: t('Scheduled', locale as any) },
      { value: 'completed' as const, label: t('Completed', locale as any) },
      { value: 'cancelled' as const, label: t('Cancelled', locale as any) },
    ],
    [locale]
  );

  const today = useMemo(() => buildPreviewToday(locale), [locale]);
  const upcoming = useMemo(() => buildPreviewUpcoming(locale), [locale]);
  const registry = useMemo(() => buildPreviewRegistry(locale), [locale]);

  const applyFilter = (list: BookingListItem[]) =>
    list.filter((b) => filter === 'all' || b.status === filter);

  // FLAGGED: no existing i18n key found for a booking empty-state message
  // (checked the full catalog) — unlike every other string here, this one
  // is not confirmed real. t() safely falls back to this literal English
  // text; a real key should be added separately.
  const emptyLabel = t('No appointments scheduled for today.', locale as any);

  const handleRefresh = () => {
    setRefreshing(true);
    // Preview-only — no real fetch. A real implementation calls the real
    // refresh() from whichever hook the production screen uses.
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <BookingCenterCompositionV2
      title={t('Bookings', locale as any)}
      subtitle={t('Appointments Hero Subtitle', locale as any)}
      connectionStatusLabel={t('Booking Flow Connected', locale as any)}
      connectionStatusSubtitle={t('Booking Flow Connected Subtitle', locale as any)}
      createActionLabel={t('Create Appointment', locale as any)}
      todayAppointments={applyFilter(today)}
      upcomingAppointments={applyFilter(upcoming)}
      registryAppointments={applyFilter(registry)}
      summaryStats={[
        { label: t('Today Label', locale as any), value: String(today.length), tone: 'royal' },
        { label: t('Total Label', locale as any), value: '99', tone: 'gold' },
        { label: t('Upcoming Label', locale as any), value: String(upcoming.length), tone: 'blue' },
      ]}
      statusFilterOptions={filterOptions}
      selectedStatusFilter={filter}
      onChangeStatusFilter={setFilter}
      searchValue={search}
      onChangeSearch={setSearch}
      searchPlaceholder={t('Search Appointments', locale as any)}
      loading={false}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      todaySectionTitle={t('TodayBookings', locale as any)}
      todaySectionSubtitle={t('TodayBookingsSubtitle', locale as any)}
      upcomingSectionTitle={t('Upcoming Bookings', locale as any)}
      upcomingSectionSubtitle={t('Upcoming Bookings Subtitle', locale as any)}
      registrySectionTitle={t('Booking Registry', locale as any)}
      emptyLabel={emptyLabel}
      createPanelVisible={createPanelVisible}
      onOpenCreatePanel={() => setCreatePanelVisible(true)}
      onCloseCreatePanel={() => setCreatePanelVisible(false)}
      createPanelTitle={t('Create Appointment', locale as any)}
      createPanelSubtitle={t('Create Appointment Subtitle', locale as any)}
      clientLabel={t('Client', locale as any)}
      clientOptions={previewClientOptions}
      selectedClientId={selectedClientId}
      clientPlaceholder={t('Select Client', locale as any)}
      onSelectClient={setSelectedClientId}
      serviceLabel={t('Service', locale as any)}
      serviceOptions={previewServiceOptions}
      selectedServiceId={selectedServiceId}
      servicePlaceholder={t('Select Service', locale as any)}
      onSelectService={setSelectedServiceId}
      bookingTimeLabel={t('Booking Time', locale as any)}
      bookingTimeValue={bookingTime}
      onChangeBookingTime={setBookingTime}
      quickActions={[
        { label: t('Quick Next Hour', locale as any), onPress: () => setBookingTime(nextHourDateTimeInput()) },
        {
          label: t('Quick Today Evening', locale as any),
          onPress: () => setBookingTime(todayEveningDateTimeInput()),
        },
        {
          label: t('Quick Tomorrow Morning', locale as any),
          onPress: () => setBookingTime(tomorrowMorningDateTimeInput()),
        },
      ]}
      notesLabel={t('Notes', locale as any)}
      notesValue={notes}
      onChangeNotes={setNotes}
      notesPlaceholder={t('Booking Notes Placeholder', locale as any)}
      submitLabel={t('Create Appointment', locale as any)}
      onSubmit={() => setCreatePanelVisible(false)}
      resetLabel={t('Reset Form', locale as any)}
      onReset={() => {
        setSelectedClientId(undefined);
        setSelectedServiceId(undefined);
        setBookingTime('2026-07-15T09:00');
        setNotes('');
      }}
    />
  );
}

export default BookingCenterPreviewAdapterV2;
