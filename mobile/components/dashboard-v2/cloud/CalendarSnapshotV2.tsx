import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type CalendarEventTone = 'royal' | 'gold' | 'blue' | 'green' | 'red';

export interface CalendarEvent {
  id: string;
  time: string; // e.g. "2:30 PM"
  clientName: string;
  serviceName: string;
  staffName?: string;
  tone: CalendarEventTone;
  statusLabel?: string; // e.g. "Confirmed", "Pending"
}

export interface CalendarSnapshotV2Props {
  title: string;
  dateLabel: string;
  events: CalendarEvent[];
  emptyLabel: string;
}

const colors = {
  surface: '#171938',
  surfaceRaised: '#1D1F47',
  border: 'rgba(255,255,255,0.07)',
  textPrimary: '#F6F5FB',
  textSecondary: '#A6A7C4',
  textTertiary: '#6F7092',
} as const;

const toneColorMap: Record<CalendarEventTone, { fg: string; bg: string }> = {
  royal: { fg: '#7C5CFF', bg: 'rgba(124,92,255,0.14)' },
  gold: { fg: '#E8C97A', bg: 'rgba(232,201,122,0.14)' },
  blue: { fg: '#5CB8FF', bg: 'rgba(92,184,255,0.14)' },
  green: { fg: '#3FCF8E', bg: 'rgba(63,207,142,0.14)' },
  red: { fg: '#F2617A', bg: 'rgba(242,97,122,0.14)' },
};

/**
 * CalendarSnapshotV2 — compact upcoming-schedule timeline. Presentation
 * only: every entry arrives via props. Self-contained, no external
 * packages, no SVG — the connecting timeline is a plain View column
 * (fixed dot + flexed line) that stretches to match each row's height.
 */
function CalendarSnapshotV2({ title, dateLabel, events, emptyLabel }: CalendarSnapshotV2Props) {
  const isEmpty = !events || events.length === 0;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.dateChip}>
          <Text style={styles.dateChipText} numberOfLines={1}>
            {dateLabel}
          </Text>
        </View>
      </View>

      {isEmpty ? (
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      ) : (
        <View style={styles.timeline}>
          {events.map((event, i) => {
            const tone = toneColorMap[event.tone];
            const isLast = i === events.length - 1;
            const showMeta = !!event.staffName || !!event.statusLabel;

            return (
              <View key={event.id} style={[styles.row, isLast && styles.rowLast]}>
                <View style={styles.timeCol}>
                  <Text style={styles.timeText} numberOfLines={1}>
                    {event.time}
                  </Text>
                </View>

                <View style={styles.rail}>
                  <View style={[styles.railDot, { backgroundColor: tone.fg }]} />
                  {!isLast && <View style={styles.railLine} />}
                </View>

                <View style={styles.detailsCol}>
                  <View style={[styles.detailsCard, { borderLeftColor: tone.fg }]}>
                    <Text style={styles.clientName} numberOfLines={1}>
                      {event.clientName}
                    </Text>
                    <Text style={styles.serviceName} numberOfLines={1}>
                      {event.serviceName}
                    </Text>
                    {showMeta && (
                      <View style={styles.metaRow}>
                        {!!event.staffName && (
                          <Text style={styles.metaText} numberOfLines={1}>
                            {event.staffName}
                          </Text>
                        )}
                        {!!event.statusLabel && (
                          <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
                            <Text style={[styles.statusText, { color: tone.fg }]} numberOfLines={1}>
                              {event.statusLabel}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
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
  dateChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 150,
  },
  dateChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  timeline: {
    marginTop: 18,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  rowLast: {
    marginBottom: 0,
  },
  timeCol: {
    width: 52,
    paddingTop: 2,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  rail: {
    width: 16,
    alignItems: 'center',
  },
  railDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginTop: 4,
  },
  railLine: {
    flex: 1,
    width: 2,
    marginTop: 4,
    borderRadius: 1,
    backgroundColor: colors.border,
  },
  detailsCol: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },
  detailsCard: {
    backgroundColor: colors.surfaceRaised,
    borderLeftWidth: 3,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  serviceName: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
  },
  metaRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 11,
    color: colors.textTertiary,
    marginRight: 8,
  },
  statusPill: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 18,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
});

export default React.memo(CalendarSnapshotV2);
