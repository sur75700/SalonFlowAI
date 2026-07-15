#!/usr/bin/env bash
set -euo pipefail

# ==========================================================================
# SalonFlowAI — Booking V2 Presentation Layer Installer
# ==========================================================================
# Creates 9 new, isolated presentation-layer files under mobile/. Touches
# nothing else. Does not replace the production appointments route. Does
# not commit. Backs up any pre-existing target files (there should be
# none — these are new files) and rolls back automatically if typecheck
# fails.
#
# Run from your repository root (the directory containing `mobile/`).
# Requires: bash, git, npm (with a `typecheck` script defined).
# ==========================================================================

REPO_ROOT="$(pwd)"
MOBILE_DIR="$REPO_ROOT/mobile"
BACKUP_DIR="$REPO_ROOT/.booking-v2-install-backup-$(date +%Y%m%d%H%M%S)"

FILES=(
  "mobile/components/booking-v2/BookingCommandHeaderV2.tsx"
  "mobile/components/booking-v2/BookingSummaryStripV2.tsx"
  "mobile/components/booking-v2/BookingStatusFilterV2.tsx"
  "mobile/components/booking-v2/BookingCardV2.tsx"
  "mobile/components/booking-v2/BookingListSectionV2.tsx"
  "mobile/components/booking-v2/CreateBookingSheetV2.tsx"
  "mobile/components/booking-v2/BookingCenterCompositionV2.tsx"
  "mobile/components/booking-v2/BookingCenterPreviewAdapterV2.tsx"
  "mobile/app/booking-v2.tsx"
)

echo "== SalonFlowAI Booking V2 installer =="
echo "Repo root (assumed CWD): $REPO_ROOT"
echo ""

if [ ! -d "$MOBILE_DIR" ]; then
  echo "ERROR: mobile/ not found in $REPO_ROOT." >&2
  echo "Run this script from the repository root (the directory containing mobile/)." >&2
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "ERROR: git is required but was not found on PATH." >&2
  exit 1
fi

mkdir -p "$REPO_ROOT/mobile/components/booking-v2"
mkdir -p "$REPO_ROOT/mobile/app"
mkdir -p "$BACKUP_DIR"

echo "-- Backing up any pre-existing target files to $BACKUP_DIR --"
BACKED_UP=0
for f in "${FILES[@]}"; do
  if [ -f "$REPO_ROOT/$f" ]; then
    mkdir -p "$BACKUP_DIR/$(dirname "$f")"
    cp "$REPO_ROOT/$f" "$BACKUP_DIR/$f"
    echo "  backed up (pre-existing): $f"
    BACKED_UP=1
  fi
done
if [ "$BACKED_UP" -eq 0 ]; then
  echo "  none of the 9 target files pre-existed — all will be new files."
fi

rollback() {
  trap - ERR
  echo ""
  echo "== ROLLBACK: restoring previous state =="
  for f in "${FILES[@]}"; do
    if [ -f "$BACKUP_DIR/$f" ]; then
      mkdir -p "$(dirname "$REPO_ROOT/$f")"
      cp "$BACKUP_DIR/$f" "$REPO_ROOT/$f"
      echo "  restored (was pre-existing): $f"
    else
      if [ -f "$REPO_ROOT/$f" ]; then
        rm -f "$REPO_ROOT/$f"
        echo "  removed (was new, no prior version): $f"
      fi
    fi
  done
  echo "Rollback complete. Backup retained at: $BACKUP_DIR"
  exit 1
}

trap 'echo "Unexpected error — rolling back."; rollback' ERR

echo ""
echo "-- Writing files --"

cat > "$REPO_ROOT/mobile/components/booking-v2/BookingCommandHeaderV2.tsx" << 'SALONFLOW_BOOKINGV2_EOF'
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export interface BookingCommandHeaderV2Props {
  /** Pre-translated — this component never calls t() itself. */
  title: string;
  subtitle?: string;
  primaryActionLabel: string;
  onPressPrimaryAction: () => void;
  /**
   * Maps to the real "Booking Flow Connected" / "...Subtitle" i18n keys
   * (confirmed real, translated). Optional and only rendered when
   * provided — Tony decides the real trigger condition; this component
   * just displays it.
   */
  connectionStatusLabel?: string;
  connectionStatusSubtitle?: string;
}

const colors = {
  royal: '#7C5CFF',
  royalGlow: 'rgba(124,92,255,0.30)',
  gold: '#E8C97A',
  textPrimary: '#F6F5FB',
  textSecondary: '#A6A7C4',
  positive: '#3FCF8E',
  positiveSoft: 'rgba(63,207,142,0.14)',
} as const;

/**
 * BookingCommandHeaderV2 — presentation-only. No fetch, no business
 * logic. The connection-status pill is optional and purely reflects
 * whatever boolean/state Tony wires it to.
 */
function BookingCommandHeaderV2({
  title,
  subtitle,
  primaryActionLabel,
  onPressPrimaryAction,
  connectionStatusLabel,
  connectionStatusSubtitle,
}: BookingCommandHeaderV2Props) {
  return (
    <View style={styles.card}>
      <View style={styles.glow} pointerEvents="none" />

      <View style={styles.topRow}>
        <View style={styles.titleCol}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {!!subtitle && (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          )}
        </View>

        <Pressable
          onPress={onPressPrimaryAction}
          accessibilityRole="button"
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
        >
          <Text style={styles.primaryBtnText} numberOfLines={1}>
            {primaryActionLabel}
          </Text>
        </Pressable>
      </View>

      {!!connectionStatusLabel && (
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <View style={styles.statusTextCol}>
            <Text style={styles.statusLabel} numberOfLines={1}>
              {connectionStatusLabel}
            </Text>
            {!!connectionStatusSubtitle && (
              <Text style={styles.statusSubtitle} numberOfLines={1}>
                {connectionStatusSubtitle}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: '#171938',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -70,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: colors.royalGlow,
    opacity: 0.35,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  primaryBtn: {
    backgroundColor: colors.royal,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  primaryBtnPressed: {
    opacity: 0.85,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F6F5FB',
  },
  statusPill: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.positiveSoft,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.positive,
    marginRight: 10,
  },
  statusTextCol: {
    flex: 1,
    minWidth: 0,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.positive,
  },
  statusSubtitle: {
    marginTop: 1,
    fontSize: 11,
    color: colors.textSecondary,
  },
});

export default React.memo(BookingCommandHeaderV2);
SALONFLOW_BOOKINGV2_EOF
echo "  wrote: mobile/components/booking-v2/BookingCommandHeaderV2.tsx"

cat > "$REPO_ROOT/mobile/components/booking-v2/BookingSummaryStripV2.tsx" << 'SALONFLOW_BOOKINGV2_EOF'
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface BookingSummaryStat {
  label: string;
  value: string;
  tone?: 'royal' | 'gold' | 'blue' | 'green' | 'red';
}

export interface BookingSummaryStripV2Props {
  stats: BookingSummaryStat[];
}

const colors = {
  surface: '#171938',
  border: 'rgba(255,255,255,0.07)',
  textPrimary: '#F6F5FB',
  textTertiary: '#6F7092',
} as const;

const toneColorMap = {
  royal: '#7C5CFF',
  gold: '#E8C97A',
  blue: '#5CB8FF',
  green: '#3FCF8E',
  red: '#F2617A',
} as const;

/**
 * BookingSummaryStripV2 — compact operational counters (Today / Total /
 * Upcoming in the current build). Deliberately not 3 full KPI cards: this
 * sits above the fold as a quick-read strip, not a competing hierarchy
 * against the booking stream itself.
 */
function BookingSummaryStripV2({ stats }: BookingSummaryStripV2Props) {
  return (
    <View style={styles.row}>
      {stats.map((stat, i) => (
        <React.Fragment key={stat.label}>
          <View style={styles.cell}>
            <Text
              style={[styles.value, stat.tone && { color: toneColorMap[stat.tone] }]}
              numberOfLines={1}
            >
              {stat.value}
            </Text>
            <Text style={styles.label} numberOfLines={1}>
              {stat.label}
            </Text>
          </View>
          {i < stats.length - 1 && <View style={styles.divider} />}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingVertical: 14,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  label: {
    marginTop: 3,
    fontSize: 11,
    color: colors.textTertiary,
  },
});

export default React.memo(BookingSummaryStripV2);
SALONFLOW_BOOKINGV2_EOF
echo "  wrote: mobile/components/booking-v2/BookingSummaryStripV2.tsx"

cat > "$REPO_ROOT/mobile/components/booking-v2/BookingStatusFilterV2.tsx" << 'SALONFLOW_BOOKINGV2_EOF'
import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';

/** Only the 3 confirmed-real statuses, plus 'all' — matches BookingCardV2. */
export type BookingFilterValue = 'all' | 'scheduled' | 'completed' | 'cancelled';

export interface BookingFilterOption {
  value: BookingFilterValue;
  /** Pre-translated label — this component never calls t() itself. */
  label: string;
}

export interface BookingStatusFilterV2Props {
  options: BookingFilterOption[];
  value: BookingFilterValue;
  onChange: (value: BookingFilterValue) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

const colors = {
  surface: '#171938',
  surfaceRaised: '#1D1F47',
  border: 'rgba(255,255,255,0.07)',
  royal: '#7C5CFF',
  textPrimary: '#F6F5FB',
  textSecondary: '#A6A7C4',
  textTertiary: '#6F7092',
} as const;

/**
 * BookingStatusFilterV2 — presentation-only segmented filter + optional
 * search. `onChange`/`onSearchChange` are the only side effects; this
 * component holds no state of its own (fully controlled).
 */
function BookingStatusFilterV2({
  options,
  value,
  onChange,
  searchValue,
  onSearchChange,
  searchPlaceholder,
}: BookingStatusFilterV2Props) {
  return (
    <View style={styles.card}>
      {onSearchChange !== undefined && (
        <TextInput
          value={searchValue}
          onChangeText={onSearchChange}
          placeholder={searchPlaceholder}
          placeholderTextColor={colors.textTertiary}
          style={styles.searchInput}
        />
      )}

      <View style={styles.segmentRow}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.segment, active && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]} numberOfLines={1}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  segment: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentActive: {
    backgroundColor: colors.royal,
    borderColor: colors.royal,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: '#F6F5FB',
    fontWeight: '700',
  },
});

export default React.memo(BookingStatusFilterV2);
SALONFLOW_BOOKINGV2_EOF
echo "  wrote: mobile/components/booking-v2/BookingStatusFilterV2.tsx"

cat > "$REPO_ROOT/mobile/components/booking-v2/BookingCardV2.tsx" << 'SALONFLOW_BOOKINGV2_EOF'
import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * Only the 3 statuses confirmed real in the backend model
 * (AppointmentStatus = "scheduled" | "completed" | "cancelled",
 * confirmed during Dashboard V2 inspection). 'Confirmed' / 'No-show' /
 * 'Pending' from the design brief are NOT added to this runtime type —
 * the tone map below is structured so adding them later is a one-line
 * addition per status, once backend actually exposes them.
 */
export type BookingStatus = 'scheduled' | 'completed' | 'cancelled';

export interface BookingCardV2Props {
  /** Pre-formatted display strings only — no Date objects, no formatting logic here. */
  time: string;
  endTime?: string;
  /** Missing real value → fallback label renders instead (pre-translated), never a blank line. */
  clientName?: string;
  clientFallbackLabel?: string;
  serviceName?: string;
  serviceFallbackLabel?: string;
  status: BookingStatus;
  /** Pre-translated display label — this component never calls t() itself. */
  statusLabel: string;
  staffName?: string;
  /** Pre-formatted — derive from starts_at/ends_at upstream, never computed here. */
  durationLabel?: string;
  notes?: string;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  /** Pre-translated — only used if onEdit/onDelete are provided. */
  editLabel?: string;
  deleteLabel?: string;
  /** Tighter density for narrow phones */
  compact?: boolean;
  loading?: boolean;
  selected?: boolean;
  disabled?: boolean;
}

const colors = {
  surface: '#171938',
  surfaceRaised: '#1D1F47',
  surfaceSelected: '#22244F',
  border: 'rgba(255,255,255,0.07)',
  borderSelected: 'rgba(124,92,255,0.45)',
  textPrimary: '#F6F5FB',
  textSecondary: '#A6A7C4',
  textTertiary: '#6F7092',
} as const;

const statusToneMap: Record<BookingStatus, { fg: string; bg: string }> = {
  scheduled: { fg: '#5CB8FF', bg: 'rgba(92,184,255,0.14)' },
  completed: { fg: '#3FCF8E', bg: 'rgba(63,207,142,0.14)' },
  cancelled: { fg: '#F2617A', bg: 'rgba(242,97,122,0.14)' },
};

/**
 * BookingCardV2 — data-agnostic presentation component. Hierarchy is
 * fixed by design: TIME (left, anchor) → CLIENT (primary) → SERVICE
 * (secondary) → STATUS (badge). Edit/Delete render only when their
 * handlers are provided; this component never assumes an action exists,
 * never calls t(), never fetches, never computes business logic.
 */
function BookingCardV2({
  time,
  endTime,
  clientName,
  clientFallbackLabel,
  serviceName,
  serviceFallbackLabel,
  status,
  statusLabel,
  staffName,
  durationLabel,
  notes,
  onPress,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
  compact = false,
  loading = false,
  selected = false,
  disabled = false,
}: BookingCardV2Props) {
  const tone = statusToneMap[status];
  const hasActions = (!!onEdit || !!onDelete) && !loading && !disabled;
  const hasMeta = !!staffName || !!durationLabel;
  const isInteractive = !!onPress && !disabled && !loading;

  const CardShell = isInteractive ? Pressable : View;

  if (loading) {
    return (
      <View style={[styles.card, { padding: compact ? 12 : 16 }, styles.loadingCard]}>
        <ActivityIndicator color={colors.textSecondary} />
      </View>
    );
  }

  return (
    <CardShell
      onPress={isInteractive ? onPress : undefined}
      accessibilityRole={isInteractive ? 'button' : undefined}
      accessibilityState={{ selected, disabled }}
      style={({ pressed }: any) => [
        styles.card,
        { padding: compact ? 12 : 16 },
        selected && styles.cardSelected,
        disabled && styles.cardDisabled,
        isInteractive && pressed ? styles.cardPressed : null,
      ]}
    >
      <View style={styles.timeCol}>
        <Text style={styles.timeStart} numberOfLines={1}>
          {time}
        </Text>
        {!!endTime && (
          <Text style={styles.timeEnd} numberOfLines={1}>
            {endTime}
          </Text>
        )}
      </View>

      <View style={styles.rail} />

      <View style={styles.detailsCol}>
        <View style={styles.topRow}>
          <Text style={styles.clientName} numberOfLines={1}>
            {clientName || clientFallbackLabel}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: tone.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: tone.fg }]} />
            <Text style={[styles.statusText, { color: tone.fg }]} numberOfLines={1}>
              {statusLabel}
            </Text>
          </View>
        </View>

        <Text style={styles.serviceName} numberOfLines={1}>
          {serviceName || serviceFallbackLabel}
        </Text>

        {hasMeta && (
          <View style={styles.metaRow}>
            {!!staffName && (
              <Text style={styles.metaText} numberOfLines={1}>
                {staffName}
              </Text>
            )}
            {!!durationLabel && (
              <Text style={styles.metaText} numberOfLines={1}>
                {staffName ? ` · ${durationLabel}` : durationLabel}
              </Text>
            )}
          </View>
        )}

        {!!notes && (
          <Text style={styles.notesText} numberOfLines={2}>
            {notes}
          </Text>
        )}

        {hasActions && (
          <View style={styles.actionsRow}>
            {!!onEdit && (
              <Pressable onPress={onEdit} hitSlop={8} accessibilityRole="button" style={styles.actionBtn}>
                <Text style={styles.actionEditText}>{editLabel}</Text>
              </Pressable>
            )}
            {!!onDelete && (
              <Pressable onPress={onDelete} hitSlop={8} accessibilityRole="button" style={styles.actionBtn}>
                <Text style={styles.actionDeleteText}>{deleteLabel}</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </CardShell>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingCard: {
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPressed: {
    backgroundColor: colors.surfaceRaised,
  },
  cardSelected: {
    backgroundColor: colors.surfaceSelected,
    borderColor: colors.borderSelected,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  timeCol: {
    width: 64,
    paddingRight: 12,
  },
  timeStart: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timeEnd: {
    marginTop: 2,
    fontSize: 11,
    color: colors.textTertiary,
  },
  rail: {
    width: 1,
    backgroundColor: colors.border,
    marginRight: 12,
  },
  detailsCol: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clientName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    maxWidth: 130,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  serviceName: {
    marginTop: 3,
    fontSize: 13,
    color: colors.textSecondary,
  },
  metaRow: {
    marginTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  notesText: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 15,
    color: colors.textTertiary,
  },
  actionsRow: {
    marginTop: 10,
    flexDirection: 'row',
  },
  actionBtn: {
    marginRight: 16,
  },
  actionEditText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C5CFF',
  },
  actionDeleteText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F2617A',
  },
});

export default React.memo(BookingCardV2);
SALONFLOW_BOOKINGV2_EOF
echo "  wrote: mobile/components/booking-v2/BookingCardV2.tsx"

cat > "$REPO_ROOT/mobile/components/booking-v2/BookingListSectionV2.tsx" << 'SALONFLOW_BOOKINGV2_EOF'
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import BookingCardV2, { BookingCardV2Props } from './BookingCardV2';

export interface BookingListSectionV2Props {
  /** Pre-translated — this component never calls t() itself. */
  title: string;
  subtitle?: string;
  items: (BookingCardV2Props & { id: string })[];
  loading?: boolean;
  error?: string;
  emptyLabel: string;
}

const colors = {
  surface: '#171938',
  border: 'rgba(255,255,255,0.07)',
  textPrimary: '#F6F5FB',
  textSecondary: '#A6A7C4',
  textTertiary: '#6F7092',
  danger: '#F2617A',
  dangerSoft: 'rgba(242,97,122,0.12)',
} as const;

/**
 * BookingListSectionV2 — presentation-only section wrapper. Renders
 * loading / error / empty / populated states from props only; it never
 * fetches or decides *why* a state applies, only how it looks.
 */
function BookingListSectionV2({ title, subtitle, items, loading, error, emptyLabel }: BookingListSectionV2Props) {
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
      </View>
      {!!subtitle && (
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      )}

      <View style={styles.body}>
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.textSecondary} />
          </View>
        ) : error ? (
          <View style={[styles.centerState, styles.errorBox]}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyText}>{emptyLabel}</Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.cardWrap}>
              <BookingCardV2 {...item} />
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textTertiary,
  },
  body: {
    marginTop: 12,
  },
  cardWrap: {
    marginBottom: 10,
  },
  centerState: {
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderColor: 'transparent',
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
  },
});

export default React.memo(BookingListSectionV2);
SALONFLOW_BOOKINGV2_EOF
echo "  wrote: mobile/components/booking-v2/BookingListSectionV2.tsx"

cat > "$REPO_ROOT/mobile/components/booking-v2/CreateBookingSheetV2.tsx" << 'SALONFLOW_BOOKINGV2_EOF'
import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';

export interface BookingSelectOption {
  id: string;
  /** Pre-formatted display label (e.g. client name, service name). */
  label: string;
}

export interface CreateBookingQuickAction {
  /** Pre-translated label — e.g. real "Quick Next Hour" key text. */
  label: string;
  onPress: () => void;
}

export interface CreateBookingSheetV2Props {
  visible: boolean;
  onRequestClose: () => void;
  /** 'sheet' = mobile bottom sheet, 'panel' = desktop side panel. */
  layout: 'sheet' | 'panel';

  title: string;
  subtitle?: string;

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

  /**
   * Real underlying value is the datetime-local string produced by
   * formatDateTimeLocalInput() (e.g. "2026-07-15T09:00") — matches the
   * real screen's confirmed format exactly. Kept as a plain text field
   * (no new date-picker dependency assumed).
   */
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

  /** Pre-formatted validation/error presentation — this component never validates itself. */
  errorMessage?: string;
}

const colors = {
  scrim: 'rgba(7,7,15,0.6)',
  surface: '#171938',
  surfaceRaised: '#1D1F47',
  surfaceOption: '#22244F',
  border: 'rgba(255,255,255,0.08)',
  royal: '#7C5CFF',
  textPrimary: '#F6F5FB',
  textSecondary: '#A6A7C4',
  textTertiary: '#6F7092',
  danger: '#F2617A',
  dangerSoft: 'rgba(242,97,122,0.12)',
} as const;

function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

/** Inline expandable select — no external picker/modal dependency. */
function SelectField({
  value,
  placeholder,
  options,
  onSelect,
}: {
  value?: string;
  placeholder: string;
  options: BookingSelectOption[];
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);

  return (
    <View>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={styles.selectField}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text style={[styles.selectFieldText, !selected && styles.placeholderText]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={styles.selectChevron}>{open ? '▲' : '▼'}</Text>
      </Pressable>

      {open && (
        <View style={styles.optionList}>
          <ScrollView style={styles.optionScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {options.length === 0 ? (
              <Text style={styles.optionEmptyText}>—</Text>
            ) : (
              options.map((option) => {
                const isSelected = option.id === value;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      onSelect(option.id);
                      setOpen(false);
                    }}
                    style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[styles.optionRowText, isSelected && styles.optionRowTextSelected]}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

/**
 * CreateBookingSheetV2 — fully controlled, presentation-only. No fetch,
 * no submit logic, no field validation logic — every value and handler
 * arrives via props. Same fields as the real screen (Client, Service,
 * Booking Time + quick actions, Notes); nothing added, nothing removed.
 */
function CreateBookingSheetV2(props: CreateBookingSheetV2Props) {
  const {
    visible,
    onRequestClose,
    layout,
    title,
    subtitle,
    clientLabel,
    clientOptions,
    selectedClientId,
    clientPlaceholder,
    onSelectClient,
    serviceLabel,
    serviceOptions,
    selectedServiceId,
    servicePlaceholder,
    onSelectService,
    bookingTimeLabel,
    bookingTimeValue,
    onChangeBookingTime,
    quickActions,
    notesLabel,
    notesValue,
    onChangeNotes,
    notesPlaceholder,
    submitLabel,
    onSubmit,
    submitting,
    resetLabel,
    onReset,
    errorMessage,
  } = props;

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  const isSheet = layout === 'sheet';

  const containerAnimatedStyle = isSheet
    ? {
        transform: [
          { translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [480, 0] }) },
        ],
      }
    : {
        transform: [
          { translateX: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [420, 0] }) },
        ],
      };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onRequestClose} accessibilityRole="button" />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={isSheet ? styles.sheetOuter : styles.panelOuter}
        >
          <Animated.View style={[isSheet ? styles.sheet : styles.panel, containerAnimatedStyle]}>
            {isSheet && <View style={styles.grabber} />}

            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{title}</Text>
                {!!subtitle && (
                  <Text style={styles.subtitle} numberOfLines={2}>
                    {subtitle}
                  </Text>
                )}
              </View>
              <Pressable onPress={onRequestClose} hitSlop={8} accessibilityRole="button">
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {!!errorMessage && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              <FieldLabel>{clientLabel}</FieldLabel>
              <SelectField
                value={selectedClientId}
                placeholder={clientPlaceholder}
                options={clientOptions}
                onSelect={onSelectClient}
              />

              <View style={styles.fieldGap} />

              <FieldLabel>{serviceLabel}</FieldLabel>
              <SelectField
                value={selectedServiceId}
                placeholder={servicePlaceholder}
                options={serviceOptions}
                onSelect={onSelectService}
              />

              <FieldLabel>{bookingTimeLabel}</FieldLabel>
              <TextInput
                value={bookingTimeValue}
                onChangeText={onChangeBookingTime}
                style={styles.textInput}
                placeholderTextColor={colors.textTertiary}
              />

              <View style={styles.quickRow}>
                {quickActions.map((action) => (
                  <Pressable
                    key={action.label}
                    onPress={action.onPress}
                    style={({ pressed }) => [styles.quickChip, pressed && styles.quickChipPressed]}
                    accessibilityRole="button"
                  >
                    <Text style={styles.quickChipText} numberOfLines={1}>
                      {action.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <FieldLabel>{notesLabel}</FieldLabel>
              <TextInput
                value={notesValue}
                onChangeText={onChangeNotes}
                placeholder={notesPlaceholder}
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
                style={[styles.textInput, styles.notesInput]}
              />
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                onPress={onSubmit}
                disabled={submitting}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.submitBtn,
                  (pressed || submitting) && styles.submitBtnPressed,
                ]}
              >
                <Text style={styles.submitBtnText}>{submitting ? '…' : submitLabel}</Text>
              </Pressable>
              <Pressable onPress={onReset} accessibilityRole="button" style={styles.resetBtn}>
                <Text style={styles.resetBtnText}>{resetLabel}</Text>
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  sheetOuter: {
    width: '100%',
  },
  panelOuter: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
    maxHeight: '88%',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 20,
  },
  panel: {
    width: 420,
    maxWidth: '100%',
    height: '100%',
    backgroundColor: colors.surface,
    borderLeftWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  closeText: {
    fontSize: 16,
    color: colors.textTertiary,
    paddingLeft: 12,
  },
  scrollArea: {
    marginTop: 12,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: colors.textTertiary,
    marginBottom: 6,
    marginTop: 14,
  },
  fieldGap: {
    height: 2,
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  selectFieldText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    marginRight: 8,
  },
  selectChevron: {
    fontSize: 10,
    color: colors.textTertiary,
  },
  placeholderText: {
    color: colors.textTertiary,
  },
  optionList: {
    marginTop: 6,
    borderRadius: 14,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  optionScroll: {
    maxHeight: 168,
  },
  optionRow: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionRowSelected: {
    backgroundColor: colors.surfaceOption,
  },
  optionRowText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  optionRowTextSelected: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  optionEmptyText: {
    padding: 14,
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  textInput: {
    borderRadius: 14,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.textPrimary,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  quickRow: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(124,92,255,0.14)',
    marginRight: 8,
    marginBottom: 8,
  },
  quickChipPressed: {
    backgroundColor: 'rgba(124,92,255,0.26)',
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.royal,
  },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
  },
  footer: {
    marginTop: 16,
  },
  submitBtn: {
    backgroundColor: colors.royal,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnPressed: {
    opacity: 0.85,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F6F5FB',
  },
  resetBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 8,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
  },
});

export default React.memo(CreateBookingSheetV2);
SALONFLOW_BOOKINGV2_EOF
echo "  wrote: mobile/components/booking-v2/CreateBookingSheetV2.tsx"

cat > "$REPO_ROOT/mobile/components/booking-v2/BookingCenterCompositionV2.tsx" << 'SALONFLOW_BOOKINGV2_EOF'
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
    />
  );

  const registrySection = (
    <BookingListSectionV2
      title={props.registrySectionTitle}
      items={props.registryAppointments}
      loading={props.loading}
      error={props.error}
      emptyLabel={props.emptyLabel}
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
                <View style={styles.rightRail}>
                  {/* Rail re-shows Today's stream compactly for at-a-glance
                      context — no duplicated summary numbers or filters. */}
                  {todaySection}
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  pageInner: {
    width: '100%',
  },
  pageInnerDesktop: {
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
  },
  sectionGap: {
    marginBottom: 20,
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
    flex: 1,
    minWidth: 280,
  },
});

export default React.memo(BookingCenterCompositionV2);
SALONFLOW_BOOKINGV2_EOF
echo "  wrote: mobile/components/booking-v2/BookingCenterCompositionV2.tsx"

cat > "$REPO_ROOT/mobile/components/booking-v2/BookingCenterPreviewAdapterV2.tsx" << 'SALONFLOW_BOOKINGV2_EOF'
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
      time: '4:30 PM',
      endTime: '5:30 PM',
      clientName: 'Lilit Hakobyan',
      serviceName: 'Manicure Gel',
      status: 'scheduled' as PreviewStatus,
      statusLabel: t('Scheduled', locale as any),
      editLabel: t('Edit', locale as any),
      deleteLabel: t('Delete', locale as any),
    },
  ];
}

function buildPreviewUpcoming(locale: string): BookingListItem[] {
  return [
    {
      id: 'pv-2',
      time: '7/16, 6:30 PM',
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
      time: '7/17, 10:30 AM',
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
      time: '4/17',
      clientName: 'Ani Petrosyan',
      serviceName: 'Hair Coloring',
      status: 'cancelled' as PreviewStatus,
      statusLabel: t('Cancelled', locale as any),
      notes: 'Demo historical appointment.',
      editLabel: t('Edit', locale as any),
      deleteLabel: t('Delete', locale as any),
    },
    {
      id: 'pv-5',
      time: '4/18',
      clientName: 'Mariam Sargsyan',
      serviceName: 'Keratin Treatment',
      status: 'completed' as PreviewStatus,
      statusLabel: t('Completed', locale as any),
      notes: 'Demo historical appointment.',
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
        { label: t('TodayLabel', locale as any), value: String(today.length), tone: 'royal' },
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
SALONFLOW_BOOKINGV2_EOF
echo "  wrote: mobile/components/booking-v2/BookingCenterPreviewAdapterV2.tsx"

cat > "$REPO_ROOT/mobile/app/booking-v2.tsx" << 'SALONFLOW_BOOKINGV2_EOF'
import React from 'react';
import BookingCenterPreviewAdapterV2 from '../components/booking-v2/BookingCenterPreviewAdapterV2';

/**
 * Isolated preview route — mobile/app/booking-v2.tsx
 *
 * Renders the PREVIEW ADAPTER (sample data, visual QA only), not the
 * bare composition. Does NOT replace the production appointments route.
 * The production route should render <BookingCenterCompositionV2 />
 * directly with real props — never this adapter.
 */
export default function BookingV2PreviewRoute() {
  return <BookingCenterPreviewAdapterV2 />;
}
SALONFLOW_BOOKINGV2_EOF
echo "  wrote: mobile/app/booking-v2.tsx"

echo ""
echo "-- Verifying all expected files exist --"
MISSING=0
for f in "${FILES[@]}"; do
  if [ ! -f "$REPO_ROOT/$f" ]; then
    echo "  MISSING: $f"
    MISSING=1
  else
    echo "  OK: $f"
  fi
done
if [ "$MISSING" -ne 0 ]; then
  echo "ERROR: one or more expected files missing after write." >&2
  rollback
fi

echo ""
echo "-- Confirming the production appointments route was not touched --"
if git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if git -C "$REPO_ROOT" diff --name-only -- '*appointments.tsx' 2>/dev/null | grep -v 'booking-v2' | grep -q 'appointments.tsx'; then
    echo "ERROR: a file matching *appointments.tsx outside booking-v2 appears modified. Aborting." >&2
    rollback
  else
    echo "  OK — no appointments.tsx route touched."
  fi
else
  echo "  (not a git repository — skipping this check; no route file was written by this script regardless)"
fi

echo ""
echo "-- Running npm run typecheck --"
if [ -f "$REPO_ROOT/package.json" ]; then
  if ! (cd "$REPO_ROOT" && npm run typecheck); then
    echo "" 
    echo "ERROR: npm run typecheck failed. Rolling back all changes made by this script." >&2
    rollback
  fi
  echo "  typecheck passed."
else
  echo "  WARNING: no package.json found at repo root — skipping typecheck. Run it manually before relying on this change."
fi

echo ""
echo "-- git diff --check (whitespace / conflict-marker check on working tree) --"
if git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if ! git -C "$REPO_ROOT" diff --check; then
    echo "  WARNING: git diff --check reported issues above. Not rolled back for this alone — review before committing."
  else
    echo "  clean."
  fi
else
  echo "  (not a git repository — skipping)"
fi

echo ""
echo "-- git status --short --"
if git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git -C "$REPO_ROOT" status --short
else
  echo "  (not a git repository — skipping)"
fi

trap - ERR
echo ""
echo "== Done. 9 files written. No commit made. No production route touched. =="
echo "== Backup (only relevant if any file pre-existed) retained at: $BACKUP_DIR =="
