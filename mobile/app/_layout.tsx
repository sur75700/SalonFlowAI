import React from "react";
import { Stack } from "expo-router";

import { LanguageProvider } from "../contexts/LanguageContext";
import { BillingProvider } from "../contexts/BillingContext";
import { ToastProvider } from "../components/ui/Toast";

export default function RootLayout() {
  return (
    <ToastProvider>
      <LanguageProvider>
        <BillingProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </BillingProvider>
      </LanguageProvider>
    </ToastProvider>
  );
}
