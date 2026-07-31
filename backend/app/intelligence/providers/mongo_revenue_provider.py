from datetime import UTC, datetime

from app.db.mongo import get_database
from app.intelligence.provider import RevenueSnapshot


class MongoRevenueProvider:
    async def get_revenue_snapshot(self, *, context):
        db = get_database()

        if db is None:
            raise RuntimeError("Database not connected")

        query = {
            "owner_id": context.owner_id,
        }

        appointments = (
            await db.appointments
            .find(query)
            .to_list(length=5000)
        )

        total_revenue = 0.0
        completed_revenue = 0.0
        completed_count = 0

        for item in appointments:
            price = float(
                item.get("price_snapshot") or 0
            )

            total_revenue += price

            if item.get("status") == "completed":
                completed_revenue += price
                completed_count += 1

        average_ticket = (
            completed_revenue / completed_count
            if completed_count
            else 0
        )

        return RevenueSnapshot(
            owner_id=context.owner_id,
            period_start=datetime.now(UTC),
            period_end=datetime.now(UTC),
            total_revenue=total_revenue,
            completed_revenue=completed_revenue,
            completed_booking_count=completed_count,
            average_ticket=average_ticket,
        )
