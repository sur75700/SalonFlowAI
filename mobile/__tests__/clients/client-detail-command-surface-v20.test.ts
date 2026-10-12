import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');

const read = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('Client V20 centered premium detail/edit command surface', () => {
  it('centers the desktop client detail/edit experience', () => {
    const source = read('components/client-v2/ClientDetailSheetV2.tsx');

    expect(source).toContain('isDesktop && styles.overlayDesktop');
    expect(source).toContain('isDesktop && styles.backdropDesktop');
    expect(source).toContain("justifyContent: 'center'");
    expect(source).toContain("alignItems: 'center'");
    expect(source).toContain("maxWidth: 760");
    expect(source).toContain("height: 690");
    expect(source).toContain("maxHeight: '88%'");
    expect(source).toContain("borderRadius: 30");
    expect(source).toContain("overflow: 'hidden'");
    expect(source).toContain('desktopModalCrown');
    expect(source).toContain('desktopModalOrbPrimary');
    expect(source).toContain('desktopModalOrbSecondary');
  });

  it('preserves mobile bottom-sheet behavior', () => {
    const source = read('components/client-v2/ClientDetailSheetV2.tsx');

    expect(source).toContain('styles.panelMobile');
    expect(source).toContain("animationType={isDesktop ? 'fade' : 'slide'}");
    expect(source).toContain('styles.dragHandle');
  });

  it('gives VIP and new clients priority glow in detail/edit status controls', () => {
    const source = read('components/client-v2/ClientDetailSheetV2.tsx');

    expect(source).toContain("client?.status === 'vip' || client?.status === 'new'");
    expect(source).toContain("option.key === 'vip' || option.key === 'new'");
    expect(source).toContain('priorityGlowStyle');
    expect(source).toContain('statusBadgePriority');
  });

  it('gives VIP and new client cards restrained semantic neon priority', () => {
    const source = read('components/client-v2/ClientCardV3.tsx');

    expect(source).toContain("status === 'vip' || status === 'new'");
    expect(source).toContain('priorityClientStyle');
    expect(source).toContain('priorityBadge');
    expect(source).toContain("status === 'vip' ? 0.30 : 0.24");
  });

  it('keeps the active theme as modal authority', () => {
    const source = read('components/client-v2/ClientDetailSheetV2.tsx');

    expect(source).toContain("selectedThemeId === 'royal_gold_cosmos'");
    expect(source).toContain('dashboardTheme.palette.surface');
    expect(source).toContain('dashboardTheme.palette.surfaceRaised');
    expect(source).toContain('dashboardTheme.palette.royal');
    expect(source).toContain('dashboardTheme.palette.gold');
  });
});
