import React from "react";
import { Tabs } from "expo-router";
import { UI } from "../../lib/theme/tokens";
import { HapticTab } from "../../components/haptic-tab";
import { IconSymbol } from "../../components/ui/icon-symbol";
import { useAppPreferences } from "../../hooks/useAppPreferences";
import { t } from "../../lib/i18n";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);
  const { locale } = useAppPreferences();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#f7da85",
        tabBarInactiveTintColor: "#b0b6c3",
        tabBarActiveBackgroundColor: "rgba(242, 209, 122, 0.07)",
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: "#08090d",
          borderTopColor: "#2a2f3d",
          borderTopWidth: 1,
          height: 66 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "900",
          letterSpacing: 0.1,
          lineHeight: 12,
          marginTop: 1,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("Dashboard", locale),
          tabBarIcon: ({ color }) => (
            <IconSymbol name="house.fill" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: t("Bookings", locale),
          tabBarIcon: ({ color }) => (
            <IconSymbol name="calendar" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: t("Clients", locale),
          tabBarIcon: ({ color }) => (
            <IconSymbol name="person.2.fill" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: t("Services", locale),
          tabBarIcon: ({ color }) => (
            <IconSymbol name="scissors" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: t("Insights", locale),
          tabBarIcon: ({ color }) => (
            <IconSymbol name="chart.bar.fill" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color }) => (
            <IconSymbol name="doc.text.fill" color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}
