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

const emptyClientForm = {
  full_name: "",
  phone: "",
  email: "",
  notes: "",
};

function ClientsSkeleton() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
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
      setMutationError("Full name and phone are required");
      showToast("Full name and phone are required", "error");
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
      showToast("Client created successfully", "success");
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
      setMutationError("Full name and phone are required");
      showToast("Full name and phone are required", "error");
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
      showToast("Client updated successfully", "success");
    }
  };

  const handleDeleteClient = async (client: ClientItem) => {
    const approved = await confirm(
      "Delete client?",
      "This will permanently remove " +
        (client.full_name || "this client") +
        " from the salon system."
    );

    if (!approved) return;

    const ok = await deleteClient(client.id);

    if (ok) {
      showToast("Client deleted successfully", "success");
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
        title="Client Snapshot"
        subtitle="Your admin session is unavailable. Restore access to continue."
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
          <Text style={styles.heroTitle}>Client Registry</Text>
          <Text style={styles.heroText}>
            Manage your client registry, update details, and add new salon leads.
          </Text>
        </View>

        <SessionActionBar
          email={sessionEmail}
          onLogout={logout}
          loggingOut={loggingOut}
        />

        <SessionStatusBanner
          title="Client Registry Connected"
          subtitle="Your session is active and ready to create, edit, and manage salon client records."
        />

        {screenError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{screenError}</Text>
          </View>
        ) : null}

        <SectionCard
          title="Create Client Entry"
          subtitle="Add a polished client profile to the salon system."
        >
          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor="#9a92a3"
            value={createForm.values.full_name}
            onChangeText={(value) => createForm.setField("full_name", value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone"
            placeholderTextColor="#9a92a3"
            value={createForm.values.phone}
            onChangeText={(value) => createForm.setField("phone", value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9a92a3"
            value={createForm.values.email}
            onChangeText={(value) => createForm.setField("email", value)}
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notes"
            placeholderTextColor="#9a92a3"
            value={createForm.values.notes}
            onChangeText={(value) => createForm.setField("notes", value)}
            multiline
          />

          <ActionButton
            title={mutationLoading ? "Creating..." : "Create Client"}
            onPress={handleCreateClient}
            disabled={mutationLoading}
            tone="success"
          />
        </SectionCard>

        <SectionCard
          title="Client Snapshot"
          subtitle="Search, edit, and manage all salon clients."
        >
          <TextInput
            style={styles.searchInput}
            placeholder="Search clients..."
            placeholderTextColor="#9a92a3"
            value={clientSearch}
            onChangeText={setClientSearch}
          />

          {noClientsAtAll ? (
            <EmptyState
              title="No clients yet"
              subtitle="Create your first client profile to start building your salon customer base."
            />
          ) : noSearchMatches ? (
            <EmptyState
              title="No matching clients"
              subtitle="Try a different search term or clear the search field."
            />
          ) : (
            filteredClients.map((client) => (
              <View key={client.id} style={styles.listCard}>
                {editingClientId === client.id ? (
                  <>
                    <TextInput
                      style={styles.input}
                      placeholder="Full name"
                      placeholderTextColor="#9a92a3"
                      value={editForm.values.full_name}
                      onChangeText={(value) => editForm.setField("full_name", value)}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Phone"
                      placeholderTextColor="#9a92a3"
                      value={editForm.values.phone}
                      onChangeText={(value) => editForm.setField("phone", value)}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="#9a92a3"
                      value={editForm.values.email}
                      onChangeText={(value) => editForm.setField("email", value)}
                      autoCapitalize="none"
                    />
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Notes"
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
                      <ActionButton title="Cancel" onPress={cancelEditClient} />
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.cardTitle}>{client.full_name}</Text>
                    <Text style={styles.item}>Phone: {client.phone}</Text>
                    <Text style={styles.item}>Email: {client.email || "-"}</Text>
                    <Text style={styles.item}>Notes: {client.notes || "-"}</Text>

                    <View style={styles.actionRow}>
                      <ActionButton
                        title="Edit"
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
    backgroundColor: "#0a0b10",
    borderRadius: 30,
    padding: 26,
    marginBottom: 20,
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
    backgroundColor: "#0f1118",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#241f27",
    marginBottom: 18,
  },
  searchInput: {
    backgroundColor: "#11131a",
    color: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#2e2631",
  },
  input: {
    backgroundColor: "#11131a",
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
    backgroundColor: "#0f1118",
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
    backgroundColor: "#301218",
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
