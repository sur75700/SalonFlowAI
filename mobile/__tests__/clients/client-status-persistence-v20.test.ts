import fs from 'fs';
import path from 'path';

import { buildClientRecordV2 } from '../../components/client-v2/clientV2Adapter';
import type { ClientLifecycleStatus, ClientItem } from '../../types/models';

const statusLabels: Record<ClientLifecycleStatus, string> = {
  new: 'New',
  active: 'Active',
  returning: 'Returning',
  vip: 'VIP',
  inactive: 'Inactive',
};

describe('V20 client status persistence contract', () => {
  it('uses persisted status from the API model', () => {
    const client: ClientItem = {
      id: 'client-1',
      full_name: 'Ani Petrosyan',
      phone: '+37499111222',
      status: 'vip',
    };

    const record = buildClientRecordV2(client, {
      labels: {
        unnamedClient: 'Unnamed',
        statusLabels,
      },
    });

    expect(record.status).toBe('vip');
    expect(record.statusLabel).toBe('VIP');
  });

  it('keeps legacy clients safe with active fallback', () => {
    const client: ClientItem = {
      id: 'client-legacy',
      full_name: 'Legacy Client',
      phone: '+37499111333',
    };

    const record = buildClientRecordV2(client, {
      labels: {
        unnamedClient: 'Unnamed',
        statusLabels,
      },
    });

    expect(record.status).toBe('active');
  });

  it('wires detail status into the update payload', () => {
    const screenSource = fs.readFileSync(
      path.resolve(process.cwd(), 'app/client-v2.tsx'),
      'utf8'
    );
    const mutationsSource = fs.readFileSync(
      path.resolve(process.cwd(), 'hooks/useMutations.ts'),
      'utf8'
    );

    expect(screenSource).toContain('status: detailValues.status');
    expect(mutationsSource).toContain('status?: ClientLifecycleStatus');
  });
});
