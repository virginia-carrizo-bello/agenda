function ymd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
    const res = new Date(d);
    res.setDate(res.getDate() + n);
    return res;
}

// Feriados nacionales de Argentina con cálculo móvil y pascua
export const ARG_FIXED_HOLIDAYS: Record<string, { name: string; desc: string }> = {
    '01-01': { name: 'Año Nuevo', desc: 'Celebración del inicio del nuevo año en el calendario gregoriano universal.' },
    '03-24': { name: 'Día de la Memoria por la Verdad y la Justicia', desc: 'Homenaje a las víctimas de la dictadura cívico-militar (1976-1983) iniciada tras el golpe de Estado del 24 de marzo de 1976 en Argentina.' },
    '04-02': { name: 'Día del Veterano y de los Caídos en Malvinas', desc: 'Homenaje a los 649 soldados caídos y veteranos de la Guerra de Malvinas (1982), combatiendo en las islas y el Atlántico Sur.' },
    '05-01': { name: 'Día del Trabajador', desc: 'Homenaje a los Mártires de Chicago (EE.UU., 1886), ejecutados tras liderar la huelga histórica por la jornada laboral de 8 horas.' },
    '05-25': { name: 'Día de la Revolución de Mayo', desc: 'Creación del primer gobierno patrio en el Cabildo de Buenos Aires (1810), destituyendo al virrey Cisneros tras la Revolución de Mayo.' },
    '06-17': { name: 'Paso a la Inmortalidad del Gral. Güemes', desc: 'Líder de la Guerra Gaucha que defendió la frontera norte de 6 invasiones realistas. Falleció el 17 de junio de 1821 en Cañada de la Horqueta (Salta) tras ser herido de bala.' },
    '06-20': { name: 'Paso a la Inmortalidad del Gral. Belgrano', desc: 'Creador de la Bandera Nacional (Rosario, 1812) y victorioso comandante en las batallas de Tucumán y Salta. Falleció el 20 de junio de 1820 en Buenos Aires.' },
    '07-09': { name: 'Día de la Declaración de la Independencia', desc: 'Proclamación formal de la independencia de las Provincias Unidas en la Casa Histórica de Tucumán (1816), rompiendo lazos con la Corona española.' },
    '08-17': { name: 'Paso a la Inmortalidad del Gral. San Martín', desc: 'Padre de la Patria: organizó el Ejército de los Andes, cruzó la cordillera y libertó Argentina, Chile y Perú. Falleció en el exilio el 17 de agosto de 1850 en Boulogne-sur-Mer (Francia).' },
    '10-12': { name: 'Día del Respeto a la Diversidad Cultural', desc: 'Reflexión tras la llegada de Cristóbal Colón a América (Guanahani, 1492) y promoción de los derechos de los pueblos originarios.' },
    '11-20': { name: 'Día de la Soberanía Nacional', desc: 'Conmemoración de la Batalla de la Vuelta de Obligado (1845) en San Pedro (Bs. As.), donde tropas de Mansilla encadenaron el Río Paraná resistiendo a la flota anglo-francesa.' },
    '12-08': { name: 'Día de la Inmaculada Concepción de María', desc: 'Festividad católica dedicada a la concepción de la Virgen María libre de pecado en Nazaret.' },
    '12-25': { name: 'Navidad', desc: 'Celebración cristiana del nacimiento de Jesús de Nazaret en Belén (Judea).' }
};

export function getEasterDate(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
}

export function getArgHoliday(ds: string): { name: string; desc: string; type: string } | null {
    if (!ds) return null;
    const [yStr, mStr, dStr] = ds.split('-');
    const year = Number(yStr);
    const mmdd = `${mStr}-${dStr}`;

    if (ARG_FIXED_HOLIDAYS[mmdd]) {
        const info = ARG_FIXED_HOLIDAYS[mmdd];
        return { name: info.name, desc: info.desc, type: 'feriado' };
    }

    const easter = getEasterDate(year);
    const carnav1 = ymd(addDays(easter, -48));
    const carnav2 = ymd(addDays(easter, -47));
    const juevSanto = ymd(addDays(easter, -3));
    const vierSanto = ymd(addDays(easter, -2));

    if (ds === carnav1 || ds === carnav2) return { name: 'Carnaval', desc: 'Festividad popular previa a la Cuaresma originada en la tradición cristiana y pagana europea.', type: 'feriado' };
    if (ds === juevSanto) return { name: 'Jueves Santo', desc: 'Conmemoración cristiana de la Última Cena y el Lavatorio de pies. Día no laborable.', type: 'nolaborable' };
    if (ds === vierSanto) return { name: 'Viernes Santo', desc: 'Conmemoración cristiana de la Pasión, crucifixión y muerte de Jesús de Nazaret.', type: 'feriado' };

    return null;
}