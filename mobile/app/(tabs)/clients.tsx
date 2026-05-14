import React, { useMemo, useState } from "react";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import DevLoginCard from "../../components/auth/DevLoginCard";
import SessionStatusBanner from "../../components/auth/SessionStatusBanner";
import { useLogout } from "../../hooks/useLogout";
import SessionActionBar from "../../components/auth/SessionActionBar";
import ActionButton from "../../components/dashboard/ActionButton";
import SectionCard from "../../components/dashboard/SectionCard";
import EmptyState from "../../components/ui/EmptyState";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";
import { useToast } from "../../components/ui/Toast";
import { useConfirmAction } from "../../hooks/useConfirmAction";
import { useFormState } from "../../hooks/useFormState";
import { useClientsData } from "../../hooks/useResourceData";
import { useClientMutations } from "../../hooks/useMutations";
import { useSession } from "../../hooks/useSession";
import type { ClientItem } from "../../types/models";
import { useAppPreferences } from "../../hooks/useAppPreferences";
import { t } from "../../lib/i18n";
import { UI } from "../../lib/theme/tokens";

const emptyClientForm = {
  full_name: "",
  phone: "",
  email: "",
  notes: "",
};

function ClientsSkeleton() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
          keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <LoadingSkeleton height={12} width={110} style={{ marginBottom: 12 }} />
          <LoadingSkeleton height={36} width={150} style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={14} width="96%" style={{ marginBottom: 8 }} />
          <LoadingSkeleton height={14} width="82%" />
        </View>

        <View style={styles.sectionCard}>
          <LoadingSkeleton height={20} width={140} style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={14} width="75%" style={{ marginBottom: 16 }} />
          <LoadingSkeleton height={50} width="100%" style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={50} width="100%" style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={50} width="100%" style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={92} width="100%" style={{ marginBottom: 14 }} />
          <LoadingSkeleton height={46} width={170} />
        </View>

        <View style={styles.sectionCard}>
          <LoadingSkeleton height={20} width={150} style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={14} width="80%" style={{ marginBottom: 16 }} />
          <LoadingSkeleton height={50} width="100%" style={{ marginBottom: 14 }} />
          <LoadingSkeleton height={122} width="100%" style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={122} width="100%" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function ClientsScreen() {
  const { locale, currency: preferredCurrency } = useAppPreferences();
  const { token, booting, clearToken, sessionEmail } = useSession();
  const { logout, loggingOut } = useLogout();
  const { showToast } = useToast();
  const { confirm } = useConfirmAction();

  const {
    clients,
    setClients,
    loading,
    refreshing,
    error,
    refresh,
    reload,
  } = useClientsData(token, clearToken);

  const {
    error: mutationError,
    loading: mutationLoading,
    workingId,
    setError: setMutationError,
    createClient,
    updateClient,
    deleteClient,
  } = useClientMutations({
    token,
    clearToken,
    onSuccessReload: reload,
    onAuthFailure: () => {
      setClients([]);
    },
  });

  const [editingClientId, setEditingClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");

  const createForm = useFormState(emptyClientForm);
  const editForm = useFormState(emptyClientForm);

  const screenError = mutationError || error;

  const handleCreateClient = async () => {
    if (!createForm.values.full_name.trim() || !createForm.values.phone.trim()) {
      setMutationError(t("common.clientFieldsRequired", locale));
      showToast(t("common.clientFieldsRequired", locale), "error");
      return;
    }

    const ok = await createClient({
      full_name: createForm.values.full_name.trim(),
      phone: createForm.values.phone.trim(),
      email: createForm.values.email.trim() || null,
      notes: createForm.values.notes.trim() || null,
    });

    if (ok) {
      createForm.reset();
      showToast(t("common.clientCreatedSuccessfully", locale), "success");
    }
  };

  const startEditClient = (client: ClientItem) => {
    setEditingClientId(client.id);
    editForm.fill({
      full_name: client.full_name || "",
      phone: client.phone || "",
      email: client.email || "",
      notes: client.notes || "",
    });
    setMutationError("");
  };

  const cancelEditClient = () => {
    setEditingClientId("");
    editForm.reset();
    setMutationError("");
  };

  const handleSaveClient = async (clientId: string) => {
    if (!editForm.values.full_name.trim() || !editForm.values.phone.trim()) {
      setMutationError(t("common.clientFieldsRequired", locale));
      showToast(t("common.clientFieldsRequired", locale), "error");
      return;
    }

    const ok = await updateClient(clientId, {
      full_name: editForm.values.full_name.trim(),
      phone: editForm.values.phone.trim(),
      email: editForm.values.email.trim() || null,
      notes: editForm.values.notes.trim() || null,
    });

    if (ok) {
      cancelEditClient();
      showToast(t("common.clientUpdatedSuccessfully", locale), "success");
    }
  };

  const handleDeleteClient = async (client: ClientItem) => {
    const approved = await confirm(
      t("common.deleteClientTitle", locale),
        t("common.deleteClientConfirmMessage", locale)
    );

    if (!approved) return;

    const ok = await deleteClient(client.id);

    if (ok) {
      showToast(t("common.clientDeletedSuccessfully", locale), "success");
    }
  };

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;

    return clients.filter(
      (item) =>
        (item.full_name || "").toLowerCase().includes(q) ||
        (item.phone || "").toLowerCase().includes(q) ||
        (item.email || "").toLowerCase().includes(q) ||
        (item.notes || "").toLowerCase().includes(q)
    );
  }, [clients, clientSearch]);

  if (booting || loading) {
    return <ClientsSkeleton />;
  }

  if (!token) {
    return (
      <DevLoginCard
        title={t("common.clientSnapshot", locale)}
        subtitle={t("common.sessionUnavailableSubtitle", locale)}
      />
    );
  }

  const noClientsAtAll = clients.length === 0;
  const noSearchMatches = clients.length > 0 && filteredClients.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <View style={styles.hero}>
          <Text style={styles.heroOverline}>SALONFLOW AI</Text>
          <Text style={styles.heroTitle}>{t("common.clientSnapshot", locale)}</Text>
          <Text style={styles.heroText}>
            {t("common.clientRegistryHeroSubtitle", locale)}
          </Text>
        </View>

        <SessionActionBar
          email={sessionEmail}
          onLogout={logout}
          loggingOut={loggingOut}
        />

        <SessionStatusBanner
          title={t("common.clientRegistryConnected", locale)}
          subtitle={t("common.clientRegistryConnectedSubtitle", locale)}
        />

        {screenError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{screenError}</Text>
          </View>
        ) : null}

        <SectionCard
          title={t("common.createClientEntry", locale)}
          subtitle={t("common.createClientEntrySubtitle", locale)}
        >
          <TextInput
            style={styles.input}
            placeholder={t("common.fullName", locale)}
            placeholderTextColor="#9a92a3"
            value={createForm.values.full_name}
            onChangeText={(value) => createForm.setField("full_name", value)}
          />
          <TextInput
            style={styles.input}
            placeholder={t("common.phone", locale)}
            placeholderTextColor="#9a92a3"
            value={createForm.values.phone}
            onChangeText={(value) => createForm.setField("phone", value)}
          />
          <TextInput
            style={styles.input}
            placeholder={t("common.email", locale)}
            placeholderTextColor="#9a92a3"
            value={createForm.values.email}
            onChangeText={(value) => createForm.setField("email", value)}
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t("common.notes", locale)}
            placeholderTextColor="#9a92a3"
            value={createForm.values.notes}
            onChangeText={(value) => createForm.setField("notes", value)}
            multiline
          />

          <ActionButton
            title={mutationLoading ? t("common.creating", locale) : t("common.createClient", locale)}
            onPress={handleCreateClient}
            disabled={mutationLoading}
            tone="success"
          />
        </SectionCard>

        <SectionCard
          title={t("common.clientSnapshot", locale)}
          subtitle={t("common.clientSnapshotSubtitle", locale)}
        >
          <TextInput
            style={styles.searchInput}
            placeholder={t("common.searchClients", locale)}
            placeholderTextColor="#9a92a3"
            value={clientSearch}
            onChangeText={setClientSearch}
          />

          {noClientsAtAll ? (
            <EmptyState
              title={t("common.noClientsYet", locale)}
              subtitle={t("common.noClientsYetSubtitle", locale)}
            />
          ) : noSearchMatches ? (
            <EmptyState
              title={t("common.noMatchingClients", locale)}
              subtitle={t("common.noMatchingClientsSubtitle", locale)}
            />
          ) : (
            filteredClients.map((client) => (
              <View key={client.id} style={styles.listCard}>
                {editingClientId === client.id ? (
                  <>
                    <TextInput
                      style={styles.input}
                      placeholder={t("common.fullName", locale)}
                      placeholderTextColor="#9a92a3"
                      value={editForm.values.full_name}
                      onChangeText={(value) => editForm.setField("full_name", value)}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder={t("common.phone", locale)}
                      placeholderTextColor="#9a92a3"
                      value={editForm.values.phone}
                      onChangeText={(value) => editForm.setField("phone", value)}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder={t("common.email", locale)}
                      placeholderTextColor="#9a92a3"
                      value={editForm.values.email}
                      onChangeText={(value) => editForm.setField("email", value)}
                      autoCapitalize="none"
                    />
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder={t("common.notes", locale)}
                      placeholderTextColor="#9a92a3"
                      value={editForm.values.notes}
                      onChangeText={(value) => editForm.setField("notes", value)}
                      multiline
                    />

                    <View style={styles.actionRow}>
                      <ActionButton
                        title={workingId === client.id ? "Working..." : "Save"}
                        onPress={() => handleSaveClient(client.id)}
                        disabled={workingId === client.id}
                        tone="success"
                      />
                      <ActionButton title={t("common.cancel", locale)} onPress={cancelEditClient} />
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.cardTitle}>{client.full_name}</Text>
                    <Text style={styles.item}>{t("common.phone", locale)}: {client.phone}</Text>
                    <Text style={styles.item}>{t("common.email", locale)}: {client.email || "-"}</Text>
                    <Text style={styles.item}>{t("common.notes", locale)}: {client.notes || "-"}</Text>

                    <View style={styles.actionRow}>
                      <ActionButton
                        title={t("common.edit", locale)}
                        onPress={() => startEditClient(client)}
                        tone="success"
                      />
                      <ActionButton
                        title={workingId === client.id ? "Working..." : "Delete"}
                        onPress={() => handleDeleteClient(client)}
                        disabled={workingId === client.id}
                        tone="danger"
                      />
                    </View>
                  </>
                )}
              </View>
            ))
          )}
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#040508" },
  content: { padding: 22, paddingBottom: 40 },
  hero: {
    boxShadow: UI.depth.hero,
    elevation: 12,
    backgroundColor: "rgba(8, 10, 18, 0.92)",
    borderRadius: 30,
    padding: 28,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#27212c",
  },
  heroOverline: {
    color: "#f2d17a",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 10,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 38,
    fontWeight: "900",
    marginBottom: 8,
  },
  heroText: {
    color: "#b7adbf",
    fontSize: 15,
    lineHeight: 23,
  },
  sectionCard: {
    backgroundColor: "#11131d",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#241f27",
    marginBottom: 18,
  },
  searchInput: {
    backgroundColor: "#141824",
    color: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#2e2631",
  },
  input: {
    backgroundColor: "#141824",
    color: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2e2631",
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  listCard: {
    backgroundColor: "#11131d",
    borderRadius: 20,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#241f27",
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 6,
  },
  item: {
    color: "#ece7ef",
    fontSize: 14,
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    flexWrap: "wrap",
  },
  errorBox: {
    backgroundColor: "#38161f",
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#5a232e",
  },
  errorText: {
    color: "#ffcad3",
    fontSize: 14,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 16,
  },
});
