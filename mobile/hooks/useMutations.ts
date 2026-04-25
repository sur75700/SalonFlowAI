import { useState } from "react";

import { api, authHeaders, isAuthError } from "../lib/api";
import { getErrorMessage } from "../lib/errors";
import type { AppointmentStatus } from "../types/models";

type MutationBaseArgs = {
  token: string;
  clearToken: () => void;
  onSuccessReload: () => Promise<void> | void;
  onAuthFailure?: () => void;
};

type CreateClientInput = {
  full_name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
};

type UpdateClientInput = CreateClientInput;

type CreateServiceInput = {
  name: string;
  duration_minutes: number;
  price: number;
  currency: string;
  is_active: boolean;
};

type UpdateServiceInput = CreateServiceInput;

type UpdateAppointmentInput = {
  client_id: string;
  service_id: string;
  starts_at: string;
  status: AppointmentStatus;
  notes?: string | null;
};

type CreateAppointmentInput = {
  client_id: string;
  service_id: string;
  starts_at: string;
  notes?: string | null;
};

function useMutationState() {
  const [loading, setLoading] = useState(false);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");

  return {
    loading,
    setLoading,
    workingId,
    setWorkingId,
    error,
    setError,
  };
}

function handleAuthFailure(
  err: any,
  clearToken: () => void,
  onAuthFailure?: () => void
): boolean {
  if (!isAuthError(err)) return false;

  clearToken();
  onAuthFailure?.();
  return true;
}

export function useClientMutations({
  token,
  clearToken,
  onSuccessReload,
  onAuthFailure,
}: MutationBaseArgs) {
  const state = useMutationState();

  const createClient = async (payload: CreateClientInput) => {
    try {
      state.setLoading(true);
      state.setError("");

      await api.post("/clients", payload, {
        headers: authHeaders(token),
      });

      await onSuccessReload();
      return true;
    } catch (err: any) {
      if (handleAuthFailure(err, clearToken, onAuthFailure)) {
        return false;
      }

      state.setError(getErrorMessage(err, "Failed to create client"));
      return false;
    } finally {
      state.setLoading(false);
    }
  };

  const updateClient = async (clientId: string, payload: UpdateClientInput) => {
    try {
      state.setWorkingId(clientId);
      state.setError("");

      await api.put(`/clients/${clientId}`, payload, {
        headers: authHeaders(token),
      });

      await onSuccessReload();
      return true;
    } catch (err: any) {
      if (handleAuthFailure(err, clearToken, onAuthFailure)) {
        return false;
      }

      state.setError(getErrorMessage(err, "Failed to update client"));
      return false;
    } finally {
      state.setWorkingId("");
    }
  };

  const deleteClient = async (clientId: string) => {
    try {
      state.setWorkingId(clientId);
      state.setError("");

      await api.delete(`/clients/${clientId}`, {
        headers: authHeaders(token),
      });

      await onSuccessReload();
      return true;
    } catch (err: any) {
      if (handleAuthFailure(err, clearToken, onAuthFailure)) {
        return false;
      }

      state.setError(getErrorMessage(err, "Failed to delete client"));
      return false;
    } finally {
      state.setWorkingId("");
    }
  };

  return {
    ...state,
    createClient,
    updateClient,
    deleteClient,
  };
}

export function useServiceMutations({
  token,
  clearToken,
  onSuccessReload,
  onAuthFailure,
}: MutationBaseArgs) {
  const state = useMutationState();

  const createService = async (payload: CreateServiceInput) => {
    try {
      state.setLoading(true);
      state.setError("");

      await api.post("/services", payload, {
        headers: authHeaders(token),
      });

      await onSuccessReload();
      return true;
    } catch (err: any) {
      if (handleAuthFailure(err, clearToken, onAuthFailure)) {
        return false;
      }

      state.setError(getErrorMessage(err, "Failed to create service"));
      return false;
    } finally {
      state.setLoading(false);
    }
  };

  const updateService = async (
    serviceId: string,
    payload: UpdateServiceInput
  ) => {
    try {
      state.setWorkingId(serviceId);
      state.setError("");

      await api.put(`/services/${serviceId}`, payload, {
        headers: authHeaders(token),
      });

      await onSuccessReload();
      return true;
    } catch (err: any) {
      if (handleAuthFailure(err, clearToken, onAuthFailure)) {
        return false;
      }

      state.setError(getErrorMessage(err, "Failed to update service"));
      return false;
    } finally {
      state.setWorkingId("");
    }
  };

  const deleteService = async (serviceId: string) => {
    try {
      state.setWorkingId(serviceId);
      state.setError("");

      await api.delete(`/services/${serviceId}`, {
        headers: authHeaders(token),
      });

      await onSuccessReload();
      return true;
    } catch (err: any) {
      if (handleAuthFailure(err, clearToken, onAuthFailure)) {
        return false;
      }

      state.setError(getErrorMessage(err, "Failed to delete service"));
      return false;
    } finally {
      state.setWorkingId("");
    }
  };

  return {
    ...state,
    createService,
    updateService,
    deleteService,
  };
}

export function useAppointmentMutations({
  token,
  clearToken,
  onSuccessReload,
  onAuthFailure,
}: MutationBaseArgs) {
  const state = useMutationState();

  const createAppointment = async (payload: CreateAppointmentInput) => {
    try {
      state.setLoading(true);
      state.setError("");

      await api.post("/appointments", payload, {
        headers: authHeaders(token),
      });

      await onSuccessReload();
      return true;
    } catch (err: any) {
      if (handleAuthFailure(err, clearToken, onAuthFailure)) {
        return false;
      }

      state.setError(getErrorMessage(err, "Failed to create appointment"));
      return false;
    } finally {
      state.setLoading(false);
    }
  };

  const updateAppointment = async (
    appointmentId: string,
    payload: UpdateAppointmentInput
  ) => {
    try {
      state.setWorkingId(appointmentId);
      state.setError("");

      await api.put(`/appointments/${appointmentId}`, payload, {
        headers: authHeaders(token),
      });

      await onSuccessReload();
      return true;
    } catch (err: any) {
      if (handleAuthFailure(err, clearToken, onAuthFailure)) {
        return false;
      }

      state.setError(getErrorMessage(err, "Failed to update appointment"));
      return false;
    } finally {
      state.setWorkingId("");
    }
  };

  const updateAppointmentStatus = async (
    appointmentId: string,
    status: AppointmentStatus
  ) => {
    try {
      state.setWorkingId(appointmentId);
      state.setError("");

      await api.patch(
        `/appointments/${appointmentId}/status`,
        { status },
        { headers: authHeaders(token) }
      );

      await onSuccessReload();
      return true;
    } catch (err: any) {
      if (handleAuthFailure(err, clearToken, onAuthFailure)) {
        return false;
      }

      state.setError(getErrorMessage(err, "Failed to update status"));
      return false;
    } finally {
      state.setWorkingId("");
    }
  };

  const deleteAppointment = async (appointmentId: string) => {
    try {
      state.setWorkingId(appointmentId);
      state.setError("");

      await api.delete(`/appointments/${appointmentId}`, {
        headers: authHeaders(token),
      });

      await onSuccessReload();
      return true;
    } catch (err: any) {
      if (handleAuthFailure(err, clearToken, onAuthFailure)) {
        return false;
      }

      state.setError(getErrorMessage(err, "Failed to delete appointment"));
      return false;
    } finally {
      state.setWorkingId("");
    }
  };

  return {
    ...state,
    createAppointment,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
  };
}
