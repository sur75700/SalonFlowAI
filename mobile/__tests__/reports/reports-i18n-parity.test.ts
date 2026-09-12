import en from "../../translations/en";
import fr from "../../translations/fr";
import hy from "../../translations/hy";
import ru from "../../translations/ru";

function flattenStrings(
  value: unknown,
  prefix = "",
  output = new Map<string, string>(),
): Map<string, string> {
  if (typeof value === "string") {
    output.set(
      prefix,
      value,
    );

    return output;
  }

  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    for (
      const [key, child]
      of Object.entries(value)
    ) {
      flattenStrings(
        child,
        prefix
          ? `${prefix}.${key}`
          : key,
        output,
      );
    }
  }

  return output;
}

function placeholders(
  value: string,
): string[] {
  return (
    value.match(
      /\{[^{}]+\}/g,
    ) ?? []
  ).sort();
}

describe(
  "reports command-center i18n parity",
  () => {
    const locales = {
      en: en.reports.commandCenter,
      hy: hy.reports.commandCenter,
      ru: ru.reports.commandCenter,
      fr: fr.reports.commandCenter,
    };

    const baseline = flattenStrings(
      locales.en,
    );

    test.each(
      Object.entries(locales),
    )(
      "%s matches the English key structure",
      (_locale, commandCenter) => {
        const candidate =
          flattenStrings(
            commandCenter,
          );

        expect(
          [...candidate.keys()].sort(),
        ).toEqual(
          [...baseline.keys()].sort(),
        );
      },
    );

    test.each(
      Object.entries(locales),
    )(
      "%s preserves interpolation placeholders",
      (_locale, commandCenter) => {
        const candidate =
          flattenStrings(
            commandCenter,
          );

        for (
          const [key, baselineValue]
          of baseline.entries()
        ) {
          const candidateValue =
            candidate.get(key);

          expect(
            candidateValue,
          ).toBeDefined();

          if (
            typeof candidateValue
            !== "string"
          ) {
            throw new Error(
              `Missing translated string: ${key}`,
            );
          }

          expect(
            placeholders(
              candidateValue,
            ),
          ).toEqual(
            placeholders(
              baselineValue,
            ),
          );
        }
      },
    );
  },
);
