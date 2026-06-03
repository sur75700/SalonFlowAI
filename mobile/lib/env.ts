import Constants from "expo-constants";
import { Platform } from "react-native";

declare const process: {
  env?: {
    EXPO_PUBLIC_API_URL?: string;
  };
};

type ExtraConfig = {
  apiBaseUrlWeb?: string;
  apiBaseUrlNative?: string;
};

function getExtra(): ExtraConfig {
  const extra =
    (Constants.expoConfig?.extra as ExtraConfig | undefined) ||
    (Constants.manifest2?.extra as ExtraConfig | undefined) ||
    {};

  return extra;
}

function getPublicApiUrl(): string {
  if (typeof process === "undefined") return "";
  return process.env?.EXPO_PUBLIC_API_URL?.trim() || "";
}

export function getApiBaseUrl(): string {
  const publicApiUrl = getPublicApiUrl();

  if (publicApiUrl) {
    return publicApiUrl;
  }

  const extra = getExtra();

  const productionDefault = "https://salonflowai-backend.onrender.com";
  const webDefault = extra.apiBaseUrlWeb || productionDefault;
  const nativeDefault = extra.apiBaseUrlNative || productionDefault;

  if (Platform.OS === "web") {
    return webDefault;
  }

  return nativeDefault;
}
