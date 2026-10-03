import type { AppLanguage } from "../../lib/i18n";

export type AccessGatewayMode = "signin" | "signup" | "forgot";

export const ACCESS_LANGUAGE_OPTIONS: readonly {
  code: AppLanguage;
  flag: string;
  label: string;
}[] = [
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "hy", flag: "🇦🇲", label: "Հայերեն" },
  { code: "ru", flag: "🇷🇺", label: "Русский" },
  { code: "fr", flag: "🇫🇷", label: "Français" },
] as const;

export type AccessGatewayCopy = {
  overline: string;
  signinTab: string;
  signupTab: string;
  signinTitle: string;
  signinSubtitle: string;
  signupTitle: string;
  signupSubtitle: string;
  forgotTitle: string;
  forgotSubtitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  fullNameLabel: string;
  fullNamePlaceholder: string;
  confirmPasswordLabel: string;
  confirmPasswordPlaceholder: string;
  forgotPassword: string;
  signInAction: string;
  signingIn: string;
  createAccountAction: string;
  creatingAccount: string;
  sendResetAction: string;
  sendingReset: string;
  backToSignIn: string;
  orContinue: string;
  continueGoogle: string;
  continueApple: string;
  googleNotConfigured: string;
  appleNotConfigured: string;
  configured: string;
  providerUnavailable: string;
  workspaceAccessTitle: string;
  workspaceAccessBody: string;
  createWorkspaceTitle: string;
  createWorkspaceBody: string;
  recoveryInfoTitle: string;
  recoveryInfoBody: string;
  invalidCredentials: string;
  genericError: string;
  resetTitle: string;
  resetSubtitle: string;
  newPasswordLabel: string;
  confirmNewPasswordLabel: string;
  resetAction: string;
  resetting: string;
  resetSuccessTitle: string;
  resetSuccessBody: string;
  invalidResetToken: string;
  fourLanguages: string;
  themeAware: string;
  sessionContinuity: string;
};

export const ACCESS_GATEWAY_COPY: Readonly<Record<AppLanguage, AccessGatewayCopy>> = {
  en: {
    overline: "SALONFLOWAI ACCESS",
    signinTab: "Sign in",
    signupTab: "Create account",
    signinTitle: "Welcome to the universe of limitless intelligence.",
    signinSubtitle: "Where data becomes decisions, and decisions become growth.",
    signupTitle: "Create your workspace.",
    signupSubtitle: "Create the owner account that will control your SalonFlowAI workspace.",
    forgotTitle: "Recover access.",
    forgotSubtitle: "Enter your email. If the account exists, we’ll send a reset link.",
    emailLabel: "Email",
    emailPlaceholder: "name@company.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    fullNameLabel: "Full name",
    fullNamePlaceholder: "Your full name",
    confirmPasswordLabel: "Confirm password",
    confirmPasswordPlaceholder: "Repeat your password",
    forgotPassword: "Forgot password?",
    signInAction: "Enter workspace",
    signingIn: "Signing in…",
    createAccountAction: "Create workspace",
    creatingAccount: "Creating…",
    sendResetAction: "Send reset link",
    sendingReset: "Sending…",
    backToSignIn: "Back to sign in",
    orContinue: "OR CONTINUE WITH",
    continueGoogle: "Continue with Google",
    continueApple: "Continue with Apple",
    googleNotConfigured: "Google is not configured",
    appleNotConfigured: "Apple is not configured",
    configured: "Available",
    providerUnavailable: "Unavailable",
    workspaceAccessTitle: "Workspace access",
    workspaceAccessBody: "Sign in with the account method already connected to your workspace.",
    createWorkspaceTitle: "Owner workspace",
    createWorkspaceBody: "New accounts remain subject to the existing email-verification flow.",
    recoveryInfoTitle: "Private recovery",
    recoveryInfoBody: "For privacy, reset requests use the same response whether or not an account exists.",
    invalidCredentials: "Email or password is incorrect.",
    genericError: "We couldn’t complete that request.",
    resetTitle: "Choose a new password.",
    resetSubtitle: "Set a new password for the account linked to this recovery request.",
    newPasswordLabel: "New password",
    confirmNewPasswordLabel: "Confirm new password",
    resetAction: "Update password",
    resetting: "Updating…",
    resetSuccessTitle: "Password updated",
    resetSuccessBody: "Your password has been changed. You can return to sign in.",
    invalidResetToken: "This reset link is invalid or has expired.",
    fourLanguages: "EN · HY · RU · FR",
    themeAware: "Royal Cosmos identity",
    sessionContinuity: "Session-aware access",
  },
  hy: {
    overline: "SALONFLOWAI ՄՈՒՏՔ",
    signinTab: "Մուտք գործել",
    signupTab: "Ստեղծել հաշիվ",
    signinTitle: "Բարի գալուստ անսահման ինտելեկտի տիեզերք։",
    signinSubtitle: "Այստեղ տվյալները դառնում են որոշումներ, իսկ որոշումները՝ աճ։",
    signupTitle: "Ստեղծեք ձեր workspace-ը։",
    signupSubtitle: "Ստեղծեք owner հաշիվը, որը կկառավարի ձեր SalonFlowAI workspace-ը։",
    forgotTitle: "Վերականգնեք մուտքը։",
    forgotSubtitle: "Մուտքագրեք էլ․ հասցեն։ Եթե հաշիվը գոյություն ունի, կուղարկենք վերականգնման հղում։",
    emailLabel: "Էլ․ հասցե",
    emailPlaceholder: "name@company.com",
    passwordLabel: "Գաղտնաբառ",
    passwordPlaceholder: "Մուտքագրեք գաղտնաբառը",
    fullNameLabel: "Ամբողջական անուն",
    fullNamePlaceholder: "Ձեր անունը և ազգանունը",
    confirmPasswordLabel: "Հաստատել գաղտնաբառը",
    confirmPasswordPlaceholder: "Կրկնեք գաղտնաբառը",
    forgotPassword: "Մոռացե՞լ եք գաղտնաբառը",
    signInAction: "Մուտք գործել workspace",
    signingIn: "Մուտք ենք գործում…",
    createAccountAction: "Ստեղծել workspace",
    creatingAccount: "Ստեղծվում է…",
    sendResetAction: "Ուղարկել վերականգնման հղումը",
    sendingReset: "Ուղարկվում է…",
    backToSignIn: "Վերադառնալ մուտքին",
    orContinue: "ԿԱՄ ՇԱՐՈՒՆԱԿԵԼ",
    continueGoogle: "Շարունակել Google-ով",
    continueApple: "Շարունակել Apple-ով",
    googleNotConfigured: "Google-ը դեռ կարգավորված չէ",
    appleNotConfigured: "Apple-ը դեռ կարգավորված չէ",
    configured: "Հասանելի",
    providerUnavailable: "Հասանելի չէ",
    workspaceAccessTitle: "Workspace-ի մուտք",
    workspaceAccessBody: "Մուտք գործեք այն եղանակով, որն արդեն միացված է ձեր հաշվին։",
    createWorkspaceTitle: "Owner workspace",
    createWorkspaceBody: "Նոր հաշիվները շարունակում են գործել առկա էլ․ հասցեի հաստատման հոսքով։",
    recoveryInfoTitle: "Գաղտնի վերականգնում",
    recoveryInfoBody: "Գաղտնիության համար հարցումը նույն պատասխանն է տալիս՝ անկախ հաշվի գոյությունից։",
    invalidCredentials: "Էլ․ հասցեն կամ գաղտնաբառը սխալ է։",
    genericError: "Չհաջողվեց կատարել հարցումը։",
    resetTitle: "Սահմանեք նոր գաղտնաբառ։",
    resetSubtitle: "Սահմանեք նոր գաղտնաբառ այս վերականգնման հարցմանը կապված հաշվի համար։",
    newPasswordLabel: "Նոր գաղտնաբառ",
    confirmNewPasswordLabel: "Հաստատել նոր գաղտնաբառը",
    resetAction: "Թարմացնել գաղտնաբառը",
    resetting: "Թարմացվում է…",
    resetSuccessTitle: "Գաղտնաբառը թարմացվեց",
    resetSuccessBody: "Գաղտնաբառը փոխված է։ Կարող եք վերադառնալ մուտքի էջ։",
    invalidResetToken: "Վերականգնման այս հղումը անվավեր է կամ ժամկետանց։",
    fourLanguages: "EN · HY · RU · FR",
    themeAware: "Royal Cosmos ինքնություն",
    sessionContinuity: "Սեսիային համապատասխան մուտք",
  },
  ru: {
    overline: "ДОСТУП SALONFLOWAI",
    signinTab: "Войти",
    signupTab: "Создать аккаунт",
    signinTitle: "Добро пожаловать во вселенную безграничного интеллекта.",
    signinSubtitle: "Здесь данные превращаются в решения, а решения — в рост.",
    signupTitle: "Создайте свой workspace.",
    signupSubtitle: "Создайте owner-аккаунт, который будет управлять вашим workspace SalonFlowAI.",
    forgotTitle: "Восстановите доступ.",
    forgotSubtitle: "Введите e-mail. Если аккаунт существует, мы отправим ссылку для сброса.",
    emailLabel: "Эл. почта",
    emailPlaceholder: "name@company.com",
    passwordLabel: "Пароль",
    passwordPlaceholder: "Введите пароль",
    fullNameLabel: "Полное имя",
    fullNamePlaceholder: "Имя и фамилия",
    confirmPasswordLabel: "Подтвердите пароль",
    confirmPasswordPlaceholder: "Повторите пароль",
    forgotPassword: "Забыли пароль?",
    signInAction: "Войти в workspace",
    signingIn: "Выполняется вход…",
    createAccountAction: "Создать workspace",
    creatingAccount: "Создание…",
    sendResetAction: "Отправить ссылку",
    sendingReset: "Отправка…",
    backToSignIn: "Вернуться ко входу",
    orContinue: "ИЛИ ПРОДОЛЖИТЬ",
    continueGoogle: "Продолжить с Google",
    continueApple: "Продолжить с Apple",
    googleNotConfigured: "Google ещё не настроен",
    appleNotConfigured: "Apple ещё не настроен",
    configured: "Доступно",
    providerUnavailable: "Недоступно",
    workspaceAccessTitle: "Доступ к workspace",
    workspaceAccessBody: "Используйте способ входа, который уже подключён к вашему аккаунту.",
    createWorkspaceTitle: "Owner workspace",
    createWorkspaceBody: "Новые аккаунты по-прежнему проходят существующую проверку e-mail.",
    recoveryInfoTitle: "Приватное восстановление",
    recoveryInfoBody: "Для конфиденциальности ответ одинаков независимо от существования аккаунта.",
    invalidCredentials: "Неверный e-mail или пароль.",
    genericError: "Не удалось выполнить запрос.",
    resetTitle: "Задайте новый пароль.",
    resetSubtitle: "Установите новый пароль для аккаунта, связанного с этим запросом восстановления.",
    newPasswordLabel: "Новый пароль",
    confirmNewPasswordLabel: "Подтвердите новый пароль",
    resetAction: "Обновить пароль",
    resetting: "Обновление…",
    resetSuccessTitle: "Пароль обновлён",
    resetSuccessBody: "Пароль изменён. Теперь можно вернуться ко входу.",
    invalidResetToken: "Ссылка для сброса недействительна или истекла.",
    fourLanguages: "EN · HY · RU · FR",
    themeAware: "Стиль Royal Cosmos",
    sessionContinuity: "Доступ с учётом сессии",
  },
  fr: {
    overline: "ACCÈS SALONFLOWAI",
    signinTab: "Connexion",
    signupTab: "Créer un compte",
    signinTitle: "Bienvenue dans l’univers de l’intelligence sans limites.",
    signinSubtitle: "Ici, les données deviennent des décisions, et les décisions alimentent la croissance.",
    signupTitle: "Créez votre workspace.",
    signupSubtitle: "Créez le compte owner qui contrôlera votre workspace SalonFlowAI.",
    forgotTitle: "Récupérez votre accès.",
    forgotSubtitle: "Saisissez votre e-mail. Si le compte existe, nous enverrons un lien de réinitialisation.",
    emailLabel: "E-mail",
    emailPlaceholder: "name@company.com",
    passwordLabel: "Mot de passe",
    passwordPlaceholder: "Saisissez votre mot de passe",
    fullNameLabel: "Nom complet",
    fullNamePlaceholder: "Prénom et nom",
    confirmPasswordLabel: "Confirmer le mot de passe",
    confirmPasswordPlaceholder: "Répétez le mot de passe",
    forgotPassword: "Mot de passe oublié ?",
    signInAction: "Entrer dans le workspace",
    signingIn: "Connexion…",
    createAccountAction: "Créer le workspace",
    creatingAccount: "Création…",
    sendResetAction: "Envoyer le lien",
    sendingReset: "Envoi…",
    backToSignIn: "Retour à la connexion",
    orContinue: "OU CONTINUER AVEC",
    continueGoogle: "Continuer avec Google",
    continueApple: "Continuer avec Apple",
    googleNotConfigured: "Google n’est pas encore configuré",
    appleNotConfigured: "Apple n’est pas encore configuré",
    configured: "Disponible",
    providerUnavailable: "Indisponible",
    workspaceAccessTitle: "Accès au workspace",
    workspaceAccessBody: "Utilisez la méthode de connexion déjà liée à votre compte.",
    createWorkspaceTitle: "Workspace owner",
    createWorkspaceBody: "Les nouveaux comptes conservent le flux actuel de vérification de l’e-mail.",
    recoveryInfoTitle: "Récupération privée",
    recoveryInfoBody: "Pour la confidentialité, la réponse est identique que le compte existe ou non.",
    invalidCredentials: "E-mail ou mot de passe incorrect.",
    genericError: "Impossible d’effectuer cette demande.",
    resetTitle: "Choisissez un nouveau mot de passe.",
    resetSubtitle: "Définissez un nouveau mot de passe pour le compte lié à cette demande de récupération.",
    newPasswordLabel: "Nouveau mot de passe",
    confirmNewPasswordLabel: "Confirmer le nouveau mot de passe",
    resetAction: "Mettre à jour le mot de passe",
    resetting: "Mise à jour…",
    resetSuccessTitle: "Mot de passe mis à jour",
    resetSuccessBody: "Votre mot de passe a été modifié. Vous pouvez revenir à la connexion.",
    invalidResetToken: "Ce lien de réinitialisation est invalide ou a expiré.",
    fourLanguages: "EN · HY · RU · FR",
    themeAware: "Identité Royal Cosmos",
    sessionContinuity: "Accès lié à la session",
  },
};

export function accessGatewayCopy(language: AppLanguage): AccessGatewayCopy {
  return ACCESS_GATEWAY_COPY[language] ?? ACCESS_GATEWAY_COPY.en;
}
