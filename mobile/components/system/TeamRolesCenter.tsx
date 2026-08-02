import { StyleSheet, Text, View } from "react-native";

import { useAppPreferences } from "../../hooks/useAppPreferences";
import { t } from "../../lib/i18n";
import { UI } from "../../lib/theme/tokens";

type TeamRole = {
  nameKey: string;
  permissionKey: string;
};

const TEAM_ROLES: TeamRole[] = [
  { nameKey: "Role Owner", permissionKey: "Role Owner Permission" },
  { nameKey: "Role Admin", permissionKey: "Role Admin Permission" },
  { nameKey: "Role Manager", permissionKey: "Role Manager Permission" },
  { nameKey: "Role Staff", permissionKey: "Role Staff Permission" },
  { nameKey: "Role Viewer", permissionKey: "Role Viewer Permission" },
];

export default function TeamRolesCenter() {
  const { locale } = useAppPreferences();

  return (
    <View style={styles.card}>
      <Text style={styles.overline}>SALONFLOW AI</Text>
      <Text style={styles.title}>👥 {t("Team Roles Center", locale)}</Text>
      <Text style={styles.subtitle}>{t("Team Roles Center Subtitle", locale)}</Text>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryValue}>{t("Team Mode Foundation", locale)}</Text>
        <Text style={styles.summaryLabel}>{t("Role Permissions", locale)}</Text>
      </View>

      <View style={styles.roleList}>
        {TEAM_ROLES.map((role) => (
          <View key={role.nameKey} style={styles.roleRow}>
            <Text style={styles.roleName}>{t(role.nameKey, locale)}</Text>
            <Text style={styles.rolePermission}>{t(role.permissionKey, locale)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.inviteBox}>
        <Text style={styles.inviteTitle}>{t("Pending Invites", locale)}</Text>
        <Text style={styles.inviteText}>{t("Pending Invites Placeholder", locale)}</Text>
      </View>

      <Text style={styles.note}>{t("Team Roles Foundation Note", locale)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(15,23,42,0.86)",
    borderRadius: UI.radius.xl,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  overline: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  title: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 8,
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 16,
  },
  summaryBox: {
    backgroundColor: "rgba(242,209,122,0.12)",
    borderWidth: 1,
    borderColor: "#f2d17a",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  summaryValue: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },
  summaryLabel: {
    color: "#f2d17a",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 4,
  },
  roleList: {
    gap: 10,
  },
  roleRow: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
    gap: 6,
  },
  roleName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  rolePermission: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
  },
  inviteBox: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#334155",
    marginTop: 12,
  },
  inviteTitle: {
    color: "#f2d17a",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  inviteText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 6,
  },
  note: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 14,
  },
});
