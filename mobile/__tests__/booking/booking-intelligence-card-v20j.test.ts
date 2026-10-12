import fs from "fs";
import path from "path";

function source(relative: string): string {
  return fs.readFileSync(path.resolve(__dirname, "../..", relative), "utf8");
}

describe("V20J booking intelligence card contract", () => {
  test("projects persisted client status and service icon identity", () => {
    const container = source("components/booking-v2/BookingCenterContainerV2.tsx");
    const builder = source("components/booking-v2/buildBookingListItemV2.ts");

    expect(container).toContain("clientStatusById");
    expect(container).toContain("serviceIconKeyById");
    expect(builder).toContain("clientStatus: options.clientStatus");
    expect(builder).toContain("serviceIconKey: options.serviceIconKey");
    expect(builder).toContain("priceLabel: formatPrice");
  });

  test("opens read-only appointment details from the card and keeps edit explicit", () => {
    const builder = source("components/booking-v2/buildBookingListItemV2.ts");
    expect(builder).toContain("onPress: options.onOpen");
    expect(builder).toContain("onEdit: options.onEdit");
    expect(builder).not.toContain("onPress: options.onEdit");
  });

  test("renders premium client, service and quick-fact hierarchy", () => {
    const card = source("components/booking-v2/BookingCardV3.tsx");
    expect(card).toContain("ClientPriorityBadge");
    expect(card).toContain("resolveServiceIconName");
    expect(card).toContain("styles.clientHero");
    expect(card).toContain("styles.serviceHero");
    expect(card).toContain("styles.factRail");
    expect(card).toContain('name="expand-outline"');
    expect(card).toContain("V20J_BOOKING_INTELLIGENCE_CARD");
  });
});
