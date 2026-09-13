import React from "react";
import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";

import { LanguageProvider } from "../contexts/LanguageContext";
import { BillingProvider } from "../contexts/BillingContext";
import { ToastProvider } from "../components/ui/Toast";
import { useSession } from "../hooks/useSession";
import { DashboardThemeProvider } from "../hooks/useDashboardTheme";

export default function RootLayout() {
  const { token, booting } = useSession();

  return (
    <DashboardThemeProvider>
    <View style={styles.root}>
      <ToastProvider>
        <LanguageProvider>
          <BillingProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Protected guard={!token}>
                <Stack.Screen name="login" />
              </Stack.Protected>

              <Stack.Protected guard={!!token}>
                <Stack.Screen name="(tabs)" />
              </Stack.Protected>
            </Stack>
          </BillingProvider>
        </LanguageProvider>
      </ToastProvider>

      {booting ? (
        <View
          pointerEvents="auto"
          style={styles.bootOverlay}
          testID="root-session-boot-overlay"
        />
      ) : null}
    </View>
    </DashboardThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#040508",
  },
  bootOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: "#040508",
  },
});
