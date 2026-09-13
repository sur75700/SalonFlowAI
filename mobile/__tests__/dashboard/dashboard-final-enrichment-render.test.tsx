import React from "react";
import { render } from "@testing-library/react-native";

import AppointmentAnalyticsV2 from "../../components/dashboard-v2/cloud/AppointmentAnalyticsV2";
import ClientRetentionPulseV2 from "../../components/dashboard-v2/cloud/ClientRetentionPulseV2";
import ExecutiveGreetingV2 from "../../components/dashboard-v2/cloud/ExecutiveGreetingV2";
import type {
  CapacitySnapshotModel,
  ClientRetentionPulseModel,
} from "../../lib/dashboard/finalEnrichment";

jest.mock("../../hooks/useDashboardTheme", () => ({
  useDashboardTheme: () => ({
    theme: {
      palette: {
        surface: "#171938",
        surfaceRaised: "#1D1F47",
        border: "rgba(255,255,255,0.07)",
        royal: "#7C5CFF",
      },
    },
  }),
}));

const greetingBase = {
  ownerFirstName: "Owner",
  salonName: "SalonFlowAI",
  businessHealth: { label: "Live", tone: "positive" as const },
  revenueToday: {
    amount: "—",
    trendLabel: "Unavailable",
    trendDirection: "flat" as const,
  },
  appointmentPulse: { completed: 4, total: 8 },
};

const appointmentLabels = {
  total: "Total",
  noData: "No data",
  emptyPeriod: "No appointments",
  selectPeriod: "Select period {period}",
};

const capacityLabels = {
  title: "Capacity Intelligence",
  utilization: "Utilization",
  availableSlots: "Available slots",
  idleHours: "Idle hours",
  analysisWindow: "AI analysis window",
  loading: "Loading capacity",
  refreshing: "Refreshing capacity",
  unavailable: "Capacity unavailable",
  locked: "Advanced AI required",
};

const retentionLabels = {
  title: "Client Retention Pulse",
  subtitle: "Appointment-history classifications",
  live: "Live",
  returningRatio: "2+ appointment ratio",
  riskScore: "Risk index",
  singleAppointment: "1 recorded appointment",
  repeatHistory: "2+ recorded appointments",
  inactive: "Inactive clients",
  atRisk: "At risk · 30+ days",
  highRisk: "High risk · 60+ days",
  lost: "Lost · 90+ days",
  overlapNote: "Risk groups may overlap; they are not summed as unique clients.",
  loading: "Loading client analytics",
  refreshing: "Refreshing client analytics",
  unavailable: "Client facts unavailable",
  empty: "No client history",
};

describe("dashboard final enrichment rendering", () => {
  it("renders unavailable AI confidence as a dash, never as synthetic 0%", () => {
    const screen = render(
      <ExecutiveGreetingV2
        {...greetingBase}
        aiConfidence={{
          value: null,
          state: "unavailable",
          label: "Intelligence confidence unavailable",
        }}
      />,
    );

    expect(screen.getByText("Intelligence confidence unavailable")).toBeTruthy();
    expect(screen.queryByText("0%")).toBeNull();
  });

  it("renders a measured zero confidence as the real 0% value", () => {
    const screen = render(
      <ExecutiveGreetingV2
        {...greetingBase}
        aiConfidence={{
          value: 0,
          state: "available",
          label: "Live Intelligence confidence",
        }}
      />,
    );

    expect(screen.getByText("0%")).toBeTruthy();
  });

  it("renders factual capacity values with the Intelligence analysis window and preserves >100% utilization", () => {
    const capacity: CapacitySnapshotModel = {
      state: "available",
      utilizationPercent: 112.4,
      availableSlots: 7,
      idleHours: 5.5,
      windowLabel: "Last 7 Days",
    };

    const screen = render(
      <AppointmentAnalyticsV2
        labels={appointmentLabels}
        title="Appointments"
        totalAppointments={10}
        periodLabel="All Time"
        segments={[{ label: "Completed", value: 10, tone: "completed" }]}
        capacity={capacity}
        capacityLabels={capacityLabels}
      />,
    );

    expect(screen.getByText("112.4%")).toBeTruthy();
    expect(screen.getByText("7")).toBeTruthy();
    expect(screen.getByText("5.5h")).toBeTruthy();
    expect(screen.getByText("AI analysis window: Last 7 Days")).toBeTruthy();
  });

  it("renders capacity unavailable without zero-valued placeholders", () => {
    const capacity: CapacitySnapshotModel = {
      state: "unavailable",
      utilizationPercent: null,
      availableSlots: null,
      idleHours: null,
      windowLabel: "Last 7 Days",
    };

    const screen = render(
      <AppointmentAnalyticsV2
        labels={appointmentLabels}
        title="Appointments"
        totalAppointments={0}
        periodLabel="All Time"
        segments={[]}
        capacity={capacity}
        capacityLabels={capacityLabels}
      />,
    );

    expect(screen.getByText("Capacity unavailable")).toBeTruthy();
    expect(screen.queryByText("0%")).toBeNull();
  });

  it("renders one client pulse with precise overlapping-risk semantics", () => {
    const model: ClientRetentionPulseModel = {
      state: "available",
      totalClients: 20,
      singleAppointmentClients: 8,
      repeatHistoryClients: 12,
      inactiveClients: 5,
      returningRatioPercent: 60,
      atRiskClients: 6,
      highRiskClients: 4,
      lostClients: 2,
      riskScore: 40,
    };

    const screen = render(
      <ClientRetentionPulseV2 model={model} labels={retentionLabels} />,
    );

    expect(screen.getByText("Client Retention Pulse")).toBeTruthy();
    expect(screen.getByText("60%")).toBeTruthy();
    expect(screen.getByText("40%")).toBeTruthy();
    expect(screen.getByText(retentionLabels.overlapNote)).toBeTruthy();
  });

  it("retains valid client facts during refresh while clearly labeling the refresh", () => {
    const model: ClientRetentionPulseModel = {
      state: "refreshing",
      totalClients: 20,
      singleAppointmentClients: 8,
      repeatHistoryClients: 12,
      inactiveClients: 5,
      returningRatioPercent: 60,
      atRiskClients: 6,
      highRiskClients: 4,
      lostClients: 2,
      riskScore: 40,
    };

    const screen = render(
      <ClientRetentionPulseV2 model={model} labels={retentionLabels} />,
    );

    expect(screen.getByText("Refreshing client analytics")).toBeTruthy();
    expect(screen.getByText("60%")).toBeTruthy();
    expect(screen.getByText("40%")).toBeTruthy();
  });

  it("renders client analytics unavailable without stale classification values", () => {
    const model: ClientRetentionPulseModel = {
      state: "unavailable",
      totalClients: null,
      singleAppointmentClients: null,
      repeatHistoryClients: null,
      inactiveClients: null,
      returningRatioPercent: null,
      atRiskClients: null,
      highRiskClients: null,
      lostClients: null,
      riskScore: null,
    };

    const screen = render(
      <ClientRetentionPulseV2 model={model} labels={retentionLabels} />,
    );

    expect(screen.getAllByText("Client facts unavailable")).toHaveLength(1);
    expect(screen.queryByText("60%")).toBeNull();
  });
});
