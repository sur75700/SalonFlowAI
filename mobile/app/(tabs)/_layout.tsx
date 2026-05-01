import React from "react";
import { Tabs } from "expo-router";

export default function TabsLayout() {
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
        options={{ title: "Dashboard" }}
      />
      <Tabs.Screen
        name="appointments"
        options={{ title: "Bookings" }}
      />
      <Tabs.Screen
        name="clients"
        options={{ title: "Clients" }}
      />
      <Tabs.Screen
        name="services"
        options={{ title: "Services" }}
      />
      <Tabs.Screen
        name="analytics"
        options={{ title: "Insights" }}
      />
      <Tabs.Screen
        name="reports"
        options={{ title: "PDF Reports" }}
      />
    </Tabs>
  );
}
