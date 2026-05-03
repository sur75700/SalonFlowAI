import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

type QuickLinkProps = {
  title: string;
  subtitle: string;
  onPress: () => void;
};

function QuickLink({ title, subtitle, onPress }: QuickLinkProps) {
  return (
    <Pressable onPress={onPress} style={styles.linkCard}>
      <Text style={styles.linkTitle}>{title}</Text>
      <Text style={styles.linkSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

export default function WorkspaceScreen() {
  const openDocs = () => {
    Linking.openURL("https://salonflowai-backend.onrender.com/docs");
  };

  const openBackend = () => {
    Linking.openURL("https://salonflowai-backend.onrender.com/healthz");
  };

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.overline}>SALONFLOW AI</Text>
        <Text style={styles.title}>Workspace</Text>
        <Text style={styles.subtitle}>
          Central utility space for navigation, backend access, and admin operations.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Navigation</Text>

        <QuickLink
          title="Open Dashboard"
          subtitle="Return to the executive overview."
          onPress={() => router.navigate("/(tabs)")}
        />
        <QuickLink
          title="Open Bookings"
          subtitle="Manage appointments and daily booking flow."
          onPress={() => router.navigate("/(tabs)/appointments")}
        />
        <QuickLink
          title="Open Clients"
          subtitle="Access the client registry and search records."
          onPress={() => router.navigate("/(tabs)/clients")}
        />
        <QuickLink
          title="Open Service Catalog"
          subtitle="Manage pricing, duration, and active services."
          onPress={() => router.navigate("/(tabs)/services")}
        />
        <QuickLink
          title="Open Insights"
          subtitle="Review analytics, trends, and executive metrics."
          onPress={() => router.navigate("/(tabs)/analytics")}
        />
        <QuickLink
          title="Open PDF Reports"
          subtitle="Generate and export daily summary reports."
          onPress={() => router.navigate("/(tabs)/reports")}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Backend Access</Text>

        <QuickLink
          title="Open API Docs"
          subtitle="Launch the production Swagger documentation."
          onPress={openDocs}
        />
        <QuickLink
          title="Check Backend Health"
          subtitle="Open the production health endpoint."
          onPress={openBackend}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Operator Notes</Text>
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            Use this workspace as a clean replacement for the default Expo starter tab.
          </Text>
          <Text style={styles.noteText}>
            It is now aligned with the SalonFlow AI admin experience.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0d12",
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  hero: {
    marginBottom: 20,
  },
  overline: {
    color: "#f2d17a",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    color: "#ffffff",
    fontSize: 38,
    fontWeight: "900",
    marginBottom: 8,
  },
  subtitle: {
    color: "#b7adbf",
    fontSize: 15,
    lineHeight: 23,
  },
  section: {
    backgroundColor: "#0f1118",
    borderWidth: 1,
    borderColor: "#232834",
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 14,
  },
  linkCard: {
    backgroundColor: "#11131a",
    borderWidth: 1,
    borderColor: "#2a3140",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  linkTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6,
  },
  linkSubtitle: {
    color: "#c9c2cf",
    fontSize: 14,
    lineHeight: 20,
  },
  noteCard: {
    backgroundColor: "#11131a",
    borderWidth: 1,
    borderColor: "#2a3140",
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  noteText: {
    color: "#d7d2de",
    fontSize: 14,
    lineHeight: 21,
  },
});
