import React from 'react';
import BookingCenterPreviewAdapterV2 from '../components/booking-v2/BookingCenterPreviewAdapterV2';

/**
 * Isolated preview route — mobile/app/booking-v2.tsx
 *
 * Renders the PREVIEW ADAPTER (sample data, visual QA only), not the
 * bare composition. Does NOT replace the production appointments route.
 * The production route should render <BookingCenterCompositionV2 />
 * directly with real props — never this adapter.
 */
export default function BookingV2PreviewRoute() {
  return <BookingCenterPreviewAdapterV2 />;
}
