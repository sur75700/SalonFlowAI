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
import { Picker } from "@react-native-picker/picker";

import DevLoginCard from "../../components/auth/DevLoginCard";
import SessionActionBar from "../../components/auth/SessionActionBar";
import SessionStatusBanner from "../../components/auth/SessionStatusBanner";
import ActionButton from "../../components/dashboard/ActionButton";
import SectionCard from "../../components/dashboard/SectionCard";
import EmptyState from "../../components/ui/EmptyState";
import FilterChip from "../../components/ui/FilterChip";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";
import StatusBadge from "../../components/ui/StatusBadge";
import { useToast } from "../../components/ui/Toast";
import { useConfirmAction } from "../../hooks/useConfirmAction";
import { useFormState } from "../../hooks/useFormState";
import { useLogout } from "../../hooks/useLogout";
import { useAppointmentsData } from "../../hooks/useResourceData";
import { useAppointmentMutations } from "../../hooks/useMutations";
import { useSession } from "../../hooks/useSession";
import type {
  AppointmentItem,
  AppointmentStatus,
} from "../../types/models";
import {
  formatDateTime,
  isFuture,
  isToday,
  nextHourDateTimeInput,
  toIsoFromLocalInput,
  todayEveningDateTimeInput,
  tomorrowMorningDateTimeInput,
} from "../../utils/formatters";

type FilterType = "all" | AppointmentStatus;

const emptyCreateForm = {
  client_id: "",
  service_id: "",
  starts_at: nextHourDateTimeInput(),
  notes: "",
};

const emptyEditForm = {
  client_id: "",
  service_id: "",
  starts_at: "",
  status: "scheduled" as AppointmentStatus,
  notes: "",
};

function AppointmentsSkeleton() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <LoadingSkeleton height={12} width={110} style={{ marginBottom: 12 }} />
          <LoadingSkeleton height={36} width={190} style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={14} width="96%" style={{ marginBottom: 8 }} />
          <LoadingSkeleton height={14} width="78%" />
        </View>

        <View style={styles.sectionCard}>
          <LoadingSkeleton height={20} width={160} style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={14} width="75%" style={{ marginBottom: 16 }} />
          <LoadingSkeleton height={52} width="100%" style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={52} width="100%" style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={52} width="100%" style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={90} width="100%" style={{ marginBottom: 14 }} />
          <LoadingSkeleton height={46} width={180} />
        </View>

        <View style={styles.sectionCard}>
          <LoadingSkeleton height={20} width={150} style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={14} width="85%" style={{ marginBottom: 16 }} />
          <LoadingSkeleton height={50} width="100%" style={{ marginBottom: 10 }} />
          <LoadingSkeleton height={40} width="70%" style={{ marginBottom: 14 }} />
          <LoadingSkeleton height={138} width="100%" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function AppointmentsScreen() {
  const { token, booting, clearToken, sessionEmail } = useSession();
  const { logout, loggingOut } = useLogout();
  const { showToast } = useToast();
  const { confirm } = useConfirmAction();

  const {
    appointments,
    clients,
    services,
    setAppointments,
    setClients,
    setServices,
    loading,
    refreshing,
    error,
    refresh,
    reload,
  } = useAppointmentsData(token, clearToken);

  const {
    error: mutationError,
    loading: mutationLoading,
    workingId,
    setError: setMutationError,
    createAppointment,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
  } = useAppointmentMutations({
    token,
    clearToken,
    onSuccessReload: reload,
    onAuthFailure: () => {
      setAppointments([]);
      setClients([]);
      setServices([]);
    },
  });

  const [appointmentFilter, setAppointmentFilter] =
    useState<FilterType>("all");
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [editingAppointmentId, setEditingAppointmentId] = useState("");
  const [savingAppointmentId, setSavingAppointmentId] = useState("");

  const createForm = useFormState(emptyCreateForm);
  const editForm = useFormState(emptyEditForm);

  const screenError = mutationError || error;

  const handleCreateAppointment = async () => {
    if (
      !createForm.values.client_id ||
      !createForm.values.service_id ||
      !createForm.values.starts_at.trim()
    ) {
      const message = "Client, service and booking time are required";
      setMutationError(message);
      showToast(message, "error");
      return;
    }

    const ok = await createAppointment({
      client_id: createForm.values.client_id,
      service_id: createForm.values.service_id,
      starts_at: toIsoFromLocalInput(createForm.values.starts_at.trim()),
      notes: createForm.values.notes.trim() || null,
    });

    if (ok) {
      createForm.fill({
        ...emptyCreateForm,
        starts_at: nextHourDateTimeInput(),
      });
      showToast("Appointment created successfully", "success");
    }
  };

  const startEditAppointment = (appointment: AppointmentItem) => {
    setEditingAppointmentId(appointment.id);

    const localDate = appointment.starts_at
      ? new Date(appointment.starts_at)
      : new Date();

    const yyyy = localDate.getFullYear();
    const mm = `${localDate.getMonth() + 1}`.padStart(2, "0");
    const dd = `${localDate.getDate()}`.padStart(2, "0");
    const hh = `${localDate.getHours()}`.padStart(2, "0");
    const mi = `${localDate.getMinutes()}`.padStart(2, "0");

    editForm.fill({
      client_id: appointment.client_id || "",
      service_id: appointment.service_id || "",
      starts_at: `${yyyy}-${mm}-${dd}T${hh}:${mi}`,
      status: (appointment.status as AppointmentStatus) || "scheduled",
      notes: appointment.notes || "",
    });

    setMutationError("");
  };

  const cancelEditAppointment = () => {
    setEditingAppointmentId("");
    editForm.reset();
    setMutationError("");
  };

  const handleSaveAppointment = async (appointmentId: string) => {
    if (
      !editForm.values.client_id ||
      !editForm.values.service_id ||
      !editForm.values.starts_at.trim()
    ) {
      const message = "Client, service and start datetime are required";
      setMutationError(message);
      showToast(message, "error");
      return;
    }

    try {
      setSavingAppointmentId(appointmentId);

      const ok = await updateAppointment(appointmentId, {
        client_id: editForm.values.client_id,
        service_id: editForm.values.service_id,
        starts_at: toIsoFromLocalInput(editForm.values.starts_at.trim()),
        status: editForm.values.status,
        notes: editForm.values.notes.trim() || null,
      });

      if (ok) {
        cancelEditAppointment();
        showToast("Booking updated successfully", "success");
      }
    } finally {
      setSavingAppointmentId("");
    }
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    const ok = await updateAppointmentStatus(appointmentId, "completed");
    if (ok) showToast("Booking marked completed", "success");
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    const ok = await updateAppointmentStatus(appointmentId, "cancelled");
    if (ok) showToast("Booking cancelled", "success");
  };

  const handleDeleteAppointment = async (appointment: AppointmentItem) => {
    const approved = await confirm(
      "Delete appointment?",
      "This booking for " +
        (appointment.client_name || "this client") +
        " will be permanently removed."
    );

    if (!approved) return;

    const ok = await deleteAppointment(appointment.id);
    if (ok) showToast("Booking deleted successfully", "success");
  };

  const filteredAppointments = useMemo(() => {
    const q = appointmentSearch.trim().toLowerCase();

    return appointments.filter((item) => {
      const statusMatch =
        appointmentFilter === "all" || item.status === appointmentFilter;

      const textMatch =
        !q ||
        (item.client_name || "").toLowerCase().includes(q) ||
        (item.service_name || "").toLowerCase().includes(q) ||
        (item.status || "").toLowerCase().includes(q) ||
        (item.notes || "").toLowerCase().includes(q);

      return statusMatch && textMatch;
    });
  }, [appointments, appointmentFilter, appointmentSearch]);

  const todayAppointments = useMemo(() => {
    return appointments
      .filter((item) => isToday(item.starts_at))
      .sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      );
  }, [appointments]);

  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter((item) => isFuture(item.starts_at) && !isToday(item.starts_at))
      .sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      )
      .slice(0, 5);
  }, [appointments]);

  const noAppointmentsAtAll = appointments.length === 0;
  const noSearchMatches =
    appointments.length > 0 && filteredAppointments.length === 0;

  if (booting || loading) {
    return <AppointmentsSkeleton />;
  }

  if (!token) {
    return (
      <DevLoginCard
        title="Bookings Hub"
        subtitle="Your admin session is unavailable. Restore access to continue."
      />
    );
  }

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
          <Text style={styles.heroTitle}>Bookings</Text>
          <Text style={styles.heroText}>
            Manage bookings, create reservations, update statuses, and keep
            daily salon flow under control.
          </Text>
        </View>

        <SessionActionBar
          email={sessionEmail}
          onLogout={logout}
          loggingOut={loggingOut}
        />

        <SessionStatusBanner
          title="Booking Flow Connected"
          subtitle="Your active session can create bookings, update statuses, reschedule appointments, and manage salon operations."
        />

        {screenError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{screenError}</Text>
          </View>
        ) : null}

        <SectionCard
          title="Create Appointment"
          subtitle="Create a new salon booking with client, service, date, and notes."
        >
          <Text style={styles.label}>Client</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={createForm.values.client_id}
              onValueChange={(value) =>
                createForm.setField("client_id", String(value))
              }
              dropdownIconColor="#f5d27a"
              style={styles.picker}
            >
              <Picker.Item label="Select client" value="" />
              {clients.map((client) => (
                <Picker.Item
                  key={client.id}
                  label={client.full_name + " (" + client.phone + ")"}
                  value={client.id}
                />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Service</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={createForm.values.service_id}
              onValueChange={(value) =>
                createForm.setField("service_id", String(value))
              }
              dropdownIconColor="#f5d27a"
              style={styles.picker}
            >
              <Picker.Item label="Select service" value="" />
              {services.map((service) => (
                <Picker.Item
                  key={service.id}
                  label={
                    service.name +
                    " — " +
                    service.duration_minutes +
                    " min"
                  }
                  value={service.id}
                />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Booking time</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DDTHH:MM"
            placeholderTextColor="#9a92a3"
            value={createForm.values.starts_at}
            onChangeText={(value) => createForm.setField("starts_at", value)}
          />

          <View style={styles.quickActions}>
            <FilterChip
              label="Next hour"
              active={false}
              onPress={() =>
                createForm.setField("starts_at", nextHourDateTimeInput())
              }
            />
            <FilterChip
              label="Today 18:00"
              active={false}
              onPress={() =>
                createForm.setField("starts_at", todayEveningDateTimeInput())
              }
            />
            <FilterChip
              label="Tomorrow 10:00"
              active={false}
              onPress={() =>
                createForm.setField("starts_at", tomorrowMorningDateTimeInput())
              }
            />
          </View>

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Booking notes"
            placeholderTextColor="#9a92a3"
            value={createForm.values.notes}
            onChangeText={(value) => createForm.setField("notes", value)}
            multiline
          />

          <View style={styles.actionRow}>
            <ActionButton
              title={mutationLoading ? "Creating..." : "Create Appointment"}
              onPress={handleCreateAppointment}
              disabled={mutationLoading}
              tone="success"
            />
            <ActionButton
              title="Reset Form"
              onPress={() =>
                createForm.fill({
                  ...emptyCreateForm,
                  starts_at: nextHourDateTimeInput(),
                })
              }
            />
          </View>
        </SectionCard>

        <SectionCard
          title="Today Bookings"
          subtitle="Live same-day appointment flow."
        >
          {todayAppointments.length === 0 ? (
            <EmptyState
              title="No bookings today"
              subtitle="Today has no scheduled appointments right now."
            />
          ) : (
            todayAppointments.map((appointment) => (
              <View key={appointment.id} style={styles.dayCard}>
                <View style={styles.dayCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{appointment.client_name}</Text>
                    <Text style={styles.cardMuted}>
                      {appointment.service_name || "-"}
                    </Text>
                  </View>

                  <StatusBadge status={appointment.status} />
                </View>

                <Text style={styles.item}>
                  Start: {formatDateTime(appointment.starts_at)}
                </Text>
                <Text style={styles.item}>
                  End: {formatDateTime(appointment.ends_at)}
                </Text>
              </View>
            ))
          )}
        </SectionCard>

        <SectionCard
          title="Upcoming Bookings"
          subtitle="Next scheduled client flow."
        >
          {upcomingAppointments.length === 0 ? (
            <EmptyState
              title="No upcoming bookings"
              subtitle="There are no future appointments scheduled yet."
            />
          ) : (
            upcomingAppointments.map((appointment) => (
              <View key={appointment.id} style={styles.dayCard}>
                <View style={styles.dayCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{appointment.client_name}</Text>
                    <Text style={styles.cardMuted}>
                      {appointment.service_name || "-"}
                    </Text>
                  </View>

                  <StatusBadge status={appointment.status} />
                </View>

                <Text style={styles.item}>
                  Start: {formatDateTime(appointment.starts_at)}
                </Text>
                <Text style={styles.item}>
                  End: {formatDateTime(appointment.ends_at)}
                </Text>
              </View>
            ))
          )}
        </SectionCard>

        <SectionCard
          title="All Bookings"
          subtitle="Search, filter, update, complete, cancel, or remove bookings."
        >
          <TextInput
            style={styles.searchInput}
            placeholder="Search appointments..."
            placeholderTextColor="#9a92a3"
            value={appointmentSearch}
            onChangeText={setAppointmentSearch}
          />

          <View style={styles.filterRow}>
            {(["all", "scheduled", "completed", "cancelled"] as FilterType[]).map(
              (filter) => (
                <FilterChip
                  key={filter}
                  label={filter}
                  active={appointmentFilter === filter}
                  onPress={() => setAppointmentFilter(filter)}
                />
              )
            )}
          </View>

          {noAppointmentsAtAll ? (
            <EmptyState
              title="No appointments yet"
              subtitle="Create your first booking using the appointment form above."
            />
          ) : noSearchMatches ? (
            <EmptyState
              title="No matching appointments"
              subtitle="Try another search term or switch the active filter."
            />
          ) : (
            filteredAppointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                {editingAppointmentId === appointment.id ? (
                  <>
                    <Text style={styles.label}>Client</Text>
                    <View style={styles.pickerWrap}>
                      <Picker
                        selectedValue={editForm.values.client_id}
                        onValueChange={(value) =>
                          editForm.setField("client_id", String(value))
                        }
                        dropdownIconColor="#f5d27a"
                        style={styles.picker}
                      >
                        <Picker.Item label="Select client" value="" />
                        {clients.map((client) => (
                          <Picker.Item
                            key={client.id}
                            label={client.full_name + " (" + client.phone + ")"}
                            value={client.id}
                          />
                        ))}
                      </Picker>
                    </View>

                    <Text style={styles.label}>Service</Text>
                    <View style={styles.pickerWrap}>
                      <Picker
                        selectedValue={editForm.values.service_id}
                        onValueChange={(value) =>
                          editForm.setField("service_id", String(value))
                        }
                        dropdownIconColor="#f5d27a"
                        style={styles.picker}
                      >
                        <Picker.Item label="Select service" value="" />
                        {services.map((service) => (
                          <Picker.Item
                            key={service.id}
                            label={
                              service.name +
                              " — " +
                              service.price +
                              " " +
                              service.currency
                            }
                            value={service.id}
                          />
                        ))}
                      </Picker>
                    </View>

                    <Text style={styles.label}>Start time</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DDTHH:MM"
                      placeholderTextColor="#9a92a3"
                      value={editForm.values.starts_at}
                      onChangeText={(value) =>
                        editForm.setField("starts_at", value)
                      }
                    />

                    <Text style={styles.label}>Status</Text>
                    <View style={styles.pickerWrap}>
                      <Picker
                        selectedValue={editForm.values.status}
                        onValueChange={(value) =>
                          editForm.setField("status", value as AppointmentStatus)
                        }
                        dropdownIconColor="#f5d27a"
                        style={styles.picker}
                      >
                        <Picker.Item label="Scheduled" value="scheduled" />
                        <Picker.Item label="Completed" value="completed" />
                        <Picker.Item label="Cancelled" value="cancelled" />
                      </Picker>
                    </View>

                    <Text style={styles.label}>Notes</Text>
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
                        title={
                          savingAppointmentId === appointment.id
                            ? "Working..."
                            : "Save"
                        }
                        onPress={() => handleSaveAppointment(appointment.id)}
                        disabled={savingAppointmentId === appointment.id}
                        tone="success"
                      />
                      <ActionButton title="Cancel" onPress={cancelEditAppointment} />
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.appointmentHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>
                          {appointment.client_name}
                        </Text>
                        <Text style={styles.cardMuted}>
                          {appointment.service_name || "-"}
                        </Text>
                      </View>

                      <StatusBadge status={appointment.status} />
                    </View>

                    <Text style={styles.item}>
                      Start: {formatDateTime(appointment.starts_at)}
                    </Text>
                    <Text style={styles.item}>
                      End: {formatDateTime(appointment.ends_at)}
                    </Text>
                    <Text style={styles.item}>
                      Notes: {appointment.notes || "-"}
                    </Text>

                    <View style={styles.actionRow}>
                      <ActionButton
                        title="Edit"
                        onPress={() => startEditAppointment(appointment)}
                        tone="success"
                      />
                      <ActionButton
                        title={workingId === appointment.id ? "Working..." : "Complete"}
                        onPress={() => handleCompleteAppointment(appointment.id)}
                        disabled={workingId === appointment.id}
                        tone="success"
                      />
                      <ActionButton
                        title={workingId === appointment.id ? "Working..." : "Cancel"}
                        onPress={() => handleCancelAppointment(appointment.id)}
                        disabled={workingId === appointment.id}
                        tone="warning"
                      />
                      <ActionButton
                        title={workingId === appointment.id ? "Working..." : "Delete"}
                        onPress={() => handleDeleteAppointment(appointment)}
                        disabled={workingId === appointment.id}
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
  pickerWrap: {
    backgroundColor: "#11131a",
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2e2631",
    overflow: "hidden",
  },
  picker: {
    color: "#ffffff",
    backgroundColor: "#11131a",
  },
  quickActions: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  appointmentCard: {
    backgroundColor: "#0f1118",
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#241f27",
  },
  dayCard: {
    backgroundColor: "#11131a",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2b2f3a",
  },
  dayCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 6,
  },
  cardMuted: {
    color: "#b7adbf",
    fontSize: 13,
  },
  item: {
    color: "#ece7ef",
    fontSize: 14,
    marginBottom: 4,
  },
  label: {
    color: "#f5d27a",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 8,
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
});
