import React from "react";
import { Tabs } from "expo-router";
import { UI } from "../../lib/theme/tokens";
import { HapticTab } from "../../components/haptic-tab";
import { IconSymbol } from "../../components/ui/icon-symbol";
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
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: "#0a0b10",
          borderTopColor: "#1e2230",
          height: 68,
          paddingBottom: UI.spacing.xs,
          paddingTop: UI.spacing.xs,
        },
        tabBarLabelStyle: {
          fontSize: UI.font.tiny,
          fontWeight: "900",
          letterSpacing: 0.2,
        },
        tabBarIconStyle: {
          marginBottom: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("Dashboard", locale),
          tabBarIcon: ({ color }) => (
            <IconSymbol name="house.fill" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: t("Bookings", locale),
          tabBarIcon: ({ color }) => (
            <IconSymbol name="calendar" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: t("Clients", locale),
          tabBarIcon: ({ color }) => (
            <IconSymbol name="person.2.fill" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: t("Service Catalog", locale),
          tabBarIcon: ({ color }) => (
            <IconSymbol name="scissors" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: t("Insights", locale),
          tabBarIcon: ({ color }) => (
            <IconSymbol name="chart.bar.fill" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: t("Pdf Reports", locale),
          tabBarIcon: ({ color }) => (
            <IconSymbol name="doc.text.fill" color={color} size={22} />
          ),
        }}
      />
    </Tabs>
  );
}
