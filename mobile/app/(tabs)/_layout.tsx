import React from "react";
import { Tabs } from "expo-router";
import { useAppLanguage } from "../../contexts/LanguageContext";

export default function TabsLayout() {
  const { t } = useAppLanguage();
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
        options={{ title: t.nav.dashboard }}
      />
      <Tabs.Screen
        name="appointments"
        options={{ title: t.nav.bookings }}
      />
      <Tabs.Screen
        name="clients"
        options={{ title: t.nav.clients }}
      />
      <Tabs.Screen
        name="services"
        options={{ title: t.nav.services }}
      />
      <Tabs.Screen
        name="analytics"
        options={{ title: t.nav.insights }}
      />
      <Tabs.Screen
        name="reports"
        options={{ title: t.nav.reports }}
      />
    </Tabs>
  );
}
