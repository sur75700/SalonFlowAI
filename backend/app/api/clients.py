from datetime import UTC, datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field

from app.api.deps import require_auth
from app.db.mongo import get_database

router = APIRouter()


class ClientCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=5, max_length=32)
    email: EmailStr | None = None
    notes: str | None = None


class ClientUpdate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=5, max_length=32)
    email: EmailStr | None = None
    notes: str | None = None


@router.post("/", status_code=201)
async def create_client(payload: ClientCreate, _: dict = Depends(require_auth)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    doc = payload.model_dump()
    doc["created_at"] = datetime.now(UTC).isoformat()

    result = await db.clients.insert_one(doc)

    return {
        "id": str(result.inserted_id),
        "full_name": doc["full_name"],
        "phone": doc["phone"],
        "email": doc.get("email"),
        "notes": doc.get("notes"),
        "created_at": doc["created_at"],
    }


@router.get("/")
async def list_clients(_: dict = Depends(require_auth)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    docs = await db.clients.find().sort("created_at", -1).to_list(length=100)

    items = []
    for doc in docs:
        items.append(
            {
                "id": str(doc["_id"]),
                "full_name": doc.get("full_name"),
                "phone": doc.get("phone"),
                "email": doc.get("email"),
                "notes": doc.get("notes"),
                "created_at": doc.get("created_at"),
                "updated_at": doc.get("updated_at"),
            }
        )

    return {"items": items, "count": len(items)}


@router.put("/{client_id}")
async def update_client(client_id: str, payload: ClientUpdate, _: dict = Depends(require_auth)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    if not ObjectId.is_valid(client_id):
        raise HTTPException(status_code=400, detail="Invalid client_id")

    result = await db.clients.update_one(
        {"_id": ObjectId(client_id)},
        {
            "$set": {
                "full_name": payload.full_name,
                "phone": payload.phone,
                "email": payload.email,
                "notes": payload.notes,
                "updated_at": datetime.now(UTC).isoformat(),
            }
        },
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")

    doc = await db.clients.find_one({"_id": ObjectId(client_id)})

    return {
        "id": str(doc["_id"]),
        "full_name": doc.get("full_name"),
        "phone": doc.get("phone"),
        "email": doc.get("email"),
        "notes": doc.get("notes"),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
    }


@router.delete("/{client_id}")
async def delete_client(client_id: str, _: dict = Depends(require_auth)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    if not ObjectId.is_valid(client_id):
        raise HTTPException(status_code=400, detail="Invalid client_id")

    client_obj_id = ObjectId(client_id)

    linked_appointments = await db.appointments.count_documents({"client_id": client_obj_id})
    if linked_appointments > 0:
        raise HTTPException(status_code=409, detail="Cannot delete client with linked appointments")

    result = await db.clients.delete_one({"_id": client_obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")

    return {"ok": True, "deleted_id": client_id}
