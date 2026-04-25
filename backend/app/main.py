from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

from app.api.analytics import router as analytics_router
from app.api.appointments import router as appointments_router
from app.api.auth import router as auth_router
from app.api.clients import router as clients_router
from app.api.reports import router as reports_router
from app.api.services import router as services_router
from app.db.mongo import close_mongo_connection, connect_to_mongo


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(title="SalonFlow AI API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(clients_router, prefix="/clients", tags=["clients"])
app.include_router(appointments_router, prefix="/appointments", tags=["appointments"])
app.include_router(services_router, prefix="/services", tags=["services"])
app.include_router(reports_router, prefix="/reports", tags=["reports"])
app.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
