import { Redirect } from "expo-router";

import { useSession } from "../hooks/useSession";

export default function RootIndex() {
  const { token, booting } = useSession();

  if (booting) {
    return null;
  }

  if (!token) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(tabs)" />;
}
