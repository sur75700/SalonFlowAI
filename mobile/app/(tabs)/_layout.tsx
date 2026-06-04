import React from "react";
import { Tabs } from "expo-router";
import { UI } from "../../lib/theme/tokens";
import { HapticTab } from "../../components/haptic-tab";
import { IconSymbol } from "../../components/ui/icon-symbol";
import { useAppPreferences } from "../../hooks/useAppPreferences";
import { t } from "../../lib/i18n";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const { locale } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#f7da85",
        tabBarInactiveTintColor: "#aab2c0",
        tabBarActiveBackgroundColor: "transparent",
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#08090d",
          borderTopColor: "#2a2f3d",
          borderTopWidth: 1,
          height: 58 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 6,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
        },
        tabBarIconStyle: {
          marginTop: 1,
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("Dashboard", locale),
          tabBarIcon: ({ color }) => (
            <IconSymbol name="house.fill" color={color} size={26} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: t("Bookings", locale),
          tabBarIcon: ({ color }) => (
            <IconSymbol name="calendar" color={color} size={26} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: t("Clients", locale),
          tabBarIcon: ({ color }) => (
            <IconSymbol name="person.2.fill" color={color} size={26} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: t("Services", locale),
          tabBarIcon: ({ color }) => (
            <IconSymbol name="scissors" color={color} size={26} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: t("Insights", locale),
          tabBarIcon: ({ color }) => (
            <IconSymbol name="chart.bar.fill" color={color} size={26} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color }) => (
            <IconSymbol name="doc.text.fill" color={color} size={26} />
          ),
        }}
      />
    </Tabs>
  );
}
