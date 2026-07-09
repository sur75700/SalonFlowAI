import React from "react";
import { StyleSheet, View } from "react-native";
import DashboardV2 from "../components/dashboard-v2/DashboardV2";
import RoyalCosmosBackground from "../components/RoyalCosmosBackground";

export default function DashboardV2PreviewScreen() {
  return (
    <RoyalCosmosBackground style={styles.container}>
      <DashboardV2 />
    </RoyalCosmosBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#040508",
  },
});
