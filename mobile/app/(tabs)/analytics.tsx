import React from "react";

import AnalyticsRealContainerV2 from "../../components/analytics-v2/AnalyticsRealContainerV2";

/**
 * Production Analytics V2 route.
 *
 * Live appointment, client and service records power the
 * 7D, 30D and 90D analytics period models.
 *
 * Preview comparison remains available at /analytics-v2.
 */
export default function AnalyticsScreen() {
  return <AnalyticsRealContainerV2 />;
}
