import React from "react";
import { StyleSheet } from "react-native";

import SettingsCommandCenter from "../../components/settings/command/SettingsCommandCenter";
import RoyalCosmosBackground from "../../components/ui/RoyalCosmosBackground";

export default function WorkspaceScreen() {
  return (
    <RoyalCosmosBackground style={styles.container}>
      <SettingsCommandCenter />
    </RoyalCosmosBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
