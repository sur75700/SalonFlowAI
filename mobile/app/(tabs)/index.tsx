import React from "react";
import DashboardV2Composition from "../../components/dashboard-v2/cloud/DashboardV2Composition";

/**
 * Main SalonFlowAI Dashboard
 *
 * Dashboard V2 is now promoted to the primary Dashboard tab.
 * The previous dashboard implementation remains preserved in the
 * local GHOST backup created during the promotion checkpoint.
 */
export default function DashboardScreen() {
  return <DashboardV2Composition />;
}
