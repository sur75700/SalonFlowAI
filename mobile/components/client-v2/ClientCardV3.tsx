import { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet, ViewStyle } from 'react-native';

/**
 * Royal Cosmos design tokens.
 * Mirrored identically across every ClientCenter V2 file so each file stays a
 * complete, self-contained unit per the build brief. During integration these
 * should be extracted into one shared theme module — see integration notes.
 */
const theme = {
  color: {
    bgBase: '#0A0A12',
    surface: 'rgba(34, 24, 61, 0.92)',
    surfaceAlt: 'rgba(47, 34, 80, 0.88)',
    surfaceRaised: 'rgba(57, 41, 96, 0.94)',
    border: 'rgba(174, 145, 255, 0.22)',
    borderStrong: 'rgba(194, 170, 255, 0.38)',
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

export type ClientStatus = 'new' | 'active' | 'returning' | 'vip' | 'inactive';
export type ClientCardLayout = 'stacked' | 'row' | 'compact';

/** Pure client data. Shared shape used by the card, the list, and the detail sheet. */
export interface ClientRecord {
  id: string;
  name: string;
  initials: string;
  phone?: string;
  email?: string;
  status: ClientStatus;
  statusLabel: string;
  vipLabel?: string;
  lastVisitLabel?: string;
  upcomingAppointmentLabel?: string;
  visitCountLabel?: string;
  lifetimeValueLabel?: string;
  notesPreview?: string;
  notes?: string;
}

export interface ClientCardV3Labels {
  phoneField: string;
  emailField: string;
  editAction: string;
  deleteAction: string;
  openDetailsAction: string;
  destructiveHint: string;
  lastVisitField: string;
  upcomingAppointmentField: string;
  visitCountField: string;
  lifetimeValueField: string;
  notesField: string;
  noUpcomingAppointment: string;
  noNotes: string;
}

export const DEFAULT_CLIENT_CARD_LABELS: ClientCardV3Labels = {
  phoneField: 'Phone',
  emailField: 'Email',
  editAction: 'Edit',
  deleteAction: 'Delete',
  openDetailsAction: 'View details',
  destructiveHint: 'This is a destructive action',
  lastVisitField: 'Last visit',
  upcomingAppointmentField: 'Next appointment',
  visitCountField: 'Visits',
  lifetimeValueField: 'Lifetime value',
  notesField: 'Notes',
  noUpcomingAppointment: 'None scheduled',
  noNotes: 'No notes yet',
};

export interface ClientCardV3Props extends ClientRecord {
  selected?: boolean;
  loading?: boolean;
  disabled?: boolean;
  layout?: ClientCardLayout;
  labels?: Partial<ClientCardV3Labels>;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onOpenDetails?: (id: string) => void;
}

function getStatusPalette(status: ClientStatus) {
  switch (status) {
    case 'vip':
      return { fg: theme.color.gold, bg: theme.color.goldSoft };
    case 'active':
      return { fg: theme.color.green, bg: theme.color.greenSoft };
    case 'new':
      return { fg: theme.color.cyan, bg: theme.color.cyanSoft };
    case 'returning':
      return { fg: theme.color.blue, bg: theme.color.blueSoft };
    case 'inactive':
    default:
      return { fg: theme.color.textTertiary, bg: 'rgba(255,255,255,0.06)' };
  }
}

function ChevronGlyph({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 7,
        height: 7,
        borderTopWidth: 2,
        borderRightWidth: 2,
        borderColor: color,
        transform: [{ rotate: '45deg' }],
        marginLeft: 2,
      }}
    />
  );
}

function SkeletonBlock({ style }: { style?: ViewStyle | ViewStyle[] }) {
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        { backgroundColor: theme.color.surfaceAlt, borderRadius: theme.radius.sm, opacity: pulse },
        style,
      ]}
    />
  );
}

function ClientCardV3({
  id,
  name,
  initials,
  phone,
  email,
  status,
  statusLabel,
  vipLabel,
  lastVisitLabel,
  upcomingAppointmentLabel,
  visitCountLabel,
  lifetimeValueLabel,
  notesPreview,
  selected = false,
  loading = false,
  disabled = false,
  layout = 'stacked',
  labels,
  onEdit,
  onDelete,
  onOpenDetails,
}: ClientCardV3Props) {
  const t: ClientCardV3Labels = { ...DEFAULT_CLIENT_CARD_LABELS, ...labels };
  const palette = getStatusPalette(status);
  const isRow = layout === 'row';
  const isCompact = layout === 'compact';
  const interactive = !disabled && !loading;

  const accessibleLabel = [name, statusLabel, vipLabel].filter(Boolean).join(', ');

  const handleOpen = () => interactive && onOpenDetails?.(id);
  const handleEdit = () => interactive && onEdit?.(id);
  const handleDelete = () => interactive && onDelete?.(id);

  if (loading) {
    return (
      <View style={[styles.card, isRow && styles.cardRow]} accessibilityRole="none">
        <View style={[styles.headerRow, isRow && styles.headerRowInRow]}>
          <SkeletonBlock style={{ width: 44, height: 44, borderRadius: theme.radius.lg }} />
          <View style={{ marginLeft: theme.space.md, flex: 1 }}>
            <SkeletonBlock style={{ width: '55%', height: 14, marginBottom: theme.space.sm }} />
            <SkeletonBlock style={{ width: '35%', height: 10 }} />
          </View>
        </View>
        <View style={styles.statsGrid}>
          <SkeletonBlock style={{ width: '46%', height: 40, marginBottom: theme.space.sm }} />
          <SkeletonBlock style={{ width: '46%', height: 40, marginBottom: theme.space.sm }} />
          <SkeletonBlock style={{ width: '46%', height: 40 }} />
          <SkeletonBlock style={{ width: '46%', height: 40 }} />
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={handleOpen}
      disabled={!interactive}
      accessibilityRole="button"
      accessibilityLabel={`${accessibleLabel}. ${t.openDetailsAction}`}
      accessibilityState={{ selected, disabled }}
      style={({ pressed }: { pressed: boolean }) => [
        styles.card,
        isRow && styles.cardRow,
        isCompact && styles.cardCompact,
        selected && styles.cardSelected,
        disabled && styles.cardDisabled,
        pressed && interactive && styles.cardPressed,
      ]}
    >
      <View style={[styles.headerRow, isRow && styles.headerRowInRow]}>
        <View
          style={[
            styles.avatar,
            { borderColor: status === 'vip' ? theme.color.gold : theme.color.violet },
          ]}
        >
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.identityBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {!!vipLabel && status !== 'vip' && (
              <View style={[styles.badge, { backgroundColor: theme.color.goldSoft }]}>
                <Text style={[styles.badgeText, { color: theme.color.gold }]}>{vipLabel}</Text>
              </View>
            )}
          </View>
          <View style={[styles.badge, { backgroundColor: palette.bg, alignSelf: 'flex-start' }]}>
            <Text style={[styles.badgeText, { color: palette.fg }]}>{statusLabel}</Text>
          </View>
        </View>

        {isRow && renderStatsInline()}
      </View>

      {!isRow && (phone || email) && (
        <View style={styles.contactRow}>
          {!!phone && (
            <View style={styles.contactItem}>
              <Text style={styles.contactCaption}>{t.phoneField}</Text>
              <Text style={styles.contactValue} numberOfLines={1}>
                {phone}
              </Text>
            </View>
          )}
          {!!email && (
            <View style={styles.contactItem}>
              <Text style={styles.contactCaption}>{t.emailField}</Text>
              <Text style={styles.contactValue} numberOfLines={1}>
                {email}
              </Text>
            </View>
          )}
        </View>
      )}

      {!isRow && renderStatsGrid()}

      {!isRow && !isCompact && (
        <View style={styles.notesBlock}>
          <Text style={styles.notesCaption}>{t.notesField}</Text>
          <Text style={styles.notesText} numberOfLines={2}>
            {notesPreview || t.noNotes}
          </Text>
        </View>
      )}

      <View style={[styles.actionsRow, isRow && styles.actionsRowInRow]}>
        <Pressable
          onPress={handleEdit}
          disabled={!interactive}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${t.editAction} ${name}`}
          accessibilityState={{ disabled }}
          style={({ pressed }: { pressed: boolean }) => [
            styles.editButton,
            pressed && interactive && styles.editButtonPressed,
          ]}
        >
          <Text style={styles.editButtonText}>{t.editAction}</Text>
          <ChevronGlyph color={theme.color.violet} />
        </Pressable>

        <Pressable
          onPress={handleDelete}
          disabled={!interactive}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${t.deleteAction} ${name}`}
          accessibilityHint={t.destructiveHint}
          accessibilityState={{ disabled }}
          style={({ pressed }: { pressed: boolean }) => [
            styles.deleteButton,
            pressed && interactive && styles.deleteButtonPressed,
          ]}
        >
          <Text style={styles.deleteButtonText}>{t.deleteAction}</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  function renderStatsGrid() {
    const items = [
      { label: t.lastVisitField, value: lastVisitLabel },
      { label: t.upcomingAppointmentField, value: upcomingAppointmentLabel || t.noUpcomingAppointment },
    ];
    if (!isCompact) {
      items.push(
        { label: t.visitCountField, value: visitCountLabel },
        { label: t.lifetimeValueField, value: lifetimeValueLabel }
      );
    } else {
      items.push({ label: t.lifetimeValueField, value: lifetimeValueLabel });
    }
    return (
      <View style={styles.statsGrid}>
        {items.map((item, index) => (
          <View key={index} style={styles.statChip}>
            <Text style={styles.statLabel}>{item.label}</Text>
            <Text style={styles.statValue} numberOfLines={1}>
              {item.value || '—'}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  function renderStatsInline() {
    return (
      <View style={styles.statsInline}>
        <View style={styles.statInlineItem}>
          <Text style={styles.statLabel}>{t.lastVisitField}</Text>
          <Text style={styles.statValue}>{lastVisitLabel || '—'}</Text>
        </View>
        <View style={styles.statInlineItem}>
          <Text style={styles.statLabel}>{t.visitCountField}</Text>
          <Text style={styles.statValue}>{visitCountLabel || '—'}</Text>
        </View>
        <View style={styles.statInlineItem}>
          <Text style={styles.statLabel}>{t.lifetimeValueField}</Text>
          <Text style={styles.statValue}>{lifetimeValueLabel || '—'}</Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    shadowColor: '#8C6CFF',
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
    padding: theme.space.lg,
  },
  cardRow: {
    flexDirection: 'column',
  },
  cardCompact: {
    padding: theme.space.md,
  },
  cardSelected: {
    borderColor: theme.color.violet,
    shadowColor: theme.color.violet,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardPressed: {
    backgroundColor: theme.color.surfaceRaised,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRowInRow: {
    marginBottom: 0,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(198, 174, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.surfaceAlt,
  },
  avatarText: {
    color: theme.color.textPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
  identityBlock: {
    marginLeft: theme.space.md,
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.space.xs,
  },
  name: {
    color: theme.color.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginRight: theme.space.sm,
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: theme.space.sm,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  contactRow: {
    flexDirection: 'row',
    marginTop: theme.space.lg,
    gap: theme.space.lg,
  },
  contactItem: {
    flex: 1,
    minWidth: 0,
  },
  contactCaption: {
    color: theme.color.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  contactValue: {
    color: theme.color.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.space.lg,
    gap: theme.space.sm,
  },
  statChip: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: theme.color.surfaceAlt,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(180, 150, 255, 0.14)',
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.md,
  },
  statsInline: {
    flexDirection: 'row',
    marginLeft: 'auto',
    gap: theme.space.xl,
  },
  statInlineItem: {
    alignItems: 'flex-start',
    minWidth: 90,
  },
  statLabel: {
    color: theme.color.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statValue: {
    color: theme.color.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  notesBlock: {
    marginTop: theme.space.lg,
    borderLeftWidth: 2,
    borderLeftColor: theme.color.violetSoft,
    paddingLeft: theme.space.md,
  },
  notesCaption: {
    color: theme.color.textTertiary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  notesText: {
    color: theme.color.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: theme.space.lg,
    gap: theme.space.xl,
  },
  actionsRowInRow: {
    marginTop: theme.space.md,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: theme.space.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.violetSoft,
  },
  editButtonPressed: {
    backgroundColor: theme.color.violetSoft,
  },
  editButtonText: {
    color: theme.color.violet,
    fontSize: 13,
    fontWeight: '600',
    marginRight: 2,
  },
  deleteButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: theme.space.sm,
  },
  deleteButtonPressed: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: theme.color.red,
    fontSize: 13,
    fontWeight: '500',
  },
});

export default ClientCardV3;
