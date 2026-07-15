import React from 'react';
import { View, ScrollView, SafeAreaView, RefreshControl, StyleSheet, useWindowDimensions } from 'react-native';

import RoyalCosmosBackground from '../ui/RoyalCosmosBackground';
import BookingCommandHeaderV2 from './BookingCommandHeaderV2';
import BookingSummaryStripV2, { BookingSummaryStat } from './BookingSummaryStripV2';
import BookingStatusFilterV2, { BookingFilterOption, BookingFilterValue } from './BookingStatusFilterV2';
import BookingListSectionV2 from './BookingListSectionV2';
import CreateBookingSheetV2, { BookingSelectOption, CreateBookingQuickAction } from './CreateBookingSheetV2';
import { BookingCardV2Props } from './BookingCardV2';

export interface BookingListItem extends BookingCardV2Props {
  id: string;
}

/**
 * BookingCenterCompositionV2 — presentation-only, fully controlled.
 * Every value and handler arrives via props. No fetch, no API calls, no
 * auth reads, no business hooks, no owned business data, no server-derived
 * computation, no sample data. Tony's real appointments screen supplies
 * all of this; BookingCenterPreviewAdapterV2 supplies preview data for
 * visual QA only and is never imported by the production route.
 *
 * Uses RoyalCosmosBackground the same way the real DashboardV2Composition
 * does (confirmed from that file: `<RoyalCosmosBackground style={...}>`),
 * for true visual continuity with Dashboard V2 — its internal contents
 * were never shared with me, only this real usage pattern.
 */
export interface BookingCenterCompositionV2Props {
  // header
  title: string;
  subtitle?: string;
  connectionStatusLabel?: string;
  connectionStatusSubtitle?: string;

  // data streams — pre-translated, card-ready (low-level components never call t())
  todayAppointments: BookingListItem[];
  upcomingAppointments: BookingListItem[];
  registryAppointments: BookingListItem[];

  // summary
  summaryStats: BookingSummaryStat[];

  // filter / search — fully controlled
  statusFilterOptions: BookingFilterOption[];
  selectedStatusFilter: BookingFilterValue;
  onChangeStatusFilter: (value: BookingFilterValue) => void;
  searchValue: string;
  onChangeSearch: (value: string) => void;
  searchPlaceholder: string;

  // list-level states
  loading?: boolean;
  refreshing?: boolean;
  error?: string;
  onRefresh?: () => void;

  // section labels
  todaySectionTitle: string;
  todaySectionSubtitle?: string;
  upcomingSectionTitle: string;
  upcomingSectionSubtitle?: string;
  registrySectionTitle: string;
  emptyLabel: string;

  // create panel
  createPanelVisible: boolean;
  onOpenCreatePanel: () => void;
  onCloseCreatePanel: () => void;
  createPanelTitle: string;
  createPanelSubtitle?: string;

  clientLabel: string;
  clientOptions: BookingSelectOption[];
  selectedClientId?: string;
  clientPlaceholder: string;
  onSelectClient: (id: string) => void;

  serviceLabel: string;
  serviceOptions: BookingSelectOption[];
  selectedServiceId?: string;
  servicePlaceholder: string;
  onSelectService: (id: string) => void;

  bookingTimeLabel: string;
  bookingTimeValue: string;
  onChangeBookingTime: (value: string) => void;
  quickActions: CreateBookingQuickAction[];

  notesLabel: string;
  notesValue: string;
  onChangeNotes: (value: string) => void;
  notesPlaceholder: string;

  submitLabel: string;
  onSubmit: () => void;
  submitting?: boolean;

  resetLabel: string;
  onReset: () => void;

  errorMessage?: string;

  // primary action button in header opens the create panel
  createActionLabel: string;
}

function classifyDevice(width: number): 'phone' | 'tablet' | 'desktop' {
  if (width >= 1100) return 'desktop';
  if (width >= 700) return 'tablet';
  return 'phone';
}

function BookingCenterCompositionV2(props: BookingCenterCompositionV2Props) {
  const { width } = useWindowDimensions();
  const isDesktop = classifyDevice(width) === 'desktop';

  const todaySection = (
    <BookingListSectionV2
      title={props.todaySectionTitle}
      subtitle={props.todaySectionSubtitle}
      items={props.todayAppointments}
      loading={props.loading}
      error={props.error}
      emptyLabel={props.emptyLabel}
      cardLayout={isDesktop ? 'row' : 'stacked'}
    />
  );

  const upcomingSection = (
    <BookingListSectionV2
      title={props.upcomingSectionTitle}
      subtitle={props.upcomingSectionSubtitle}
      items={props.upcomingAppointments}
      loading={props.loading}
      error={props.error}
      emptyLabel={props.emptyLabel}
      cardLayout={isDesktop ? 'row' : 'stacked'}
    />
  );

  const registrySection = (
    <BookingListSectionV2
      title={props.registrySectionTitle}
      items={props.registryAppointments}
      loading={props.loading}
      error={props.error}
      emptyLabel={props.emptyLabel}
      cardLayout={isDesktop ? 'row' : 'stacked'}
    />
  );

  return (
    <RoyalCosmosBackground style={styles.cosmosShell}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: isDesktop ? 40 : 16 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            props.onRefresh ? (
              <RefreshControl
                refreshing={!!props.refreshing}
                onRefresh={props.onRefresh}
                tintColor="#7C5CFF"
              />
            ) : undefined
          }
        >
          <View style={isDesktop ? styles.pageInnerDesktop : styles.pageInner}>
            <View style={styles.sectionGap}>
              <BookingCommandHeaderV2
                title={props.title}
                subtitle={props.subtitle}
                primaryActionLabel={props.createActionLabel}
                onPressPrimaryAction={props.onOpenCreatePanel}
                connectionStatusLabel={props.connectionStatusLabel}
                connectionStatusSubtitle={props.connectionStatusSubtitle}
              />
            </View>

            <View style={styles.sectionGap}>
              <BookingSummaryStripV2 stats={props.summaryStats} />
            </View>

            <View style={styles.sectionGap}>
              <BookingStatusFilterV2
                options={props.statusFilterOptions}
                value={props.selectedStatusFilter}
                onChange={props.onChangeStatusFilter}
                searchValue={props.searchValue}
                onSearchChange={props.onChangeSearch}
                searchPlaceholder={props.searchPlaceholder}
              />
            </View>

            {isDesktop ? (
              <View style={styles.executiveGrid}>
                <View style={styles.primaryCol}>
                  <View style={styles.sectionGap}>{todaySection}</View>
                  <View style={styles.sectionGap}>{upcomingSection}</View>
                  <View>{registrySection}</View>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.sectionGap}>{todaySection}</View>
                <View style={styles.sectionGap}>{upcomingSection}</View>
                <View>{registrySection}</View>
              </>
            )}
          </View>
        </ScrollView>

        <CreateBookingSheetV2
          visible={props.createPanelVisible}
          onRequestClose={props.onCloseCreatePanel}
          layout={isDesktop ? 'panel' : 'sheet'}
          title={props.createPanelTitle}
          subtitle={props.createPanelSubtitle}
          clientLabel={props.clientLabel}
          clientOptions={props.clientOptions}
          selectedClientId={props.selectedClientId}
          clientPlaceholder={props.clientPlaceholder}
          onSelectClient={props.onSelectClient}
          serviceLabel={props.serviceLabel}
          serviceOptions={props.serviceOptions}
          selectedServiceId={props.selectedServiceId}
          servicePlaceholder={props.servicePlaceholder}
          onSelectService={props.onSelectService}
          bookingTimeLabel={props.bookingTimeLabel}
          bookingTimeValue={props.bookingTimeValue}
          onChangeBookingTime={props.onChangeBookingTime}
          quickActions={props.quickActions}
          notesLabel={props.notesLabel}
          notesValue={props.notesValue}
          onChangeNotes={props.onChangeNotes}
          notesPlaceholder={props.notesPlaceholder}
          submitLabel={props.submitLabel}
          onSubmit={props.onSubmit}
          submitting={props.submitting}
          resetLabel={props.resetLabel}
          onReset={props.onReset}
          errorMessage={props.errorMessage}
        />
      </SafeAreaView>
    </RoyalCosmosBackground>
  );
}

const styles = StyleSheet.create({
  cosmosShell: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 48,
  },
  pageInner: {
    width: '100%',
  },
  pageInnerDesktop: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
  },
  sectionGap: {
    marginBottom: 24,
  },
  executiveGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  primaryCol: {
    flex: 2,
    minWidth: 0,
    marginRight: 20,
  },
  rightRail: {
    display: 'none',
  },
});

export default React.memo(BookingCenterCompositionV2);
