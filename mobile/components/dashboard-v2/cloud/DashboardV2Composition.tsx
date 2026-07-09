import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView } from 'react-native';

import ExecutiveGreetingV2 from './ExecutiveGreetingV2';
import KPICardV2 from './KPICardV2';
import AICommandCenterV2 from './AICommandCenterV2';

/**
 * DashboardV2Composition
 *
 * Pure composition screen for Dashboard V2. Uses only ExecutiveGreetingV2,
 * KPICardV2, and AICommandCenterV2 — no new components are introduced,
 * and the only styles defined are the layout/spacing rules needed to
 * arrange those three into a premium, mobile-first screen.
 */
function DashboardV2Composition() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Executive Greeting */}
        <ExecutiveGreetingV2
          ownerFirstName="Maya"
          salonName="Lumière Studio"
          businessHealth={{ label: 'Excellent', tone: 'positive' }}
          revenueToday={{ amount: '$2,480', trendLabel: '+12% vs yesterday', trendDirection: 'up' }}
          aiConfidence={{ value: 94, label: 'High accuracy today' }}
          appointmentPulse={{ completed: 8, total: 14, nextClientName: 'Sarah K.', nextTime: '2:30 PM' }}
        />

        {/* 2. KPI Command Center — 2x2 grid on phone */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCell}>
              <KPICardV2
                label="Revenue"
                value="$18,240"
                trendLabel="+8.4%"
                trendDirection="up"
                helperText="vs last 30 days"
                accent="gold"
                sparklineData={[12, 14, 13, 16, 18, 17, 19]}
                compact
              />
            </View>
            <View style={styles.kpiCell}>
              <KPICardV2
                label="Appointments"
                value="146"
                trendLabel="+5.1%"
                trendDirection="up"
                helperText="this month"
                accent="royal"
                sparklineData={[20, 22, 21, 24, 23, 25, 27]}
                compact
              />
            </View>
          </View>

          <View style={styles.kpiRow}>
            <View style={styles.kpiCell}>
              <KPICardV2
                label="New Clients"
                value="32"
                trendLabel="-2.3%"
                trendDirection="down"
                helperText="vs last month"
                accent="blue"
                sparklineData={[9, 11, 10, 8, 9, 7, 8]}
                compact
              />
            </View>
            <View style={styles.kpiCell}>
              <KPICardV2
                label="Retention"
                value="87%"
                trendLabel="Steady"
                trendDirection="flat"
                helperText="12-month average"
                accent="green"
                sparklineData={[85, 86, 87, 86, 87, 87, 87]}
                compact
              />
            </View>
          </View>
        </View>

        {/* 3. AI Command Center */}
        <View style={styles.aiWrap}>
          <AICommandCenterV2
            healthLabel="Thriving"
            aiScore={86}
            confidenceLabel="94% confidence, based on the last 30 days of bookings and revenue."
            todaysFocus={[
              {
                time: '2:30 PM',
                label: "Confirm Sarah K.'s color appointment",
                detail: 'High no-show risk based on booking history.',
                tone: 'warning',
              },
              {
                time: '5:00 PM',
                label: 'Follow up with 3 clients overdue for rebooking',
                detail: 'Retention window closes this week.',
                tone: 'neutral',
              },
            ]}
            forecast={{
              headline: 'Revenue trending 12% above forecast this week.',
              helperText: 'Driven by strong Friday and Saturday bookings.',
              trendLabel: '+12%',
              trendDirection: 'up',
              series: [
                { label: 'Mon', value: 1800 },
                { label: 'Tue', value: 2100 },
                { label: 'Wed', value: 1950 },
                { label: 'Thu', value: 2400 },
                { label: 'Fri', value: 2900 },
                { label: 'Sat', value: 3200 },
                { label: 'Sun', value: 2600 },
              ],
            }}
            insights={[
              {
                title: 'Peak hours shifting later',
                description: 'Saturday demand is now heaviest between 1–4 PM, up from 11 AM–1 PM last quarter.',
                tone: 'neutral',
              },
              {
                title: '3 empty slots tomorrow',
                description: '10 AM, 11:30 AM, and 3 PM are open with no waitlist match yet.',
                tone: 'warning',
              },
            ]}
            recommendations={[
              'Send a rebooking reminder to clients inactive for 45+ days.',
              'Offer the 10 AM slot to your waitlist before end of day.',
            ]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0B18',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  kpiGrid: {
    marginTop: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  kpiCell: {
    flex: 1,
    marginHorizontal: 6,
  },
  aiWrap: {
    marginTop: 4,
  },
});

export default DashboardV2Composition;
