import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type TrendDirection = 'up' | 'down' | 'flat';

export interface StaffMember {
  id: string;
  name: string;
  role?: string;
  initials?: string;
  /** No avatar/image library dependency — pass whatever the host app already renders avatars with. */
  avatar?: React.ReactNode;
  revenueLabel: string; // pre-formatted, e.g. "$4,280"
  appointmentCount: number;
  performancePercent: number; // 0–100, clamped defensively below
  trendLabel?: string;
  trendDirection?: TrendDirection;
}

export interface StaffPerformanceV2Props {
  title: string;
  periodLabel: string;
  staff: StaffMember[];
  emptyLabel: string;
}

const colors = {
  surface: '#171938',
  surfaceRaised: '#1D1F47',
  border: 'rgba(255,255,255,0.07)',
  royal: '#7C5CFF',
  gold: '#E8C97A',
  warning: '#F2B84B',
  textPrimary: '#F6F5FB',
  textSecondary: '#A6A7C4',
  textTertiary: '#6F7092',
  positive: '#3FCF8E',
  danger: '#F2617A',
} as const;

const trendColorMap: Record<TrendDirection, string> = {
  up: colors.positive,
  down: colors.danger,
  flat: colors.textTertiary,
};

function clampPercent(value: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function getPerformanceTone(percent: number): string {
  if (percent >= 85) return colors.gold;
  if (percent >= 60) return colors.royal;
  return colors.warning;
}

function getInitials(name: string, provided?: string): string {
  if (provided && provided.trim()) return provided.trim().slice(0, 2).toUpperCase();
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function TrendIndicator({ direction }: { direction: TrendDirection }) {
  const color = trendColorMap[direction];
  if (direction === 'flat') {
    return <View style={[styles.trendDash, { backgroundColor: color }]} />;
  }
  return (
    <View
      style={[
        direction === 'up' ? styles.triangleUp : styles.triangleDown,
        direction === 'up' ? { borderBottomColor: color } : { borderTopColor: color },
      ]}
    />
  );
}

/**
 * StaffPerformanceV2 — ranked team leaderboard. Presentation-only: order
 * of the `staff` array determines rank (rank 1 gets a gold accent as a
 * purely visual touch, no scoring logic lives here). Self-contained, no
 * external packages, no SVG.
 */
function StaffPerformanceV2({ title, periodLabel, staff, emptyLabel }: StaffPerformanceV2Props) {
  const isEmpty = !staff || staff.length === 0;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.periodChip}>
          <Text style={styles.periodChipText} numberOfLines={1}>
            {periodLabel}
          </Text>
        </View>
      </View>

      {isEmpty ? (
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      ) : (
        <View style={styles.list}>
          {staff.map((member, index) => {
            const rank = index + 1;
            const isTop = index === 0;
            const clamped = clampPercent(member.performancePercent);
            const perfTone = getPerformanceTone(clamped);
            const initials = getInitials(member.name, member.initials);
            const isLast = index === staff.length - 1;

            return (
              <View key={member.id} style={[styles.row, !isLast && styles.rowDivider]}>
                <View style={styles.rowTop}>
                  <View style={styles.leftGroup}>
                    <View style={[styles.rankBadge, isTop && styles.rankBadgeTop]}>
                      <Text style={[styles.rankText, isTop && styles.rankTextTop]}>{rank}</Text>
                    </View>

                    <View style={styles.avatarWrap}>
                      {member.avatar ?? (
                        <View style={styles.avatarFallback}>
                          <Text style={styles.avatarInitials}>{initials}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.nameCol}>
                      <Text style={styles.name} numberOfLines={1}>
                        {member.name}
                      </Text>
                      {!!member.role && (
                        <Text style={styles.role} numberOfLines={1}>
                          {member.role}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.metricsCol}>
                    <Text style={styles.revenue} numberOfLines={1}>
                      {member.revenueLabel}
                    </Text>
                    {!!member.trendLabel && (
                      <View style={styles.trendRow}>
                        <TrendIndicator direction={member.trendDirection ?? 'flat'} />
                        <Text
                          style={[styles.trendText, { color: trendColorMap[member.trendDirection ?? 'flat'] }]}
                          numberOfLines={1}
                        >
                          {member.trendLabel}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.performanceRow}>
                  <View style={styles.performanceTrack}>
                    <View
                      style={[
                        styles.performanceFill,
                        { width: `${clamped}%`, backgroundColor: perfTone },
                      ]}
                    />
                  </View>
                  <Text style={styles.performancePercentText}>{Math.round(clamped)}%</Text>
                  <Text style={styles.appointmentCountText} numberOfLines={1}>
                    · {member.appointmentCount} appts
                  </Text>
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
  periodChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 150,
  },
  periodChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  list: {
    marginTop: 16,
  },
  row: {
    paddingBottom: 16,
    marginBottom: 16,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  rankBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginRight: 8,
  },
  rankBadgeTop: {
    backgroundColor: 'rgba(232,201,122,0.18)',
  },
  rankText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  rankTextTop: {
    color: colors.gold,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    overflow: 'hidden',
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124,92,255,0.16)',
  },
  avatarInitials: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.royal,
  },
  nameCol: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  role: {
    marginTop: 1,
    fontSize: 11,
    color: colors.textTertiary,
  },
  metricsCol: {
    alignItems: 'flex-end',
  },
  revenue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  trendRow: {
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  performanceRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  performanceTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  performanceFill: {
    height: '100%',
    borderRadius: 3,
  },
  performancePercentText: {
    marginLeft: 8,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  appointmentCountText: {
    marginLeft: 4,
    fontSize: 11,
    color: colors.textTertiary,
  },
  emptyText: {
    marginTop: 18,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  trendDash: {
    width: 8,
    height: 2,
    borderRadius: 1,
  },
  triangleUp: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  triangleDown: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});

export default React.memo(StaffPerformanceV2);
