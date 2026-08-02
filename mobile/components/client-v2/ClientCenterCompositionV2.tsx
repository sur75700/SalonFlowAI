import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import ClientCommandHeaderV2, { ClientCommandHeaderV2Props } from './ClientCommandHeaderV2';
import ClientSummaryStripV2, { ClientSummaryStripV2Props } from './ClientSummaryStripV2';
import ClientSearchFiltersV2, { ClientSearchFiltersV2Props } from './ClientSearchFiltersV2';
import ClientListSectionV2, { ClientListSectionV2Props } from './ClientListSectionV2';
import ClientDetailSheetV2, { ClientDetailSheetV2Props } from './ClientDetailSheetV2';
import CreateClientSheetV2, { CreateClientSheetV2Props } from './CreateClientSheetV2';

const theme = {
  color: {
    bgBase: '#0A0A12',
  },
  space: { lg: 16, xl: 20, xxl: 28 },
};

const SHELL_MAX_WIDTH = 1280;

export interface ClientCenterCompositionV2Props {
  header: ClientCommandHeaderV2Props;
  summary: ClientSummaryStripV2Props;
  searchFilters: ClientSearchFiltersV2Props;
  list: ClientListSectionV2Props;
  detailSheet: ClientDetailSheetV2Props;
  createSheet: CreateClientSheetV2Props;
}

export default function ClientCenterCompositionV2({
  header,
  summary,
  searchFilters,
  list,
  detailSheet,
  createSheet,
}: ClientCenterCompositionV2Props) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
        ]}
      >
        <View style={styles.shell}>
          <ClientCommandHeaderV2 {...header} />
          <View style={styles.section}>
            <ClientSummaryStripV2 {...summary} />
          </View>
          <View style={styles.section}>
            <ClientSearchFiltersV2 {...searchFilters} />
          </View>
          <View style={styles.listSection}>
            <ClientListSectionV2 {...list} />
          </View>
        </View>
      </ScrollView>

      <ClientDetailSheetV2 {...detailSheet} />
      <CreateClientSheetV2 {...createSheet} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: theme.space.lg,
  },
  scrollContentDesktop: {
    paddingHorizontal: theme.space.xxl,
    paddingVertical: theme.space.xxl,
    alignItems: 'center',
  },
  shell: {
    width: '100%',
    maxWidth: SHELL_MAX_WIDTH,
  },
  section: {
    marginTop: theme.space.xxl,
  },
  listSection: {
    marginTop: theme.space.xxl,
    marginBottom: theme.space.xxl,
  },
});
