import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import ClientCardV3, { ClientRecord, ClientCardLayout, ClientCardV3Labels } from './ClientCardV3';

const theme = {
  color: {
    bgBase: '#0A0A12',
    surface: '#14141F',
    surfaceAlt: '#191927',
    surfaceRaised: '#1D1D2E',
    border: 'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.16)',
    textPrimary: '#F2F2F8',
    textSecondary: '#A6A6BE',
    textTertiary: '#6C6C84',
    violet: '#8C7CFF',
    violetSoft: 'rgba(140,124,255,0.16)',
    blue: '#5C8CFF',
    blueSoft: 'rgba(92,140,255,0.16)',
    cyan: '#5FD3E8',
    cyanSoft: 'rgba(95,211,232,0.16)',
    gold: '#E8C275',
    goldSoft: 'rgba(232,194,117,0.18)',
    green: '#6FCF97',
    greenSoft: 'rgba(111,207,151,0.16)',
    red: '#E8748A',
    redSoft: 'rgba(232,116,138,0.16)',
  },
  radius: { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 },
};

export type ClientListState = 'idle' | 'loading' | 'empty' | 'no-results' | 'error';

export interface ClientListSectionV2Labels {
  loadingAnnouncement: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel: string;
  noResultsTitle: string;
  noResultsDescription: string;
  errorTitle: string;
  errorDescription: string;
  errorActionLabel: string;
}

export const DEFAULT_CLIENT_LIST_SECTION_LABELS: ClientListSectionV2Labels = {
  loadingAnnouncement: 'Loading clients',
  emptyTitle: 'No clients yet',
  emptyDescription: 'Clients you add will appear here as premium relationship cards.',
  emptyActionLabel: 'Add your first client',
  noResultsTitle: 'No matches',
  noResultsDescription: 'Try a different name, phone number, or filter.',
  errorTitle: 'Something went wrong',
  errorDescription: 'This list could not be loaded. Please try again.',
  errorActionLabel: 'Retry',
};

export interface ClientListSectionV2Props {
  clients: ClientRecord[];
  state: ClientListState;
  skeletonCount?: number;
  columns?: number;
  cardLayout?: ClientCardLayout;
  selectedClientId?: string | null;
  loadingClientIds?: string[];
  disabledClientIds?: string[];
  cardLabels?: Partial<ClientCardV3Labels>;
  labels?: Partial<ClientListSectionV2Labels>;
  onSelectClient?: (id: string) => void;
  onEditClient?: (id: string) => void;
  onDeleteClient?: (id: string) => void;
  onEmptyStateAction?: () => void;
  onErrorAction?: () => void;
}

function computeColumns(width: number): number {
  if (width >= 1280) return 3;
  if (width >= 860) return 2;
  return 1;
}

export default function ClientListSectionV2({
  clients,
  state,
  skeletonCount = 6,
  columns,
  cardLayout,
  selectedClientId = null,
  loadingClientIds = [],
  disabledClientIds = [],
  cardLabels,
  labels,
  onSelectClient,
  onEditClient,
  onDeleteClient,
  onEmptyStateAction,
  onErrorAction,
}: ClientListSectionV2Props) {
  const t: ClientListSectionV2Labels = { ...DEFAULT_CLIENT_LIST_SECTION_LABELS, ...labels };
  const { width } = useWindowDimensions();
  const effectiveColumns = columns ?? computeColumns(width);
  const effectiveLayout: ClientCardLayout = cardLayout ?? (effectiveColumns >= 3 ? 'compact' : 'stacked');

  if (state === 'loading') {
    return (
      <View
        style={styles.grid}
        accessibilityRole="progressbar"
        accessibilityLabel={t.loadingAnnouncement}
      >
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <View key={index} style={[styles.gridItem, { width: `${100 / effectiveColumns}%` }]}>
            <ClientCardV3
              id={`skeleton-${index}`}
              name=""
              initials=""
              status="active"
              statusLabel=""
              loading
              layout={effectiveLayout}
            />
          </View>
        ))}
      </View>
    );
  }

  if (state === 'empty') {
    return renderStatePanel({
      title: t.emptyTitle,
      description: t.emptyDescription,
      actionLabel: t.emptyActionLabel,
      onAction: onEmptyStateAction,
      tone: 'violet',
    });
  }

  if (state === 'no-results') {
    return renderStatePanel({
      title: t.noResultsTitle,
      description: t.noResultsDescription,
      tone: 'neutral',
    });
  }

  if (state === 'error') {
    return renderStatePanel({
      title: t.errorTitle,
      description: t.errorDescription,
      actionLabel: t.errorActionLabel,
      onAction: onErrorAction,
      tone: 'red',
    });
  }

  return (
    <View style={styles.grid}>
      {clients.map((client) => (
        <View key={client.id} style={[styles.gridItem, { width: `${100 / effectiveColumns}%` }]}>
          <ClientCardV3
            {...client}
            layout={effectiveLayout}
            selected={client.id === selectedClientId}
            loading={loadingClientIds.includes(client.id)}
            disabled={disabledClientIds.includes(client.id)}
            labels={cardLabels}
            onEdit={onEditClient}
            onDelete={onDeleteClient}
            onOpenDetails={onSelectClient}
          />
        </View>
      ))}
    </View>
  );

  function renderStatePanel(options: {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    tone: 'violet' | 'neutral' | 'red';
  }) {
    const toneColor =
      options.tone === 'violet'
        ? theme.color.violet
        : options.tone === 'red'
        ? theme.color.red
        : theme.color.textSecondary;
    return (
      <View style={styles.statePanel} accessibilityRole="none">
        <View style={[styles.stateGlyph, { borderColor: toneColor }]} />
        <Text style={styles.stateTitle}>{options.title}</Text>
        <Text style={styles.stateDescription}>{options.description}</Text>
        {!!options.actionLabel && (
          <Pressable
            onPress={options.onAction}
            accessibilityRole="button"
            accessibilityLabel={options.actionLabel}
            style={({ pressed }: { pressed: boolean }) => [
              styles.stateAction,
              pressed && styles.stateActionPressed,
            ]}
          >
            <Text style={styles.stateActionText}>{options.actionLabel}</Text>
          </Pressable>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.space.sm,
  },
  gridItem: {
    paddingHorizontal: theme.space.sm,
    paddingVertical: theme.space.sm,
  },
  statePanel: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.space.xxl * 2,
    paddingHorizontal: theme.space.xl,
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    borderStyle: 'dashed',
    width: '100%',
  },
  stateGlyph: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    marginBottom: theme.space.lg,
  },
  stateTitle: {
    color: theme.color.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: theme.space.xs,
    textAlign: 'center',
  },
  stateDescription: {
    color: theme.color.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
  },
  stateAction: {
    marginTop: theme.space.xl,
    minHeight: 44,
    paddingHorizontal: theme.space.xl,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.violetSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateActionPressed: {
    opacity: 0.75,
  },
  stateActionText: {
    color: theme.color.violet,
    fontSize: 13,
    fontWeight: '700',
  },
});
