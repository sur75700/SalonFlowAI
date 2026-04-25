from datetime import UTC, datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.api.deps import require_auth
from app.db.mongo import get_database

router = APIRouter()


class ServiceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    duration_minutes: int = Field(gt=0, le=1440)
    price: float = Field(ge=0)
    currency: str = Field(default="AMD", min_length=3, max_length=8)
    is_active: bool = True


class ServiceUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    duration_minutes: int = Field(gt=0, le=1440)
    price: float = Field(ge=0)
    currency: str = Field(default="AMD", min_length=3, max_length=8)
    is_active: bool = True


class ServiceStatusUpdate(BaseModel):
    is_active: bool


@router.post("/", status_code=201)
async def create_service(payload: ServiceCreate, _: dict = Depends(require_auth)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    existing = await db.services.find_one({"name": payload.name})
    if existing is not None:
        raise HTTPException(status_code=409, detail="Service already exists")

    doc = {
        "name": payload.name,
        "duration_minutes": payload.duration_minutes,
        "price": payload.price,
        "currency": payload.currency.upper(),
        "is_active": payload.is_active,
        "created_at": datetime.now(UTC).isoformat(),
    }

    result = await db.services.insert_one(doc)

    return {
        "id": str(result.inserted_id),
        "name": doc["name"],
        "duration_minutes": doc["duration_minutes"],
        "price": doc["price"],
        "currency": doc["currency"],
        "is_active": doc["is_active"],
        "created_at": doc["created_at"],
    }


@router.get("/")
async def list_services(active_only: bool = Query(default=False), _: dict = Depends(require_auth)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    query = {}
    if active_only:
        query["is_active"] = True

    docs = await db.services.find(query).sort("name", 1).to_list(length=200)

    items = []
    for doc in docs:
        items.append(
            {
                "id": str(doc["_id"]),
                "name": doc.get("name"),
                "duration_minutes": doc.get("duration_minutes"),
                "price": doc.get("price"),
                "currency": doc.get("currency"),
                "is_active": doc.get("is_active"),
                "created_at": doc.get("created_at"),
                "updated_at": doc.get("updated_at"),
            }
        )

    return {"items": items, "count": len(items)}


@router.put("/{service_id}")
async def update_service(service_id: str, payload: ServiceUpdate, _: dict = Depends(require_auth)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    if not ObjectId.is_valid(service_id):
        raise HTTPException(status_code=400, detail="Invalid service_id")

    result = await db.services.update_one(
        {"_id": ObjectId(service_id)},
        {
            "$set": {
                "name": payload.name,
                "duration_minutes": payload.duration_minutes,
                "price": payload.price,
                "currency": payload.currency.upper(),
                "is_active": payload.is_active,
                "updated_at": datetime.now(UTC).isoformat(),
            }
        },
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")

    doc = await db.services.find_one({"_id": ObjectId(service_id)})

    return {
        "id": str(doc["_id"]),
        "name": doc.get("name"),
        "duration_minutes": doc.get("duration_minutes"),
        "price": doc.get("price"),
        "currency": doc.get("currency"),
        "is_active": doc.get("is_active"),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
    }


@router.patch("/{service_id}/status")
async def update_service_status(service_id: str, payload: ServiceStatusUpdate, _: dict = Depends(require_auth)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    if not ObjectId.is_valid(service_id):
        raise HTTPException(status_code=400, detail="Invalid service_id")

    result = await db.services.update_one(
        {"_id": ObjectId(service_id)},
        {"$set": {"is_active": payload.is_active, "updated_at": datetime.now(UTC).isoformat()}},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")

    doc = await db.services.find_one({"_id": ObjectId(service_id)})

    return {
        "id": str(doc["_id"]),
        "name": doc.get("name"),
        "duration_minutes": doc.get("duration_minutes"),
        "price": doc.get("price"),
        "currency": doc.get("currency"),
        "is_active": doc.get("is_active"),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
    }


@router.delete("/{service_id}")
async def delete_service(service_id: str, _: dict = Depends(require_auth)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    if not ObjectId.is_valid(service_id):
        raise HTTPException(status_code=400, detail="Invalid service_id")

    service_obj_id = ObjectId(service_id)

    linked_appointments = await db.appointments.count_documents({"service_id": service_obj_id})
    if linked_appointments > 0:
        raise HTTPException(status_code=409, detail="Cannot delete service with linked appointments")

    result = await db.services.delete_one({"_id": service_obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")

    return {"ok": True, "deleted_id": service_id}
