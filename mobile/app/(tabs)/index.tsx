import React from "react";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import DevLoginCard from "../../components/auth/DevLoginCard";
import SessionStatusBanner from "../../components/auth/SessionStatusBanner";
import { useLogout } from "../../hooks/useLogout";
import SessionActionBar from "../../components/auth/SessionActionBar";
import SectionCard from "../../components/dashboard/SectionCard";
import StatCard from "../../components/dashboard/StatCard";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";
import { useSummaryData } from "../../hooks/useDashboardData";
import { useSession } from "../../hooks/useSession";

function OverviewSkeleton() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <LoadingSkeleton height={12} width={110} style={{ marginBottom: 12 }} />
          <LoadingSkeleton height={38} width={180} style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={14} width="100%" style={{ marginBottom: 8 }} />
          <LoadingSkeleton height={14} width="88%" />
        </View>

        <View style={styles.statsGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={styles.statSkeletonCard}>
              <LoadingSkeleton height={12} width={80} style={{ marginBottom: 14 }} />
              <LoadingSkeleton height={24} width={70} />
            </View>
          ))}
        </View>

        <View style={styles.sectionSkeleton}>
          <LoadingSkeleton height={20} width={170} style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={14} width="90%" style={{ marginBottom: 18 }} />
          <LoadingSkeleton height={48} width="100%" style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={48} width="100%" style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={48} width="100%" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function OverviewScreen() {
  const { token, booting, clearToken, sessionEmail } = useSession();
  const { logout, loggingOut } = useLogout();
  const { summary, loading, refreshing, error, refresh } = useSummaryData(
    token,
    clearToken
  );

  const statCards = [
    { label: "Clients", value: summary?.total_clients ?? 0 },
    { label: "Services", value: summary?.total_services ?? 0 },
    { label: "Bookings", value: summary?.total_appointments ?? 0 },
    { label: "Scheduled", value: summary?.scheduled_appointments ?? 0 },
    { label: "Completed", value: summary?.completed_appointments ?? 0 },
    { label: "Cancelled", value: summary?.cancelled_appointments ?? 0 },
    { label: "Today", value: summary?.today_appointments ?? 0 },
  ];

  if (booting) {
    return <OverviewSkeleton />;
  }

  if (!token) {
    return (
      <DevLoginCard
        title="Overview"
        subtitle="Your admin session is unavailable. Restore access to continue."
      />
    );
  }

  if (loading) {
    return <OverviewSkeleton />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <View style={styles.hero}>
          <Text style={styles.heroOverline}>SALONFLOW AI</Text>
          <Text style={styles.heroTitle}>Overview</Text>
          <Text style={styles.heroText}>
            Premium salon command center for bookings, clients, services, analytics,
            and reporting—organized into focused operational sections.
          </Text>
        </View>

        <SessionActionBar
          email={sessionEmail}
          onLogout={logout}
          loggingOut={loggingOut}
        />

        <SessionStatusBanner
          title="Operations Ready"
          subtitle="Your admin session is active. Pull to refresh and sync the latest salon activity."
        />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.statsGrid}>
          {statCards.map((card) => (
            <StatCard key={card.label} label={card.label} value={card.value} />
          ))}
        </View>

        <SectionCard
          title="Admin Navigation"
          subtitle="Navigate the platform through focused operational workspaces."
        >
          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>Analytics</Text>
            <Text style={styles.infoText}>
              Revenue intelligence, charts, service performance, and status distribution.
            </Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>Reports</Text>
            <Text style={styles.infoText}>
              Export daily PDF summary files for selected dates.
            </Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>Appointments</Text>
            <Text style={styles.infoText}>
              Search, filter, edit, complete, cancel, and delete bookings.
            </Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>Clients</Text>
            <Text style={styles.infoText}>
              Create and manage your client registry in a dedicated screen.
            </Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>Services</Text>
            <Text style={styles.infoText}>
              Manage service catalog, prices, duration, and active state.
            </Text>
          </View>
        </SectionCard>

        <SectionCard
          title="Quick Business Snapshot"
          subtitle="High-level operational summary."
        >
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total clients</Text>
            <Text style={styles.metricValue}>{summary?.total_clients ?? 0}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total services</Text>
            <Text style={styles.metricValue}>{summary?.total_services ?? 0}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total bookings</Text>
            <Text style={styles.metricValue}>{summary?.total_appointments ?? 0}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Scheduled bookings</Text>
            <Text style={styles.metricValue}>{summary?.scheduled_appointments ?? 0}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Completed bookings</Text>
            <Text style={styles.metricValue}>{summary?.completed_appointments ?? 0}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Cancelled bookings</Text>
            <Text style={styles.metricValue}>{summary?.cancelled_appointments ?? 0}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Today bookings</Text>
            <Text style={styles.metricValue}>{summary?.today_appointments ?? 0}</Text>
          </View>
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#040508" },
  content: { padding: 22, paddingBottom: 40 },
  hero: {
    backgroundColor: "#0a0b10",
    borderRadius: 30,
    padding: 26,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#27212c",
  },
  heroOverline: {
    color: "#f2d17a",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 10,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 38,
    fontWeight: "900",
    marginBottom: 8,
  },
  heroText: {
    color: "#b7adbf",
    fontSize: 15,
    lineHeight: 23,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statSkeletonCard: {
    width: "48%",
    backgroundColor: "#0f1118",
    borderWidth: 1,
    borderColor: "#241f27",
    borderRadius: 20,
    padding: 18,
  },
  sectionSkeleton: {
    backgroundColor: "#0f1118",
    borderWidth: 1,
    borderColor: "#241f27",
    borderRadius: 24,
    padding: 20,
  },
  infoBlock: {
    backgroundColor: "#11131a",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#232834",
  },
  infoTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6,
  },
  infoText: {
    color: "#c9c2cf",
    fontSize: 14,
    lineHeight: 21,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1e2230",
  },
  metricLabel: {
    color: "#ece7ef",
    fontSize: 14,
  },
  metricValue: {
    color: "#f5d27a",
    fontSize: 14,
    fontWeight: "900",
  },
  errorBox: {
    backgroundColor: "#301218",
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#5a232e",
  },
  errorText: {
    color: "#ffcad3",
    fontSize: 14,
  },
});
