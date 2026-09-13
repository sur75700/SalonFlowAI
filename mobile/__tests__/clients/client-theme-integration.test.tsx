import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');

const read = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('Client shared Royal Cosmos theme', () => {
  it('uses root Dashboard theme authority', () => {
    const layout = read('app/_layout.tsx');
    const client = read('app/client-v2.tsx');

    expect(layout).toContain('DashboardThemeProvider');
    expect(client).toContain('DashboardThemeBackground');
    expect(client).not.toContain('RoyalCosmosBackground');
    expect(client).not.toContain('DashboardThemeProvider');
  });
});
