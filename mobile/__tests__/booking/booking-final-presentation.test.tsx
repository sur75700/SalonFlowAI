import fs from "fs";
import path from "path";

function source(relative: string): string {
  return fs.readFileSync(
    path.resolve(__dirname, "../..", relative),
    "utf8",
  );
}

describe("Booking Royal Cosmos final presentation", () => {
  test("active booking card keeps V3 and cosmic depth", () => {
    const list = source(
      "components/booking-v2/BookingListSectionV2.tsx",
    );
    const card = source(
      "components/booking-v2/BookingCardV3.tsx",
    );

    expect(list).toContain("<BookingCardV3");
    expect(card).toContain("styles.bookingCosmicSheen");
    expect(card).toContain("styles.bookingCosmicSheenBlue");
  });

  test("desktop Cosmic Command Modal stays adaptive while mobile keeps sheet mode", () => {
    const sheet = source(
      "components/booking-v2/CreateBookingSheetV2.tsx",
    );

    expect(sheet).toContain(
      "const isSheet = layout === 'sheet'",
    );
    expect(sheet).toContain("styles.panelOuter");
    expect(sheet).toContain("styles.panel");
    expect(sheet).toContain("styles.sheetOuter");
    expect(sheet).toContain("styles.sheet");
    expect(sheet).toContain("styles.desktopModalCrown");
    expect(sheet).toContain("maxWidth: 540");
    expect(sheet).toContain("maxHeight: '88%'");
    expect(sheet).toContain("justifyContent: 'center'");
    expect(sheet).toContain("alignItems: 'center'");
  });


  test("create appointment surface has premium cosmic depth", () => {
    const sheet = source(
      "components/booking-v2/CreateBookingSheetV2.tsx",
    );

    expect(sheet).toContain("styles.cosmicAura");
    expect(sheet).toContain("styles.cosmicAuraBlue");
    expect(sheet).toContain("styles.submitBtn");
    expect(sheet).toContain("styles.resetBtn");
  });

  test("header, summary and filters remain presentation-only surfaces", () => {
    const header = source(
      "components/booking-v2/BookingCommandHeaderV2.tsx",
    );
    const summary = source(
      "components/booking-v2/BookingSummaryStripV2.tsx",
    );
    const filters = source(
      "components/booking-v2/BookingStatusFilterV2.tsx",
    );

    expect(header).toContain("styles.glow");
    expect(summary).toContain("styles.accentLine");
    expect(filters).toContain("TextInput");

    expect(header).not.toContain("useAppointmentsData");
    expect(summary).not.toContain("useAppointmentsData");
    expect(filters).not.toContain("useAppointmentsData");
  });
});
