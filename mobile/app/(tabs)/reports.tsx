import React, {
  useState,
} from "react";

import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import DevLoginCard from "../../components/auth/DevLoginCard";
import ReportsCommandCenterV2 from "../../components/reports/ReportsCommandCenterV2";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";
import RoyalCosmosBackground from "../../components/ui/RoyalCosmosBackground";

import {
  useAppPreferences,
} from "../../hooks/useAppPreferences";

import {
  useSession,
} from "../../hooks/useSession";

import { t } from "../../lib/i18n";

import type {
  ReportLocale,
} from "../../lib/reports/contracts";

import { UI } from "../../lib/theme/tokens";

function ReportsSkeleton() {
  return (
    <RoyalCosmosBackground
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
      >
        <View style={styles.hero}>
          <LoadingSkeleton
            height={11}
            width={130}
            style={{
              marginBottom: 14,
            }}
          />

          <LoadingSkeleton
            height={36}
            width={250}
            style={{
              marginBottom: 10,
            }}
          />

          <LoadingSkeleton
            height={13}
            width="90%"
            style={{
              marginBottom: 7,
            }}
          />

          <LoadingSkeleton
            height={13}
            width="72%"
          />
        </View>

        <View
          style={
            styles.sectionSkeleton
          }
        >
          <LoadingSkeleton
            height={18}
            width={170}
            style={{
              marginBottom: 12,
            }}
          />

          <LoadingSkeleton
            height={100}
            width="100%"
            style={{
              marginBottom: 10,
            }}
          />

          <LoadingSkeleton
            height={100}
            width="100%"
          />
        </View>
      </ScrollView>
    </RoyalCosmosBackground>
  );
}

export default function ReportsScreen() {
  const { locale } =
    useAppPreferences();

  const {
    token,
    booting,
    clearToken,
  } = useSession();

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0);

  const onRefresh = () => {
    setRefreshing(true);

    setRefreshKey(
      (current) =>
        current + 1,
    );

    setTimeout(
      () =>
        setRefreshing(false),
      450,
    );
  };

  if (booting) {
    return <ReportsSkeleton />;
  }

  if (!token) {
    return (
      <DevLoginCard
        title={t(
          "reports.title",
          locale,
        )}
        subtitle={t(
          "Session Unavailable Subtitle",
          locale,
        )}
      />
    );
  }

  return (
    <RoyalCosmosBackground
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <View
            style={styles.heroGlowSmall}
          />

          <View
            style={styles.heroTopRow}
          >
            <Text
              style={
                styles.heroOverline
              }
            >
              {t(
                "reports.commandCenter.eyebrow",
                locale,
              )}
            </Text>

            <View
              style={styles.liveBadge}
            >
              <View
                style={styles.liveDot}
              />

              <Text
                style={
                  styles.liveBadgeText
                }
              >
                {t(
                  "reports.commandCenter.liveBadge",
                  locale,
                )}
              </Text>
            </View>
          </View>

          <View
            style={styles.heroAccent}
          />

          <Text
            style={styles.heroTitle}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            {t(
              "reports.title",
              locale,
            )}
          </Text>

          <Text style={styles.heroText}>
            {t(
              "reports.heroSubtitle",
              locale,
            )}
          </Text>
        </View>

        <ReportsCommandCenterV2
          token={token}
          locale={
            locale as ReportLocale
          }
          refreshKey={refreshKey}
          onAuthExpired={
            clearToken
          }
        />
      </ScrollView>
    </RoyalCosmosBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#03040A",
  },

  content: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",

    padding: UI.spacing.screen,

    paddingBottom:
      UI.spacing.bottom,
  },

  hero: {
    position: "relative",
    overflow: "hidden",

    backgroundColor:
      "#191746",

    borderRadius: 28,

    paddingHorizontal: 24,
    paddingVertical: 22,

    marginBottom: 17,

    borderWidth: 1,
    borderColor:
      "rgba(139,114,255,0.32)",

    shadowColor: "#8B72FF",
    shadowOpacity: 0.16,
    shadowRadius: 26,
    shadowOffset: {
      width: 0,
      height: 12,
    },

    elevation: 12,
  },

  heroGlow: {
    position: "absolute",

    width: 280,
    height: 280,
    borderRadius: 140,

    right: -105,
    top: -135,

    backgroundColor:
      "rgba(78,111,255,0.13)",
  },

  heroGlowSmall: {
    position: "absolute",

    width: 160,
    height: 160,
    borderRadius: 80,

    left: -70,
    bottom: -105,

    backgroundColor:
      "rgba(207,140,255,0.08)",
  },

  heroTopRow: {
    flexDirection: "row",
    flexWrap: "wrap",

    justifyContent:
      "space-between",

    alignItems: "center",

    gap: 10,
    marginBottom: 14,
  },

  heroOverline: {
    color: "#F2D17A",

    fontSize: 9,
    fontWeight: "900",

    letterSpacing: 1.7,
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",

    gap: 7,

    borderRadius: 999,

    borderWidth: 1,
    borderColor:
      "rgba(114,224,168,0.28)",

    backgroundColor:
      "rgba(114,224,168,0.08)",

    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,

    backgroundColor: "#72E0A8",

    shadowColor: "#72E0A8",
    shadowOpacity: 0.70,
    shadowRadius: 7,
  },

  liveBadgeText: {
    color: "#C5F3D8",

    fontSize: 8,
    fontWeight: "900",

    letterSpacing: 0.8,
  },

  heroAccent: {
    width: 56,
    height: 3,
    borderRadius: 999,

    backgroundColor: "#8B72FF",

    marginBottom: 14,
  },

  heroTitle: {
    color: "#FFFFFF",

    fontSize: 31,
    lineHeight: 38,
    fontWeight: "900",

    letterSpacing: -0.85,

    maxWidth: 760,

    marginBottom: 8,
  },

  heroText: {
    color: "#C0BBCD",

    fontSize: UI.font.subtitle,
    lineHeight: 22,

    maxWidth: 780,
  },

  sectionSkeleton: {
    backgroundColor:
      "rgba(9,12,38,0.60)",

    borderWidth: 1,
    borderColor:
      "rgba(139,114,255,0.24)",

    borderRadius: 26,

    padding: 19,
    marginBottom: 17,
  },
});
