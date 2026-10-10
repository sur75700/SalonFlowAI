import React from "react";
import { StyleSheet, View } from "react-native";
import { Tabs } from "expo-router";
import { UI } from "../../lib/theme/tokens";
import { HapticTab } from "../../components/haptic-tab";
import { IconSymbol } from "../../components/ui/icon-symbol";
import { useAppPreferences } from "../../hooks/useAppPreferences";
import { t } from "../../lib/i18n";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useDashboardTheme } from "../../hooks/useDashboardTheme";

export default function TabsLayout() {
  const { locale } = useAppPreferences();
  const { selectedThemeId, theme: dashboardTheme } = useDashboardTheme();
  const brandAccent =
    selectedThemeId === "royal_gold_cosmos"
      ? dashboardTheme.palette.gold
      : dashboardTheme.palette.royal;
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: brandAccent,
        tabBarInactiveTintColor: dashboardTheme.palette.textSecondary,
        tabBarActiveBackgroundColor: "transparent",
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: dashboardTheme.palette.surface,
          borderTopColor: dashboardTheme.palette.borderStrong,
          borderTopWidth: 1,
          height: 64 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 7,
          shadowColor: brandAccent,
          shadowOpacity: 0.22,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: -8 },
          elevation: 24,
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
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconShell,
                focused && {
                  backgroundColor: dashboardTheme.palette.royalGlow,
                  borderColor: dashboardTheme.palette.borderStrong,
                  shadowColor: brandAccent,
                },
              ]}
            >
              <IconSymbol
                name="house.fill"
                color={color}
                size={focused ? 25 : 23}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: t("Bookings", locale),
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconShell,
                focused && {
                  backgroundColor: dashboardTheme.palette.royalGlow,
                  borderColor: dashboardTheme.palette.borderStrong,
                  shadowColor: brandAccent,
                },
              ]}
            >
              <IconSymbol
                name="calendar"
                color={color}
                size={focused ? 25 : 23}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: t("Clients", locale),
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconShell,
                focused && {
                  backgroundColor: dashboardTheme.palette.royalGlow,
                  borderColor: dashboardTheme.palette.borderStrong,
                  shadowColor: brandAccent,
                },
              ]}
            >
              <IconSymbol
                name="person.2.fill"
                color={color}
                size={focused ? 25 : 23}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: t("Services", locale),
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconShell,
                focused && {
                  backgroundColor: dashboardTheme.palette.royalGlow,
                  borderColor: dashboardTheme.palette.borderStrong,
                  shadowColor: brandAccent,
                },
              ]}
            >
              <IconSymbol
                name="scissors"
                color={color}
                size={focused ? 25 : 23}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: t("Insights", locale),
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconShell,
                focused && {
                  backgroundColor: dashboardTheme.palette.royalGlow,
                  borderColor: dashboardTheme.palette.borderStrong,
                  shadowColor: brandAccent,
                },
              ]}
            >
              <IconSymbol
                name="chart.bar.fill"
                color={color}
                size={focused ? 25 : 23}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: t("Pdf Reports", locale),
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconShell,
                focused && {
                  backgroundColor: dashboardTheme.palette.royalGlow,
                  borderColor: dashboardTheme.palette.borderStrong,
                  shadowColor: brandAccent,
                },
              ]}
            >
              <IconSymbol
                name="doc.text.fill"
                color={color}
                size={focused ? 25 : 23}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t("Settings", locale),
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconShell,
                focused && {
                  backgroundColor: dashboardTheme.palette.royalGlow,
                  borderColor: dashboardTheme.palette.borderStrong,
                  shadowColor: brandAccent,
                },
              ]}
            >
              <IconSymbol
                name="gearshape.fill"
                color={color}
                size={focused ? 25 : 23}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconShell: {
    width: 46,
    height: 38,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
});
