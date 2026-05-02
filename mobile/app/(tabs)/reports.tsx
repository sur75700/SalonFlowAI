import React, { useState } from "react";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import DevLoginCard from "../../components/auth/DevLoginCard";
import SessionStatusBanner from "../../components/auth/SessionStatusBanner";
import { useLogout } from "../../hooks/useLogout";
import SessionActionBar from "../../components/auth/SessionActionBar";
import SectionCard from "../../components/dashboard/SectionCard";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";
import { useSession } from "../../hooks/useSession";
import { API_BASE_URL, isAuthError } from "../../lib/api";
import {
  todayDateInput,
  yesterdayDateInput,
} from "../../utils/formatters";

function ReportsSkeleton() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <LoadingSkeleton height={12} width={110} style={{ marginBottom: 12 }} />
          <LoadingSkeleton height={36} width={130} style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={14} width="95%" style={{ marginBottom: 8 }} />
          <LoadingSkeleton height={14} width="78%" />
        </View>

        <View style={styles.sectionSkeleton}>
          <LoadingSkeleton height={20} width={150} style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={14} width="84%" style={{ marginBottom: 16 }} />
          <LoadingSkeleton height={50} width="100%" style={{ marginBottom: 14 }} />
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
            <LoadingSkeleton height={40} width={90} />
            <LoadingSkeleton height={40} width={110} />
          </View>
          <LoadingSkeleton height={46} width={180} />
        </View>

        <View style={styles.sectionSkeleton}>
          <LoadingSkeleton height={20} width={140} style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={14} width="75%" style={{ marginBottom: 14 }} />
          <LoadingSkeleton height={56} width="100%" style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={56} width="100%" style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={56} width="100%" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function ReportsScreen() {
  const { token, booting, clearToken, sessionEmail } = useSession();
  const { logout, loggingOut } = useLogout();

  const [refreshing, setRefreshing] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [error, setError] = useState("");
  const [reportDate, setReportDate] = useState(todayDateInput());

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 350);
  };

  const exportPdfReport = async () => {
    if (!token) {
      setError("Session expired. Sign in first.");
      return;
    }

    if (typeof window === "undefined") {
      setError("PDF export from UI is currently enabled for web.");
      return;
    }

    try {
      setExportingPdf(true);
      setError("");

      const url =
        API_BASE_URL +
        "/reports/daily-summary/pdf?date=" +
        encodeURIComponent(reportDate);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let payload: any = null;

        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        const fakeErr = {
          response: {
            status: response.status,
            data: payload || { detail: await response.text() },
          },
        };

        if (isAuthError(fakeErr)) {
          clearToken();
          return;
        }

        throw new Error(payload?.detail || "Failed to export PDF");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "salonflow_daily_summary_" + reportDate + ".pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      if (isAuthError(err)) {
        clearToken();
        setError("");
        return;
      }

      setError(err?.message || "Failed to export PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  if (booting) {
    return <ReportsSkeleton />;
  }

  if (!token) {
    return (
      <DevLoginCard
        title="PDF Reports"
        subtitle="Your admin session is unavailable. Restore access to continue."
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.hero}>
          <Text style={styles.heroOverline}>SALONFLOW AI</Text>
          <Text style={styles.heroTitle}>PDF Reports</Text>
          <Text style={styles.heroText}>
            Export polished daily PDF summaries for operations, finance review, and management reporting.
          </Text>
        </View>

        <SessionActionBar
          email={sessionEmail}
          onLogout={logout}
          loggingOut={loggingOut}
        />

        <SessionStatusBanner
          title="Reports Ready"
          subtitle="Your session can generate and export protected daily PDF summaries."
        />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <SectionCard
          title="Daily PDF Summary"
          subtitle="Generate and download a daily salon summary report."
        >
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9a92a3"
            value={reportDate}
            onChangeText={setReportDate}
            autoCapitalize="none"
          />

          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => setReportDate(todayDateInput())}
            >
              <Text style={styles.quickButtonText}>Today</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => setReportDate(yesterdayDateInput())}
            >
              <Text style={styles.quickButtonText}>Yesterday</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={exportPdfReport}
            disabled={exportingPdf}
          >
            <Text style={styles.primaryButtonText}>
              {exportingPdf ? "Exporting..." : "Export PDF Report"}
            </Text>
          </TouchableOpacity>
        </SectionCard>

        <SectionCard
          title="Report Workflow"
          subtitle="Quick explanation of the reporting flow."
        >
          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>1. Pick a date</Text>
            <Text style={styles.infoText}>
              Use the input field or quick buttons to select the report date.
            </Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>2. Export the summary</Text>
            <Text style={styles.infoText}>
              The system downloads a PDF generated from your backend reports endpoint.
            </Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>3. Review salon performance</Text>
            <Text style={styles.infoText}>
              The report includes totals and appointments for the selected day.
            </Text>
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
  sectionSkeleton: {
    backgroundColor: "#0f1118",
    borderWidth: 1,
    borderColor: "#241f27",
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
  },
  input: {
    backgroundColor: "#11131a",
    color: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2e2631",
  },
  quickRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  quickButton: {
    backgroundColor: "#161922",
    borderWidth: 1,
    borderColor: "#2b2f3b",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  quickButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
  primaryButton: {
    backgroundColor: "#f2d17a",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 6,
  },
  primaryButtonText: {
    color: "#121212",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.3,
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
