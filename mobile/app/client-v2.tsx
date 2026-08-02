import { useMemo, useState } from 'react';

import ClientCenterContainerV2 from '../components/client-v2/ClientCenterContainerV2';
import type { CreateClientFormValues } from '../components/client-v2/CreateClientSheetV2';
import type { ClientRecord } from '../components/client-v2/ClientCardV3';
import type { ClientDetailFormValues } from '../components/client-v2/ClientDetailSheetV2';
import type {
  ClientFilterKey,
  ClientFilterOption,
} from '../components/client-v2/ClientSearchFiltersV2';
import { buildClientRecordsV2 } from '../components/client-v2/clientV2Adapter';
import DevLoginCard from '../components/auth/DevLoginCard';
import RoyalCosmosBackground from '../components/ui/RoyalCosmosBackground';
import { useClientsData } from '../hooks/useResourceData';
import { useClientMutations } from '../hooks/useMutations';
import { useSession } from '../hooks/useSession';
import { useAppLanguage } from '../contexts/LanguageContext';
import { t } from '../lib/i18n';

const EMPTY_CREATE_FORM = {
  fullName: '',
  phone: '',
  email: '',
  notes: '',
};

const EMPTY_DETAIL_FORM = {
  name: '',
  phone: '',
  email: '',
  notes: '',
  status: 'active' as const,
};

export default function ClientV2Screen() {
  const { language: locale } = useAppLanguage();
  const { token, booting, clearToken } = useSession();

  const statusLabels = useMemo(
    () => ({
      active: t('Client V2 Active', locale),
      new: t('Client V2 New', locale),
      returning: t('Client V2 Returning', locale),
      vip: t('Client V2 VIP', locale),
      inactive: t('Client V2 Inactive', locale),
    }),
    [locale]
  );
  const {
    clients,
    loading,
    refreshing,
    error,
    refresh,
    reload,
  } = useClientsData(token, clearToken);


  const {
    loading: mutationLoading,
    workingId,
    error: mutationError,
    createClient,
    updateClient,
    deleteClient,
  } = useClientMutations({
    token: token ?? '',
    clearToken,
    onSuccessReload: reload,
  });

  const [searchValue, setSearchValue] = useState('');
  const [activeFilterKey, setActiveFilterKey] =
    useState<ClientFilterKey>('all');

  const [createValues, setCreateValues] =
    useState<CreateClientFormValues>({ ...EMPTY_CREATE_FORM });

  const [createErrors, setCreateErrors] =
    useState<Partial<Record<keyof CreateClientFormValues, string>>>({});

  const [detailValues, setDetailValues] =
    useState<ClientDetailFormValues>({ ...EMPTY_DETAIL_FORM });

  const [detailErrors, setDetailErrors] =
    useState<Partial<Record<keyof ClientDetailFormValues, string>>>({});

  const clientRecords = useMemo(
    () =>
      buildClientRecordsV2(clients, {
        labels: {
          unnamedClient: t('Client V2 Unnamed Client', locale),
          statusLabels,
        },
      }),
    [clients, locale, statusLabels]
  );

  const filteredClients = useMemo(() => {
    const query = searchValue.trim().toLocaleLowerCase();

    return clientRecords.filter((client) => {
      const matchesFilter =
        activeFilterKey === 'all' || client.status === activeFilterKey;

      if (!matchesFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        client.name,
        client.phone,
        client.email,
        client.notes,
      ].some((value) => value?.toLocaleLowerCase().includes(query));
    });
  }, [activeFilterKey, clientRecords, searchValue]);

  const filters = useMemo<ClientFilterOption[]>(
    () => [
      {
        key: 'all',
        label: t('Client V2 All', locale),
        count: clientRecords.length,
      },
      {
        key: 'active',
        label: t('Client V2 Active', locale),
        count: clientRecords.filter(
          (client) => client.status === 'active'
        ).length,
      },
      {
        key: 'new',
        label: t('Client V2 New', locale),
        count: clientRecords.filter(
          (client) => client.status === 'new'
        ).length,
      },
      {
        key: 'returning',
        label: t('Client V2 Returning', locale),
        count: clientRecords.filter(
          (client) => client.status === 'returning'
        ).length,
      },
      {
        key: 'vip',
        label: t('Client V2 VIP', locale),
        count: clientRecords.filter(
          (client) => client.status === 'vip'
        ).length,
      },
      {
        key: 'inactive',
        label: t('Client V2 Inactive', locale),
        count: clientRecords.filter(
          (client) => client.status === 'inactive'
        ).length,
      },
    ],
    [clientRecords, locale]
  );

  const listState = useMemo(() => {
    if (booting || loading || refreshing) {
      return 'loading' as const;
    }

    if (error) {
      return 'error' as const;
    }

    if (clientRecords.length === 0) {
      return 'empty' as const;
    }

    if (filteredClients.length === 0) {
      return 'no-results' as const;
    }

    return 'idle' as const;
  }, [
    booting,
    clientRecords.length,
    error,
    filteredClients.length,
    loading,
    refreshing,
  ]);

  const handleCreateFieldChange = (
    field: keyof CreateClientFormValues,
    value: string
  ) => {
    setCreateValues((current) => ({
      ...current,
      [field]: value,
    }));

    setCreateErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  const handleCreateClient = async (): Promise<boolean> => {
    const fullName = createValues.fullName.trim();
    const phone = createValues.phone.trim();
    const email = createValues.email.trim();
    const notes = createValues.notes.trim();

    const nextErrors: Partial<
      Record<keyof CreateClientFormValues, string>
    > = {};

    if (!fullName) {
      nextErrors.fullName = 'Full name is required.';
    }

    if (!phone) {
      nextErrors.phone = 'Phone number is required.';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = t('Client V2 Invalid Email', locale);
    }

    if (Object.values(nextErrors).some(Boolean)) {
      setCreateErrors(nextErrors);
      return false;
    }

    const created = await createClient({
      full_name: fullName,
      phone,
      email: email || null,
      notes: notes || null,
    });

    if (created) {
      setCreateValues({ ...EMPTY_CREATE_FORM });
      setCreateErrors({});
    }

    return created;
  };

  const handleOpenClient = (client: ClientRecord) => {
    setDetailValues({
      name: client.name ?? '',
      phone: client.phone ?? '',
      email: client.email ?? '',
      notes: client.notes ?? '',
      status: client.status,
    });

    setDetailErrors({});
  };

  const handleDetailFieldChange = (
    field: keyof ClientDetailFormValues,
    value: string
  ) => {
    setDetailValues((current) => ({
      ...current,
      [field]: value,
    }));

    setDetailErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  const handleSaveClient = async (
    clientId: string
  ): Promise<boolean> => {
    const name = detailValues.name.trim();
    const phone = detailValues.phone.trim();
    const email = detailValues.email.trim();
    const notes = detailValues.notes.trim();

    const nextErrors: Partial<
      Record<keyof ClientDetailFormValues, string>
    > = {};

    if (!name) {
      nextErrors.name = 'Full name is required.';
    }

    if (!phone) {
      nextErrors.phone = 'Phone number is required.';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = t('Client V2 Invalid Email', locale);
    }

    if (Object.values(nextErrors).some(Boolean)) {
      setDetailErrors(nextErrors);
      return false;
    }

    const updated = await updateClient(clientId, {
      full_name: name,
      phone,
      email: email || null,
      notes: notes || null,
    });

    if (updated) {
      setDetailErrors({});
    }

    return updated;
  };

  const handleDeleteClient = async (
    clientId: string
  ): Promise<void> => {
    await deleteClient(clientId);
  };

  if (!booting && !token) {
    return (
      <DevLoginCard
        title={t('Client V2 Command Center', locale)}
        subtitle={t('Client V2 Sign In Subtitle', locale)}
      />
    );
  }

  return (
    <RoyalCosmosBackground>
      <ClientCenterContainerV2
        header={{
          overline: 'SALONFLOW AI',
          title: t('Client V2 Command Center', locale),
          subtitle: t('Client V2 Hero Subtitle', locale),
          liveStatusLabel: error
            ? t('Client V2 Attention', locale)
            : t('Client V2 Live', locale),
          liveStatusTone: error ? 'idle' : 'active',
          createClientLabel: t('Client V2 Add Client', locale),
          disabled: booting || mutationLoading,
          loading: booting || loading || mutationLoading,
        }}
        kpis={[]}
        summaryLoading={booting || loading}
        clients={filteredClients}
        listState={listState}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={filters}
        activeFilterKey={activeFilterKey}
        onFilterChange={setActiveFilterKey}
        searchFiltersDisabled={booting || loading}
        createForm={{
          values: createValues,
          errors: createErrors,
          loading: mutationLoading,
          disabled: booting || loading || mutationLoading,
          onChangeField: handleCreateFieldChange,
          onCreate: handleCreateClient,
          onReset: () => {
            setCreateValues({ ...EMPTY_CREATE_FORM });
            setCreateErrors({});
          },
        }}
        detailForm={{
          values: detailValues,
          errors: detailErrors,
          loading: Boolean(workingId),
          disabled:
            booting ||
            loading ||
            mutationLoading ||
            Boolean(workingId),
          statusOptions: Object.entries(statusLabels).map(
            ([key, label]) => ({
              key: key as ClientDetailFormValues['status'],
              label,
            })
          ),
          onChangeField: handleDetailFieldChange,
          onOpenClient: handleOpenClient,
          onSave: handleSaveClient,
        }}
        loadingClientIds={workingId ? [workingId] : []}
        disabledClientIds={workingId ? [workingId] : []}
        onDeleteClient={handleDeleteClient}
        onEmptyStateAction={() => {}}
        onErrorAction={reload}
        labels={{
          searchFilters: {
            searchPlaceholder: t('Client V2 Search Placeholder', locale),
            searchAccessibilityLabel: t(
              'Client V2 Search Accessibility',
              locale
            ),
            clearSearchAccessibilityLabel: t(
              'Client V2 Clear Search Accessibility',
              locale
            ),
            filterGroupAccessibilityLabel: t(
              'Client V2 Filter Group Accessibility',
              locale
            ),
          },
          list: {
            loadingAnnouncement: t('Client V2 Loading Clients', locale),
            emptyTitle: t('Client V2 Empty Title', locale),
            emptyDescription: t('Client V2 Empty Description', locale),
            emptyActionLabel: t('Client V2 Empty Action', locale),
            noResultsTitle: t('Client V2 No Results Title', locale),
            noResultsDescription: t(
              'Client V2 No Results Description',
              locale
            ),
            errorTitle: t('Client V2 Error Title', locale),
            errorDescription:
              mutationError ||
              error ||
              t('Client V2 Error Description', locale),
            errorActionLabel: t('Client V2 Retry', locale),
          },
          card: {
            phoneField: t('Client V2 Phone', locale),
            emailField: t('Client V2 Email', locale),
            editAction: t('Client V2 Edit', locale),
            deleteAction: t('Client V2 Delete', locale),
            destructiveHint: t('Client V2 Destructive Hint', locale),
            openDetailsAction: t('Client V2 View Details', locale),
            lastVisitField: t('Client V2 Last Visit', locale),
            upcomingAppointmentField: t(
              'Client V2 Next Appointment',
              locale
            ),
            visitCountField: t('Client V2 Visits', locale),
            lifetimeValueField: t('Client V2 Lifetime Value', locale),
            noUpcomingAppointment: t(
              'Client V2 None Scheduled',
              locale
            ),
          },
          createSheet: {
            title: t('Client V2 Create Title', locale),
            subtitle: t('Client V2 Create Subtitle', locale),
            fullNameField: t('Client V2 Full Name', locale),
            fullNamePlaceholder: t(
              'Client V2 Full Name Placeholder',
              locale
            ),
            phoneField: t('Client V2 Phone', locale),
            phonePlaceholder: t(
              'Client V2 Phone Placeholder',
              locale
            ),
            emailField: t('Client V2 Email', locale),
            emailPlaceholder: t(
              'Client V2 Email Placeholder',
              locale
            ),
            notesField: t('Client V2 Notes', locale),
            notesPlaceholder: t(
              'Client V2 Notes Placeholder',
              locale
            ),
            createAction: t('Client V2 Add Client', locale),
            creatingLabel: t('Client V2 Creating', locale),
            resetAction: t('Client V2 Reset', locale),
            closeAction: t('Client V2 Close', locale),
          },
          detailSheet: {
            nameField: t('Client V2 Full Name', locale),
            namePlaceholder: t('Client V2 Name Placeholder', locale),
            phoneField: t('Client V2 Phone', locale),
            phonePlaceholder: t(
              'Client V2 Phone Placeholder',
              locale
            ),
            emailField: t('Client V2 Email', locale),
            emailPlaceholder: t(
              'Client V2 Email Placeholder',
              locale
            ),
            notesField: t('Client V2 Notes', locale),
            notesPlaceholder: t(
              'Client V2 Detail Notes Placeholder',
              locale
            ),
            statusField: t('Client V2 Status', locale),
            lastVisitField: t('Client V2 Last Visit', locale),
            upcomingAppointmentField: t(
              'Client V2 Next Appointment',
              locale
            ),
            visitCountField: t('Client V2 Visits', locale),
            lifetimeValueField: t('Client V2 Lifetime Value', locale),
            editAction: t('Client V2 Edit', locale),
            saveAction: t('Client V2 Save Changes', locale),
            cancelAction: t('Client V2 Cancel', locale),
            closeAction: t('Client V2 Close', locale),
            savingLabel: t('Client V2 Saving', locale),
            noUpcomingAppointment: t(
              'Client V2 None Scheduled',
              locale
            ),
          },
        }}
      />
    </RoyalCosmosBackground>
  );
}
