import ClientCenterContainerV2 from '../components/client-v2/ClientCenterContainerV2';
import RoyalCosmosBackground from '../components/ui/RoyalCosmosBackground';
import type { ClientRecord } from '../components/client-v2/ClientCardV3';

const DEMO_CLIENTS: ClientRecord[] = [
  {
    id: 'demo-client-1',
    name: 'Sophia Laurent',
    initials: 'SL',
    phone: '+374 91 240 680',
    email: 'sophia.laurent@example.com',
    status: 'vip',
    statusLabel: 'VIP',
    vipLabel: 'Royal Client',
    lastVisitLabel: 'July 18, 2026',
    upcomingAppointmentLabel: 'July 25 · 14:30',
    visitCountLabel: '28 visits',
    lifetimeValueLabel: '֏ 1,480,000',
    notesPreview: 'Prefers premium hair treatments and quiet afternoon appointments.',
    notes: 'Prefers premium hair treatments and quiet afternoon appointments.',
  },
  {
    id: 'demo-client-2',
    name: 'Anna Petrosyan',
    initials: 'AP',
    phone: '+374 77 555 412',
    email: 'anna.petrosyan@example.com',
    status: 'active',
    statusLabel: 'Active',
    lastVisitLabel: 'July 20, 2026',
    upcomingAppointmentLabel: 'July 23 · 11:00',
    visitCountLabel: '14 visits',
    lifetimeValueLabel: '֏ 720,000',
    notesPreview: 'Usually books manicure and eyebrow services together.',
    notes: 'Usually books manicure and eyebrow services together.',
  },
  {
    id: 'demo-client-3',
    name: 'Mariam Grigoryan',
    initials: 'MG',
    phone: '+374 95 880 221',
    email: 'mariam.g@example.com',
    status: 'returning',
    statusLabel: 'Returning',
    lastVisitLabel: 'June 29, 2026',
    upcomingAppointmentLabel: 'July 29 · 17:00',
    visitCountLabel: '8 visits',
    lifetimeValueLabel: '֏ 395,000',
    notesPreview: 'Returning client interested in a new seasonal styling package.',
    notes: 'Returning client interested in a new seasonal styling package.',
  },
  {
    id: 'demo-client-4',
    name: 'Elena Martinez',
    initials: 'EM',
    phone: '+1 415 555 0198',
    email: 'elena.martinez@example.com',
    status: 'new',
    statusLabel: 'New',
    lastVisitLabel: 'First visit',
    upcomingAppointmentLabel: 'July 24 · 10:15',
    visitCountLabel: '1 visit',
    lifetimeValueLabel: '֏ 48,000',
    notesPreview: 'New client referred by an existing VIP customer.',
    notes: 'New client referred by an existing VIP customer.',
  },
  {
    id: 'demo-client-5',
    name: 'Lilit Harutyunyan',
    initials: 'LH',
    phone: '+374 43 310 909',
    email: 'lilit.h@example.com',
    status: 'inactive',
    statusLabel: 'Inactive',
    lastVisitLabel: 'February 12, 2026',
    upcomingAppointmentLabel: 'None scheduled',
    visitCountLabel: '5 visits',
    lifetimeValueLabel: '֏ 210,000',
    notesPreview: 'No appointment activity during the last five months.',
    notes: 'No appointment activity during the last five months.',
  },
];

export default function ClientV2Preview() {
  return (
    <RoyalCosmosBackground>
      <ClientCenterContainerV2
      header={{
        title: 'Client Command Center',
        subtitle: 'Royal Cosmos client intelligence',
        liveStatusLabel: 'Live',
        liveStatusTone: 'active',
      }}
      kpis={[]}
      clients={DEMO_CLIENTS}
      listState="idle"
      searchValue=""
      onSearchChange={() => {}}
      filters={[]}
      activeFilterKey="all"
      onFilterChange={() => {}}
      createForm={{
        values: {
          fullName: '',
          phone: '',
          email: '',
          notes: '',
        },
        onChangeField: () => {},
        onCreate: () => {},
      }}
      detailForm={{
        values: {
          name: '',
          phone: '',
          email: '',
          notes: '',
          status: 'active',
        },
        onChangeField: () => {},
        onSave: () => {},
      }}
      onDeleteClient={() => {}}
      />
    </RoyalCosmosBackground>
  );
}
