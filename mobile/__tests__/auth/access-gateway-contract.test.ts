import fs from "fs";
import path from "path";

const mobileRoot = path.resolve(__dirname, "../..");

const loginSource = fs.readFileSync(
  path.join(
    mobileRoot,
    "components",
    "auth",
    "DevLoginCard.tsx"
  ),
  "utf8"
);

const shellSource = fs.readFileSync(
  path.join(
    mobileRoot,
    "components",
    "auth",
    "AuthScreenShell.tsx"
  ),
  "utf8"
);

const primitiveSource = fs.readFileSync(
  path.join(
    mobileRoot,
    "components",
    "auth",
    "AccessGatewayPrimitives.tsx"
  ),
  "utf8"
);

describe("Access Gateway source contract", () => {
  it("removes production-facing demo-admin shortcuts and credential prefill", () => {
    expect(loginSource).not.toContain("DEFAULTS.adminEmail");
    expect(loginSource).not.toContain("DEFAULTS.adminPassword");
    expect(loginSource).not.toContain("loadAdminAccess");
    expect(loginSource).not.toContain("useDemoAccount");
  });

  it("preserves the shared DevLoginCard title/subtitle caller contract", () => {
    expect(loginSource).toContain("type DevLoginCardProps");
    expect(loginSource).toContain("title?: string;");
    expect(loginSource).toContain("subtitle?: string;");
    expect(loginSource).toContain("contextualTitle?.trim() || copy.signinTitle");
    expect(loginSource).toContain("contextualSubtitle?.trim() || copy.signinSubtitle");
  });

  it("keeps provider availability truthful", () => {
    expect(loginSource).toContain("isGoogleAuthConfigured");
    expect(loginSource).toContain("googleNotConfigured");
    expect(loginSource).toContain("appleNotConfigured");
    expect(loginSource).toContain("disabled");
  });

  it("provides brand-authentic Google and Apple provider treatments", () => {
    expect(loginSource).toContain('brand="google"');
    expect(loginSource).toContain('brand="apple"');
    expect(primitiveSource).toContain("google-g.png");
    expect(primitiveSource).toContain('brand === "google"');
    expect(primitiveSource).toContain('brand === "apple"');
    expect(primitiveSource).toContain('name="logo-apple"');
    expect(loginSource).toContain('icon="mail-outline"');
    expect(loginSource).toContain('icon="lock-closed-outline"');
  });

  it("uses the shared Royal Cosmos theme and flag language switcher", () => {
    expect(shellSource).toContain("useDashboardTheme");
    expect(shellSource).toContain("AccessLanguageSwitcher");
    expect(shellSource).toContain("RoyalCosmosBackground");
  });

  it("owns password visibility and autofill-aware field presentation", () => {
    expect(primitiveSource).toContain("secureTextEntry");
    expect(primitiveSource).toContain("eye-outline");
    expect(primitiveSource).toContain("autoComplete");
    expect(primitiveSource).toContain("boxShadow");
  });
});
