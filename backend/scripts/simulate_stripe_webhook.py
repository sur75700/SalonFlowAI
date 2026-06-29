import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

import stripe

ROOT = Path(__file__).resolve().parents[1]
os.chdir(ROOT)
sys.path.insert(0, str(ROOT))

from app.core.config import settings  # noqa: E402


def build_event(event_type: str, admin_id: str, plan: str, event_id: str = "") -> dict:
    if event_type == "checkout.session.completed":
        data_object = {
            "id": "cs_test_ghost_simulator",
            "object": "checkout.session",
            "client_reference_id": admin_id,
            "customer": "cus_ghost_simulator",
            "subscription": "sub_ghost_simulator",
            "metadata": {"admin_id": admin_id, "plan": plan},
        }
    elif event_type in {"customer.subscription.updated", "customer.subscription.deleted"}:
        data_object = {
            "id": "sub_ghost_simulator",
            "object": "subscription",
            "customer": "cus_ghost_simulator",
            "status": "canceled" if event_type.endswith("deleted") else "active",
            "metadata": {"admin_id": admin_id, "plan": plan},
        }
    else:
        data_object = {"id": "evt_data_ghost_simulator", "object": "invoice"}

    return {
        "id": event_id or f"evt_ghost_{int(time.time())}",
        "object": "event",
        "type": event_type,
        "data": {"object": data_object},
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--event", default="checkout.session.completed")
    parser.add_argument("--admin-id", default="ghost-billing-test-admin")
    parser.add_argument("--plan", default="business")
    parser.add_argument("--event-id", default="", help="Reuse an existing Stripe event id")
    parser.add_argument("--url", default="http://127.0.0.1:8000/billing/webhook")
    args = parser.parse_args()

    secret = settings.stripe_webhook_secret.strip()
    if not secret:
        print("STRIPE_WEBHOOK_SECRET is missing in backend/.env", file=sys.stderr)
        return 2

    payload = json.dumps(build_event(args.event, args.admin_id, args.plan, args.event_id), separators=(",", ":"))
    timestamp = int(time.time())
    signature = stripe.WebhookSignature._compute_signature(f"{timestamp}.{payload}", secret)
    header = f"t={timestamp},v1={signature}"

    result = subprocess.run(
        [
            "curl",
            "-sS",
            "-X",
            "POST",
            args.url,
            "-H",
            "Content-Type: application/json",
            "-H",
            f"Stripe-Signature: {header}",
            "-d",
            payload,
        ],
        check=False,
        capture_output=True,
        text=True,
    )

    print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)

    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
