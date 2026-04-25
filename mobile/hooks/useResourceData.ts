import { useCallback, useEffect, useState } from "react";

import { api, authHeaders, isAuthError } from "../lib/api";
import type {
  AppointmentItem,
  ClientItem,
  ServiceItem,
} from "../types/models";

type HookBaseState = {
  loading: boolean;
  refreshing: boolean;
  error: string;
};

type ClientsHookResult = HookBaseState & {
  clients: ClientItem[];
  reload: () => Promise<void>;
  refresh: () => void;
  setClients: React.Dispatch<React.SetStateAction<ClientItem[]>>;
};

type ServicesHookResult = HookBaseState & {
  services: ServiceItem[];
  reload: () => Promise<void>;
  refresh: () => void;
  setServices: React.Dispatch<React.SetStateAction<ServiceItem[]>>;
};

type AppointmentsHookResult = HookBaseState & {
  appointments: AppointmentItem[];
  clients: ClientItem[];
  services: ServiceItem[];
  reload: () => Promise<void>;
  refresh: () => void;
  setAppointments: React.Dispatch<React.SetStateAction<AppointmentItem[]>>;
  setClients: React.Dispatch<React.SetStateAction<ClientItem[]>>;
  setServices: React.Dispatch<React.SetStateAction<ServiceItem[]>>;
};

export function useClientsData(
  token: string,
  clearToken: () => void
): ClientsHookResult {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setClients([]);
      return;
    }

    try {
      setError("");

      const response = await api.get("/clients/", {
        headers: authHeaders(token),
      });

      setClients(response.data.items || []);
    } catch (err: any) {
      if (isAuthError(err)) {
        clearToken();
        setClients([]);
        setError("");
        return;
      }

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to load clients"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, clearToken]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = () => {
    setRefreshing(true);
    load();
  };

  return {
    clients,
    loading,
    refreshing,
    error,
    reload: load,
    refresh,
    setClients,
  };
}

export function useServicesData(
  token: string,
  clearToken: () => void
): ServicesHookResult {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setServices([]);
      return;
    }

    try {
      setError("");

      const response = await api.get("/services/", {
        headers: authHeaders(token),
      });

      setServices(response.data.items || []);
    } catch (err: any) {
      if (isAuthError(err)) {
        clearToken();
        setServices([]);
        setError("");
        return;
      }

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to load services"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, clearToken]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = () => {
    setRefreshing(true);
    load();
  };

  return {
    services,
    loading,
    refreshing,
    error,
    reload: load,
    refresh,
    setServices,
  };
}

export function useAppointmentsData(
  token: string,
  clearToken: () => void
): AppointmentsHookResult {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setAppointments([]);
      setClients([]);
      setServices([]);
      return;
    }

    try {
      setError("");

      const [appointmentsRes, clientsRes, servicesRes] = await Promise.all([
        api.get("/appointments/", {
          headers: authHeaders(token),
        }),
        api.get("/clients/", {
          headers: authHeaders(token),
        }),
        api.get("/services/", {
          headers: authHeaders(token),
        }),
      ]);

      setAppointments(appointmentsRes.data.items || []);
      setClients(clientsRes.data.items || []);
      setServices(servicesRes.data.items || []);
    } catch (err: any) {
      if (isAuthError(err)) {
        clearToken();
        setAppointments([]);
        setClients([]);
        setServices([]);
        setError("");
        return;
      }

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to load appointments"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, clearToken]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = () => {
    setRefreshing(true);
    load();
  };

  return {
    appointments,
    clients,
    services,
    loading,
    refreshing,
    error,
    reload: load,
    refresh,
    setAppointments,
    setClients,
    setServices,
  };
}
