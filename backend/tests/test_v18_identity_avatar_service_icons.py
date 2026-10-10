import unittest

from fastapi import HTTPException

from app.api.auth import (
    AVATAR_MAX_BYTES,
    detect_avatar_mime,
    normalize_avatar_mime,
    resolve_avatar_url,
)
from app.api.services import normalize_service_icon_key


class V18IdentityAvatarServiceIconTests(unittest.TestCase):
    def test_service_icon_whitelist(self):
        self.assertEqual(normalize_service_icon_key("HairCut"), "haircut")
        self.assertIsNone(normalize_service_icon_key(""))
        with self.assertRaises(HTTPException):
            normalize_service_icon_key("totally-unknown-icon")

    def test_avatar_magic_detection(self):
        self.assertEqual(detect_avatar_mime(b"\xff\xd8\xffrest"), "image/jpeg")
        self.assertEqual(
            detect_avatar_mime(b"\x89PNG\r\n\x1a\nrest"),
            "image/png",
        )
        self.assertEqual(
            detect_avatar_mime(b"RIFF\x00\x00\x00\x00WEBPrest"),
            "image/webp",
        )
        self.assertIsNone(detect_avatar_mime(b"GIF89a"))

    def test_avatar_mime_normalization(self):
        self.assertEqual(normalize_avatar_mime("image/jpg"), "image/jpeg")
        self.assertEqual(
            normalize_avatar_mime("image/png; charset=binary"),
            "image/png",
        )

    def test_custom_avatar_precedes_provider(self):
        url, source = resolve_avatar_url(
            {
                "avatar_blob": b"\xff\xd8\xffabc",
                "avatar_mime": "image/jpeg",
                "provider_avatar_url": "https://example.com/google.jpg",
            }
        )
        self.assertEqual(source, "custom")
        self.assertTrue(url.startswith("data:image/jpeg;base64,"))

    def test_provider_avatar_fallback(self):
        url, source = resolve_avatar_url(
            {
                "provider_avatar_url": "https://example.com/google.jpg",
            }
        )
        self.assertEqual(url, "https://example.com/google.jpg")
        self.assertEqual(source, "google")

    def test_avatar_size_is_bounded(self):
        self.assertGreater(AVATAR_MAX_BYTES, 0)
        self.assertLessEqual(AVATAR_MAX_BYTES, 2_000_000)


if __name__ == "__main__":
    unittest.main()
