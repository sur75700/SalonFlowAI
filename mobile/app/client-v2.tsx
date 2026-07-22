import { useMemo, useState } from 'react';

import ClientCenterContainerV2 from '../components/client-v2/ClientCenterContainerV2';
import type {
  ClientFilterKey,
  ClientFilterOption,
} from '../components/client-v2/ClientSearchFiltersV2';
import { buildClientRecordsV2 } from '../components/client-v2/clientV2Adapter';
import DevLoginCard from '../components/auth/DevLoginCard';
import RoyalCosmosBackground from '../components/ui/RoyalCosmosBackground';
import { useClientsData } from '../hooks/useResourceData';
import { useSession } from '../hooks/useSession';

const STATUS_LABELS = {
  active: 'Active',
  new: 'New',
  returning: 'Returning',
  vip: 'VIP',
  inactive: 'Inactive',
} as const;

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
  const { token, booting, clearToken } = useSession();
  const {
    clients,
    loading,
    refreshing,
    error,
    refresh,
    reload,
  } = useClientsData(token, clearToken);

  const [searchValue, setSearchValue] = useState('');
  const [activeFilterKey, setActiveFilterKey] =
    useState<ClientFilterKey>('all');

  const clientRecords = useMemo(
    () =>
      buildClientRecordsV2(clients, {
        labels: {
          unnamedClient: 'Unnamed client',
          statusLabels: STATUS_LABELS,
        },
      }),
    [clients]
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
        label: 'All',
        count: clientRecords.length,
      },
      {
        key: 'active',
        label: 'Active',
        count: clientRecords.filter(
          (client) => client.status === 'active'
        ).length,
      },
      {
        key: 'new',
        label: 'New',
        count: clientRecords.filter(
          (client) => client.status === 'new'
        ).length,
      },
      {
        key: 'returning',
        label: 'Returning',
        count: clientRecords.filter(
          (client) => client.status === 'returning'
        ).length,
      },
      {
        key: 'vip',
        label: 'VIP',
        count: clientRecords.filter(
          (client) => client.status === 'vip'
        ).length,
      },
      {
        key: 'inactive',
        label: 'Inactive',
        count: clientRecords.filter(
          (client) => client.status === 'inactive'
        ).length,
      },
    ],
    [clientRecords]
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

  if (!booting && !token) {
    return (
      <DevLoginCard
        title="Client Command Center"
        subtitle="Sign in to access the live client registry."
      />
    );
  }

  return (
    <RoyalCosmosBackground>
      <ClientCenterContainerV2
        header={{
          overline: 'SALONFLOW AI',
          title: 'Client Command Center',
          subtitle: 'Royal Cosmos client intelligence',
          liveStatusLabel: error ? 'Attention' : 'Live',
          liveStatusTone: error ? 'idle' : 'active',
          createClientLabel: 'Add client',
          disabled: true,
          loading: booting || loading,
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
          values: EMPTY_CREATE_FORM,
          disabled: true,
          onChangeField: () => {},
          onCreate: () => {},
        }}
        detailForm={{
          values: EMPTY_DETAIL_FORM,
          disabled: true,
          onChangeField: () => {},
          onSave: () => {},
        }}
        onDeleteClient={() => {}}
        onEmptyStateAction={() => {}}
        onErrorAction={reload}
        labels={{
          list: {
            errorDescription:
              error || 'The client registry could not be loaded.',
          },
        }}
      />
    </RoyalCosmosBackground>
  );
}
