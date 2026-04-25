import React from "react";
import { Stack } from "expo-router";

import { ToastProvider } from "../components/ui/Toast";

export default function RootLayout() {
  return (
    <ToastProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ToastProvider>
  );
}
