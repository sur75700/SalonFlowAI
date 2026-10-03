import type { AppLanguage } from "../i18n";
import type { SettingsSectionGroup, SettingsSectionId, SettingsTruthState } from "./contracts";

type LocaleCopy = {
  title: string;
  subtitle: string;
  search: string;
  browse: string;
  close: string;
  retry: string;
  refresh: string;
  unavailable: string;
  loading: string;
  notConfigured: string;
  sessionOnly: string;
  browserSaved: string;
  applyTheme: string;
  applyLanguage: string;
  current: string;
  customPrice: string;
  perMonth: string;

  accountSubtitle: string;
  emailLabel: string;
  fullNameLabel: string;
  roleLabel: string;
  roleDetail: string;
  emailVerificationLabel: string;
  verified: string;
  notVerified: string;
  createdLabel: string;
  thisDeviceLabel: string;
  signedIn: string;
  thisDeviceDetail: string;
  accountDetailsUnavailable: string;

  workspaceSubtitle: string;
  workspaceUnavailable: string;
  workspaceNotConfigured: string;
  operationalProfile: string;
  revisionLabel: string;
  timezoneLabel: string;
  slotDurationLabel: string;
  minutesShort: string;
  closed: string;

  appearanceSubtitle: string;
  themeLabel: string;
  languageLabel: string;

  securitySubtitle: string;
  passwordLabel: string;
  passwordChangeSupported: string;
  passwordDetail: string;
  changePassword: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  updatePassword: string;
  sessionRequired: string;
  passwordFieldsRequired: string;
  passwordMinLength: string;
  passwordsMismatch: string;
  passwordChanged: string;
  advancedSecurityUnavailable: string;

  privacySubtitle: string;
  privacyUnavailable: string;
  operationalReports: string;
  availableInReports: string;
  workspaceIsolation: string;
  serverScopedPrinciple: string;
  workspaceIsolationDetail: string;
  reportsNotExport: string;

  teamSubtitle: string;
  currentAccountRole: string;
  teamUnavailable: string;

  billingSubtitle: string;
  billingNotConfirmed: string;
  checkoutOpened: string;
  portalOpened: string;
  actionFailed: string;
  paymentPendingNote: string;
  connectedViaStripe: string;
  stripeReady: string;
  stripeNotReady: string;
  subscriptionActions: string;
  subscriptionLifecycle: string;
  paymentManagement: string;
  subscriptionSource: string;
  organizationAssignedAccess: string;
  changePlan: string;
  manageSubscription: string;
  manageSubscriptionDetail: string;
  paymentMethods: string;
  paymentMethodsDetail: string;
  billingActionsUnavailable: string;
  currentPlanLabel: string;
  availablePlans: string;
  catalogEntitlements: string;

  aiSubtitle: string;
  aiRuntimeDoctrine: string;
  livePlanEntitlement: string;
  notIncludedInPlan: string;
  governanceSubtitle: string;
  usageUnavailable: string;
  humanAuthorization: string;
  humanAuthorizationRequired: string;
  humanAuthorizationDetail: string;
  usageCounters: string;
  estimatedAiCost: string;
  efficiencyScore: string;

  notificationsSubtitle: string;
  notificationUnavailable: string;
  channelUnavailable: string;

  integrationsSubtitle: string;
  integrationUnavailable: string;

  statusSubtitle: string;
  backendApiLabel: string;
  operational: string;
  checkedAt: string;
  featureAvailability: string;
  integrationReadiness: string;
  configurationCompleteness: string;
  seeRelevantSection: string;
  noOperationalTelemetry: string;

  auditSubtitle: string;
  auditUnavailable: string;

  authoritySubtitle: string;
  productLabel: string;
  engineeringLabel: string;
  engineeringPrinciples: string;
  authorityPrinciples: readonly string[];
  releaseIdentity: string;
  supportDocumentation: string;
  releaseUnavailable: string;
  supportUnavailable: string;

  dangerSubtitle: string;
  unsupportedDestructiveActions: string;
  signOutQuestion: string;
  signOutDetail: string;
  cancel: string;
  confirmSignOut: string;

  planAccessAvailable: string;
  apiReachability: string;

  sectionLabels: Record<SettingsSectionId, string>;
  groupLabels: Record<SettingsSectionGroup, string>;
  truthLabels: Record<SettingsTruthState, string>;
  weekdays: readonly string[];
};

const en: LocaleCopy = {
  title: "Settings Command Center",
  subtitle: "Control account, workspace, billing, intelligence and product trust from one verified surface.",
  search: "Search settings",
  browse: "Browse settings",
  close: "Close",
  retry: "Retry",
  refresh: "Refresh",
  unavailable: "Unavailable",
  loading: "Loading…",
  notConfigured: "Not configured",
  sessionOnly: "Applied for this session",
  browserSaved: "Saved in this browser",
  applyTheme: "Apply theme",
  applyLanguage: "Apply language",
  current: "Current",
  customPrice: "Custom",
  perMonth: "month",

  accountSubtitle: "Authenticated account facts only. Missing fields are never replaced with invented defaults.",
  emailLabel: "Email",
  fullNameLabel: "Full name",
  roleLabel: "Role",
  roleDetail: "The displayed role is the account profile value. Server authorization remains authoritative.",
  emailVerificationLabel: "Email verification",
  verified: "Verified",
  notVerified: "Not verified",
  createdLabel: "Created",
  thisDeviceLabel: "This device",
  signedIn: "Signed in",
  thisDeviceDetail: "A valid authenticated profile proves access on this device only.",
  accountDetailsUnavailable: "Account details are unavailable.",

  workspaceSubtitle: "Operational workspace configuration from the existing capacity authority.",
  workspaceUnavailable: "Salon identity fields are not exposed by the current workspace contract. Operational configuration is shown separately when available.",
  workspaceNotConfigured: "Operational workspace configuration has not been created yet.",
  operationalProfile: "Operational profile",
  revisionLabel: "Revision",
  timezoneLabel: "Timezone",
  slotDurationLabel: "Slot duration",
  minutesShort: "min",
  closed: "Closed",

  appearanceSubtitle: "Theme uses the existing Royal Cosmos authority. Language currently applies to this session.",
  themeLabel: "Theme",
  languageLabel: "Language",

  securitySubtitle: "Verified account controls only. No cosmetic security score is used.",
  passwordLabel: "Password",
  passwordChangeSupported: "Change supported",
  passwordDetail: "The backend verifies the current password and enforces the existing password policy.",
  changePassword: "Change password",
  currentPassword: "Current password",
  newPassword: "New password",
  confirmNewPassword: "Confirm new password",
  updatePassword: "Update password",
  sessionRequired: "An active session is required.",
  passwordFieldsRequired: "Complete all password fields.",
  passwordMinLength: "The new password must be at least 8 characters.",
  passwordsMismatch: "The passwords do not match.",
  passwordChanged: "Password changed successfully.",
  advancedSecurityUnavailable: "2FA, trusted devices, active-session management and login history are not available in the current server contract.",

  privacySubtitle: "Data lifecycle controls are shown only when an enforceable server contract exists.",
  privacyUnavailable: "Full account export, retention controls and destructive data actions are not available in the current server contract.",
  operationalReports: "Operational reports",
  availableInReports: "Available in Reports",
  workspaceIsolation: "Workspace isolation",
  serverScopedPrinciple: "Server-scoped product principle",
  workspaceIsolationDetail: "Settings does not expose or accept arbitrary workspace identifiers for current reads.",
  reportsNotExport: "Reports provide operational documents; they are not a complete account-data export.",

  teamSubtitle: "The current account role is visible; team administration is not simulated.",
  currentAccountRole: "Current account role",
  teamUnavailable: "Team membership, invitations and role administration are not available in the current server contract.",

  billingSubtitle: "Customer billing control surface. Internal plan overrides and internal provider diagnostics are never exposed.",
  billingNotConfirmed: "Subscription status could not be confirmed.",
  checkoutOpened: "Checkout opened. Subscription state will be refreshed after you return.",
  portalOpened: "Subscription portal opened.",
  actionFailed: "The action could not be completed.",
  paymentPendingNote: "Opening checkout does not change your plan until the backend confirms payment state.",
  connectedViaStripe: "Stripe subscription",
  stripeReady: "Stripe billing is configured",
  stripeNotReady: "Stripe billing is not configured",
  subscriptionActions: "Subscription actions",
  subscriptionLifecycle: "Subscription lifecycle",
  paymentManagement: "Payment management",
  subscriptionSource: "Access source",
  organizationAssignedAccess: "Organization-assigned access",
  changePlan: "Change plan",
  manageSubscription: "Manage / change / cancel subscription",
  manageSubscriptionDetail: "Plan changes, cancellation and provider-managed billing controls open in the billing portal when that authority is available.",
  paymentMethods: "Payment methods",
  paymentMethodsDetail: "Payment methods are managed by the billing provider when a Stripe customer is connected.",
  billingActionsUnavailable: "Billing actions remain unavailable until Stripe billing is configured and the required customer authority exists.",
  currentPlanLabel: "Current plan",
  availablePlans: "Available plans",
  catalogEntitlements: "catalog capabilities",

  aiSubtitle: "Plan entitlement is separated from runtime execution. Settings does not invoke the intelligence engine.",
  aiRuntimeDoctrine: "AI decisions remain on the existing intelligence authority. This Settings surface creates no second engine and sends no decision request.",
  livePlanEntitlement: "Included in current plan",
  notIncludedInPlan: "Not included in current plan",
  governanceSubtitle: "Usage and governance claims require server-side measurement and enforcement.",
  usageUnavailable: "AI usage metering, token accounting and cost telemetry are not available.",
  humanAuthorization: "Human authorization",
  humanAuthorizationRequired: "Required for consequential product actions",
  humanAuthorizationDetail: "Settings communicates governance policy only; it creates no autonomous write authority.",
  usageCounters: "Usage counters",
  estimatedAiCost: "Estimated AI cost",
  efficiencyScore: "Efficiency score",

  notificationsSubtitle: "Delivery-provider readiness and user preference are separate states.",
  notificationUnavailable: "Notification delivery providers and persisted channel preferences are not available yet.",
  channelUnavailable: "Provider and persisted preference are unavailable",

  integrationsSubtitle: "Only integrations with real connection authority are described as available or connected.",
  integrationUnavailable: "Customer connection authority is not available for this integration.",

  statusSubtitle: "Service health is distinct from feature availability, integration readiness and configuration completeness.",
  backendApiLabel: "Backend API",
  operational: "Operational",
  checkedAt: "Checked",
  featureAvailability: "Feature availability",
  integrationReadiness: "Integration readiness",
  configurationCompleteness: "Configuration completeness",
  seeRelevantSection: "See the relevant Settings section",
  noOperationalTelemetry: "Only customer-safe backend API reachability is currently observable here.",

  auditSubtitle: "Audit history is never synthesized from local clicks or placeholder events.",
  auditUnavailable: "Audit activity is unavailable because no authoritative audit-history contract is exposed.",

  authoritySubtitle: "Product & Engineering",
  productLabel: "Product",
  engineeringLabel: "Engineering",
  engineeringPrinciples: "Engineering principles",
  authorityPrinciples: [
    "Verified data. Statuses and numbers require an identifiable source.",
    "Server authority. Access and critical decisions are enforced on the server.",
    "Workspace boundaries. Data access is bound to the authorized workspace.",
    "Safe failure. Uncertainty does not grant access or report success.",
    "Human-controlled AI. Recommendations inform decisions; consequential actions require human authorization.",
    "Evidence before release. Operational and financial contracts are deterministic. Releases require verification.",
  ],
  releaseIdentity: "Release identity",
  supportDocumentation: "Support & documentation",
  releaseUnavailable: "Verified release details are unavailable.",
  supportUnavailable: "Support and documentation links are unavailable in this release.",

  dangerSubtitle: "Only actions supported by the current lifecycle are exposed.",
  unsupportedDestructiveActions: "Account deletion, workspace deletion, ownership transfer and revoke-all sessions are not available.",
  signOutQuestion: "Sign out on this device?",
  signOutDetail: "This clears the local SalonFlowAI session. It does not claim to revoke sessions on other devices.",
  cancel: "Cancel",
  confirmSignOut: "Sign out",

  planAccessAvailable: "Included in plan · runtime availability is verified separately",
  apiReachability: "API reachability",

  sectionLabels: {
    overview: "Executive Overview", account: "Account & Identity", workspace: "Salon / Workspace", appearance: "Appearance & Language",
    security: "Security", privacy: "Privacy & Data", team: "Team & Roles", billing: "Billing & Subscription",
    intelligence: "AI Intelligence", governance: "AI Usage & Governance", notifications: "Notifications", integrations: "Integrations",
    status: "System Status", audit: "Audit Activity", authority: "GhostStage — Product & Engineering", danger: "Account & Workspace Actions",
  },
  groupLabels: { core: "Core", protection: "Protection", business: "Business", intelligence: "Intelligence", connections: "Connections", trust: "Trust", danger: "" },
  truthLabels: {
    LIVE: "Live", CACHED: "Cached", CONFIGURED: "Configured", DERIVED: "Calculated", ESTIMATED: "Estimated",
    NOT_CONNECTED: "Not connected", NOT_AVAILABLE: "Unavailable", PLAN_RESTRICTED: "Plan restricted", PERMISSION_RESTRICTED: "Permission required",
    ERROR: "Error", OFFLINE: "Offline",
  },
  weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

const hy: LocaleCopy = {
  ...en,
  title: "Կարգավորումների հրամանատարական կենտրոն",
  subtitle: "Կառավարեք հաշիվը, սրահի աշխատանքային տարածքը, վճարումները, AI-ը և արտադրանքի վստահության շերտերը մեկ հաստատված մակերեսից։",
  search: "Որոնել կարգավորումներում",
  browse: "Բացել կարգավորումները",
  close: "Փակել",
  retry: "Կրկին փորձել",
  refresh: "Թարմացնել",
  unavailable: "Հասանելի չէ",
  loading: "Բեռնվում է…",
  notConfigured: "Կարգավորված չէ",
  sessionOnly: "Կիրառված է այս աշխատաշրջանի համար",
  browserSaved: "Պահպանված է այս դիտարկիչում",
  applyTheme: "Կիրառել թեման",
  applyLanguage: "Կիրառել լեզուն",
  current: "Ընթացիկ",
  customPrice: "Անհատական",
  perMonth: "ամիս",

  accountSubtitle: "Ցուցադրվում են միայն հաստատված հաշվի տվյալները։ Բացակայող արժեքները չեն փոխարինվում հորինված տվյալներով։",
  emailLabel: "Email",
  fullNameLabel: "Անուն և ազգանուն",
  roleLabel: "Դեր",
  roleDetail: "Ցուցադրվում է հաշվի պրոֆիլից ստացված դերը։ Իրավասությունների վերջնական վերահսկողությունը մնում է սերվերի վրա։",
  emailVerificationLabel: "Email-ի հաստատում",
  verified: "Հաստատված",
  notVerified: "Հաստատված չէ",
  createdLabel: "Ստեղծված է",
  thisDeviceLabel: "Այս սարքը",
  signedIn: "Մուտքն ակտիվ է",
  thisDeviceDetail: "Վավերացված պրոֆիլը հաստատում է միայն այս սարքի ընթացիկ հասանելիությունը։",
  accountDetailsUnavailable: "Հաշվի տվյալները հասանելի չեն։",

  workspaceSubtitle: "Սրահի օպերացիոն կարգավորումները ստացվում են գործող Capacity authority-ից։",
  workspaceUnavailable: "Սրահի ինքնության առանձին դաշտերը ընթացիկ contract-ով չեն տրամադրվում։ Օպերացիոն կարգավորումները ցուցադրվում են առանձին՝ երբ հասանելի են։",
  workspaceNotConfigured: "Սրահի օպերացիոն կարգավորումը դեռ ստեղծված չէ։",
  operationalProfile: "Օպերացիոն պրոֆիլ",
  revisionLabel: "Տարբերակ",
  timezoneLabel: "Ժամային գոտի",
  slotDurationLabel: "Ժամանակային միջակայք",
  minutesShort: "րոպե",
  closed: "Փակ",

  appearanceSubtitle: "Թեման օգտագործում է գործող Royal Cosmos համակարգը։ Լեզուն ներկայում կիրառվում է այս աշխատաշրջանի համար։",
  themeLabel: "Թեմա",
  languageLabel: "Լեզու",

  securitySubtitle: "Ցուցադրվում են միայն հաստատված անվտանգության գործողությունները։ Թվային կեղծ գնահատական չի օգտագործվում։",
  passwordLabel: "Գաղտնաբառ",
  passwordChangeSupported: "Փոփոխումը հասանելի է",
  passwordDetail: "Սերվերը ստուգում է ընթացիկ գաղտնաբառը և կիրառում գործող գաղտնաբառային քաղաքականությունը։",
  changePassword: "Փոխել գաղտնաբառը",
  currentPassword: "Ընթացիկ գաղտնաբառ",
  newPassword: "Նոր գաղտնաբառ",
  confirmNewPassword: "Կրկնել նոր գաղտնաբառը",
  updatePassword: "Թարմացնել գաղտնաբառը",
  sessionRequired: "Պահանջվում է ակտիվ մուտք։",
  passwordFieldsRequired: "Լրացրեք գաղտնաբառի բոլոր դաշտերը։",
  passwordMinLength: "Նոր գաղտնաբառը պետք է լինի առնվազն 8 նիշ։",
  passwordsMismatch: "Գաղտնաբառերը չեն համընկնում։",
  passwordChanged: "Գաղտնաբառը հաջողությամբ փոխվեց։",
  advancedSecurityUnavailable: "2FA-ը, վստահելի սարքերը, ակտիվ մուտքերի կառավարումը և մուտքերի պատմությունը դեռ հասանելի չեն ընթացիկ սերվերային contract-ով։",

  privacySubtitle: "Տվյալների կյանքի ցիկլի գործողությունները ցուցադրվում են միայն կիրառելի սերվերային contract ունենալու դեպքում։",
  privacyUnavailable: "Հաշվի ամբողջական արտահանումը, պահպանման կանոնները և տվյալների կործանարար գործողությունները դեռ հասանելի չեն։",
  operationalReports: "Օպերացիոն հաշվետվություններ",
  availableInReports: "Հասանելի է Reports-ում",
  workspaceIsolation: "Աշխատանքային տարածքի մեկուսացում",
  serverScopedPrinciple: "Սերվերի կողմից սահմանված սկզբունք",
  workspaceIsolationDetail: "Settings-ը ընթացիկ հարցումների համար չի ցուցադրում և չի ընդունում կամայական workspace identifier-ներ։",
  reportsNotExport: "Reports-ը տրամադրում է օպերացիոն փաստաթղթեր, բայց ամբողջական հաշվի տվյալների արտահանում չէ։",

  teamSubtitle: "Ցուցադրվում է հաշվի ընթացիկ դերը, իսկ թիմի կառավարումը չի նմանակվում։",
  currentAccountRole: "Հաշվի ընթացիկ դեր",
  teamUnavailable: "Թիմի անդամները, հրավերները և դերերի կառավարումը դեռ հասանելի չեն ընթացիկ սերվերային contract-ով։",

  billingSubtitle: "Հաճախորդի վճարումների կառավարման մակերես։ Ներքին plan override-ները և ներքին provider diagnostics-ը երբեք չեն ցուցադրվում։",
  billingNotConfirmed: "Բաժանորդագրության վիճակը չհաջողվեց հաստատել։",
  checkoutOpened: "Stripe checkout-ը բացվեց։ Վերադառնալուց հետո բաժանորդագրության վիճակը կթարմացվի։",
  portalOpened: "Բաժանորդագրության portal-ը բացվեց։",
  actionFailed: "Գործողությունը չհաջողվեց ավարտել։",
  paymentPendingNote: "Checkout բացելը չի փոխում փաթեթը, մինչև սերվերը չհաստատի վճարման վիճակը։",
  connectedViaStripe: "Stripe բաժանորդագրություն",
  stripeReady: "Stripe billing-ը կարգավորված է",
  stripeNotReady: "Stripe billing-ը կարգավորված չէ",
  subscriptionActions: "Բաժանորդագրության գործողություններ",
  subscriptionLifecycle: "Բաժանորդագրության վիճակ",
  paymentManagement: "Վճարումների կառավարում",
  subscriptionSource: "Հասանելիության աղբյուր",
  organizationAssignedAccess: "Կազմակերպության կողմից տրամադրված հասանելիություն",
  changePlan: "Փոխել փաթեթը",
  manageSubscription: "Կառավարել / փոխել / չեղարկել բաժանորդագրությունը",
  manageSubscriptionDetail: "Փաթեթի փոփոխությունը, չեղարկումը և provider-ի վճարային կառավարումը բացվում են billing portal-ում միայն իրական authority լինելու դեպքում։",
  paymentMethods: "Վճարման մեթոդներ",
  paymentMethodsDetail: "Վճարման մեթոդները կառավարվում են billing provider-ի միջոցով, երբ հաշվին Stripe customer է միացված։",
  billingActionsUnavailable: "Վճարային գործողությունները կմնան անհասանելի, մինչև Stripe billing-ը կարգավորվի և անհրաժեշտ customer authority-ն իրականում գոյություն ունենա։",
  currentPlanLabel: "Ընթացիկ փաթեթ",
  availablePlans: "Հասանելի փաթեթներ",
  catalogEntitlements: "կատալոգային հնարավորություն",

  aiSubtitle: "Փաթեթային entitlement-ը տարանջատված է runtime execution-ից։ Settings-ը չի կանչում Intelligence engine-ը։",
  aiRuntimeDoctrine: "AI որոշումները մնում են գործող Intelligence authority-ի վրա։ Settings-ը երկրորդ AI engine չի ստեղծում և decision request չի ուղարկում։",
  livePlanEntitlement: "Ներառված է ընթացիկ փաթեթում",
  notIncludedInPlan: "Ներառված չէ ընթացիկ փաթեթում",
  governanceSubtitle: "Օգտագործման և governance-ի պնդումները պահանջում են server-side չափում և enforcement։",
  usageUnavailable: "AI օգտագործման չափումը, token accounting-ը և արժեքի telemetry-ն դեռ հասանելի չեն։",
  humanAuthorization: "Մարդու թույլտվություն",
  humanAuthorizationRequired: "Պարտադիր է էական հետևանք ունեցող գործողությունների համար",
  humanAuthorizationDetail: "Settings-ը ցուցադրում է governance policy-ն, բայց ինքնավար write authority չի ստեղծում։",
  usageCounters: "Օգտագործման հաշվիչներ",
  estimatedAiCost: "AI-ի գնահատված արժեք",
  efficiencyScore: "Արդյունավետության գնահատական",

  notificationsSubtitle: "Առաքման provider-ի պատրաստությունը և օգտվողի նախընտրությունը տարբեր վիճակներ են։",
  notificationUnavailable: "Ծանուցումների առաքման provider-ները և պահպանվող channel preference-ները դեռ հասանելի չեն։",
  channelUnavailable: "Provider-ը և պահպանվող նախընտրությունը հասանելի չեն",

  integrationsSubtitle: "Հասանելի կամ միացված են կոչվում միայն իրական connection authority ունեցող ինտեգրումները։",
  integrationUnavailable: "Այս ինտեգրման համար customer connection authority դեռ հասանելի չէ։",

  statusSubtitle: "Service health-ը տարանջատված է feature availability-ից, integration readiness-ից և configuration completeness-ից։",
  backendApiLabel: "Backend API",
  operational: "Աշխատում է",
  checkedAt: "Ստուգվել է",
  featureAvailability: "Ֆունկցիաների հասանելիություն",
  integrationReadiness: "Ինտեգրումների պատրաստություն",
  configurationCompleteness: "Կարգավորման ամբողջականություն",
  seeRelevantSection: "Տես համապատասխան Settings բաժինը",
  noOperationalTelemetry: "Այստեղ ներկայում դիտարկելի է միայն customer-safe Backend API հասանելիությունը։",

  auditSubtitle: "Audit history-ը երբեք չի ստեղծվում տեղային click-երից կամ placeholder event-երից։",
  auditUnavailable: "Audit activity-ն հասանելի չէ, քանի որ authoritative audit-history contract դեռ չկա։",

  authoritySubtitle: "Արտադրանք և ինժեներություն",
  productLabel: "Արտադրանք",
  engineeringLabel: "Ինժեներություն",
  engineeringPrinciples: "Ինժեներական սկզբունքներ",
  authorityPrinciples: [
    "Ստուգված տվյալներ։ Վիճակների և թվերի համար պահանջվում է հստակ աղբյուր։",
    "Սերվերի վերահսկողություն։ Հասանելիությունը և կարևոր որոշումները վերահսկվում են սերվերում։",
    "Աշխատանքային տարածքների սահմաններ։ Տվյալների հասանելիությունը սահմանափակվում է թույլատրված աշխատանքային տարածքով։",
    "Անվտանգ վարքագիծ խափանման դեպքում։ Անորոշությունը հասանելիություն չի տալիս և հաջողության հաստատում չի համարվում։",
    "Մարդու վերահսկողությամբ AI։ Առաջարկություններն օգնում են որոշումներ կայացնել, իսկ էական հետևանքներ ունեցող գործողությունները պահանջում են մարդու թույլտվությունը։",
    "Ապացույցներ՝ նախքան թողարկումը։ Գործառնական և ֆինանսական կանոնները նույն պայմաններում տալիս են նույն արդյունքը։ Թողարկումները պահանջում են ստուգում։",
  ],
  releaseIdentity: "Թողարկման տվյալներ",
  supportDocumentation: "Աջակցություն և փաստաթղթեր",
  releaseUnavailable: "Թողարկման ստուգված տվյալները հասանելի չեն։",
  supportUnavailable: "Այս թողարկման մեջ աջակցության և փաստաթղթերի հղումները հասանելի չեն։",

  dangerSubtitle: "Ցուցադրվում են միայն ընթացիկ lifecycle-ով իրականում աջակցվող գործողությունները։",
  unsupportedDestructiveActions: "Հաշվի ջնջումը, workspace-ի ջնջումը, ownership transfer-ը և բոլոր sessions-ի revoke-ը դեռ հասանելի չեն։",
  signOutQuestion: "Դո՞ւրս գալ այս սարքում։",
  signOutDetail: "Սա մաքրում է այս սարքի SalonFlowAI session-ը և չի պնդում, որ մյուս սարքերի session-ները revoke են արվել։",
  cancel: "Չեղարկել",
  confirmSignOut: "Դուրս գալ",

  planAccessAvailable: "Ներառված է փաթեթում · runtime հասանելիությունը ստուգվում է առանձին",
  apiReachability: "API հասանելիություն",

  sectionLabels: {
    overview: "Կառավարման ամփոփում", account: "Հաշիվ և ինքնություն", workspace: "Սրահ / աշխատանքային տարածք", appearance: "Տեսք և լեզու",
    security: "Անվտանգություն", privacy: "Գաղտնիություն և տվյալներ", team: "Թիմ և դերեր", billing: "Վճարումներ և բաժանորդագրություն",
    intelligence: "AI ինտելեկտ", governance: "AI օգտագործում և կառավարում", notifications: "Ծանուցումներ", integrations: "Ինտեգրումներ",
    status: "Համակարգի վիճակ", audit: "Գործողությունների պատմություն", authority: "GhostStage — Արտադրանք և ինժեներություն", danger: "Հաշվի և workspace-ի գործողություններ",
  },
  groupLabels: { core: "Հիմնական", protection: "Պաշտպանություն", business: "Բիզնես", intelligence: "Ինտելեկտ", connections: "Կապեր", trust: "Վստահություն", danger: "" },
  truthLabels: {
    LIVE: "Թարմ", CACHED: "Պահված", CONFIGURED: "Կարգավորված", DERIVED: "Հաշվարկված", ESTIMATED: "Գնահատված",
    NOT_CONNECTED: "Միացված չէ", NOT_AVAILABLE: "Հասանելի չէ", PLAN_RESTRICTED: "Փաթեթով սահմանափակված", PERMISSION_RESTRICTED: "Թույլտվություն է պահանջվում",
    ERROR: "Սխալ", OFFLINE: "Կապ չկա",
  },
  weekdays: ["Երկ", "Երք", "Չրք", "Հնգ", "Ուրբ", "Շբթ", "Կիր"],
};

const ru: LocaleCopy = {
  ...en,
  title: "Центр управления настройками",
  subtitle: "Управляйте аккаунтом, салоном, подпиской, AI и слоями доверия из одного проверенного интерфейса.",
  search: "Поиск по настройкам",
  browse: "Открыть настройки",
  close: "Закрыть",
  retry: "Повторить",
  refresh: "Обновить",
  unavailable: "Недоступно",
  loading: "Загрузка…",
  notConfigured: "Не настроено",
  sessionOnly: "Применено для текущего сеанса",
  browserSaved: "Сохранено в этом браузере",
  applyTheme: "Применить тему",
  applyLanguage: "Применить язык",
  current: "Текущий",
  customPrice: "Индивидуально",
  perMonth: "месяц",

  accountSubtitle: "Показываются только подтверждённые данные аккаунта. Отсутствующие значения не заменяются вымышленными.",
  emailLabel: "Email",
  fullNameLabel: "Имя",
  roleLabel: "Роль",
  roleDetail: "Показывается роль из профиля аккаунта. Окончательное решение о доступе принимает сервер.",
  emailVerificationLabel: "Подтверждение Email",
  verified: "Подтверждён",
  notVerified: "Не подтверждён",
  createdLabel: "Создан",
  thisDeviceLabel: "Это устройство",
  signedIn: "Вход выполнен",
  thisDeviceDetail: "Подтверждённый профиль доказывает доступ только на этом устройстве.",
  accountDetailsUnavailable: "Данные аккаунта недоступны.",

  workspaceSubtitle: "Операционная конфигурация салона поступает от существующего Capacity authority.",
  workspaceUnavailable: "Отдельные поля идентификации салона текущим contract не предоставляются. Операционная конфигурация показывается отдельно, когда она доступна.",
  workspaceNotConfigured: "Операционная конфигурация салона ещё не создана.",
  operationalProfile: "Операционный профиль",
  revisionLabel: "Ревизия",
  timezoneLabel: "Часовой пояс",
  slotDurationLabel: "Длительность интервала",
  minutesShort: "мин",
  closed: "Закрыто",

  appearanceSubtitle: "Тема использует существующую систему Royal Cosmos. Язык сейчас применяется в рамках текущего сеанса.",
  themeLabel: "Тема",
  languageLabel: "Язык",

  securitySubtitle: "Показываются только подтверждённые меры управления аккаунтом. Косметический security score не используется.",
  passwordLabel: "Пароль",
  passwordChangeSupported: "Изменение доступно",
  passwordDetail: "Сервер проверяет текущий пароль и применяет действующую парольную политику.",
  changePassword: "Изменить пароль",
  currentPassword: "Текущий пароль",
  newPassword: "Новый пароль",
  confirmNewPassword: "Повторите новый пароль",
  updatePassword: "Обновить пароль",
  sessionRequired: "Требуется активный вход.",
  passwordFieldsRequired: "Заполните все поля пароля.",
  passwordMinLength: "Новый пароль должен содержать не менее 8 символов.",
  passwordsMismatch: "Пароли не совпадают.",
  passwordChanged: "Пароль успешно изменён.",
  advancedSecurityUnavailable: "2FA, доверенные устройства, управление активными сессиями и история входов пока недоступны в текущем серверном contract.",

  privacySubtitle: "Управление жизненным циклом данных показывается только при наличии исполнимого серверного contract.",
  privacyUnavailable: "Полный экспорт аккаунта, правила хранения и разрушительные операции с данными пока недоступны.",
  operationalReports: "Операционные отчёты",
  availableInReports: "Доступно в Reports",
  workspaceIsolation: "Изоляция рабочего пространства",
  serverScopedPrinciple: "Серверный принцип",
  workspaceIsolationDetail: "Settings не показывает и не принимает произвольные workspace identifier для текущих чтений.",
  reportsNotExport: "Reports предоставляет операционные документы, но не является полным экспортом данных аккаунта.",

  teamSubtitle: "Показывается текущая роль аккаунта; управление командой не имитируется.",
  currentAccountRole: "Текущая роль аккаунта",
  teamUnavailable: "Участники команды, приглашения и управление ролями пока недоступны в текущем серверном contract.",

  billingSubtitle: "Клиентская поверхность управления подпиской. Внутренние plan override и provider diagnostics никогда не показываются.",
  billingNotConfirmed: "Не удалось подтвердить статус подписки.",
  checkoutOpened: "Stripe checkout открыт. После возврата статус подписки будет обновлён.",
  portalOpened: "Портал подписки открыт.",
  actionFailed: "Не удалось выполнить действие.",
  paymentPendingNote: "Открытие checkout не меняет тариф, пока сервер не подтвердит состояние оплаты.",
  connectedViaStripe: "Подписка Stripe",
  stripeReady: "Stripe billing настроен",
  stripeNotReady: "Stripe billing не настроен",
  subscriptionActions: "Действия с подпиской",
  subscriptionLifecycle: "Состояние подписки",
  paymentManagement: "Управление оплатой",
  subscriptionSource: "Источник доступа",
  organizationAssignedAccess: "Доступ, назначенный организацией",
  changePlan: "Изменить тариф",
  manageSubscription: "Управлять / изменить / отменить подписку",
  manageSubscriptionDetail: "Изменение тарифа, отмена и управление оплатой провайдера открываются в billing portal только при наличии реальных полномочий.",
  paymentMethods: "Способы оплаты",
  paymentMethodsDetail: "Способы оплаты управляются billing provider, когда к аккаунту подключён Stripe customer.",
  billingActionsUnavailable: "Платёжные действия остаются недоступными, пока Stripe billing не настроен и отсутствуют необходимые customer authority.",
  currentPlanLabel: "Текущий тариф",
  availablePlans: "Доступные тарифы",
  catalogEntitlements: "возможностей каталога",

  aiSubtitle: "Тарифный entitlement отделён от runtime execution. Settings не вызывает Intelligence engine.",
  aiRuntimeDoctrine: "AI-решения остаются в существующем Intelligence authority. Settings не создаёт второй AI engine и не отправляет decision request.",
  livePlanEntitlement: "Включено в текущий тариф",
  notIncludedInPlan: "Не включено в текущий тариф",
  governanceSubtitle: "Заявления об использовании и governance требуют server-side измерения и enforcement.",
  usageUnavailable: "Измерение AI-использования, token accounting и телеметрия стоимости пока недоступны.",
  humanAuthorization: "Разрешение человека",
  humanAuthorizationRequired: "Обязательно для действий со значимыми последствиями",
  humanAuthorizationDetail: "Settings показывает governance policy, но не создаёт автономных write authority.",
  usageCounters: "Счётчики использования",
  estimatedAiCost: "Оценочная стоимость AI",
  efficiencyScore: "Оценка эффективности",

  notificationsSubtitle: "Готовность provider доставки и пользовательская настройка — разные состояния.",
  notificationUnavailable: "Provider-ы доставки уведомлений и сохраняемые настройки каналов пока недоступны.",
  channelUnavailable: "Provider и сохраняемая настройка недоступны",

  integrationsSubtitle: "Доступными или подключёнными считаются только интеграции с реальными полномочиями подключения.",
  integrationUnavailable: "Для этой интеграции пока нет customer connection authority.",

  statusSubtitle: "Service health отделён от feature availability, integration readiness и configuration completeness.",
  backendApiLabel: "Backend API",
  operational: "Работает",
  checkedAt: "Проверено",
  featureAvailability: "Доступность функций",
  integrationReadiness: "Готовность интеграций",
  configurationCompleteness: "Полнота конфигурации",
  seeRelevantSection: "Смотрите соответствующий раздел Settings",
  noOperationalTelemetry: "Сейчас здесь наблюдается только customer-safe доступность Backend API.",

  auditSubtitle: "Audit history никогда не синтезируется из локальных кликов или placeholder events.",
  auditUnavailable: "Audit activity недоступна, поскольку authoritative audit-history contract пока отсутствует.",

  authoritySubtitle: "Продукт и инженерия",
  productLabel: "Продукт",
  engineeringLabel: "Инженерия",
  engineeringPrinciples: "Инженерные принципы",
  authorityPrinciples: [
    "Проверенные данные. У каждого статуса и показателя должен быть установленный источник.",
    "Серверный контроль. Доступ и критически важные решения контролируются на сервере.",
    "Границы рабочих пространств. Доступ к данным ограничен разрешённым рабочим пространством.",
    "Безопасное поведение при сбое. Неопределённость не даёт доступа и не означает успех.",
    "AI под контролем человека. Рекомендации помогают принимать решения; действия со значимыми последствиями требуют разрешения человека.",
    "Проверка перед выпуском. При одинаковых входных данных операционные и финансовые правила дают одинаковые результаты. Каждый выпуск требует проверки.",
  ],
  releaseIdentity: "Сведения о выпуске",
  supportDocumentation: "Поддержка и документация",
  releaseUnavailable: "Проверенные сведения о выпуске недоступны.",
  supportUnavailable: "Ссылки на поддержку и документацию недоступны в этом выпуске.",

  dangerSubtitle: "Показываются только действия, реально поддерживаемые текущим lifecycle.",
  unsupportedDestructiveActions: "Удаление аккаунта, удаление workspace, передача владения и отзыв всех sessions пока недоступны.",
  signOutQuestion: "Выйти на этом устройстве?",
  signOutDetail: "Это очищает локальную сессию SalonFlowAI и не утверждает, что сессии на других устройствах отозваны.",
  cancel: "Отмена",
  confirmSignOut: "Выйти",

  planAccessAvailable: "Включено в тариф · runtime-доступность проверяется отдельно",
  apiReachability: "Доступность API",

  sectionLabels: {
    overview: "Обзор управления", account: "Аккаунт и идентификация", workspace: "Салон / рабочее пространство", appearance: "Внешний вид и язык",
    security: "Безопасность", privacy: "Приватность и данные", team: "Команда и роли", billing: "Оплата и подписка",
    intelligence: "AI Intelligence", governance: "Использование и управление AI", notifications: "Уведомления", integrations: "Интеграции",
    status: "Состояние системы", audit: "История действий", authority: "GhostStage — Продукт и инженерия", danger: "Действия аккаунта и workspace",
  },
  groupLabels: { core: "Основное", protection: "Защита", business: "Бизнес", intelligence: "Интеллект", connections: "Подключения", trust: "Доверие", danger: "" },
  truthLabels: {
    LIVE: "Актуально", CACHED: "Кэш", CONFIGURED: "Настроено", DERIVED: "Рассчитано", ESTIMATED: "Оценка",
    NOT_CONNECTED: "Не подключено", NOT_AVAILABLE: "Недоступно", PLAN_RESTRICTED: "Ограничено тарифом", PERMISSION_RESTRICTED: "Требуется разрешение",
    ERROR: "Ошибка", OFFLINE: "Нет подключения",
  },
  weekdays: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
};

const fr: LocaleCopy = {
  ...en,
  title: "Centre de commande des paramètres",
  subtitle: "Gérez le compte, le salon, la facturation, l’IA et les couches de confiance depuis une surface vérifiée.",
  search: "Rechercher dans les paramètres",
  browse: "Parcourir les paramètres",
  close: "Fermer",
  retry: "Réessayer",
  refresh: "Actualiser",
  unavailable: "Indisponible",
  loading: "Chargement…",
  notConfigured: "Non configuré",
  sessionOnly: "Appliqué pour cette session",
  browserSaved: "Enregistré dans ce navigateur",
  applyTheme: "Appliquer le thème",
  applyLanguage: "Appliquer la langue",
  current: "Actuel",
  customPrice: "Sur mesure",
  perMonth: "mois",

  accountSubtitle: "Seules les données de compte vérifiées sont affichées. Les valeurs absentes ne sont jamais remplacées par des données inventées.",
  emailLabel: "Email",
  fullNameLabel: "Nom complet",
  roleLabel: "Rôle",
  roleDetail: "Le rôle affiché provient du profil du compte. L’autorisation finale reste contrôlée par le serveur.",
  emailVerificationLabel: "Vérification Email",
  verified: "Vérifié",
  notVerified: "Non vérifié",
  createdLabel: "Créé",
  thisDeviceLabel: "Cet appareil",
  signedIn: "Connecté",
  thisDeviceDetail: "Un profil authentifié confirme l’accès sur cet appareil uniquement.",
  accountDetailsUnavailable: "Les données du compte sont indisponibles.",

  workspaceSubtitle: "La configuration opérationnelle du salon provient de l’autorité Capacity existante.",
  workspaceUnavailable: "Les champs d’identité détaillés du salon ne sont pas exposés par le contract actuel. La configuration opérationnelle est affichée séparément lorsqu’elle existe.",
  workspaceNotConfigured: "La configuration opérationnelle du salon n’a pas encore été créée.",
  operationalProfile: "Profil opérationnel",
  revisionLabel: "Révision",
  timezoneLabel: "Fuseau horaire",
  slotDurationLabel: "Durée d’un créneau",
  minutesShort: "min",
  closed: "Fermé",

  appearanceSubtitle: "Le thème utilise l’autorité Royal Cosmos existante. La langue s’applique actuellement à cette session.",
  themeLabel: "Thème",
  languageLabel: "Langue",

  securitySubtitle: "Seuls les contrôles de compte vérifiés sont affichés. Aucun score de sécurité cosmétique n’est utilisé.",
  passwordLabel: "Mot de passe",
  passwordChangeSupported: "Modification disponible",
  passwordDetail: "Le serveur vérifie le mot de passe actuel et applique la politique de mot de passe existante.",
  changePassword: "Modifier le mot de passe",
  currentPassword: "Mot de passe actuel",
  newPassword: "Nouveau mot de passe",
  confirmNewPassword: "Confirmer le nouveau mot de passe",
  updatePassword: "Mettre à jour le mot de passe",
  sessionRequired: "Une session active est requise.",
  passwordFieldsRequired: "Renseignez tous les champs de mot de passe.",
  passwordMinLength: "Le nouveau mot de passe doit contenir au moins 8 caractères.",
  passwordsMismatch: "Les mots de passe ne correspondent pas.",
  passwordChanged: "Mot de passe modifié avec succès.",
  advancedSecurityUnavailable: "2FA, appareils de confiance, gestion des sessions actives et historique de connexion ne sont pas encore disponibles dans le contract serveur actuel.",

  privacySubtitle: "Les contrôles du cycle de vie des données ne sont affichés qu’avec un contract serveur applicable.",
  privacyUnavailable: "L’export complet du compte, les règles de conservation et les actions destructives sur les données ne sont pas encore disponibles.",
  operationalReports: "Rapports opérationnels",
  availableInReports: "Disponible dans Reports",
  workspaceIsolation: "Isolation de l’espace de travail",
  serverScopedPrinciple: "Principe contrôlé côté serveur",
  workspaceIsolationDetail: "Settings n’expose ni n’accepte d’identifiants workspace arbitraires pour les lectures actuelles.",
  reportsNotExport: "Reports fournit des documents opérationnels ; il ne constitue pas un export complet des données du compte.",

  teamSubtitle: "Le rôle actuel du compte est visible ; l’administration d’équipe n’est pas simulée.",
  currentAccountRole: "Rôle actuel du compte",
  teamUnavailable: "Les membres, invitations et rôles d’équipe ne sont pas encore disponibles dans le contract serveur actuel.",

  billingSubtitle: "Surface client de contrôle de la facturation. Les plan override et diagnostics provider internes ne sont jamais exposés.",
  billingNotConfirmed: "Impossible de confirmer le statut de l’abonnement.",
  checkoutOpened: "Stripe checkout ouvert. Le statut de l’abonnement sera actualisé après votre retour.",
  portalOpened: "Portail d’abonnement ouvert.",
  actionFailed: "Impossible d’exécuter l’action.",
  paymentPendingNote: "Ouvrir checkout ne change pas l’offre tant que le serveur n’a pas confirmé l’état du paiement.",
  connectedViaStripe: "Abonnement Stripe",
  stripeReady: "Stripe billing est configuré",
  stripeNotReady: "Stripe billing n’est pas configuré",
  subscriptionActions: "Actions d’abonnement",
  subscriptionLifecycle: "Cycle de vie de l’abonnement",
  paymentManagement: "Gestion des paiements",
  subscriptionSource: "Source d’accès",
  organizationAssignedAccess: "Accès attribué par l’organisation",
  changePlan: "Changer d’offre",
  manageSubscription: "Gérer / changer / annuler l’abonnement",
  manageSubscriptionDetail: "Les changements d’offre, l’annulation et la gestion des paiements du provider s’ouvrent dans le billing portal uniquement lorsqu’une autorité réelle existe.",
  paymentMethods: "Moyens de paiement",
  paymentMethodsDetail: "Les moyens de paiement sont gérés par le billing provider lorsqu’un client Stripe est associé au compte.",
  billingActionsUnavailable: "Les actions de facturation restent indisponibles tant que Stripe billing n’est pas configuré et que l’autorité client nécessaire n’existe pas.",
  currentPlanLabel: "Offre actuelle",
  availablePlans: "Offres disponibles",
  catalogEntitlements: "capacités du catalogue",

  aiSubtitle: "L’entitlement de l’offre est séparé du runtime execution. Settings n’appelle pas l’Intelligence engine.",
  aiRuntimeDoctrine: "Les décisions AI restent sous l’autorité Intelligence existante. Settings ne crée aucun second AI engine et n’envoie aucune decision request.",
  livePlanEntitlement: "Inclus dans l’offre actuelle",
  notIncludedInPlan: "Non inclus dans l’offre actuelle",
  governanceSubtitle: "Les affirmations d’usage et de governance exigent une mesure et une enforcement côté serveur.",
  usageUnavailable: "La mesure d’usage AI, la comptabilité des tokens et la télémétrie de coût ne sont pas encore disponibles.",
  humanAuthorization: "Autorisation humaine",
  humanAuthorizationRequired: "Requise pour les actions aux conséquences significatives",
  humanAuthorizationDetail: "Settings communique la governance policy mais ne crée aucune write authority autonome.",
  usageCounters: "Compteurs d’usage",
  estimatedAiCost: "Coût AI estimé",
  efficiencyScore: "Score d’efficacité",

  notificationsSubtitle: "La disponibilité du provider de livraison et la préférence utilisateur sont deux états distincts.",
  notificationUnavailable: "Les providers de livraison et les préférences persistées par canal ne sont pas encore disponibles.",
  channelUnavailable: "Provider et préférence persistée indisponibles",

  integrationsSubtitle: "Seules les intégrations disposant d’une véritable autorité de connexion sont décrites comme disponibles ou connectées.",
  integrationUnavailable: "L’autorité de connexion client n’est pas encore disponible pour cette intégration.",

  statusSubtitle: "Le service health est distinct de la feature availability, de l’integration readiness et de la configuration completeness.",
  backendApiLabel: "Backend API",
  operational: "Opérationnel",
  checkedAt: "Vérifié",
  featureAvailability: "Disponibilité des fonctions",
  integrationReadiness: "Préparation des intégrations",
  configurationCompleteness: "Complétude de la configuration",
  seeRelevantSection: "Voir la section Settings correspondante",
  noOperationalTelemetry: "Seule l’accessibilité customer-safe du Backend API est actuellement observable ici.",

  auditSubtitle: "L’audit history n’est jamais synthétisé à partir de clics locaux ou d’événements factices.",
  auditUnavailable: "Audit activity est indisponible car aucun contract d’historique authoritative n’est encore exposé.",

  authoritySubtitle: "Produit et ingénierie",
  productLabel: "Produit",
  engineeringLabel: "Ingénierie",
  engineeringPrinciples: "Principes d’ingénierie",
  authorityPrinciples: [
    "Données vérifiées. Chaque statut et chaque indicateur doivent avoir une source identifiable.",
    "Contrôle côté serveur. Les accès et les décisions critiques sont contrôlés par le serveur.",
    "Limites des espaces de travail. L’accès aux données est limité à l’espace de travail autorisé.",
    "Comportement sûr en cas d’échec. L’incertitude n’accorde aucun accès et ne vaut pas confirmation de réussite.",
    "AI sous contrôle humain. Les recommandations éclairent les décisions ; les actions aux conséquences significatives nécessitent une autorisation humaine.",
    "Vérification avant publication. Les règles opérationnelles et financières produisent des résultats déterministes. Chaque version exige une vérification.",
  ],
  releaseIdentity: "Informations sur la version",
  supportDocumentation: "Assistance et documentation",
  releaseUnavailable: "Les informations vérifiées sur la version sont indisponibles.",
  supportUnavailable: "Les liens vers l’assistance et la documentation sont indisponibles dans cette version.",

  dangerSubtitle: "Seules les actions réellement prises en charge par le lifecycle actuel sont exposées.",
  unsupportedDestructiveActions: "Suppression du compte, suppression du workspace, transfert de propriété et révocation de toutes les sessions ne sont pas encore disponibles.",
  signOutQuestion: "Se déconnecter sur cet appareil ?",
  signOutDetail: "Cela efface la session SalonFlowAI locale sans prétendre révoquer les sessions des autres appareils.",
  cancel: "Annuler",
  confirmSignOut: "Se déconnecter",

  planAccessAvailable: "Inclus dans l’offre · la disponibilité runtime est vérifiée séparément",
  apiReachability: "Accessibilité API",

  sectionLabels: {
    overview: "Vue d’ensemble", account: "Compte et identité", workspace: "Salon / espace de travail", appearance: "Apparence et langue",
    security: "Sécurité", privacy: "Confidentialité et données", team: "Équipe et rôles", billing: "Facturation et abonnement",
    intelligence: "Intelligence AI", governance: "Utilisation et gouvernance AI", notifications: "Notifications", integrations: "Intégrations",
    status: "État du système", audit: "Historique d’activité", authority: "GhostStage — Produit et ingénierie", danger: "Actions du compte et du workspace",
  },
  groupLabels: { core: "Principal", protection: "Protection", business: "Entreprise", intelligence: "Intelligence", connections: "Connexions", trust: "Confiance", danger: "" },
  truthLabels: {
    LIVE: "À jour", CACHED: "Cache", CONFIGURED: "Configuré", DERIVED: "Calculé", ESTIMATED: "Estimation",
    NOT_CONNECTED: "Non connecté", NOT_AVAILABLE: "Indisponible", PLAN_RESTRICTED: "Limité par l’offre", PERMISSION_RESTRICTED: "Autorisation requise",
    ERROR: "Erreur", OFFLINE: "Hors connexion",
  },
  weekdays: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
};

const COPIES: Record<AppLanguage, LocaleCopy> = { en, hy, ru, fr };

export function settingsCopy(locale: AppLanguage): LocaleCopy {
  return COPIES[locale] ?? en;
}
