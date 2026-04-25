import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import api from "./src/api/client";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setError("");

      const [summaryRes, clientsRes, servicesRes, appointmentsRes] =
        await Promise.all([
          api.get("/appointments/dashboard/summary"),
          api.get("/clients/"),
          api.get("/services/"),
          api.get("/appointments/"),
        ]);

      setSummary(summaryRes.data);
      setClients(clientsRes.data.items || []);
      setServices(servicesRes.data.items || []);
      setAppointments(appointmentsRes.data.items || []);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to load data"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading SalonFlow AI...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>SalonFlow AI</Text>
        <Text style={styles.subtitle}>Mobile Admin Preview</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dashboard Summary</Text>
          <View style={styles.card}>
            <Text style={styles.item}>Clients: {summary?.total_clients ?? 0}</Text>
            <Text style={styles.item}>Services: {summary?.total_services ?? 0}</Text>
            <Text style={styles.item}>Appointments: {summary?.total_appointments ?? 0}</Text>
            <Text style={styles.item}>Scheduled: {summary?.scheduled_appointments ?? 0}</Text>
            <Text style={styles.item}>Completed: {summary?.completed_appointments ?? 0}</Text>
            <Text style={styles.item}>Cancelled: {summary?.cancelled_appointments ?? 0}</Text>
            <Text style={styles.item}>Today: {summary?.today_appointments ?? 0}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clients</Text>
          {clients.map((client) => (
            <View key={client.id} style={styles.card}>
              <Text style={styles.cardTitle}>{client.full_name}</Text>
              <Text style={styles.item}>Phone: {client.phone}</Text>
              <Text style={styles.item}>Email: {client.email || "-"}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          {services.map((service) => (
            <View key={service.id} style={styles.card}>
              <Text style={styles.cardTitle}>{service.name}</Text>
              <Text style={styles.item}>Duration: {service.duration_minutes} min</Text>
              <Text style={styles.item}>Price: {service.price} {service.currency}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appointments</Text>
          {appointments.map((appointment) => (
            <View key={appointment.id} style={styles.card}>
              <Text style={styles.cardTitle}>{appointment.client_name}</Text>
              <Text style={styles.item}>Service: {appointment.service_name || "-"}</Text>
              <Text style={styles.item}>Status: {appointment.status}</Text>
              <Text style={styles.item}>Start: {appointment.starts_at}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0f1a" },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, backgroundColor: "#0b0f1a", alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 12, color: "#fff", fontSize: 16 },
  title: { fontSize: 32, fontWeight: "700", color: "#fff", marginBottom: 4 },
  subtitle: { fontSize: 16, color: "#a0a8b8", marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 10 },
  card: { backgroundColor: "#161c2c", borderRadius: 16, padding: 14, marginBottom: 10 },
  cardTitle: { fontSize: 17, fontWeight: "700", color: "#fff", marginBottom: 6 },
  item: { fontSize: 14, color: "#d8deea", marginBottom: 4 },
  errorBox: { backgroundColor: "#421919", padding: 12, borderRadius: 12, marginBottom: 16 },
  errorText: { color: "#ffb3b3", fontSize: 14 },
});
