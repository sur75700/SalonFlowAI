import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');

const read = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('Client final Royal Cosmos create presentation', () => {
  it('renders a real centered desktop command surface', () => {
    const source = read(
      'components/client-v2/CreateClientSheetV2.tsx'
    );

    expect(source).toContain(
      'isDesktop && styles.overlayDesktop'
    );

    expect(source).toContain(
      'isDesktop && styles.backdropDesktop'
    );

    expect(source).toContain(
      "flexDirection: 'column'"
    );

    expect(source).toContain(
      "justifyContent: 'center'"
    );

    expect(source).toContain(
      "alignItems: 'center'"
    );

    expect(source).toContain(
      '...StyleSheet.absoluteFillObject'
    );

    expect(source).toContain(
      "height: 600"
    );

    expect(source).toContain(
      "minHeight: 560"
    );

    expect(source).toContain(
      "maxWidth: 560"
    );

    expect(source).toContain(
      "overflow: 'hidden'"
    );
  });

  it('contains restrained Royal Cosmos depth treatment', () => {
    const source = read(
      'components/client-v2/CreateClientSheetV2.tsx'
    );

    expect(source).toContain(
      'desktopModalCrown'
    );

    expect(source).toContain(
      'desktopModalOrbPrimary'
    );

    expect(source).toContain(
      'desktopModalOrbSecondary'
    );
  });

  it('preserves adaptive mobile sheet behavior', () => {
    const source = read(
      'components/client-v2/CreateClientSheetV2.tsx'
    );

    expect(source).toContain(
      'styles.panelMobile'
    );

    expect(source).toContain(
      "animationType={isDesktop ? 'fade' : 'slide'}"
    );

    expect(source).toContain(
      'styles.dragHandle'
    );
  });

  it('preserves backdrop interaction layer', () => {
    const source = read(
      'components/client-v2/CreateClientSheetV2.tsx'
    );

    expect(source).toContain(
      'styles.backdrop'
    );

    expect(source).toContain(
      'styles.backdropDesktop'
    );
  });
});
