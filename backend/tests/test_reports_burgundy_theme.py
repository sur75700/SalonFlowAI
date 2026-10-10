import unittest

from app.reports.contracts import REPORT_THEME_IDS, normalize_report_theme
from app.reports.renderers.document_i18n import theme_label
from app.reports.renderers.pdf import PDF_THEME_PALETTES


class BurgundyReportThemeTests(unittest.TestCase):
    def test_burgundy_theme_is_supported_by_report_contract(self) -> None:
        self.assertIn("burgundy_cosmos", REPORT_THEME_IDS)
        self.assertEqual(
            normalize_report_theme("burgundy_cosmos"),
            "burgundy_cosmos",
        )

    def test_burgundy_theme_has_pdf_palette(self) -> None:
        palette = PDF_THEME_PALETTES["burgundy_cosmos"]
        self.assertEqual(palette["accent"], "#D65A88")
        self.assertEqual(palette["hero"], "#3B0B1D")
        self.assertEqual(palette["surface"], "#FFF8FA")

    def test_burgundy_theme_label_is_available_in_all_locales(self) -> None:
        for locale in ("en", "hy", "ru", "fr"):
            with self.subTest(locale=locale):
                self.assertEqual(
                    theme_label(locale, "burgundy_cosmos"),
                    "Burgundy Cosmos",
                )


if __name__ == "__main__":
    unittest.main()
