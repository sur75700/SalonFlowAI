import React from "react";
import { Tabs } from "expo-router";
import { useAppPreferences } from "../../hooks/useAppPreferences";
import { t } from "../../lib/i18n";

export default function TabsLayout() {
  const { locale } = useAppPreferences();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#f2d17a",
        tabBarInactiveTintColor: "#8f96a3",
        tabBarStyle: {
          backgroundColor: "#0a0b10",
          borderTopColor: "#1e2230",
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "800",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t("Dashboard", locale) }}
      />
      <Tabs.Screen
        name="appointments"
        options={{ title: t("Bookings", locale) }}
      />
      <Tabs.Screen
        name="clients"
        options={{ title: t("Clients", locale) }}
      />
      <Tabs.Screen
        name="services"
        options={{ title: t("Service Catalog", locale) }}
      />
      <Tabs.Screen
        name="analytics"
        options={{ title: t("Insights", locale) }}
      />
      <Tabs.Screen
        name="reports"
        options={{ title: t("Pdf Reports", locale) }}
      />
    </Tabs>
  );
}
