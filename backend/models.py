from typing import Optional, Literal
from pydantic import BaseModel, Field

KindType = Literal['event', 'reminder', 'task', 'birthday', 'wish', 'shopping']

class ListItem(BaseModel):
    id: str
    name: str
    color: str

class AgendaItem(BaseModel):
    id: str
    kind: KindType
    title: str
    done: bool = False
    createdAt: Optional[float] = None
    doneAt: Optional[float] = None
    date: Optional[str] = None       # YYYY-MM-DD, o MM-DD para cumpleaños
    time: Optional[str] = None       # HH:MM
    end: Optional[str] = None        # HH:MM para eventos
    prio: Optional[int] = None       # 0: Baja, 1: Media, 2: Alta
    notes: Optional[str] = None
    year: Optional[int] = None       # Año de nacimiento
    price: Optional[float] = None    # Precio para lista de deseos
    listId: Optional[str] = None     # ID de la lista para artículos de compra
    qty: Optional[str] = None        # Cantidad para compra (ej: "1 L", "×2")

class ItemUpdate(BaseModel):
    kind: Optional[KindType] = None
    title: Optional[str] = None
    done: Optional[bool] = None
    doneAt: Optional[float] = None
    date: Optional[str] = None
    time: Optional[str] = None
    end: Optional[str] = None
    prio: Optional[int] = None
    notes: Optional[str] = None
    year: Optional[int] = None
    price: Optional[float] = None
    listId: Optional[str] = None
    qty: Optional[str] = None

class AppState(BaseModel):
    lists: list[ListItem]
    items: list[AgendaItem]
