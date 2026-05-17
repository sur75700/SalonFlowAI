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
import { useAppPreferences } from "../../hooks/useAppPreferences";
import { t } from "../../lib/i18n";
import {
  todayDateInput,
  yesterdayDateInput,
} from "../../utils/formatters";
import { UI } from "../../lib/theme/tokens";

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
  const { locale } = useAppPreferences();
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
      setError(t("Session Expired Sign In", locale));
      return;
    }

    if (typeof window === "undefined") {
      setError(t("Export Ui Web Only", locale));
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

        throw new Error(payload?.detail || t("Failed To Export Pdf", locale));
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

      setError(err?.message || t("Failed To Export Pdf", locale));
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
        title={t("Pdf Reports", locale)}
        subtitle={t("Session Unavailable Subtitle", locale)}
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
          <Text style={styles.heroTitle}>{t("Pdf Reports", locale)}</Text>
          <Text style={styles.heroText}>
            {t("Reports Hero Subtitle", locale)}
          </Text>
        </View>

        <SessionActionBar
          email={sessionEmail}
          onLogout={logout}
          loggingOut={loggingOut}
        />

        <SessionStatusBanner
          title={t("Reports Ready", locale)}
          subtitle={t("Reports Ready Subtitle", locale)}
        />

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <SectionCard
          title={t("Daily Pdf Export", locale)}
          subtitle={t("Daily Pdf Export Subtitle", locale)}
        >
          <TextInput
            style={styles.input}
            placeholder={t("Date Input Placeholder", locale)}
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
              <Text style={styles.quickButtonText}>{t("Today", locale)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => setReportDate(yesterdayDateInput())}
            >
              <Text style={styles.quickButtonText}>{t("Yesterday", locale)}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={exportPdfReport}
            disabled={exportingPdf}
          >
            <Text style={styles.primaryButtonText}>
              {exportingPdf ? t("Exporting", locale) : t("Export Pdf Report", locale)}
            </Text>
          </TouchableOpacity>
        </SectionCard>

        <SectionCard
          title={t("Export Readiness", locale)}
          subtitle={t("Export Readiness Subtitle", locale)}
        >
          <View style={styles.readinessCard}>
            <Text style={styles.readinessLabel}>{t("Selected Date", locale)}</Text>
            <Text style={styles.readinessValue}>{reportDate}</Text>
          </View>

          <View style={styles.readinessCard}>
            <Text style={styles.readinessLabel}>{t("Export State", locale)}</Text>
            <Text style={styles.readinessValue}>
              {exportingPdf ? t("Generating Pdf", locale) : t("Ready To Export", locale)}
            </Text>
          </View>
        </SectionCard>

        <SectionCard
          title={t("Reporting Workflow", locale)}
          subtitle={t("Reporting WorkflowSubtitle", locale)}
        >
          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>{t("Pick Date Step Title", locale)}</Text>
            <Text style={styles.infoText}>
              {t("Pick Date Step Subtitle", locale)}
            </Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>{t("Export Summary Step Title", locale)}</Text>
            <Text style={styles.infoText}>
              {t("Export Summary Step Subtitle", locale)}
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
    boxShadow: UI.depth.hero,
    elevation: 12,
    backgroundColor: "rgba(8, 10, 18, 0.92)",
    borderRadius: 30,
    padding: 28,
    marginBottom: 24,
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
    backgroundColor: "#11131d",
    borderWidth: 1,
    borderColor: "#241f27",
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
  },
  input: {
    backgroundColor: "#141824",
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
    backgroundColor: "#141824",
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
    backgroundColor: "#38161f",
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


  readinessCard: {
    backgroundColor: "#141824",
    borderWidth: 1,
    borderColor: "#2a3140",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  readinessLabel: {
    color: "#c9c2cf",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  readinessValue: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },
});
