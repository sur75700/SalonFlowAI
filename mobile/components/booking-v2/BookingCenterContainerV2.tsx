import React, { useMemo, useState } from "react";

import BookingCenterCompositionV2 from "./BookingCenterCompositionV2";
import type { BookingFilterValue } from "./BookingStatusFilterV2";
import { buildBookingListItemV2 } from "./buildBookingListItemV2";

import { useAppPreferences } from "../../hooks/useAppPreferences";
import { useAppointmentMutations } from "../../hooks/useMutations";
import { useAppointmentsData } from "../../hooks/useResourceData";
import { useSession } from "../../hooks/useSession";
import { t } from "../../lib/i18n/index";
import {
  isFuture,
  isToday,
  nextHourDateTimeInput,
  toIsoFromLocalInput,
  todayEveningDateTimeInput,
  tomorrowMorningDateTimeInput,
} from "../../utils/formatters";

type CompositionProps = React.ComponentProps<
  typeof BookingCenterCompositionV2
>;

function toLocalDateTimeInput(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (number: number) => String(number).padStart(2, "0");

  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
  ].join("");
}

export default function BookingCenterContainerV2() {
  const { token, clearToken } = useSession();
  const { locale } = useAppPreferences();

  const appointmentsData = useAppointmentsData(
    token,
    clearToken
  );

  const appointmentMutations = useAppointmentMutations({
    token,
    clearToken,
    onSuccessReload: appointmentsData.reload,
  });

  const [filter, setFilter] =
    useState<BookingFilterValue>("all");

  const [search, setSearch] = useState("");
  const [createPanelVisible, setCreatePanelVisible] =
    useState(false);

  const [selectedClientId, setSelectedClientId] =
    useState<string | undefined>();

  const [selectedServiceId, setSelectedServiceId] =
    useState<string | undefined>();

  const [bookingTime, setBookingTime] = useState(
    nextHourDateTimeInput()
  );

  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  const [editingAppointment, setEditingAppointment] =
    useState<(typeof appointmentsData.appointments)[number] | null>(
      null
    );

  const filterOptions =
    useMemo<CompositionProps["statusFilterOptions"]>(
      () => [
        {
          value: "all",
          label: t("All", locale as any),
        },
        {
          value: "scheduled",
          label: t("Scheduled", locale as any),
        },
        {
          value: "completed",
          label: t("Completed", locale as any),
        },
        {
          value: "cancelled",
          label: t("Cancelled", locale as any),
        },
      ],
      [locale]
    );

  const bookingRecords = useMemo(
    () =>
      appointmentsData.appointments.map((appointment) => ({
        appointment,
        item: buildBookingListItemV2(appointment, {
          locale,

          onEdit: (item) => {
            setEditingAppointment(item);
            setSelectedClientId(item.client_id);
            setSelectedServiceId(item.service_id ?? undefined);
            setBookingTime(
              toLocalDateTimeInput(item.starts_at)
            );
            setNotes(item.notes || "");
            setFormError("");
            setCreatePanelVisible(true);
          },

          onComplete: (item) => {
            void appointmentMutations.updateAppointmentStatus(
              item.id,
              "completed"
            );
          },

          onCancel: (item) => {
            void appointmentMutations.updateAppointmentStatus(
              item.id,
              "cancelled"
            );
          },

          onDelete: (item) => {
            void appointmentMutations.deleteAppointment(
              item.id
            );
          },
        }),
      })),
    [
      appointmentsData.appointments,
      appointmentMutations.deleteAppointment,
      locale,
    ]
  );

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookingRecords.filter(({ item }) => {
      const statusMatches =
        filter === "all" || item.status === filter;

      const searchMatches =
        !query ||
        (item.clientName || "")
          .toLowerCase()
          .includes(query) ||
        (item.serviceName || "")
          .toLowerCase()
          .includes(query) ||
        (item.statusLabel || "")
          .toLowerCase()
          .includes(query) ||
        (item.notes || "")
          .toLowerCase()
          .includes(query);

      return statusMatches && searchMatches;
    });
  }, [bookingRecords, filter, search]);

  const todayAppointments = useMemo(
    () =>
      filteredRecords
        .filter(({ appointment }) =>
          isToday(appointment.starts_at)
        )
        .sort(
          (a, b) =>
            new Date(a.appointment.starts_at).getTime() -
            new Date(b.appointment.starts_at).getTime()
        )
        .map(({ item }) => item),
    [filteredRecords]
  );

  const upcomingAppointments = useMemo(
    () =>
      filteredRecords
        .filter(
          ({ appointment }) =>
            isFuture(appointment.starts_at) &&
            !isToday(appointment.starts_at)
        )
        .sort(
          (a, b) =>
            new Date(a.appointment.starts_at).getTime() -
            new Date(b.appointment.starts_at).getTime()
        )
        .slice(0, 5)
        .map(({ item }) => item),
    [filteredRecords]
  );

  const registryAppointments = useMemo(
    () => filteredRecords.map(({ item }) => item),
    [filteredRecords]
  );

  const summaryStats =
    useMemo<CompositionProps["summaryStats"]>(
      () => [
        {
          label: t("Today Label", locale as any),
          value: String(todayAppointments.length),
          tone: "royal",
        },
        {
          label: t("Total Label", locale as any),
          value: String(
            appointmentsData.appointments.length
          ),
          tone: "gold",
        },
        {
          label: t("Upcoming Label", locale as any),
          value: String(upcomingAppointments.length),
          tone: "blue",
        },
      ],
      [
        appointmentsData.appointments.length,
        locale,
        todayAppointments.length,
        upcomingAppointments.length,
      ]
    );

  const clientOptions =
    useMemo<CompositionProps["clientOptions"]>(
      () =>
        appointmentsData.clients.map((client) => ({
          id: client.id,
          label: client.phone
            ? `${client.full_name} (${client.phone})`
            : client.full_name,
        })),
      [appointmentsData.clients]
    );

  const serviceOptions =
    useMemo<CompositionProps["serviceOptions"]>(
      () =>
        appointmentsData.services.map((service) => ({
          id: service.id,
          label: service.duration_minutes
            ? `${service.name} — ${service.duration_minutes} min`
            : service.name,
        })),
      [appointmentsData.services]
    );

  const quickActions =
    useMemo<CompositionProps["quickActions"]>(
      () => [
        {
          label: t("Quick Next Hour", locale as any),
          onPress: () =>
            setBookingTime(nextHourDateTimeInput()),
        },
        {
          label: t(
            "Quick Today Evening",
            locale as any
          ),
          onPress: () =>
            setBookingTime(
              todayEveningDateTimeInput()
            ),
        },
        {
          label: t(
            "Quick Tomorrow Morning",
            locale as any
          ),
          onPress: () =>
            setBookingTime(
              tomorrowMorningDateTimeInput()
            ),
        },
      ],
      [locale]
    );

  const resetCreateForm = () => {
    setSelectedClientId(undefined);
    setSelectedServiceId(undefined);
    setBookingTime(nextHourDateTimeInput());
    setNotes("");
    setFormError("");
    setEditingAppointment(null);
  };

  const handleCreateAppointment = async () => {
    if (
      !selectedClientId ||
      !selectedServiceId ||
      !bookingTime.trim()
    ) {
      setFormError(
        t("Booking Fields Required", locale as any)
      );
      return;
    }

    setFormError("");

    const payload = {
      client_id: selectedClientId,
      service_id: selectedServiceId,
      starts_at: toIsoFromLocalInput(
        bookingTime.trim()
      ),
      notes: notes.trim() || null,
    };

    const saved = editingAppointment
      ? await appointmentMutations.updateAppointment(
          editingAppointment.id,
          {
            ...payload,
            status:
              editingAppointment.status === "completed" ||
              editingAppointment.status === "cancelled"
                ? editingAppointment.status
                : "scheduled",
          }
        )
      : await appointmentMutations.createAppointment(
          payload
        );

    if (!saved) {
      return;
    }

    resetCreateForm();
    setCreatePanelVisible(false);
  };

  const screenError =
    formError ||
    appointmentMutations.error ||
    appointmentsData.error ||
    "";

  return (
    <BookingCenterCompositionV2
      title={t("Bookings", locale as any)}
      subtitle={t(
        "Appointments Hero Subtitle",
        locale as any
      )}
      connectionStatusLabel={t(
        "Booking Flow Connected",
        locale as any
      )}
      connectionStatusSubtitle={t(
        "Booking Flow Connected Subtitle",
        locale as any
      )}
      createActionLabel={t(
        "Create Appointment",
        locale as any
      )}
      todayAppointments={todayAppointments}
      upcomingAppointments={upcomingAppointments}
      registryAppointments={registryAppointments}
      summaryStats={summaryStats}
      statusFilterOptions={filterOptions}
      selectedStatusFilter={filter}
      onChangeStatusFilter={setFilter}
      searchValue={search}
      onChangeSearch={setSearch}
      searchPlaceholder={t(
        "Search Appointments",
        locale as any
      )}
      loading={appointmentsData.loading}
      refreshing={appointmentsData.refreshing}
      error={appointmentsData.error || undefined}
      onRefresh={appointmentsData.refresh}
      todaySectionTitle={t(
        "TodayBookings",
        locale as any
      )}
      todaySectionSubtitle={t(
        "TodayBookingsSubtitle",
        locale as any
      )}
      upcomingSectionTitle={t(
        "Upcoming Bookings",
        locale as any
      )}
      upcomingSectionSubtitle={t(
        "Upcoming Bookings Subtitle",
        locale as any
      )}
      registrySectionTitle={t(
        "Booking Registry",
        locale as any
      )}
      emptyLabel={t(
        "No appointments scheduled for today.",
        locale as any
      )}
      createPanelVisible={createPanelVisible}
      onOpenCreatePanel={() => {
        resetCreateForm();
        setCreatePanelVisible(true);
      }}
      onCloseCreatePanel={() => {
        setCreatePanelVisible(false);
        resetCreateForm();
      }}
      createPanelTitle={t(
        editingAppointment
          ? "Edit Appointment"
          : "Create Appointment",
        locale as any
      )}
      createPanelSubtitle={t(
        "Create Appointment Subtitle",
        locale as any
      )}
      clientLabel={t("Client", locale as any)}
      clientOptions={clientOptions}
      selectedClientId={selectedClientId}
      clientPlaceholder={t(
        "Select Client",
        locale as any
      )}
      onSelectClient={setSelectedClientId}
      serviceLabel={t("Service", locale as any)}
      serviceOptions={serviceOptions}
      selectedServiceId={selectedServiceId}
      servicePlaceholder={t(
        "Select Service",
        locale as any
      )}
      onSelectService={setSelectedServiceId}
      bookingTimeLabel={t(
        "Booking Time",
        locale as any
      )}
      bookingTimeValue={bookingTime}
      onChangeBookingTime={setBookingTime}
      quickActions={quickActions}
      notesLabel={t("Notes", locale as any)}
      notesValue={notes}
      onChangeNotes={setNotes}
      notesPlaceholder={t(
        "Booking Notes Placeholder",
        locale as any
      )}
      submitLabel={t(
        editingAppointment
          ? "Save Changes"
          : "Create Appointment",
        locale as any
      )}
      onSubmit={() => {
        void handleCreateAppointment();
      }}
      submitting={appointmentMutations.loading}
      resetLabel={t(
        "Reset Form",
        locale as any
      )}
      onReset={resetCreateForm}
      errorMessage={screenError || undefined}
    />
  );
}
