import {
  ACCESS_GATEWAY_COPY,
  ACCESS_LANGUAGE_OPTIONS,
  accessGatewayCopy,
} from "../../components/auth/access-gateway-copy";
import type { AppLanguage } from "../../lib/i18n";

describe("Access Gateway copy", () => {
  const languages: AppLanguage[] = ["en", "hy", "ru", "fr"];

  it("keeps all four supported languages available with flags", () => {
    expect(ACCESS_LANGUAGE_OPTIONS.map((item) => item.code)).toEqual(
      languages
    );

    for (const item of ACCESS_LANGUAGE_OPTIONS) {
      expect(item.flag.length).toBeGreaterThan(0);
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  it("keeps every locale structurally identical", () => {
    const englishKeys = Object.keys(ACCESS_GATEWAY_COPY.en).sort();

    for (const language of languages) {
      const copy = accessGatewayCopy(language);
      expect(Object.keys(copy).sort()).toEqual(englishKeys);

      for (const value of Object.values(copy)) {
        expect(typeof value).toBe("string");
        expect(value.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("locks the final limitless-intelligence sign-in hero in every locale", () => {
    expect(ACCESS_GATEWAY_COPY.en.signinTitle).toBe(
      "Welcome to the universe of limitless intelligence."
    );
    expect(ACCESS_GATEWAY_COPY.hy.signinTitle).toBe(
      "Բարի գալուստ անսահման ինտելեկտի տիեզերք։"
    );
    expect(ACCESS_GATEWAY_COPY.ru.signinTitle).toBe(
      "Добро пожаловать во вселенную безграничного интеллекта."
    );
    expect(ACCESS_GATEWAY_COPY.fr.signinTitle).toBe(
      "Bienvenue dans l’univers de l’intelligence sans limites."
    );

    expect(ACCESS_GATEWAY_COPY.hy.signinSubtitle).toBe(
      "Այստեղ տվյալները դառնում են որոշումներ, իսկ որոշումները՝ աճ։"
    );
  });

  it("does not fall back to English for the primary localized titles", () => {
    expect(ACCESS_GATEWAY_COPY.hy.signinTitle).not.toBe(
      ACCESS_GATEWAY_COPY.en.signinTitle
    );
    expect(ACCESS_GATEWAY_COPY.ru.signinTitle).not.toBe(
      ACCESS_GATEWAY_COPY.en.signinTitle
    );
    expect(ACCESS_GATEWAY_COPY.fr.signinTitle).not.toBe(
      ACCESS_GATEWAY_COPY.en.signinTitle
    );
  });
});
