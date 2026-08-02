import React from "react";

import AnalyticsCommandCenterV2 from "./AnalyticsCommandCenterV2";
import { analyticsV2PreviewModel } from "./analytics-v2-preview-data";

export default function AnalyticsPreviewContainerV2() {
  return (
    <AnalyticsCommandCenterV2
      model={analyticsV2PreviewModel}
    />
  );
}
