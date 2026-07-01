import asyncio
from datetime import UTC, datetime, timedelta

from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings

OWNER_EMAIL = "admin@salonflowai.com"
SEED_TAG = "phase_27b_demo_business_seed"

CLIENTS = [
    ("Ani Petrosyan", "+37499100101", "ani.petrosyan@example.com"),
    ("Mariam Sargsyan", "+37499100102", "mariam.sargsyan@example.com"),
    ("Lilit Hakobyan", "+37499100103", "lilit.hakobyan@example.com"),
    ("Nare Grigoryan", "+37499100104", "nare.grigoryan@example.com"),
    ("Sona Avagyan", "+37499100105", "sona.avagyan@example.com"),
    ("Arpine Karapetyan", "+37499100106", "arpine.karapetyan@example.com"),
    ("Elina Martirosyan", "+37499100107", "elina.martirosyan@example.com"),
    ("Gohar Vardanyan", "+37499100108", "gohar.vardanyan@example.com"),
    ("Tatev Manukyan", "+37499100109", "tatev.manukyan@example.com"),
    ("Mane Hovhannisyan", "+37499100110", "mane.hovhannisyan@example.com"),
    ("Anna Melkonyan", "+37499100111", "anna.melkonyan@example.com"),
    ("Diana Khachatryan", "+37499100112", "diana.khachatryan@example.com"),
]

SERVICES = [
    ("Haircut & Styling", 60, 12000),
    ("Hair Coloring", 150, 45000),
    ("Balayage Premium", 210, 68000),
    ("Keratin Treatment", 180, 52000),
    ("Bridal Makeup", 120, 60000),
    ("Evening Makeup", 75, 28000),
    ("Manicure Gel", 60, 11000),
    ("Pedicure Spa", 75, 15000),
    ("Brow Lamination", 45, 10000),
    ("Facial Glow Care", 90, 22000),
]

def iso(dt: datetime) -> str:
    return dt.astimezone(UTC).isoformat()

async def main():
    client = AsyncIOMotorClient(settings.mongo_url)
    db = client[settings.mongo_db_name]

    owner = await db.admin_users.find_one({"email": OWNER_EMAIL.lower()})
    if not owner:
        raise SystemExit(f"Owner not found: {OWNER_EMAIL}")

    owner_id = str(owner["_id"])

    existing = await db.appointments.count_documents({"owner_id": owner_id, "seed_tag": SEED_TAG})
    if existing:
        print("Demo seed already exists. No duplicate inserted.")
        print({"existing_appointments": existing})
        client.close()
        return

    now = datetime.now(UTC)

    client_docs = [
        {
            "owner_id": owner_id,
            "full_name": name,
            "phone": phone,
            "email": email,
            "notes": "Demo client for AI analytics.",
            "seed_tag": SEED_TAG,
            "created_at": iso(now - timedelta(days=90 - i * 4)),
        }
        for i, (name, phone, email) in enumerate(CLIENTS)
    ]

    service_docs = [
        {
            "owner_id": owner_id,
            "name": name,
            "duration_minutes": duration,
            "price": float(price),
            "currency": "AMD",
            "is_active": True,
            "seed_tag": SEED_TAG,
            "created_at": iso(now - timedelta(days=120)),
        }
        for name, duration, price in SERVICES
    ]

    client_result = await db.clients.insert_many(client_docs)
    service_result = await db.services.insert_many(service_docs)

    created_clients = await db.clients.find({"_id": {"$in": client_result.inserted_ids}}).to_list(length=100)
    created_services = await db.services.find({"_id": {"$in": service_result.inserted_ids}}).to_list(length=100)

    appointments = []

    for i in range(75):
        c = created_clients[i % len(created_clients)]
        s = created_services[(i * 3) % len(created_services)]
        start = (now - timedelta(days=75 - i)).replace(hour=[10, 12, 14, 16, 18][i % 5], minute=0, second=0, microsecond=0)
        end = start + timedelta(minutes=int(s["duration_minutes"]))
        status = "cancelled" if i % 12 == 0 else "completed"

        appointments.append({
            "owner_id": owner_id,
            "client_id": c["_id"],
            "client_name": c["full_name"],
            "service_id": s["_id"],
            "service_name": s["name"],
            "price_snapshot": float(s["price"]),
            "currency_snapshot": "AMD",
            "duration_minutes_snapshot": int(s["duration_minutes"]),
            "starts_at": iso(start),
            "ends_at": iso(end),
            "status": status,
            "notes": "Demo historical appointment.",
            "seed_tag": SEED_TAG,
            "created_at": iso(start - timedelta(days=2)),
        })

    for i in range(24):
        c = created_clients[(i * 2) % len(created_clients)]
        s = created_services[(i * 5 + 1) % len(created_services)]
        start = (now + timedelta(days=1 + (i % 21))).replace(hour=[10, 12, 14, 16, 18][i % 5], minute=30, second=0, microsecond=0)
        end = start + timedelta(minutes=int(s["duration_minutes"]))

        appointments.append({
            "owner_id": owner_id,
            "client_id": c["_id"],
            "client_name": c["full_name"],
            "service_id": s["_id"],
            "service_name": s["name"],
            "price_snapshot": float(s["price"]),
            "currency_snapshot": "AMD",
            "duration_minutes_snapshot": int(s["duration_minutes"]),
            "starts_at": iso(start),
            "ends_at": iso(end),
            "status": "scheduled",
            "notes": "Demo upcoming appointment.",
            "seed_tag": SEED_TAG,
            "created_at": iso(now),
        })

    appointment_result = await db.appointments.insert_many(appointments)

    print("Demo business seed inserted.")
    print({
        "owner_id": owner_id,
        "clients": len(client_result.inserted_ids),
        "services": len(service_result.inserted_ids),
        "appointments": len(appointment_result.inserted_ids),
    })

    client.close()

asyncio.run(main())
