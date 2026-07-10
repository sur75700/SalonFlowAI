import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type ActivityTone = 'royal' | 'gold' | 'blue' | 'green' | 'red';

export interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  timeLabel: string; // e.g. "2h ago", "Just now"
  actorName?: string;
  /** No icon library dependency — pass whatever the host app already renders icons with. Falls back to a monogram. */
  icon?: React.ReactNode;
  tone: ActivityTone;
  statusLabel?: string;
}

export interface RecentActivityV2Props {
  title: string;
  activities: ActivityItem[];
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

const toneColorMap: Record<ActivityTone, { fg: string; bg: string }> = {
  royal: { fg: '#7C5CFF', bg: 'rgba(124,92,255,0.14)' },
  gold: { fg: '#E8C97A', bg: 'rgba(232,201,122,0.14)' },
  blue: { fg: '#5CB8FF', bg: 'rgba(92,184,255,0.14)' },
  green: { fg: '#3FCF8E', bg: 'rgba(63,207,142,0.14)' },
  red: { fg: '#F2617A', bg: 'rgba(242,97,122,0.14)' },
};

/**
 * RecentActivityV2 — compact chronological activity feed. Presentation
 * only: every entry arrives via props, order is whatever the caller
 * passes in. Self-contained, no external packages, no SVG — the
 * connecting timeline is a plain View column (icon chip + flexed line)
 * that stretches to match each row's height.
 */
function RecentActivityV2({ title, activities, emptyLabel }: RecentActivityV2Props) {
  const isEmpty = !activities || activities.length === 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      {isEmpty ? (
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      ) : (
        <View style={styles.feed}>
          {activities.map((activity, index) => {
            const tone = toneColorMap[activity.tone];
            const isLast = index === activities.length - 1;
            const monogram = activity.title.trim().charAt(0).toUpperCase();
            const hasMeta = !!activity.actorName || !!activity.statusLabel;

            return (
              <View key={activity.id} style={[styles.row, isLast && styles.rowLast]}>
                <View style={styles.rail}>
                  <View style={[styles.railIcon, { backgroundColor: tone.bg }]}>
                    {activity.icon ?? <Text style={[styles.railMonogram, { color: tone.fg }]}>{monogram}</Text>}
                  </View>
                  {!isLast && <View style={styles.railLine} />}
                </View>

                <View style={styles.detailsCol}>
                  <View style={styles.titleRow}>
                    <Text style={styles.activityTitle} numberOfLines={1}>
                      {activity.title}
                    </Text>
                    <Text style={styles.timeLabel} numberOfLines={1}>
                      {activity.timeLabel}
                    </Text>
                  </View>

                  {!!activity.description && (
                    <Text style={styles.description} numberOfLines={2}>
                      {activity.description}
                    </Text>
                  )}

                  {hasMeta && (
                    <View style={styles.metaRow}>
                      {!!activity.actorName && (
                        <Text style={styles.actorText} numberOfLines={1}>
                          {activity.actorName}
                        </Text>
                      )}
                      {!!activity.statusLabel && (
                        <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
                          <Text style={[styles.statusText, { color: tone.fg }]} numberOfLines={1}>
                            {activity.statusLabel}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
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
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  feed: {
    marginTop: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  rowLast: {
    marginBottom: 0,
  },
  rail: {
    width: 28,
    alignItems: 'center',
  },
  railIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railMonogram: {
    fontSize: 11,
    fontWeight: '700',
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
    paddingBottom: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: 8,
  },
  timeLabel: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  description: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  metaRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  actorText: {
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

export default React.memo(RecentActivityV2);
