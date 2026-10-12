import fs from "fs";
import path from "path";

function read(relativePath: string): string {
  return fs.readFileSync(
    path.resolve(process.cwd(), relativePath),
    "utf8",
  );
}

describe("V20K booking detail view / edit separation", () => {
  it("localizes the open-appointment hint instead of hard-coding English", () => {
    const card = read("components/booking-v2/BookingCardV3.tsx");
    const i18n = read("lib/i18n/index.ts");

    expect(card).toContain('t("Open Appointment", locale as any)');
    expect(card).not.toContain(">Open appointment</Text>");

    expect(i18n).toContain('"Open Appointment": "Open appointment"');
    expect(i18n).toContain('"Open Appointment": "Բացել ամրագրումը"');
    expect(i18n).toContain('"Open Appointment": "Открыть запись"');
    expect(i18n).toContain('"Open Appointment": "Ouvrir la réservation"');
  });

  it("keeps card-open and edit as two independent actions", () => {
    const builder = read(
      "components/booking-v2/buildBookingListItemV2.ts",
    );

    expect(builder).toContain(
      "onOpen?: (appointment: AppointmentItem) => void",
    );
    expect(builder).toContain("onPress: options.onOpen");
    expect(builder).toContain("onEdit: options.onEdit");
    expect(builder).not.toContain("onPress: options.onEdit");
  });

  it("opens a dedicated read-only detail surface from a booking card", () => {
    const container = read(
      "components/booking-v2/BookingCenterContainerV2.tsx",
    );
    const composition = read(
      "components/booking-v2/BookingCenterCompositionV2.tsx",
    );
    const detail = read(
      "components/booking-v2/BookingDetailSheetV2.tsx",
    );

    expect(container).toContain("detailAppointment");
    expect(container).toContain("setDetailAppointment(item)");
    expect(composition).toContain("<BookingDetailSheetV2");
    expect(detail).toContain("title: string");
    expect(detail).toContain("{title}");
    expect(detail).not.toContain("TextInput");
    expect(detail).not.toContain("onSubmit");
    expect(detail).not.toContain("Save Changes");
  });

  it("keeps explicit edit behavior on the Edit button only", () => {
    const card = read("components/booking-v2/BookingCardV3.tsx");
    const container = read(
      "components/booking-v2/BookingCenterContainerV2.tsx",
    );

    expect(card).toContain("event.stopPropagation()");
    expect(container).toContain("setEditingAppointment(item)");
    expect(container).toContain("setCreatePanelVisible(true)");
    expect(container).toContain("setDetailAppointment(null)");
  });

  it("ships localized detail copy for EN/HY/RU/FR", () => {
    const i18n = read("lib/i18n/index.ts");

    expect(i18n).toContain('"Appointment Details": "Appointment details"');
    expect(i18n).toContain('"Appointment Details": "Ամրագրման մանրամասներ"');
    expect(i18n).toContain('"Appointment Details": "Детали записи"');
    expect(i18n).toContain('"Appointment Details": "Détails de la réservation"');
  });
  test("localizes only known demo appointment notes without rewriting real notes", () => {
    const container = read("components/booking-v2/BookingCenterContainerV2.tsx");
    const i18n = read("lib/i18n/index.ts");

    expect(container).toContain("V20L_BOOKING_DEMO_NOTE_I18N_FINAL");
    expect(container).toContain('normalized === "Demo upcoming appointment."');
    expect(container).toContain('normalized === "Demo historical appointment."');
    expect(container).toContain('t("Demo Upcoming Appointment Note", locale as any)');
    expect(container).toContain('t("Demo Historical Appointment Note", locale as any)');
    expect(container).toContain("notesValue={localizeDemoAppointmentNote(notes, locale)}");
    expect(container).toContain("return value;");

    expect(i18n).toContain('"Demo Historical Appointment Note": "Demo historical appointment."');
    expect(i18n).toContain('"Demo Historical Appointment Note": "Դեմո նախորդ ամրագրում։"');
    expect(i18n).toContain('"Demo Historical Appointment Note": "Демо предыдущей записи."');
    expect(i18n).toContain('"Demo Historical Appointment Note": "Réservation de démonstration passée."');
  });

});
