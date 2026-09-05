from datetime import datetime, timedelta
from .models import ListItem, AgendaItem

def pad(n: int) -> str:
    return str(n).zfill(2)

def ymd(d: datetime) -> str:
    return f"{d.year}-{pad(d.month)}-{pad(d.day)}"

def get_seed_data() -> tuple[list[ListItem], list[AgendaItem]]:
    now = datetime.now()
    T = ymd(now)
    tm = ymd(now + timedelta(days=1))
    
    def bd(days_ahead: int) -> str:
        d = now + timedelta(days=days_ahead)
        return f"{pad(d.month)}-{pad(d.day)}"

    sl1 = 'sl-super'
    sl2 = 'sl-ferro'

    lists = [
        ListItem(id=sl1, name='Supermercado', color='salvia'),
        ListItem(id=sl2, name='Ferretería', color='menta'),
    ]

    items = [
        AgendaItem(id='e1', kind='event', title='Reunión con el equipo', date=T, time='10:00', end='11:00', notes='Sala azul — sprint de junio', done=False),
        AgendaItem(id='e2', kind='event', title='Café con Marta', date=T, time='18:30', notes='', done=False),
        AgendaItem(id='r1', kind='reminder', title='Sacar la basura', date=T, time='20:30', notes='', done=False),
        AgendaItem(id='r2', kind='reminder', title='Regar las plantas', date=tm, time='09:00', notes='', done=False),
        AgendaItem(id='t1', kind='task', title='Enviar presupuesto a Carlos', date=T, time='', prio=2, notes='', done=False),
        AgendaItem(id='t2', kind='task', title='Renovar el gimnasio', date=T, time='', prio=0, notes='', done=True),
        AgendaItem(id='t3', kind='task', title='Recoger el paquete de la oficina', date=tm, time='12:00', prio=1, notes='', done=False),
        AgendaItem(id='e3', kind='event', title='Cena de aniversario', date=ymd(now + timedelta(days=2)), time='21:00', end='23:30', notes='', done=False),
        AgendaItem(id='e4', kind='event', title='Vuelo — visita a clientes', date=ymd(now + timedelta(days=5)), time='08:15', notes='', done=False),
        AgendaItem(id='b1', kind='birthday', title='Mamá', date=bd(4), year=1962, done=False),
        AgendaItem(id='b2', kind='birthday', title='Ana Gutiérrez', date=bd(1), year=1991, done=False),
        AgendaItem(id='b3', kind='birthday', title='Luis (oficina)', date=bd(12), year=1994, done=False),
        AgendaItem(id='b4', kind='birthday', title='Tío Pedro', date=bd(21), year=1987, done=False),
        AgendaItem(id='w1', kind='wish', title='Auriculares Sony WH-1000XM5', price=379.0, prio=2, done=False),
        AgendaItem(id='w2', kind='wish', title='Cafetera espresso con molinillo', price=249.0, prio=1, done=False),
        AgendaItem(id='w3', kind='wish', title='Silla de escritorio ergonómica', price=189.0, prio=0, done=False),
        AgendaItem(id='w4', kind='wish', title='Lámpara de arco para el salón', price=120.0, prio=0, done=True),
        AgendaItem(id='s1', kind='shopping', title='Leche entera', listId=sl1, qty='1 L', done=False),
        AgendaItem(id='s2', kind='shopping', title='Pan integral', listId=sl1, qty='', done=False),
        AgendaItem(id='s3', kind='shopping', title='Aguacates', listId=sl1, qty='×2', done=False),
        AgendaItem(id='s4', kind='shopping', title='Café en grano', listId=sl1, qty='250 g', done=False),
        AgendaItem(id='s5', kind='shopping', title='Detergente', listId=sl1, qty='', done=True),
        AgendaItem(id='s6', kind='shopping', title='Tornillos M8', listId=sl2, qty='×12', done=False),
        AgendaItem(id='s7', kind='shopping', title='Cinta de pintor', listId=sl2, qty='', done=False),
    ]

    return lists, items
