import sqlite3
import os
import tempfile
import time
from typing import Optional
from .models import ListItem, AgendaItem, ItemUpdate, AppState
from .seed_data import get_seed_data

# En Vercel el sistema de archivos es de solo lectura excepto /tmp
if os.environ.get("VERCEL"):
    DB_PATH = os.path.join(tempfile.gettempdir(), "tempo.db")
    repo_db = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "tempo.db")
    if not os.path.exists(DB_PATH) and os.path.exists(repo_db):
        import shutil
        try:
            shutil.copyfile(repo_db, DB_PATH)
        except Exception:
            pass
else:
    DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "tempo.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS lists (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                color TEXT NOT NULL
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS items (
                id TEXT PRIMARY KEY,
                kind TEXT NOT NULL,
                title TEXT NOT NULL,
                done INTEGER NOT NULL DEFAULT 0,
                createdAt REAL,
                doneAt REAL,
                date TEXT,
                time TEXT,
                end TEXT,
                prio INTEGER,
                notes TEXT,
                year INTEGER,
                price REAL,
                listId TEXT,
                qty TEXT,
                FOREIGN KEY (listId) REFERENCES lists(id) ON DELETE CASCADE
            )
        """)
        conn.commit()

        # Si está vacío, poblar con datos semilla
        cursor.execute("SELECT COUNT(*) FROM lists")
        count_lists = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM items")
        count_items = cursor.fetchone()[0]

        if count_lists == 0 and count_items == 0:
            reseed_db()

def reseed_db() -> AppState:
    lists, items = get_seed_data()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM items")
        cursor.execute("DELETE FROM lists")
        
        for l in lists:
            cursor.execute(
                "INSERT INTO lists (id, name, color) VALUES (?, ?, ?)",
                (l.id, l.name, l.color)
            )
            
        now_ts = time.time() * 1000
        for it in items:
            cursor.execute("""
                INSERT INTO items (
                    id, kind, title, done, createdAt, doneAt, date, time, end, prio, notes, year, price, listId, qty
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                it.id, it.kind, it.title, 1 if it.done else 0,
                it.createdAt or now_ts, it.doneAt,
                it.date, it.time, it.end, it.prio, it.notes,
                it.year, it.price, it.listId, it.qty
            ))
        conn.commit()
    return get_state()

def row_to_item(row: sqlite3.Row) -> AgendaItem:
    d = dict(row)
    d['done'] = bool(d['done'])
    return AgendaItem(**d)

def row_to_list(row: sqlite3.Row) -> ListItem:
    return ListItem(id=row['id'], name=row['name'], color=row['color'])

def get_state() -> AppState:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM lists")
        lists = [row_to_list(r) for r in cursor.fetchall()]
        cursor.execute("SELECT * FROM items")
        items = [row_to_item(r) for r in cursor.fetchall()]
    return AppState(lists=lists, items=items)

def get_all_lists() -> list[ListItem]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM lists")
        return [row_to_list(r) for r in cursor.fetchall()]

def create_list(l: ListItem) -> ListItem:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO lists (id, name, color) VALUES (?, ?, ?)",
            (l.id, l.name, l.color)
        )
        conn.commit()
    return l

def delete_list(list_id: str) -> bool:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM items WHERE listId = ?", (list_id,))
        cursor.execute("DELETE FROM lists WHERE id = ?", (list_id,))
        conn.commit()
        return cursor.rowcount > 0

def get_all_items(kind: Optional[str] = None, list_id: Optional[str] = None) -> list[AgendaItem]:
    with get_connection() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM items WHERE 1=1"
        params = []
        if kind:
            query += " AND kind = ?"
            params.append(kind)
        if list_id:
            query += " AND listId = ?"
            params.append(list_id)
        cursor.execute(query, params)
        return [row_to_item(r) for r in cursor.fetchall()]

def get_item(item_id: str) -> Optional[AgendaItem]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM items WHERE id = ?", (item_id,))
        row = cursor.fetchone()
        return row_to_item(row) if row else None

def upsert_item(item: AgendaItem) -> AgendaItem:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO items (
                id, kind, title, done, createdAt, doneAt, date, time, end, prio, notes, year, price, listId, qty
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                kind=excluded.kind,
                title=excluded.title,
                done=excluded.done,
                createdAt=coalesce(items.createdAt, excluded.createdAt),
                doneAt=excluded.doneAt,
                date=excluded.date,
                time=excluded.time,
                end=excluded.end,
                prio=excluded.prio,
                notes=excluded.notes,
                year=excluded.year,
                price=excluded.price,
                listId=excluded.listId,
                qty=excluded.qty
        """, (
            item.id, item.kind, item.title, 1 if item.done else 0,
            item.createdAt or (time.time() * 1000), item.doneAt,
            item.date, item.time, item.end, item.prio, item.notes,
            item.year, item.price, item.listId, item.qty
        ))
        conn.commit()
    return get_item(item.id)

def update_item_fields(item_id: str, updates: ItemUpdate) -> Optional[AgendaItem]:
    data = updates.model_dump(exclude_unset=True)
    if not data:
        return get_item(item_id)
    
    set_clauses = []
    params = []
    for k, v in data.items():
        if k == 'done':
            set_clauses.append("done = ?")
            params.append(1 if v else 0)
        else:
            set_clauses.append(f"{k} = ?")
            params.append(v)
    
    params.append(item_id)
    query = f"UPDATE items SET {', '.join(set_clauses)} WHERE id = ?"
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        conn.commit()
    return get_item(item_id)

def toggle_item_done(item_id: str) -> Optional[AgendaItem]:
    curr = get_item(item_id)
    if not curr:
        return None
    new_done = not curr.done
    new_done_at = (time.time() * 1000) if new_done else None
    return update_item_fields(item_id, ItemUpdate(done=new_done, doneAt=new_done_at))

def delete_item(item_id: str) -> Optional[AgendaItem]:
    curr = get_item(item_id)
    if not curr:
        return None
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM items WHERE id = ?", (item_id,))
        conn.commit()
    return curr

def clean_list_done(list_id: str) -> list[AgendaItem]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM items WHERE kind = 'shopping' AND listId = ? AND done = 1", (list_id,))
        removed = [row_to_item(r) for r in cursor.fetchall()]
        cursor.execute("DELETE FROM items WHERE kind = 'shopping' AND listId = ? AND done = 1", (list_id,))
        conn.commit()
    return removed

def batch_insert_items(items: list[AgendaItem]) -> list[AgendaItem]:
    inserted = []
    for it in items:
        inserted.append(upsert_item(it))
    return inserted
