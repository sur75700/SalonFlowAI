import React from "react";
import { Tabs } from "expo-router";
import { useAppLanguage } from "../../contexts/LanguageContext";

export default function TabsLayout() {
  const { t } = useAppLanguage();

  return (
    <Tabs screenOptions={{ headerShown: false }}>
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
      <Tabs.Screen
        name="explore"
        options={{ title: t.nav.workspace }}
      />
    </Tabs>
  );
}
