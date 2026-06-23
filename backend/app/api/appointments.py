from datetime import UTC, datetime, timedelta, time

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.api.deps import require_auth
from app.db.mongo import get_database

router = APIRouter()

class AppointmentCreate(BaseModel):
    client_id: str = Field(min_length=24, max_length=24)
    service_id: str = Field(min_length=24, max_length=24)
    starts_at: datetime
    ends_at: datetime | None = None
    status: str = Field(default="scheduled", min_length=3, max_length=32)
    notes: str | None = None

class AppointmentUpdate(BaseModel):
    client_id: str = Field(min_length=24, max_length=24)
    service_id: str = Field(min_length=24, max_length=24)
    starts_at: datetime
    ends_at: datetime | None = None
    status: str = Field(default="scheduled", min_length=3, max_length=32)
    notes: str | None = None

class AppointmentStatusUpdate(BaseModel):
    status: str = Field(min_length=3, max_length=32)

@router.post("/", status_code=201)
async def create_appointment(payload: AppointmentCreate, auth: dict = Depends(require_auth)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    if not ObjectId.is_valid(payload.client_id):
        raise HTTPException(status_code=400, detail="Invalid client_id")
    if not ObjectId.is_valid(payload.service_id):
        raise HTTPException(status_code=400, detail="Invalid service_id")

    owner_id = auth.get("admin_id")
    if not owner_id or not ObjectId.is_valid(owner_id):
        raise HTTPException(status_code=401, detail="Invalid token")

    client_obj_id = ObjectId(payload.client_id)
    service_obj_id = ObjectId(payload.service_id)

    client_doc = await db.clients.find_one({"_id": client_obj_id, "owner_id": owner_id})
    if client_doc is None:
        raise HTTPException(status_code=404, detail="Client not found")

    service_doc = await db.services.find_one({"_id": service_obj_id, "owner_id": owner_id})
    if service_doc is None:
        raise HTTPException(status_code=404, detail="Service not found")
    if service_doc.get("is_active") is not True:
        raise HTTPException(status_code=400, detail="Service is inactive")

    starts_at_utc = payload.starts_at.astimezone(UTC)
    if payload.ends_at is not None:
        ends_at_utc = payload.ends_at.astimezone(UTC)
    else:
        duration_minutes = int(service_doc.get("duration_minutes", 60))
        ends_at_utc = starts_at_utc + timedelta(minutes=duration_minutes)

    if ends_at_utc <= starts_at_utc:
        raise HTTPException(status_code=400, detail="ends_at must be later than starts_at")

    doc = {
        "owner_id": owner_id,
        "client_id": client_obj_id,
        "client_name": client_doc.get("full_name"),
        "service_id": service_obj_id,
        "service_name": service_doc.get("name"),
        "price_snapshot": service_doc.get("price"),
        "currency_snapshot": service_doc.get("currency"),
        "duration_minutes_snapshot": service_doc.get("duration_minutes"),
        "starts_at": starts_at_utc.isoformat(),
        "ends_at": ends_at_utc.isoformat(),
        "status": payload.status,
        "notes": payload.notes,
        "created_at": datetime.now(UTC).isoformat(),
    }

    result = await db.appointments.insert_one(doc)

    return {
        "id": str(result.inserted_id),
        "client_id": str(doc["client_id"]),
        "client_name": doc["client_name"],
        "service_id": str(doc["service_id"]),
        "service_name": doc["service_name"],
        "price_snapshot": doc["price_snapshot"],
        "currency_snapshot": doc["currency_snapshot"],
        "duration_minutes_snapshot": doc["duration_minutes_snapshot"],
        "starts_at": doc["starts_at"],
        "ends_at": doc["ends_at"],
        "status": doc["status"],
        "notes": doc["notes"],
        "created_at": doc["created_at"],
    }

@router.get("/")
async def list_appointments(
    client_id: str | None = Query(default=None),
    status: str | None = Query(default=None),
    auth: dict = Depends(require_auth),
):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    owner_id = auth.get("admin_id")
    if not owner_id or not ObjectId.is_valid(owner_id):
        raise HTTPException(status_code=401, detail="Invalid token")

    query: dict = {"owner_id": owner_id}
    if client_id is not None:
        if not ObjectId.is_valid(client_id):
            raise HTTPException(status_code=400, detail="Invalid client_id")
        query["client_id"] = ObjectId(client_id)
    if status is not None:
        query["status"] = status

    docs = await db.appointments.find(query).sort("starts_at", 1).to_list(length=200)

    items = []
    for doc in docs:
        items.append(
            {
                "id": str(doc["_id"]),
                "client_id": str(doc["client_id"]),
                "client_name": doc.get("client_name"),
                "service_id": str(doc["service_id"]) if doc.get("service_id") else None,
                "service_name": doc.get("service_name"),
                "price_snapshot": doc.get("price_snapshot"),
                "currency_snapshot": doc.get("currency_snapshot"),
                "duration_minutes_snapshot": doc.get("duration_minutes_snapshot"),
                "starts_at": doc.get("starts_at"),
                "ends_at": doc.get("ends_at"),
                "status": doc.get("status"),
                "notes": doc.get("notes"),
                "created_at": doc.get("created_at"),
                "updated_at": doc.get("updated_at"),
            }
        )

    return {"items": items, "count": len(items)}

@router.put("/{appointment_id}")
async def update_appointment(appointment_id: str, payload: AppointmentUpdate, auth: dict = Depends(require_auth)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    if not ObjectId.is_valid(appointment_id):
        raise HTTPException(status_code=400, detail="Invalid appointment_id")
    if not ObjectId.is_valid(payload.client_id):
        raise HTTPException(status_code=400, detail="Invalid client_id")
    if not ObjectId.is_valid(payload.service_id):
        raise HTTPException(status_code=400, detail="Invalid service_id")

    owner_id = auth.get("admin_id")
    if not owner_id or not ObjectId.is_valid(owner_id):
        raise HTTPException(status_code=401, detail="Invalid token")

    client_obj_id = ObjectId(payload.client_id)
    service_obj_id = ObjectId(payload.service_id)

    client_doc = await db.clients.find_one({"_id": client_obj_id, "owner_id": owner_id})
    if client_doc is None:
        raise HTTPException(status_code=404, detail="Client not found")

    service_doc = await db.services.find_one({"_id": service_obj_id, "owner_id": owner_id})
    if service_doc is None:
        raise HTTPException(status_code=404, detail="Service not found")
    if service_doc.get("is_active") is not True:
        raise HTTPException(status_code=400, detail="Service is inactive")

    starts_at_utc = payload.starts_at.astimezone(UTC)
    if payload.ends_at is not None:
        ends_at_utc = payload.ends_at.astimezone(UTC)
    else:
        duration_minutes = int(service_doc.get("duration_minutes", 60))
        ends_at_utc = starts_at_utc + timedelta(minutes=duration_minutes)

    if ends_at_utc <= starts_at_utc:
        raise HTTPException(status_code=400, detail="ends_at must be later than starts_at")

    result = await db.appointments.update_one(
        {"_id": ObjectId(appointment_id), "owner_id": owner_id},
        {
            "$set": {
                "client_id": client_obj_id,
                "client_name": client_doc.get("full_name"),
                "service_id": service_obj_id,
                "service_name": service_doc.get("name"),
                "price_snapshot": service_doc.get("price"),
                "currency_snapshot": service_doc.get("currency"),
                "duration_minutes_snapshot": service_doc.get("duration_minutes"),
                "starts_at": starts_at_utc.isoformat(),
                "ends_at": ends_at_utc.isoformat(),
                "status": payload.status,
                "notes": payload.notes,
                "updated_at": datetime.now(UTC).isoformat(),
            }
        },
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")

    doc = await db.appointments.find_one({"_id": ObjectId(appointment_id), "owner_id": owner_id})

    return {
        "id": str(doc["_id"]),
        "client_id": str(doc["client_id"]),
        "client_name": doc.get("client_name"),
        "service_id": str(doc["service_id"]) if doc.get("service_id") else None,
        "service_name": doc.get("service_name"),
        "price_snapshot": doc.get("price_snapshot"),
        "currency_snapshot": doc.get("currency_snapshot"),
        "duration_minutes_snapshot": doc.get("duration_minutes_snapshot"),
        "starts_at": doc.get("starts_at"),
        "ends_at": doc.get("ends_at"),
        "status": doc.get("status"),
        "notes": doc.get("notes"),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
    }

@router.patch("/{appointment_id}/status")
async def update_appointment_status(appointment_id: str, payload: AppointmentStatusUpdate, auth: dict = Depends(require_auth)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    if not ObjectId.is_valid(appointment_id):
        raise HTTPException(status_code=400, detail="Invalid appointment_id")

    owner_id = auth.get("admin_id")
    if not owner_id or not ObjectId.is_valid(owner_id):
        raise HTTPException(status_code=401, detail="Invalid token")

    result = await db.appointments.update_one(
        {"_id": ObjectId(appointment_id), "owner_id": owner_id},
        {"$set": {"status": payload.status, "updated_at": datetime.now(UTC).isoformat()}},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")

    doc = await db.appointments.find_one({"_id": ObjectId(appointment_id), "owner_id": owner_id})

    return {
        "id": str(doc["_id"]),
        "client_id": str(doc["client_id"]),
        "client_name": doc.get("client_name"),
        "service_id": str(doc["service_id"]) if doc.get("service_id") else None,
        "service_name": doc.get("service_name"),
        "price_snapshot": doc.get("price_snapshot"),
        "currency_snapshot": doc.get("currency_snapshot"),
        "duration_minutes_snapshot": doc.get("duration_minutes_snapshot"),
        "starts_at": doc.get("starts_at"),
        "ends_at": doc.get("ends_at"),
        "status": doc.get("status"),
        "notes": doc.get("notes"),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
    }

@router.delete("/{appointment_id}")
async def delete_appointment(appointment_id: str, auth: dict = Depends(require_auth)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    if not ObjectId.is_valid(appointment_id):
        raise HTTPException(status_code=400, detail="Invalid appointment_id")

    owner_id = auth.get("admin_id")
    if not owner_id or not ObjectId.is_valid(owner_id):
        raise HTTPException(status_code=401, detail="Invalid token")

    result = await db.appointments.delete_one({"_id": ObjectId(appointment_id), "owner_id": owner_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")

    return {"ok": True, "deleted_id": appointment_id}

@router.get("/dashboard/summary")
async def dashboard_summary(auth: dict = Depends(require_auth)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    owner_id = auth.get("admin_id")
    if not owner_id or not ObjectId.is_valid(owner_id):
        raise HTTPException(status_code=401, detail="Invalid token")

    owner_query = {"owner_id": owner_id}

    total_clients = await db.clients.count_documents(owner_query)
    total_services = await db.services.count_documents(owner_query)
    active_services = await db.services.count_documents({"owner_id": owner_id, "is_active": True})
    total_appointments = await db.appointments.count_documents(owner_query)
    scheduled_appointments = await db.appointments.count_documents({"owner_id": owner_id, "status": "scheduled"})
    completed_appointments = await db.appointments.count_documents({"owner_id": owner_id, "status": "completed"})
    cancelled_appointments = await db.appointments.count_documents({"owner_id": owner_id, "status": "cancelled"})

    today = datetime.now(UTC).date()
    start_of_day = datetime.combine(today, time.min, tzinfo=UTC).isoformat()
    end_of_day = datetime.combine(today, time.max, tzinfo=UTC).isoformat()

    today_count = await db.appointments.count_documents(
        {"owner_id": owner_id, "starts_at": {"$gte": start_of_day, "$lte": end_of_day}}
    )

    return {
        "total_clients": total_clients,
        "total_services": total_services,
        "active_services": active_services,
        "total_appointments": total_appointments,
        "scheduled_appointments": scheduled_appointments,
        "completed_appointments": completed_appointments,
        "cancelled_appointments": cancelled_appointments,
        "today_appointments": today_count,
    }
