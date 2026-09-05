from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os
from typing import Optional

from .models import ListItem, AgendaItem, ItemUpdate, AppState
from .database import (
    init_db, get_state, get_all_lists, create_list, delete_list,
    get_all_items, get_item, upsert_item, update_item_fields,
    toggle_item_done, delete_item, clean_list_done, batch_insert_items,
    reseed_db
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONT_PATH = os.path.join(BASE_DIR, "front.html")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicializa la base de datos al arrancar
    init_db()
    yield

app = FastAPI(
    title="Tempo API",
    description="Backend en Python y SQLite para el organizador Tempo",
    version="1.0.0",
    lifespan=lifespan
)

# Habilitar CORS para permitir desarrollo local sin fricción
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= Rutas de API =================

@app.get("/api/state", response_model=AppState, summary="Obtener estado completo (listas e ítems)")
def get_current_state():
    return get_state()

@app.post("/api/reseed", response_model=AppState, summary="Restaurar datos semilla iniciales")
def trigger_reseed():
    return reseed_db()

# --- Ítems ---
@app.get("/api/items", response_model=list[AgendaItem], summary="Listar ítems con filtros opcionales")
def list_items(kind: Optional[str] = None, list_id: Optional[str] = None):
    return get_all_items(kind=kind, list_id=list_id)

@app.get("/api/items/{item_id}", response_model=AgendaItem, summary="Obtener un ítem específico")
def fetch_item(item_id: str):
    it = get_item(item_id)
    if not it:
        raise HTTPException(status_code=404, detail="Ítem no encontrado")
    return it

@app.post("/api/items", response_model=AgendaItem, status_code=status.HTTP_201_CREATED, summary="Crear un ítem")
def create_new_item(item: AgendaItem):
    return upsert_item(item)

@app.put("/api/items/{item_id}", response_model=AgendaItem, summary="Actualizar o crear un ítem por ID")
def put_item(item_id: str, item: AgendaItem):
    item.id = item_id
    return upsert_item(item)

@app.patch("/api/items/{item_id}", response_model=AgendaItem, summary="Actualizar campos de un ítem")
def patch_item(item_id: str, updates: ItemUpdate):
    it = update_item_fields(item_id, updates)
    if not it:
        raise HTTPException(status_code=404, detail="Ítem no encontrado")
    return it

@app.patch("/api/items/{item_id}/toggle", response_model=AgendaItem, summary="Alternar estado completado")
def toggle_item(item_id: str):
    it = toggle_item_done(item_id)
    if not it:
        raise HTTPException(status_code=404, detail="Ítem no encontrado")
    return it

@app.delete("/api/items/{item_id}", response_model=AgendaItem, summary="Eliminar un ítem")
def remove_item(item_id: str):
    removed = delete_item(item_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Ítem no encontrado")
    return removed

@app.post("/api/items/batch", response_model=list[AgendaItem], summary="Inserción por lote (útil para deshacer eliminación)")
def batch_create(items: list[AgendaItem]):
    return batch_insert_items(items)

# --- Listas ---
@app.get("/api/lists", response_model=list[ListItem], summary="Listar todas las listas")
def list_lists():
    return get_all_lists()

@app.post("/api/lists", response_model=ListItem, status_code=status.HTTP_201_CREATED, summary="Crear una lista")
def create_new_list(l: ListItem):
    return create_list(l)

@app.delete("/api/lists/{list_id}", summary="Eliminar una lista y sus ítems")
def remove_list(list_id: str):
    success = delete_list(list_id)
    if not success:
        raise HTTPException(status_code=404, detail="Lista no encontrada")
    return {"status": "deleted", "id": list_id}

@app.post("/api/lists/{list_id}/clean", response_model=list[AgendaItem], summary="Vaciar artículos completados de una lista")
def clean_list(list_id: str):
    removed = clean_list_done(list_id)
    return removed

# ================= Servir Frontend =================
@app.get("/", include_in_schema=False)
def serve_root():
    if os.path.exists(FRONT_PATH):
        return FileResponse(FRONT_PATH, media_type="text/html")
    return {"message": "Tempo backend activo. Documentación disponible en /docs"}

@app.get("/front.html", include_in_schema=False)
def serve_front():
    if os.path.exists(FRONT_PATH):
        return FileResponse(FRONT_PATH, media_type="text/html")
    raise HTTPException(status_code=404, detail="front.html no encontrado")
