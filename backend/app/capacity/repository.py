from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from bson import ObjectId
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError, PyMongoError


class CapacityRepositoryError(RuntimeError):
    """Base persistence error for authoritative capacity state."""


class CapacityNotFound(CapacityRepositoryError):
    """Raised when a tenant-scoped capacity resource does not exist."""


class CapacityConflict(CapacityRepositoryError):
    """Raised when a unique persistence invariant is violated."""


class CapacityRevisionConflict(CapacityConflict):
    """Raised when optimistic concurrency validation fails."""


class CapacityRepository:
    def __init__(self, database: Any) -> None:
        if database is None:
            raise TypeError("database is required")
        self._db = database

    @staticmethod
    def _now() -> datetime:
        return datetime.now(UTC)

    async def get_profile(
        self,
        *,
        owner_id: str,
    ) -> dict[str, Any] | None:
        return await self._db.salon_capacity_profiles.find_one(
            {"owner_id": owner_id}
        )

    async def save_profile(
        self,
        *,
        owner_id: str,
        values: dict[str, Any],
        expected_revision: int | None,
    ) -> dict[str, Any]:
        collection = self._db.salon_capacity_profiles
        existing = await collection.find_one({"owner_id": owner_id})
        now = self._now()

        if existing is None:
            if expected_revision is not None:
                raise CapacityRevisionConflict(
                    "configuration revision does not match"
                )
            document = {
                "owner_id": owner_id,
                "schema_version": 1,
                "revision": 1,
                **values,
                "created_at": now,
                "updated_at": now,
                "created_by": owner_id,
                "updated_by": owner_id,
            }
            try:
                result = await collection.insert_one(document)
            except DuplicateKeyError as error:
                raise CapacityRevisionConflict(
                    "configuration was created concurrently"
                ) from error
            except PyMongoError as error:
                raise CapacityRepositoryError(
                    "failed to create capacity configuration"
                ) from error
            document["_id"] = result.inserted_id
            return document

        if expected_revision is None:
            raise CapacityRevisionConflict(
                "revision is required for configuration updates"
            )

        try:
            updated = await collection.find_one_and_update(
                {
                    "owner_id": owner_id,
                    "revision": expected_revision,
                },
                {
                    "$set": {
                        **values,
                        "updated_at": now,
                        "updated_by": owner_id,
                    },
                    "$inc": {"revision": 1},
                },
                return_document=ReturnDocument.AFTER,
            )
        except PyMongoError as error:
            raise CapacityRepositoryError(
                "failed to update capacity configuration"
            ) from error

        if updated is None:
            raise CapacityRevisionConflict(
                "configuration revision does not match"
            )
        return updated

    async def list_staff(
        self,
        *,
        owner_id: str,
    ) -> list[dict[str, Any]]:
        cursor = self._db.staff_members.find(
            {"owner_id": owner_id}
        ).sort("display_name", 1)
        return await cursor.to_list(length=500)

    async def list_capacity_staff(
        self,
        *,
        owner_id: str,
    ) -> list[dict[str, Any]]:
        cursor = self._db.staff_members.find(
            {
                "owner_id": owner_id,
                "is_active": True,
                "capacity_enabled": True,
            }
        ).sort("display_name", 1)
        return await cursor.to_list(length=500)

    async def get_staff(
        self,
        *,
        owner_id: str,
        staff_id: ObjectId,
    ) -> dict[str, Any] | None:
        return await self._db.staff_members.find_one(
            {
                "_id": staff_id,
                "owner_id": owner_id,
            }
        )

    async def create_staff(
        self,
        *,
        owner_id: str,
        values: dict[str, Any],
    ) -> dict[str, Any]:
        now = self._now()
        document = {
            "owner_id": owner_id,
            "schema_version": 1,
            "revision": 1,
            **values,
            "created_at": now,
            "updated_at": now,
            "created_by": owner_id,
            "updated_by": owner_id,
        }
        try:
            result = await self._db.staff_members.insert_one(document)
        except PyMongoError as error:
            raise CapacityRepositoryError(
                "failed to create staff member"
            ) from error
        document["_id"] = result.inserted_id
        return document

    async def update_staff(
        self,
        *,
        owner_id: str,
        staff_id: ObjectId,
        values: dict[str, Any],
        expected_revision: int,
    ) -> dict[str, Any]:
        try:
            updated = await self._db.staff_members.find_one_and_update(
                {
                    "_id": staff_id,
                    "owner_id": owner_id,
                    "revision": expected_revision,
                },
                {
                    "$set": {
                        **values,
                        "updated_at": self._now(),
                        "updated_by": owner_id,
                    },
                    "$inc": {"revision": 1},
                },
                return_document=ReturnDocument.AFTER,
            )
        except PyMongoError as error:
            raise CapacityRepositoryError(
                "failed to update staff member"
            ) from error

        if updated is not None:
            return updated
        existing = await self.get_staff(
            owner_id=owner_id,
            staff_id=staff_id,
        )
        if existing is None:
            raise CapacityNotFound("staff member not found")
        raise CapacityRevisionConflict(
            "staff member revision does not match"
        )

    async def deactivate_staff(
        self,
        *,
        owner_id: str,
        staff_id: ObjectId,
        expected_revision: int,
    ) -> dict[str, Any]:
        return await self.update_staff(
            owner_id=owner_id,
            staff_id=staff_id,
            values={
                "is_active": False,
                "capacity_enabled": False,
            },
            expected_revision=expected_revision,
        )

    async def get_schedule(
        self,
        *,
        owner_id: str,
        staff_id: ObjectId,
    ) -> dict[str, Any] | None:
        return await self._db.staff_schedule_profiles.find_one(
            {
                "owner_id": owner_id,
                "staff_id": staff_id,
            }
        )

    async def list_schedules_for_staff(
        self,
        *,
        owner_id: str,
        staff_ids: list[ObjectId],
    ) -> list[dict[str, Any]]:
        if not staff_ids:
            return []
        cursor = self._db.staff_schedule_profiles.find(
            {
                "owner_id": owner_id,
                "staff_id": {"$in": staff_ids},
            }
        )
        return await cursor.to_list(length=500)

    async def save_schedule(
        self,
        *,
        owner_id: str,
        staff_id: ObjectId,
        weekly_schedule: list[dict[str, Any]],
        expected_revision: int | None,
    ) -> dict[str, Any]:
        collection = self._db.staff_schedule_profiles
        existing = await collection.find_one(
            {
                "owner_id": owner_id,
                "staff_id": staff_id,
            }
        )
        now = self._now()

        if existing is None:
            if expected_revision is not None:
                raise CapacityRevisionConflict(
                    "schedule revision does not match"
                )
            document = {
                "owner_id": owner_id,
                "staff_id": staff_id,
                "schema_version": 1,
                "revision": 1,
                "weekly_schedule": weekly_schedule,
                "created_at": now,
                "updated_at": now,
                "created_by": owner_id,
                "updated_by": owner_id,
            }
            try:
                result = await collection.insert_one(document)
            except DuplicateKeyError as error:
                raise CapacityRevisionConflict(
                    "schedule was created concurrently"
                ) from error
            except PyMongoError as error:
                raise CapacityRepositoryError(
                    "failed to create staff schedule"
                ) from error
            document["_id"] = result.inserted_id
            return document

        if expected_revision is None:
            raise CapacityRevisionConflict(
                "revision is required for schedule updates"
            )

        try:
            updated = await collection.find_one_and_update(
                {
                    "owner_id": owner_id,
                    "staff_id": staff_id,
                    "revision": expected_revision,
                },
                {
                    "$set": {
                        "weekly_schedule": weekly_schedule,
                        "updated_at": now,
                        "updated_by": owner_id,
                    },
                    "$inc": {"revision": 1},
                },
                return_document=ReturnDocument.AFTER,
            )
        except PyMongoError as error:
            raise CapacityRepositoryError(
                "failed to update staff schedule"
            ) from error

        if updated is None:
            raise CapacityRevisionConflict(
                "schedule revision does not match"
            )
        return updated

    async def list_exceptions(
        self,
        *,
        owner_id: str,
        starts_at_utc: datetime | None,
        ends_at_utc: datetime | None,
        staff_id: ObjectId | None,
        status: str | None,
    ) -> list[dict[str, Any]]:
        query: dict[str, Any] = {"owner_id": owner_id}
        if starts_at_utc is not None:
            query["ends_at_utc"] = {"$gt": starts_at_utc}
        if ends_at_utc is not None:
            query["starts_at_utc"] = {"$lt": ends_at_utc}
        if staff_id is not None:
            query["staff_id"] = staff_id
        if status is not None:
            query["status"] = status
        cursor = self._db.capacity_exceptions.find(query).sort(
            "starts_at_utc",
            1,
        )
        return await cursor.to_list(length=500)

    async def get_exception(
        self,
        *,
        owner_id: str,
        exception_id: ObjectId,
    ) -> dict[str, Any] | None:
        return await self._db.capacity_exceptions.find_one(
            {
                "_id": exception_id,
                "owner_id": owner_id,
            }
        )

    async def create_exception(
        self,
        *,
        owner_id: str,
        values: dict[str, Any],
    ) -> dict[str, Any]:
        now = self._now()
        document = {
            "owner_id": owner_id,
            "schema_version": 1,
            "revision": 1,
            **values,
            "status": "active",
            "created_at": now,
            "updated_at": now,
            "created_by": owner_id,
            "updated_by": owner_id,
        }
        try:
            result = await self._db.capacity_exceptions.insert_one(
                document
            )
        except PyMongoError as error:
            raise CapacityRepositoryError(
                "failed to create capacity exception"
            ) from error
        document["_id"] = result.inserted_id
        return document

    async def update_exception(
        self,
        *,
        owner_id: str,
        exception_id: ObjectId,
        values: dict[str, Any],
        expected_revision: int,
    ) -> dict[str, Any]:
        try:
            updated = (
                await self._db.capacity_exceptions.find_one_and_update(
                    {
                        "_id": exception_id,
                        "owner_id": owner_id,
                        "revision": expected_revision,
                    },
                    {
                        "$set": {
                            **values,
                            "updated_at": self._now(),
                            "updated_by": owner_id,
                        },
                        "$inc": {"revision": 1},
                    },
                    return_document=ReturnDocument.AFTER,
                )
            )
        except PyMongoError as error:
            raise CapacityRepositoryError(
                "failed to update capacity exception"
            ) from error

        if updated is not None:
            return updated
        existing = await self.get_exception(
            owner_id=owner_id,
            exception_id=exception_id,
        )
        if existing is None:
            raise CapacityNotFound("capacity exception not found")
        raise CapacityRevisionConflict(
            "capacity exception revision does not match"
        )

    async def cancel_exception(
        self,
        *,
        owner_id: str,
        exception_id: ObjectId,
        expected_revision: int,
    ) -> dict[str, Any]:
        return await self.update_exception(
            owner_id=owner_id,
            exception_id=exception_id,
            values={"status": "cancelled"},
            expected_revision=expected_revision,
        )
