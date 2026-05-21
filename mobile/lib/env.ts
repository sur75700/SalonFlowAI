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

  const webDefault = "http://127.0.0.1:8000";
  const nativeDefault = "http://10.0.2.2:8000";

  if (Platform.OS === "web") {
    return extra.apiBaseUrlWeb || webDefault;
  }

  return extra.apiBaseUrlNative || nativeDefault;
}
