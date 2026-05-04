import React from "react";
import { Stack } from "expo-router";

import { LanguageProvider } from "../contexts/LanguageContext";
import { ToastProvider } from "../components/ui/Toast";

export default function RootLayout() {
  return (
    <ToastProvider>
      <LanguageProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </LanguageProvider>
    </ToastProvider>
  );
}
