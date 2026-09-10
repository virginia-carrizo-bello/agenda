// Tempo 1:1 Complete Engine with GCal Integration
export function initTempoEngine() {
'use strict';
        /* ================= Iconos ================= */
        const P = {
            plus: '<path d="M12 5v14M5 12h14"/>',
            chevL: '<path d="M15 18l-6-6 6-6"/>', chevR: '<path d="M9 6l6 6-6 6"/>',
            search: '<circle cx="11" cy="11" r="7"/><path d="M20.3 20.3l-3.8-3.8"/>',
            check: '<path d="M5 12.5l4.2 4.2L19 7.5"/>',
            trash: '<path d="M4 7h16M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7M6.2 7l1 12.1a1.4 1.4 0 0 0 1.4 1.3h6.8a1.4 1.4 0 0 0 1.4-1.3L17.8 7"/>',
            bell: '<path d="M18 15.5v-5a6 6 0 1 0-12 0v5L4.4 18h15.2L18 15.5zM10.4 20.6a1.8 1.8 0 0 0 3.2 0"/>',
            gift: '<path d="M4 11.5V20h16v-8.5M2.8 7h18.4v4.5H2.8zM12 7v13M12 7c-1.6-3.2-6.2-3.6-6.2-.9S10 7 12 7zm0 0c1.6-3.2 6.2-3.6 6.2-.9S14 7 12 7z"/>',
            cart: '<path d="M3 4.2h2.1l2.4 11.6a1.3 1.3 0 0 0 1.3 1h8.6a1.3 1.3 0 0 0 1.3-1L20.5 8H6"/><circle cx="9.4" cy="20.3" r="1.5"/><circle cx="17" cy="20.3" r="1.5"/>',
            star: '<path d="M12 3.2l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.5 9.4l5.9-.8L12 3.2z"/>',
            cal: '<rect x="3.2" y="4.8" width="17.6" height="16" rx="3"/><path d="M3.2 9.8h17.6M8 2.8v4M16 2.8v4"/>',
            sparkle: '<path d="M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9L12 3zM19 16.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z"/>',
            flag: '<path d="M5.5 21V3.8M5.5 4.2c4.5-2.2 8.5 2.2 13 0v9.3c-4.5 2.2-8.5-2.2-13 0"/>',
            reset: '<path d="M3.5 4.5v5.5h5.5"/><path d="M4.6 14.5a8 8 0 1 0 1.5-7.6L3.5 10"/>',
            repeat: '<path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"/>',
            moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
            sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.2M12 19.8v2.2M4.93 4.93l1.55 1.55M17.52 17.52l1.55 1.55M2 12h2.2M19.8 12h2.2M4.93 19.07l1.55-1.55M17.52 6.48l1.55-1.55"/>',
            autoTheme: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18"/><path d="M12 3a9 9 0 0 1 0 18" fill="currentColor" fill-opacity="0.35"/>',
        };
        const ic = (n, s = 20, w = 1.9) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" style="width:${s}px;height:${s}px">${P[n]}</svg>`;

        /* ================= Dominio ================= */
        const KIND = {
            event: { label: 'Evento', icon: 'cal' },
            routine: { label: 'Rutina', icon: 'repeat' },
            reminder: { label: 'Recordatorio', icon: 'bell' },
            task: { label: 'Pendiente', icon: 'check' },
            birthday: { label: 'Cumpleaños', icon: 'gift' },
            wish: { label: 'Deseo', icon: 'star' },
            shopping: { label: 'Compra', icon: 'cart' },
        };
        const kcol = k => `var(--k-${k})`, ksoft = k => `var(--k-${k}-soft)`;
        /* Paleta pastel (Madeby Haley) para las listas de compra */
        const PALETTE = {
            rosa: { name: 'Rosa', c: kcol('birthday'), cs: ksoft('birthday') },
            durazno: { name: 'Durazno', c: kcol('reminder'), cs: ksoft('reminder') },
            coral: { name: 'Coral', c: kcol('routine'), cs: ksoft('routine') },
            limon: { name: 'Limón', c: kcol('limon'), cs: ksoft('limon') },
            salvia: { name: 'Salvia', c: kcol('shopping'), cs: ksoft('shopping') },
            menta: { name: 'Menta', c: kcol('teal'), cs: ksoft('teal') },
            cielo: { name: 'Cielo', c: kcol('event'), cs: ksoft('event') },
            lavanda: { name: 'Lavanda', c: kcol('task'), cs: ksoft('task') },
            lila: { name: 'Lila', c: kcol('wish'), cs: ksoft('wish') },
        };
        const PAL_ALIAS = { verde: 'salvia', turquesa: 'menta', azul: 'cielo', naranja: 'coral' }; // compat con datos guardados
        const palOf = n => PALETTE[PAL_ALIAS[n] || n] || PALETTE.salvia;
        const PRIO = ['Baja', 'Media', 'Alta'];
        const hasCheck = k => ['task', 'reminder', 'shopping', 'wish', 'routine'].includes(k);

        /* ================= Fechas ================= */
        const pad = n => String(n).padStart(2, '0');
        const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const fromYmd = s => { const [a, b, c] = s.split('-').map(Number); return new Date(a, b - 1, c) };
        const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x };
        const getWeekDays = d => { const date = new Date(d); const day = (date.getDay() + 6) % 7; const monday = new Date(date); monday.setDate(date.getDate() - day); const days = []; for (let i = 0; i < 7; i++) { const w = new Date(monday); w.setDate(monday.getDate() + i); days.push(w); } return days; };

        /* ================= Feriados de Argentina ================= */
        function getEasterDate(year) {
            const a = year % 19, b = Math.floor(year / 100), c = year % 100;
            const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
            const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
            const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
            const m = Math.floor((a + 11 * h + 22 * l) / 451);
            const month = Math.floor((h + l - 7 * m + 114) / 31);
            const day = ((h + l - 7 * m + 114) % 31) + 1;
            return new Date(year, month - 1, day);
        }

        const ARG_FIXED_HOLIDAYS = {
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

        function getArgHoliday(ds) {
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

            if (ds === carnav1 || ds === carnav2) return { name: 'Carnaval', desc: 'Festividad popular previa a la Cuaresma originada en antiguas tradiciones mediterráneas e introducida en América.', type: 'feriado' };
            if (ds === vierSanto) return { name: 'Viernes Santo', desc: 'Conmemoración del juicio en Jerusalén, crucifixión y muerte de Jesús en el Monte Calvario (Gólgota).', type: 'feriado' };
            if (ds === juevSanto) return { name: 'Jueves Santo', desc: 'Día no laborable por la Última Cena de Jesús con sus discípulos y el lavatorio de pies en Jerusalén.', type: 'nolaborable' };

            return null;
        }
        const todayY = () => ymd(new Date());
        const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
        const fLong = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        const fDayName = new Intl.DateTimeFormat('es-ES', { weekday: 'long' });
        const fDateOnly = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        function formatHeaderDate(d = new Date()) {
            const day = d.getDate();
            const month = cap(d.toLocaleDateString('es-ES', { month: 'long' }));
            const year = d.getFullYear();
            return `${day} de ${month} de ${year}`;
        }
        const fShort = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });
        const fWk = new Intl.DateTimeFormat('es-ES', { weekday: 'short' });
        const fmtTime = t => t ? `${+t.split(':')[0]}:${t.split(':')[1]}` : '';
        function fmtRel(ds) {
            if (ds === todayY()) return 'hoy';
            if (ds === ymd(addDays(new Date(), 1))) return 'mañana';
            return fShort.format(fromYmd(ds));
        }
        function nextBday(b) {
            const [m, d] = b.date.split('-').map(Number); const t0 = new Date(); t0.setHours(0, 0, 0, 0);
            let n = new Date(t0.getFullYear(), m - 1, d); if (n < t0) n.setFullYear(n.getFullYear() + 1);
            return { next: n, days: Math.round((n - t0) / 864e5), turns: b.year ? n.getFullYear() - b.year : null };
        }

        /* ================= Clima, Ciudad y Pronóstico por Hora en Tiempo Real ================= */
        const WEATHER_KEY = 'tempo.weather.cache_v2';

        function getCityFromTimezone(tz) {
            if (!tz) return 'Tu ubicación';
            const parts = tz.split('/');
            const raw = parts[parts.length - 1] || tz;
            return raw.replace(/_/g, ' ');
        }

        let weatherState = {
            city: getCityFromTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone),
            temp: '22°C',
            feelsLike: '22°C',
            desc: 'Agradable',
            icon: '☀️',
            humidity: '55%',
            wind: '10 km/h',
            hourly: [],
            loaded: false
        };

        try {
            const cached = JSON.parse(localStorage.getItem(WEATHER_KEY) || '{}');
            if (cached && cached.temp) {
                weatherState = { ...weatherState, ...cached, loaded: true };
            }
        } catch (_) { }

        function weatherCodeToInfo(code, isDay) {
            if (code === 0) return { icon: isDay ? '☀️' : '🌙', desc: 'Despejado' };
            if (code === 1) return { icon: isDay ? '🌤️' : '🌤️', desc: 'Despejado' };
            if (code === 2) return { icon: isDay ? '⛅' : '☁️', desc: 'Parcialmente nublado' };
            if (code === 3) return { icon: '☁️', desc: 'Nublado' };
            if (code >= 45 && code <= 48) return { icon: '🌫️', desc: 'Niebla' };
            if (code >= 51 && code <= 55) return { icon: '🌦️', desc: 'Llovizna' };
            if (code >= 61 && code <= 65) return { icon: '🌧️', desc: 'Lluvia' };
            if (code >= 71 && code <= 77) return { icon: '🌨️', desc: 'Nieve' };
            if (code >= 80 && code <= 82) return { icon: '🌧️', desc: 'Chubascos' };
            if (code >= 95 && code <= 99) return { icon: '⛈️', desc: 'Tormenta' };
            return { icon: isDay ? '☀️' : '🌙', desc: 'Agradable' };
        }

        function renderWeatherPopoverContent() {
            const hourlyHTML = (weatherState.hourly && weatherState.hourly.length)
                ? weatherState.hourly.map((h, i) => `
                    <div class="wp-hour-item${i === 0 ? ' is-now' : ''}">
                      <span class="wp-hour-time">${h.timeStr}</span>
                      <span class="wp-hour-icon">${h.icon}</span>
                      <span class="wp-hour-temp">${h.temp}</span>
                      ${h.pop > 0 ? `<span class="wp-hour-pop">💧${h.pop}%</span>` : ''}
                    </div>`).join('')
                : `<div style="padding:10px;text-align:center;font-size:12px;color:var(--label3)">Cargando pronóstico...</div>`;

            return `
              <div class="wp-head">
                <div class="wp-loc">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 21s-6-5.33-6-10a6 6 0 1 1 12 0c0 4.67-6 10-6 10z"/><circle cx="12" cy="11" r="2.5"/></svg>
                  <b>${esc(weatherState.city)}</b>
                </div>
                <span class="wp-now-desc">${weatherState.desc} · Sensación ${weatherState.feelsLike}</span>
              </div>
              <div class="wp-title-h">Pronóstico próximas horas</div>
              <div class="wp-hourly-scroll">
                ${hourlyHTML}
              </div>
              <div class="wp-footer">
                <span>💧 Humedad: <b>${weatherState.humidity || '55%'}</b></span>
                <span>💨 Viento: <b>${weatherState.wind || '10 km/h'}</b></span>
              </div>`;
        }

        function updateWeatherUI() {
            const pill = document.getElementById('weatherPill');
            if (pill) {
                pill.innerHTML = `
                  <div class="wc-location">
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 21s-6-5.33-6-10a6 6 0 1 1 12 0c0 4.67-6 10-6 10z"/><circle cx="12" cy="11" r="2.5"/></svg>
                    <span>${esc(weatherState.city)}</span>
                  </div>
                  <div class="wc-condition">
                    <span class="wc-icon">${weatherState.icon}</span>
                    <span class="wc-temp">${weatherState.temp}</span>
                    <span class="wc-desc">${weatherState.desc}</span>
                    <span class="wc-chevron"><svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M6 9l6 6 6-6"/></svg></span>
                  </div>`;
                pill.setAttribute('title', `Clima en ${weatherState.city}: ${weatherState.desc}, ${weatherState.temp}. Toca para ver pronóstico.`);
            }
            const popover = document.getElementById('weatherPopover');
            if (popover) {
                popover.innerHTML = renderWeatherPopoverContent();
            }
            if (typeof UI !== 'undefined' && UI.tab === 'today' && !UI.stack && typeof navTitle !== 'undefined' && navTitle) {
                navTitle.innerHTML = formatNavTitleToday();
            }
        }

        async function fetchLiveWeather() {
            try {
                let lat = -34.6037, lon = -58.3816; // Coordenadas iniciales de referencia
                let detectedCity = null;

                if (navigator.geolocation) {
                    try {
                        const pos = await new Promise((res, rej) => {
                            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3200 });
                        });
                        lat = pos.coords.latitude;
                        lon = pos.coords.longitude;

                        try {
                            const rev = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}&zoom=10&addressdetails=1`, { headers: { 'Accept-Language': 'es' } });
                            if (rev.ok) {
                                const revData = await rev.json();
                                detectedCity = revData.address?.city || revData.address?.town || revData.address?.municipality || revData.address?.village || revData.address?.county || revData.address?.state;
                            }
                        } catch (_) { }
                    } catch (_) { }
                }

                const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto';
                if (!detectedCity) {
                    detectedCity = getCityFromTimezone(tz);
                }

                const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation_probability,is_day&timezone=${encodeURIComponent(tz)}&forecast_days=2`;
                const res = await fetch(url);
                if (!res.ok) return;
                const data = await res.json();

                if (data && data.current) {
                    const t = Math.round(data.current.temperature_2m);
                    const appT = Math.round(data.current.apparent_temperature ?? t);
                    const isDay = data.current.is_day === 1;
                    const info = weatherCodeToInfo(data.current.weather_code, isDay);
                    const hum = data.current.relative_humidity_2m ? `${data.current.relative_humidity_2m}%` : '55%';
                    const wind = data.current.wind_speed_10m ? `${Math.round(data.current.wind_speed_10m)} km/h` : '10 km/h';

                    const hourlyList = [];
                    if (data.hourly && data.hourly.time && data.hourly.temperature_2m) {
                        const nowISO = new Date();
                        const currentHourStr = pad(nowISO.getHours()) + ':00';
                        const currentDayYMD = ymd(nowISO);

                        let startIdx = data.hourly.time.findIndex(timeStr => {
                            return timeStr.startsWith(currentDayYMD) && timeStr.endsWith(currentHourStr);
                        });
                        if (startIdx === -1) startIdx = 0;

                        const count = Math.min(16, data.hourly.time.length - startIdx);
                        for (let k = 0; k < count; k++) {
                            const idx = startIdx + k;
                            const rawTime = data.hourly.time[idx];
                            const hourPart = rawTime.split('T')[1]?.slice(0, 5) || rawTime;
                            const hTemp = Math.round(data.hourly.temperature_2m[idx]);
                            const hCode = data.hourly.weather_code ? data.hourly.weather_code[idx] : 0;
                            const hIsDay = data.hourly.is_day ? (data.hourly.is_day[idx] === 1) : true;
                            const hInfo = weatherCodeToInfo(hCode, hIsDay);
                            const pop = data.hourly.precipitation_probability ? data.hourly.precipitation_probability[idx] : 0;

                            hourlyList.push({
                                timeStr: k === 0 ? 'Ahora' : hourPart,
                                temp: `${hTemp}°`,
                                icon: hInfo.icon,
                                desc: hInfo.desc,
                                pop: pop || 0
                            });
                        }
                    }

                    weatherState = {
                        city: detectedCity,
                        temp: `${t}°C`,
                        feelsLike: `${appT}°C`,
                        desc: info.desc,
                        icon: info.icon,
                        humidity: hum,
                        wind: wind,
                        hourly: hourlyList,
                        time: Date.now(),
                        loaded: true
                    };

                    try { localStorage.setItem(WEATHER_KEY, JSON.stringify(weatherState)); } catch (_) { }
                    updateWeatherUI();
                }
            } catch (e) {
                console.warn('Clima en vivo no disponible:', e);
            }
        }
        fetchLiveWeather();
        setInterval(fetchLiveWeather, 15 * 60 * 1000); // Actualizar cada 15 min

        /* ================= Store (con sincronización a API REST Backend) ================= */
        const KEY = 'tempo.v1';
        const API_BASE = (window.location.protocol === 'http:' || window.location.protocol === 'https:') ? '' : 'http://127.0.0.1:8050';
        const api = {
            async getState() {
                const res = await fetch(`${API_BASE}/api/state`);
                if (!res.ok) throw new Error('Error al cargar datos del backend');
                return await res.json();
            },
            async saveItem(item) {
                const res = await fetch(`${API_BASE}/api/items/${encodeURIComponent(item.id)}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item)
                });
                if (!res.ok) throw new Error('Error al guardar ítem en el backend');
                return await res.json();
            },
            async patchItem(id, updates) {
                const res = await fetch(`${API_BASE}/api/items/${encodeURIComponent(id)}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates)
                });
                if (!res.ok) throw new Error('Error al actualizar ítem');
                return await res.json();
            },
            async toggleItem(id) {
                const res = await fetch(`${API_BASE}/api/items/${encodeURIComponent(id)}/toggle`, {
                    method: 'PATCH'
                });
                if (!res.ok) throw new Error('Error al cambiar estado');
                return await res.json();
            },
            async deleteItem(id) {
                const res = await fetch(`${API_BASE}/api/items/${encodeURIComponent(id)}`, {
                    method: 'DELETE'
                });
                if (!res.ok) throw new Error('Error al eliminar ítem');
                return await res.json();
            },
            async batchInsert(items) {
                const res = await fetch(`${API_BASE}/api/items/batch`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(items)
                });
                if (!res.ok) throw new Error('Error al restaurar ítems');
                return await res.json();
            },
            async saveList(list) {
                const res = await fetch(`${API_BASE}/api/lists`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(list)
                });
                if (!res.ok) throw new Error('Error al guardar lista');
                return await res.json();
            },
            async cleanList(listId) {
                const res = await fetch(`${API_BASE}/api/lists/${encodeURIComponent(listId)}/clean`, {
                    method: 'POST'
                });
                if (!res.ok) throw new Error('Error al vaciar artículos completados');
                return await res.json();
            },
            async reseed() {
                const res = await fetch(`${API_BASE}/api/reseed`, {
                    method: 'POST'
                });
                if (!res.ok) throw new Error('Error al restaurar datos semilla');
                return await res.json();
            }
        };
        let S;
        function seed() {
            return { items: [], lists: [] };
        }
        function sanitizeItems() {
            if (!S || !S.items) return;
            let changed = false;
            S.items.forEach(it => {
                if (it.gcalId || it.gcal) {
                    if (it.kind !== 'event') { it.kind = 'event'; changed = true; }
                    if (it.repeat) { delete it.repeat; changed = true; }
                    if (it.recurringEventId) { delete it.recurringEventId; changed = true; }
                } else if (it.kind === 'routine' && !it.repeat) {
                    it.kind = 'event';
                    changed = true;
                }
            });
            if (changed) save();
        }

        async function load() {
            try { const r = localStorage.getItem(KEY); if (r) { S = JSON.parse(r); } } catch (e) { }
            // Si el estado guardado tiene datos de mockup, limpiarlo
            if (S && S.items && S.items.some(i => i.id && (i.id.startsWith('e') || i.id.startsWith('t') || i.id.startsWith('r') || i.id.startsWith('b') || i.id.startsWith('w') || i.id.startsWith('s')) && !i.gcalId)) {
                S = seed(); save();
            }
            if (!S) S = seed();
            sanitizeItems();
            try {
                const remote = await api.getState();
                if (remote && remote.items && remote.lists) {
                    S = remote;
                    sanitizeItems();
                    save();
                    refreshAll();
                }
            } catch (err) {
                console.warn('Backend no conectado aún o en modo local:', err);
            }
        }
        function save() { try { localStorage.setItem(KEY, JSON.stringify(S)) } catch (e) { } }
        window._getS = () => S;  // getter siempre devuelve el S actual
        window._save = save;
        const byId = id => S.items.find(i => i.id === id);

        /* ================= Consultas ================= */
        function isItemDoneOn(it, ds = (UI.selDay || todayY())) {
            if (it.kind === 'routine' && it.repeat) {
                return Boolean(it.doneDates && it.doneDates.includes(ds));
            }
            return Boolean(it.done);
        }

        function isRoutineOnDay(it, ds, dayOfWeek) {
            const start = it.date || '1970-01-01';
            if (ds < start) return false;
            const r = (it.repeat || 'daily').toLowerCase();
            if (r === 'daily') return true;
            if (r === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
            if (r === 'weekends') return dayOfWeek === 0 || dayOfWeek === 6;
            if (r === 'mon' || r === 'monday' || r === '1') return dayOfWeek === 1;
            if (r === 'tue' || r === 'tuesday' || r === '2') return dayOfWeek === 2;
            if (r === 'wed' || r === 'wednesday' || r === '3') return dayOfWeek === 3;
            if (r === 'thu' || r === 'thursday' || r === '4') return dayOfWeek === 4;
            if (r === 'fri' || r === 'friday' || r === '5') return dayOfWeek === 5;
            if (r === 'sat' || r === 'saturday' || r === '6') return dayOfWeek === 6;
            if (r === 'sun' || r === 'sunday' || r === '0') return dayOfWeek === 0;
            if (r.includes(',')) {
                const parts = r.split(',').map(s => s.trim());
                const dayMap = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6 };
                return parts.some(p => dayMap[p] === dayOfWeek);
            }
            if (r === 'weekly') {
                const sObj = fromYmd(start);
                return dayOfWeek === sObj.getDay();
            }
            if (r === 'monthly') {
                const startDay = parseInt(start.split('-')[2]);
                const curDay = parseInt(ds.split('-')[2]);
                return startDay === curDay;
            }
            return it.date === ds;
        }

        function getRoutineLabel(repeat) {
            const r = (repeat || 'daily').toLowerCase();
            if (r === 'daily') return 'Todos los días';
            if (r === 'weekdays') return 'Lun a Vie';
            if (r === 'weekends') return 'Fines de semana';
            if (r === 'mon' || r === 'monday' || r === '1') return 'Cada lunes';
            if (r === 'tue' || r === 'tuesday' || r === '2') return 'Cada martes';
            if (r === 'wed' || r === 'wednesday' || r === '3') return 'Cada miércoles';
            if (r === 'thu' || r === 'thursday' || r === '4') return 'Cada jueves';
            if (r === 'fri' || r === 'friday' || r === '5') return 'Cada viernes';
            if (r === 'sat' || r === 'saturday' || r === '6') return 'Cada sábado';
            if (r === 'sun' || r === 'sunday' || r === '0') return 'Cada domingo';
            if (r.includes(',')) {
                const names = { mon: 'Lun', tue: 'Mar', wed: 'Mié', thu: 'Jue', fri: 'Vie', sat: 'Sáb', sun: 'Dom' };
                return r.split(',').map(s => names[s.trim()] || s).join(', ');
            }
            return 'Semanal';
        }

        const itemsOn = ds => {
            const mmdd = ds.slice(5);
            const dObj = fromYmd(ds);
            const dayOfWeek = dObj.getDay(); // 0 = Dom, 1 = Lun, ..., 6 = Sáb

            return S.items.filter(it => {
                if (it.kind === 'birthday') return it.date === mmdd;
                // Únicamente si es una rutina explícita con repetición configurada
                if (it.kind === 'routine' && it.repeat) {
                    return isRoutineOnDay(it, ds, dayOfWeek);
                }
                // Todo evento normal o ítem sin repetición SOLO aparece en su fecha fija
                return it.date === ds;
            });
        };
        const sortAgenda = (a, b) => {
            const ta = a.time || '99:99', tb = b.time || '99:99';
            return ta !== tb ? (ta < tb ? -1 : 1) : (a.kind === 'birthday' ? 1 : 0) - (b.kind === 'birthday' ? 1 : 0);
        };
        const dayKinds = ds => [...new Set(itemsOn(ds).map(i => i.kind))];
        const pendToday = () => itemsOn(todayY()).filter(i => hasCheck(i.kind));
        const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches' };
        const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

        /* ================= Estado Dinámico de Carga de Tareas del Día ================= */
        function getDayWorkloadStatus(evsCount = 0, pendTotal = 0, doneCount = 0, bdsCount = 0) {
            const remainingTasks = Math.max(0, pendTotal - doneCount);
            const totalRemaining = remainingTasks + evsCount;

            if (totalRemaining === 0) {
                return 'Hoy descansás';
            }

            if (totalRemaining <= 2) {
                return 'Hoy tenés un día tranquilo';
            }

            if (totalRemaining <= 5) {
                return 'Hoy tenés varias tareas por delante';
            }

            // totalRemaining >= 6
            return 'Hoy tenés un día cargado';
        }

        /* ================= Sistema de Temas (Día / Noche & Manual) ================= */
        const THEME_KEY = 'tempo.theme';
        const getThemePref = () => { try { return localStorage.getItem(THEME_KEY) || 'auto' } catch (e) { return 'auto' } };

        // Detección de día o noche según la hora local (Día: 07:00 a 19:30, Noche: 19:30 a 07:00)
        function isDayTimeNow() {
            const now = new Date();
            const mins = now.getHours() * 60 + now.getMinutes();
            return mins >= (7 * 60) && mins < (19 * 60 + 30);
        }

        function getEffectiveTheme(pref = getThemePref()) {
            if (pref === 'light') return 'light';
            if (pref === 'dark') return 'dark';
            // Modo 'auto': se ajusta dinámicamente según sea de día o de noche
            return isDayTimeNow() ? 'light' : 'dark';
        }

        function isDarkNow() {
            return getEffectiveTheme() === 'dark';
        }

        function updateThemeMeta() {
            let m = document.querySelector('meta[name="theme-color"]');
            if (!m) { m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); }
            m.setAttribute('content', isDarkNow() ? '#16121D' : '#FAF5EF');
        }

        function updateThemeButtonsUI() {
            const pref = getThemePref();
            const effective = getEffectiveTheme(pref);
            const isDay = isDayTimeNow();

            const descText = pref === 'auto'
                ? `Tema: Automático (${isDay ? 'Modo Día ☀️ activo · 07:00-19:30' : 'Modo Noche 🌙 activo · 19:30-07:00'})`
                : `Tema: ${pref === 'light' ? 'Claro ☀️ (Manual)' : 'Oscuro 🌙 (Manual)'}`;

            // 1. Botón de la barra superior de PC (ViewModeBar)
            const vmbBtn = document.getElementById('vmbBtnTheme');
            if (vmbBtn) {
                vmbBtn.innerHTML = ic(pref === 'auto' ? 'autoTheme' : (pref === 'light' ? 'sun' : 'moon'), 16, 2);
                vmbBtn.setAttribute('title', `${descText} — Toca para alternar`);
                vmbBtn.setAttribute('aria-label', descText);
            }

            // 2. Botón del sidebar de PC
            const pcBtn = document.getElementById('pcBtnTheme');
            if (pcBtn) {
                pcBtn.innerHTML = `${ic(pref === 'auto' ? 'autoTheme' : (pref === 'light' ? 'sun' : 'moon'), 15, 2)}<span>${pref === 'auto' ? 'Auto' : (pref === 'light' ? 'Claro' : 'Oscuro')}</span>`;
                pcBtn.setAttribute('title', descText);
            }

            // 3. Botón de la barra de navegación móvil (nav)
            const navBtn = document.getElementById('btnThemeNav');
            if (navBtn) {
                navBtn.innerHTML = ic(pref === 'auto' ? 'autoTheme' : (pref === 'light' ? 'sun' : 'moon'), 19, 1.9);
                navBtn.setAttribute('title', descText);
                navBtn.setAttribute('aria-label', descText);
            }

            // 4. Control segmentado de apariencia en la pestaña 'Listas'
            const segTheme = document.querySelector('.seg[data-theme-seg]');
            if (segTheme) {
                const idx = pref === 'light' ? 1 : (pref === 'dark' ? 2 : 0);
                segTheme.dataset.i = String(idx);
                segTheme.querySelectorAll('button').forEach(btn => {
                    const isSel = btn.dataset.v === pref;
                    btn.classList.toggle('on', isSel);
                    btn.setAttribute('aria-pressed', isSel ? 'true' : 'false');
                });
                const subLbl = document.getElementById('themeStatusLabel');
                if (subLbl) {
                    subLbl.textContent = pref === 'auto'
                        ? `Horario automático (${isDay ? '☀️ Día activo · 07:00 a 19:30' : '🌙 Noche activa · 19:30 a 07:00'})`
                        : `Ajuste manual (${pref === 'light' ? '☀️ Siempre claro' : '🌙 Siempre oscuro'})`;
                }
            }
        }

        function applyThemePref(v, saveStorage = true) {
            if (saveStorage) {
                try { localStorage.setItem(THEME_KEY, v) } catch (e) { }
            }
            const effective = getEffectiveTheme(v);
            document.documentElement.dataset.theme = effective;
            document.documentElement.dataset.themePref = v;
            updateThemeMeta();
            updateThemeButtonsUI();
        }

        // Revisión automática cada 30 segundos si está en modo automático
        setInterval(() => {
            if (getThemePref() === 'auto') {
                const currentEff = document.documentElement.dataset.theme;
                const newEff = getEffectiveTheme('auto');
                if (currentEff !== newEff) {
                    applyThemePref('auto', false);
                    toast(`Cambio horario: ${newEff === 'light' ? 'Modo Día ☀️ activado' : 'Modo Noche 🌙 activado'}`, { icon: newEff === 'light' ? 'sun' : 'moon' });
                } else {
                    updateThemeButtonsUI();
                }
            }
        }, 30000);

        window.addEventListener('focus', () => {
            if (getThemePref() === 'auto') {
                applyThemePref('auto', false);
            }
        });

        /* ================= Estado UI ================= */
        const UI = { tab: 'today', cursor: new Date(), selDay: todayY(), stack: null, calMode: 'month' };
        const $ = s => document.querySelector(s);
        const nav = $('#nav'), navTitle = $('#navTitle');
        const V = { today: $('#v-today'), calendar: $('#v-calendar'), lists: $('#v-lists'), detail: $('#v-detail') };
        const C = { today: $('#c-today'), calendar: $('#c-calendar'), lists: $('#c-lists'), detail: $('#c-detail') };

        function cleanBirthdayName(title) {
            if (!title) return '';
            let name = String(title).trim();
            // Quitar emoji de torta si ya viene incluido
            name = name.replace(/^🎂\s*/, '');
            // Quitar prefijos comunes de cumpleaños
            name = name.replace(/^cumpleaños\s*(de\s+la|del|de|:|-)?\s*/i, '');
            name = name.replace(/^cumple\s*(de\s+la|del|de|:|-)?\s*/i, '');
            // Quitar sufijos comunes
            name = name.replace(/\s*[\(\[-]?\s*cumpleaños\s*[\)\]]?\s*$/i, '');
            name = name.replace(/\s*[\(\[-]?\s*cumple\s*[\)\]]?\s*$/i, '');
            name = name.replace(/^🎂\s*/, '').replace(/\s*🎂$/, '').trim();
            return name || title;
        }

        /* ================= Filas ================= */
        function rowHTML(it, o = {}) {
            const curDay = o.ds || UI.selDay || todayY();
            const isDone = isItemDoneOn(it, curDay);
            const isBday = it.kind === 'birthday' || /cumpleaños|cumple/i.test(it.title);
            const cleanName = isBday ? cleanBirthdayName(it.title) : it.title;
            let titleDisplay = cleanName;

            let lead;
            if (hasCheck(it.kind)) {
                lead = `<button type="button" class="chk" data-act="toggle" data-id="${it.id}" aria-pressed="${isDone ? 'true' : 'false'}" aria-label="${isDone ? 'Desmarcar' : 'Completar'}: ${esc(it.title)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7.5"/></svg></button>`;
            } else if (it.kind === 'birthday' || isBday) {
                lead = `<span class="bav" style="--c:${kcol('birthday')};--cs:${ksoft('birthday')}" aria-hidden="true">🎂</span>`;
            } else {
                lead = `<span class="lead-dot" style="background:${kcol(it.kind)}" aria-hidden="true"></span>`;
            }
            const flag = (it.kind === 'task' && it.prio > 0 && !isDone) ? `<span style="width:16px;color:var(${it.prio === 2 ? '--red' : '--amber'});flex:none" aria-hidden="true">${ic('flag', 16, 2)}</span>` : '';
            const star = o.star ? `<button type="button" class="starb p${it.prio || 0}" data-act="star" data-id="${it.id}" aria-label="Prioridad: ${PRIO[it.prio || 0]}. Toca para cambiar.">${ic('star', 21, it.prio ? 2.2 : 1.8)}</button>` : '';
            const meta = o.meta || '';
            const chev = o.chev === false ? '' : `<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>`;
            return `<div class="row${isDone ? ' done' : ''}" data-id="${it.id}" data-kind="${it.kind}" style="--kc:${kcol(it.kind)};--kcs:${ksoft(it.kind)}">
    <div class="under u-l" aria-hidden="true">${ic('trash', 21)}</div>
    <div class="under u-r" aria-hidden="true">${ic('check', 21, 2.4)}</div>
    <div class="fg">${lead}<button type="button" class="tx" data-act="edit" data-id="${it.id}" aria-label="Editar: ${esc(it.title)}"><span class="t1">${esc(titleDisplay)}</span>${o.cap ? `<span class="t2">${o.cap}</span>` : ''}</button>${flag}${meta ? `<span class="meta${o.hot ? ' hot' : ''}">${meta}</span>` : ''}${star}${chev}</div>
  </div>`;
        }
        const emptyHTML = (icon, title, cap, actLabel = null, actKind = null) => {
            const btn = actLabel ? `<button type="button" class="empty-btn" data-act="open-composer" data-kind="${actKind || 'task'}"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg><span>${actLabel}</span></button>` : '';
            return `<div class="empty"><div class="eic" aria-hidden="true">${ic(icon, 25)}</div><b>${title}</b><p>${cap}</p>${btn}</div>`;
        };

        function getAlarmLabel(minutes) {
            if (minutes == null) return '';
            if (minutes === 0) return '🔔 A la hora';
            if (minutes < 60) return `🔔 ${minutes}m antes`;
            if (minutes === 60) return '🔔 1h antes';
            if (minutes < 1440) return `🔔 ${Math.round(minutes / 60)}h antes`;
            return '🔔 1d antes';
        }

        function itemRow(it, o = {}) {
            if (it.kind === 'event') {
                const meta = o.timeline ? '' : (it.time ? fmtTime(it.time) + (it.end ? ' – ' + fmtTime(it.end) : '') : 'Todo el día');
                let capText = o.when || '';
                if (it.location) {
                    capText = capText ? `${capText} · 📍 ${esc(it.location)}` : `📍 ${esc(it.location)}`;
                } else if (!capText && it.notes) {
                    capText = esc(it.notes);
                }
                return rowHTML(it, { meta, cap: capText, ds: o.ds });
            }
            if (it.kind === 'routine') {
                const repLabel = getRoutineLabel(it.repeat);
                const meta = (it.time ? fmtTime(it.time) + ' · ' : '') + repLabel;
                return rowHTML(it, { meta, cap: o.when || (it.notes ? esc(it.notes) : ''), ds: o.ds });
            }
            if (it.kind === 'reminder') {
                const alarmStr = getAlarmLabel(it.alarm);
                let meta = o.timeline ? '' : (it.time ? fmtTime(it.time) : '');
                if (alarmStr) {
                    meta = meta ? `${meta} · ${alarmStr}` : alarmStr;
                }
                let cp = o.when || '';
                if (it.location) {
                    cp = cp ? `${cp} · 📍 ${esc(it.location)}` : `📍 ${esc(it.location)}`;
                } else if (!cp && it.notes) {
                    cp = esc(it.notes);
                }
                const isDone = isItemDoneOn(it, o.ds || UI.selDay || todayY());
                const hot = !isDone && it.date && it.date < todayY();
                return rowHTML(it, { meta, cap: cp, hot, ds: o.ds });
            }
            if (it.kind === 'birthday') {
                const nb = nextBday(it);
                const meta = nb.days === 0 ? '¡hoy!' : nb.days === 1 ? 'mañana' : 'en ' + nb.days + ' d';
                const cp = (nb.turns != null ? `Cumple ${nb.turns} · ` : '') + cap(fShort.format(nb.next));
                return rowHTML(it, { meta, cap: cp, hot: nb.days <= 1, ds: o.ds });
            }
            if (it.kind === 'wish') {
                const meta = it.price ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(it.price) : '';
                return rowHTML(it, { meta, cap: PRIO[it.prio || 0], star: true, chev: false, ds: o.ds });
            }
            let meta = o.timeline ? '' : (it.time ? fmtTime(it.time) : '');
            let cp = o.when || '';
            if (it.kind === 'shopping') {
                cp = o.when || esc(S.lists.find(l => l.id === it.listId)?.name || 'Lista');
                meta = it.qty ? esc(it.qty) : '';
            } else if (!cp && it.notes) { cp = esc(it.notes); }
            const isDone = isItemDoneOn(it, o.ds || UI.selDay || todayY());
            const hot = !isDone && it.date && it.date < todayY();
            return rowHTML(it, { meta, cap: cp, hot, ds: o.ds });
        }

        function renderCalCellHtml(d, ds, monthName, y) {
            const isDesk = window.innerWidth >= 769 && !document.body.classList.contains('preview-mobile');
            const maxChips = isDesk ? 3 : 2;
            const items = itemsOn(ds).sort(sortAgenda);
            const dt = fromYmd(ds);
            const dayOfWeek = dt.getDay(); // 0 = Dom, 6 = Sáb
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const hol = getArgHoliday(ds);

            const cls = ['cal-c'];
            if (isWeekend) cls.push('is-weekend');
            if (hol) cls.push('is-holiday');
            if (ds === todayY()) cls.push('is-today');
            if (ds === UI.selDay) cls.push('is-sel');

            let chipsList = [];

            items.forEach(i => {
                const isBday = i.kind === 'birthday' || /cumpleaños|cumple/i.test(i.title);
                const c = kcol(isBday ? 'birthday' : i.kind);
                const cs = ksoft(isBday ? 'birthday' : i.kind);
                let titleText = i.title;
                if (isBday) {
                    const name = cleanBirthdayName(titleText);
                    titleText = `🎂 ${name}`;
                }
                chipsList.push(`<div class="cal-ev-chip" style="background:${cs};color:${c}" title="${esc(titleText)}${i.time ? ' ' + i.time : ''}">
                    <span class="ev-title">${esc(titleText)}</span>
                </div>`);
            });

            let chipsHtml = '';
            if (chipsList.length > 0) {
                const visible = chipsList.slice(0, maxChips);
                const extra = chipsList.length - maxChips;
                chipsHtml = `<div class="cal-events-list">` +
                    visible.join('') +
                    (extra > 0 ? `<div class="cal-ev-more">+${extra} más</div>` : '') +
                    `</div>`;
            }

            const nTotal = items.length;
            const holTitle = hol ? `${hol.name} (${hol.type === 'nolaborable' ? 'Día no laborable' : 'Feriado Nacional'})` : '';

            return `<button type="button" class="${cls.join(' ')}" data-act="selday" data-day="${ds}"
      title="${holTitle}"
      aria-label="${d} de ${monthName} de ${y}${hol ? `, ${hol.name}` : ''}${nTotal ? `, ${nTotal} elemento${nTotal > 1 ? 's' : ''}` : ''}"
      ${ds === UI.selDay ? 'aria-pressed="true"' : ''}${ds === todayY() ? ' aria-current="date"' : ''}>
      <div class="cal-top"><span class="cal-n">${d}</span></div>
      ${chipsHtml}
    </button>`;
        }

        function renderCalHeaderBar(mainTitle, mode) {
            return `<div class="cal-header-bar">
          <div class="cal-header-left">
            <button type="button" class="cal-nav-btn" data-act="calnav" data-d="-1" aria-label="Anterior">${ic('chevL', 18, 2.2)}</button>
            <span class="cal-title-main">${mainTitle}</span>
            <button type="button" class="cal-nav-btn" data-act="calnav" data-d="1" aria-label="Siguiente">${ic('chevR', 18, 2.2)}</button>
          </div>
          <div class="cal-view-selector" role="group" aria-label="Modo de vista del calendario">
            <button type="button" class="cal-mode-btn ${mode === 'month' ? 'on' : ''}" data-act="calmode" data-m="month">Mes</button>
            <button type="button" class="cal-mode-btn ${mode === 'week' ? 'on' : ''}" data-act="calmode" data-m="week">Semana</button>
            <button type="button" class="cal-mode-btn ${mode === 'day' ? 'on' : ''}" data-act="calmode" data-m="day">Día</button>
          </div>
        </div>`;
        }

        /* ================= Vista HOY ================= */
        function renderToday() {
            const T = todayY();
            const pend = pendToday(), doneN = pend.filter(i => i.done).length;
            const evs = itemsOn(T).filter(i => i.kind === 'event');
            const bds = itemsOn(T).filter(i => i.kind === 'birthday');

            // --- Calendario embebido ---
            const cur = UI.cursor, y = cur.getFullYear(), m = cur.getMonth();
            const monthName = cur.toLocaleDateString('es-ES', { month: 'long' });
            const mode = UI.calMode || 'month';

            let todayCalTitle = `${cap(monthName)} ${y}`;
            let cells = '';

            if (mode === 'week') {
                const weekDays = getWeekDays(cur);
                const first = weekDays[0], last = weekDays[6];
                const fMonth = cap(first.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''));
                const lMonth = cap(last.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''));
                todayCalTitle = `${first.getDate()} ${fMonth} – ${last.getDate()} ${lMonth} ${y}`;
                cells = weekDays.map(wDay => {
                    const ds = ymd(wDay);
                    return renderCalCellHtml(wDay.getDate(), ds, monthName, y);
                }).join('');
            } else if (mode === 'day') {
                todayCalTitle = cap(fLong.format(cur));
            } else {
                const off = (new Date(y, m, 1).getDay() + 6) % 7, dim = new Date(y, m + 1, 0).getDate();
                for (let i = 0; i < off; i++) cells += '<span class="cal-c empty"></span>';
                for (let d = 1; d <= dim; d++) {
                    const ds = ymd(new Date(y, m, d));
                    cells += renderCalCellHtml(d, ds, monthName, y);
                }
            }

            // --- Día seleccionado ---
            const ds = UI.selDay, list = [...itemsOn(ds)].sort(sortAgenda);
            const head = ds === todayY() ? 'Hoy' : (ds === ymd(addDays(new Date(), 1)) ? 'Mañana' : cap(fLong.format(fromYmd(ds))));
            const hol = getArgHoliday(ds);
            let holBanner = '';
            if (hol) {
                const isNolab = hol.type === 'nolaborable';
                const col = 'var(--green)';
                holBanner = `<div class="card" style="padding:12px 15px;margin-bottom:12px;display:flex;align-items:flex-start;gap:12px;background:color-mix(in srgb, ${col} 12%, var(--card));box-shadow:inset 0 0 0 1px color-mix(in srgb, ${col} 25%, transparent);border-radius:16px">
                    <span style="font-size:22px;line-height:1.2">🇦🇷</span>
                    <div style="flex:1">
                        <div style="font-size:var(--fs-sm);font-weight:700;color:${col};letter-spacing:.3px;text-transform:uppercase">${isNolab ? 'Día no laborable' : 'Feriado Nacional en Argentina'}</div>
                        <div style="font-size:var(--fs-md);font-weight:700;color:var(--label);margin-top:2px">${esc(hol.name)}</div>
                        ${hol.desc ? `<div style="font-size:var(--fs-sm2);color:var(--label2);margin-top:4px;line-height:1.4">${esc(hol.desc)}</div>` : ''}
                    </div>
                </div>`;
            }
            const agenda = list.length ? `${holBanner}<div class="card">${list.map(i => itemRow(i)).join('')}</div>`
                : `${holBanner}${emptyHTML('sparkle', 'Sin tareas ni eventos creados', 'Nada adicional previsto para esta fecha.', 'Añadir', 'event')}`;

            // --- Pendientes destacados ---
            const prioList = S.items.filter(i => !i.done && (i.prio === 2 || (i.kind === 'task' && i.date && i.date <= ymd(addDays(new Date(), 2))))).slice(0, 5);

            // --- Hero ring ---
            const CIRC = 2 * Math.PI * 40;
            const pct = pend.length ? doneN / pend.length : 0;
            const pctVal = Math.round(pct * 100);
            const isComplete = pend.length > 0 && doneN === pend.length;

            let ringT;
            if (pend.length === 0) {
                ringT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7.5"/></svg><span>al día</span>`;
            } else if (isComplete) {
                ringT = `<b class="pct-num" style="color:var(--green)">100%</b><span>hecho</span>`;
            } else {
                ringT = `<b class="pct-num">${pctVal}%</b><span>hecho</span>`;
            }

            const workloadText = getDayWorkloadStatus(evs.length, pend.length, doneN, bds.length);

            C.today.innerHTML = `
    <div class="today-header">
      <div class="today-header-left">
        <div class="today-date-eyebrow">${formatHeaderDate(new Date())}</div>
        <h1 class="large-day">${cap(fDayName.format(new Date()))}</h1>
      </div>
      <div class="weather-widget-wrap" id="weatherWrap">
        <button type="button" class="weather-card-btn" id="weatherPill" aria-haspopup="dialog" aria-expanded="false" title="Clima en ${esc(weatherState.city)}: ${weatherState.desc}, ${weatherState.temp}. Toca para ver pronóstico por hora.">
          <div class="wc-location">
            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 21s-6-5.33-6-10a6 6 0 1 1 12 0c0 4.67-6 10-6 10z"/><circle cx="12" cy="11" r="2.5"/></svg>
            <span>${esc(weatherState.city)}</span>
          </div>
          <div class="wc-condition">
            <span class="wc-icon">${weatherState.icon}</span>
            <span class="wc-temp">${weatherState.temp}</span>
            <span class="wc-desc">${weatherState.desc}</span>
            <span class="wc-chevron"><svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M6 9l6 6 6-6"/></svg></span>
          </div>
        </button>
        <div class="weather-popover" id="weatherPopover" role="dialog" aria-label="Pronóstico por hora en ${esc(weatherState.city)}">
          ${renderWeatherPopoverContent()}
        </div>
      </div>
    </div>
    <div class="today-dual" style="margin-top:14px">
      <div class="today-main-col">
        <div class="card hero">
          <div class="hero-l">
            <div class="hi">${greeting()}</div>
            <div class="hd">${esc(workloadText)}</div>
            <div class="hstats">
              <div class="hs"><b style="color:${kcol('event')}">${evs.length}</b><span>${evs.length === 1 ? 'evento' : 'eventos'}</span></div>
              <div class="hs"><b style="color:${kcol('task')}">${pend.length - doneN}</b><span>pendientes</span></div>
              <div class="hs"><b style="color:${kcol('birthday')}">${bds.length}</b><span>cumpleaños</span></div>
            </div>
          </div>
          <div class="hero-r">
            <svg class="ring${isComplete ? ' complete' : ''}" viewBox="0 0 96 96" aria-hidden="true"><circle class="rbg" cx="48" cy="48" r="40"/><circle class="rfg" cx="48" cy="48" r="40" stroke-dasharray="${CIRC.toFixed(1)}" stroke-dashoffset="${(CIRC * (1 - pct)).toFixed(1)}"/></svg>
            <div class="ring-t" role="img" aria-label="${pend.length ? `${pctVal}% completado (${doneN} de ${pend.length} tareas)` : 'Al día, sin tareas pendientes'}">${ringT}</div>
          </div>
        </div>

        <!-- Calendario embebido en Hoy -->
        <div style="margin-top:16px">
          ${renderCalHeaderBar(todayCalTitle, mode)}
          ${mode !== 'day' ? `
          <div class="calw">
            <div class="calh" aria-hidden="true">${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => `<span>${d}</span>`).join('')}</div>
            <div class="calg">${cells}</div>
          </div>` : ''}
        </div>

        <!-- Items del día seleccionado -->
        <div class="cal-day-header" style="margin-top:18px">
          <div class="sech" style="margin:0">${head}</div>
          <button type="button" class="cal-add-btn" data-act="add-to-day" data-day="${ds}" title="Añadir a esta fecha">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>
            <span>Añadir</span>
          </button>
        </div>
        <div style="margin-top:6px">${agenda}</div>
      </div>
      <div class="today-side-col">
        <div class="sech">Pendientes destacados</div>
        ${prioList.length ? `<div class="card">${prioList.map(i => itemRow(i, { when: i.date ? fmtRel(i.date) : '' })).join('')}</div>` : emptyHTML('check', 'Al día', 'No tienes tareas urgentes pendientes.', 'Nueva tarea', 'task')}
      </div>
    </div>`;
        }


        /* ================= Vista CALENDARIO ================= */
        function renderCalendar() {
            const cur = UI.cursor, y = cur.getFullYear(), m = cur.getMonth();
            const monthName = cur.toLocaleDateString('es-ES', { month: 'long' });
            const mode = UI.calMode || 'month';

            let mainTitle = `${cap(monthName)} ${y}`;
            let cells = '';

            if (mode === 'week') {
                const weekDays = getWeekDays(cur);
                const first = weekDays[0], last = weekDays[6];
                const fMonth = cap(first.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''));
                const lMonth = cap(last.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''));
                mainTitle = `${first.getDate()} ${fMonth} – ${last.getDate()} ${lMonth} ${y}`;
                cells = weekDays.map(wDay => {
                    const ds = ymd(wDay);
                    return renderCalCellHtml(wDay.getDate(), ds, monthName, y);
                }).join('');
            } else if (mode === 'day') {
                mainTitle = cap(fLong.format(cur));
            } else {
                const off = (new Date(y, m, 1).getDay() + 6) % 7, dim = new Date(y, m + 1, 0).getDate();
                for (let i = 0; i < off; i++) cells += '<span class="cal-c empty"></span>';
                for (let d = 1; d <= dim; d++) {
                    const ds = ymd(new Date(y, m, d));
                    cells += renderCalCellHtml(d, ds, monthName, y);
                }
            }

            const ds = UI.selDay, list = [...itemsOn(ds)].sort(sortAgenda);
            const head = ds === todayY() ? 'Hoy' : (ds === ymd(addDays(new Date(), 1)) ? 'Mañana' : cap(fLong.format(fromYmd(ds))));
            const hol = getArgHoliday(ds);
            let holBanner = '';
            if (hol) {
                const isNolab = hol.type === 'nolaborable';
                const col = 'var(--green)';
                holBanner = `<div class="card" style="padding:12px 15px;margin-bottom:12px;display:flex;align-items:flex-start;gap:12px;background:color-mix(in srgb, ${col} 12%, var(--card));box-shadow:inset 0 0 0 1px color-mix(in srgb, ${col} 25%, transparent);border-radius:16px">
                    <span style="font-size:22px;line-height:1.2">🇦🇷</span>
                    <div style="flex:1">
                        <div style="font-size:var(--fs-sm);font-weight:700;color:${col};letter-spacing:.3px;text-transform:uppercase">${isNolab ? 'Día no laborable' : 'Feriado Nacional en Argentina'}</div>
                        <div style="font-size:var(--fs-md);font-weight:700;color:var(--label);margin-top:2px">${esc(hol.name)}</div>
                        ${hol.desc ? `<div style="font-size:var(--fs-sm2);color:var(--label2);margin-top:4px;line-height:1.4">${esc(hol.desc)}</div>` : ''}
                    </div>
                </div>`;
            }
            const agenda = list.length ? `${holBanner}<div class="card">${list.map(i => itemRow(i)).join('')}</div>`
                : `${holBanner}${emptyHTML('sparkle', 'Sin tareas ni eventos creados', 'Nada adicional previsto para esta fecha.', 'Añadir a este día', 'event')}`;

            C.calendar.innerHTML = `
    <div class="cal-split">
      <div class="cal-pane-left">
        ${renderCalHeaderBar(mainTitle, mode)}
        ${mode !== 'day' ? `
        <div class="calw">
          <div class="calh" aria-hidden="true">${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => `<span>${d}</span>`).join('')}</div>
          <div class="calg">${cells}</div>
        </div>` : ''}
      </div>
      <div class="cal-pane-right">
        <div class="cal-day-header">
          <div class="sech" style="margin:0">${head}</div>
          <button type="button" class="cal-add-btn" data-act="add-to-day" data-day="${ds}" title="Añadir a esta fecha">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>
            <span>Añadir</span>
          </button>
        </div>
        <div style="margin-top:6px">${agenda}</div>
      </div>
    </div>`;
        }

        /* ================= Vista LISTAS ================= */
        function collRow(icon, cols, name, sub, act, kind, id) {
            return `<div class="row coll"><button type="button" class="fg" data-act="${act}"${kind ? ` data-kind="${kind}"` : ''}${id ? ` data-id="${id}"` : ''}>
    <span class="sq" style="--c:${cols.c};--cs:${cols.cs}" aria-hidden="true">${ic(icon, 18)}</span>
    <span class="tx"><span class="t1">${esc(name)}</span></span>
    <span class="cnt">${sub}</span>
    <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
  </button></div>`;
        }
        function renderLists() {
            const pend = k => S.items.filter(i => i.kind === k && !i.done).length;
            const kc = k => ({ c: kcol(k), cs: ksoft(k) });
            const shopRows = S.lists.map(l => {
                const p = palOf(l.color);
                const n = S.items.filter(i => i.kind === 'shopping' && i.listId === l.id && !i.done).length;
                return collRow('cart', p, l.name, n ? `${n} por comprar` : 'Al día', 'open', 'shopping', l.id);
            }).join('');
            const pref = getThemePref();
            const effective = getEffectiveTheme(pref);
            const isDay = isDayTimeNow();
            const idx = pref === 'light' ? 1 : (pref === 'dark' ? 2 : 0);
            const statusNote = pref === 'auto'
                ? `Horario automático (${isDay ? '☀️ Día activo · 07:00 a 19:30' : '🌙 Noche activa · 19:30 a 07:00'})`
                : `Ajuste manual (${pref === 'light' ? '☀️ Siempre claro' : '🌙 Siempre oscuro'})`;

            C.lists.innerHTML = `
    <h1 class="large">Listas y Colecciones</h1>
    <div class="lists-desktop-grid" style="margin-top:14px">
      <div class="lists-col">
        <div class="sech">Organización</div>
        <div class="card coll">
          ${collRow('repeat', kc('routine'), 'Rutinas', S.items.filter(i => i.kind === 'routine').length + ' activas', 'open', 'routine')}
          ${collRow('bell', kc('reminder'), 'Recordatorios', pend('reminder') ? `${pend('reminder')} pendientes` : 'Al día', 'open', 'reminder')}
          ${collRow('check', kc('task'), 'Pendientes', pend('task') ? `${pend('task')} abiertos` : 'Al día', 'open', 'task')}
          ${collRow('gift', kc('birthday'), 'Cumpleaños', S.items.filter(i => i.kind === 'birthday').length + ' guardados', 'open', 'birthday')}
          ${collRow('star', kc('wish'), 'Deseos', S.items.filter(i => i.kind === 'wish' && !i.done).length + ' por conseguir', 'open', 'wish')}
        </div>
      </div>
      <div class="lists-col">
        <div class="sech">Listas de compra</div>
        <div class="card coll">${shopRows}
          <div class="row coll"><button type="button" class="fg" data-act="newlist">
            <span class="sq link" aria-hidden="true">${ic('plus', 18, 2.2)}</span>
            <span class="tx"><span class="t1 link">Nueva lista</span></span></button></div>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:24px;padding:12px 14px;display:flex;flex-direction:column;gap:10px">
      <div style="display:flex;align-items:center;gap:12px;width:100%">
        <span class="sq" style="--c:${kcol('wish')};--cs:${ksoft('wish')}" aria-hidden="true">${ic(pref === 'auto' ? 'autoTheme' : (effective === 'light' ? 'sun' : 'moon'), 18)}</span>
        <div style="flex:1;display:flex;flex-direction:column">
          <span style="font-size: var(--fs-base);font-weight:600;color:var(--label)">Apariencia y Modo</span>
          <span id="themeStatusLabel" style="font-size:12px;color:var(--label3)">${statusNote}</span>
        </div>
      </div>
      <div class="seg" data-theme-seg="true" data-i="${idx}" style="margin:2px 0 0;width:100%" role="group" aria-label="Selector de tema">
        <div class="thumb" aria-hidden="true"></div>
        <button type="button" data-act="theme" data-v="auto" class="${pref === 'auto' ? 'on' : ''}" aria-pressed="${pref === 'auto' ? 'true' : 'false'}">🌗 Auto</button>
        <button type="button" data-act="theme" data-v="light" class="${pref === 'light' ? 'on' : ''}" aria-pressed="${pref === 'light' ? 'true' : 'false'}">☀️ Claro</button>
        <button type="button" data-act="theme" data-v="dark" class="${pref === 'dark' ? 'on' : ''}" aria-pressed="${pref === 'dark' ? 'true' : 'false'}">🌙 Oscuro</button>
      </div>
    </div>
    <div class="card" style="margin-top:10px">
      <div class="row coll"><button type="button" class="fg" id="gcalConnectBtn" data-act="gcal-connect">
        <span class="sq" style="--c:#4285F4;--cs:rgba(66,133,244,.15)" aria-hidden="true">
          <svg viewBox="0 0 18 18" width="18" height="18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 6.294C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
        </span>
        <span class="tx"><span class="t1" id="gcalBtnLabel">Conectar Google Calendar</span><span class="t2" id="gcalBtnSub">Sincroniza tus eventos automáticamente</span></span>
      </button></div>
      <div class="row coll"><button type="button" class="fg" data-act="reseed">
        <span class="sq link" aria-hidden="true">${ic('reset', 17)}</span>
        <span class="tx"><span class="t1 link">Restaurar datos de ejemplo</span></span></button></div>
    </div>
    <p class="capfield" style="text-align:center;margin-top:14px">Toca el círculo para completar · desliza → para eliminar · toca una fila para editarla</p>`;
            if (window._updateGCalUI) window._updateGCalUI();
        }

        /* ================= Vista DETALLE ================= */
        function groupLabel(ds) {
            if (ds === todayY()) return 'Hoy';
            if (ds === ymd(addDays(new Date(), 1))) return 'Mañana';
            if (ds < todayY()) return 'Vencidos';
            return cap(fLong.format(fromYmd(ds)));
        }
        function renderDetail() {
            const st = UI.stack; if (!st) return;
            let html = '', title = '';
            const all = S.items;
            if (st.kind === 'routine') {
                title = 'Rutinas';
                const list = all.filter(i => i.kind === 'routine').sort((a, b) => (a.time || '99:99') < (b.time || '99:99') ? -1 : 1);
                html = `<div class="dhead"><span class="dt"><b>${list.length}</b> ${list.length === 1 ? 'rutina activa' : 'rutinas activas'}</span></div>
        ${list.length ? `<div class="card">${list.map(i => itemRow(i)).join('')}</div>` : emptyHTML('repeat', 'Sin rutinas creadas', 'Crea tareas o eventos que se repitan periódicamente para mantener tus hábitos al día.')}
        <p class="capfield" style="margin-top:12px">Las rutinas se repiten automáticamente en los días indicados y aparecen con color coral en el calendario.</p>`;
            }
            else if (st.kind === 'task' || st.kind === 'reminder') {
                const k = st.kind; title = KIND[k].label;
                const open = all.filter(i => i.kind === k && !i.done), done = all.filter(i => i.kind === k && i.done);
                const groups = {};
                open.sort((a, b) => (a.date || '9999') < (b.date || '9999') ? -1 : (a.date > (b.date || '9999') ? 1 : (a.time || '99') > (b.time || '99') ? 1 : -1))
                    .forEach(i => { (groups[i.date || 'sin fecha'] = groups[i.date || 'sin fecha'] || []).push(i) });
                const secs = Object.keys(groups).sort().map(g => `
      <div class="sech">${g === 'sin fecha' ? 'Algún día' : groupLabel(g)}</div>
      <div class="card">${groups[g].map(i => itemRow(i)).join('')}</div>`).join('');
                html = `<div class="dhead"><span class="dt"><b>${open.length}</b> ${open.length === 1 ? 'pendiente' : 'pendientes'} de <b>${open.length + done.length}</b></span></div>
      ${open.length ? secs : emptyHTML(KIND[k].icon, 'Nada pendiente', 'Todo despejado. Toca + para añadir uno nuevo.')}
      ${done.length ? `<div class="sech">Completados · ${done.length}</div><div class="card grpdone">${done.sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0)).map(i => itemRow(i)).join('')}</div>` : ''}
      <p class="capfield" style="margin-top:12px">Toca el círculo para completar · desliza hacia la izquierda para eliminar</p>`;
            }
            else if (st.kind === 'birthday') {
                title = 'Cumpleaños';
                const list = S.items.filter(i => i.kind === 'birthday').map(b => ({ b, ...nextBday(b) })).sort((a, b) => a.days - b.days);
                html = `${list.length ? `<div class="card">${list.map(x => itemRow(x.b)).join('')}</div>` : emptyHTML('gift', 'Sin cumpleaños', 'Guarda los cumpleaños importantes y nunca llegues tarde con el regalo.')}
    <p class="capfield" style="margin-top:12px">Se ordenan por fecha más cercana. Desliza una fila hacia la izquierda para eliminarla.</p>`;
            }
            else if (st.kind === 'wish') {
                title = 'Deseos';
                const open = all.filter(i => i.kind === 'wish' && !i.done).sort((a, b) => (b.prio || 0) - (a.prio || 0));
                const done = all.filter(i => i.kind === 'wish' && i.done);
                html = `${open.length ? `<div class="card">${open.map(i => itemRow(i)).join('')}</div>` : emptyHTML('star', 'Tu lista de deseos', 'Apunta lo que te apetezca con prioridad y precio. Toca la estrella para cambiarla.')}
      ${done.length ? `<div class="sech">Conseguidos · ${done.length}</div><div class="card grpdone">${done.map(i => itemRow(i)).join('')}</div>` : ''}
      <p class="capfield" style="margin-top:12px">La estrella cicla la prioridad: baja → media → alta.</p>`;
            }
            else if (st.kind === 'shopping') {
                const l = S.lists.find(x => x.id === st.id) || { name: 'Lista', color: 'salvia' };
                title = l.name; const p = palOf(l.color);
                const open = all.filter(i => i.kind === 'shopping' && i.listId === l.id && !i.done);
                const done = all.filter(i => i.kind === 'shopping' && i.listId === l.id && i.done);
                const tot = open.length + done.length, pct = tot ? done.length / tot : 0;
                html = `<div class="dhead"><span class="dt"><b>${open.length}</b> por comprar · <b>${done.length}</b> en la cesta</span>
        <div class="prog"><i style="width:${(pct * 100).toFixed(0)}%;background:${p.c}"></i></div></div>
      ${open.length ? `<div class="card" style="margin-top:12px">${open.map(i => itemRow(i)).join('')}</div>` : emptyHTML('cart', 'Cesta vacía', 'Añade lo que necesites con el botón +.')}
      ${done.length ? `<div class="sech">Comprado · ${done.length}<button type="button" class="act" data-act="cleanlist" data-id="${l.id}" aria-label="Vaciar artículos comprados">Vaciar</button></div><div class="card grpdone">${done.map(i => itemRow(i)).join('')}</div>` : ''}`;
            }
            C.detail.innerHTML = `<h1 class="large">${esc(title)}</h1>${html}`;
        }

        /* ================= Navegación ================= */
        function renderView(tab) {
            if (tab === 'today') renderToday(); else if (tab === 'calendar') renderCalendar(); else if (tab === 'lists') renderLists(); else renderDetail();
        }
        function formatNavTitleToday(d = new Date()) {
            const rawDay = fWk.format(d).replace('.', '');
            const dayName = cap(rawDay);
            const dayNum = d.getDate();
            const rawMonth = d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
            const month = cap(rawMonth);
            const icon = weatherState.icon || '☀️';
            const tempShort = (weatherState.temp || '22°C').replace(/C$/i, '');
            return `<span class="nt-date">${dayName}, ${dayNum} de ${month}</span><span class="nt-sep">·</span><span class="nt-weather"><span class="nt-icon">${icon}</span> <span>${tempShort}</span></span>`;
        }
        function syncNav() {
            $('#btnBack').classList.toggle('show', !!UI.stack);
            if (UI.stack) {
                navTitle.textContent = detailTitle(UI.stack);
            } else if (UI.tab === 'today') {
                navTitle.innerHTML = formatNavTitleToday();
            } else {
                navTitle.textContent = '';
            }
            const curScroll = (V[UI.tab] && V[UI.tab].scrollTop) || 0;
            nav.classList.toggle('solid', !!UI.stack || curScroll > 12);
        }
        function detailTitle(st) {
            if (st.kind === 'shopping') return S.lists.find(l => l.id === st.id)?.name || 'Lista';
            return KIND[st.kind].label;
        }
        function setTab(tab) {
            UI.tab = tab; UI.stack = null;
            $('#v-detail').classList.remove('open');
            Object.entries(V).forEach(([k, v]) => { if (k !== 'detail') v.classList.toggle('on', k === tab) });
            renderView(tab);
            const v = V[tab]; v.classList.remove('anim'); void v.offsetWidth; v.classList.add('anim');
            document.querySelectorAll('[data-tab]').forEach(b => {
                const on = b.dataset.tab === tab; b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false');
            });
            syncNav(); v.scrollTop = 0;
            renderSidebar();
        }
        function openDetail(kind, id) {
            UI.stack = { kind, id }; renderDetail();
            $('#v-detail').classList.add('open'); V.detail.scrollTop = 0; syncNav();
        }
        function popDetail() { $('#v-detail').classList.remove('open'); UI.stack = null; syncNav(); }
        function refreshAll() {
            window._refreshAll = refreshAll; // exponer siempre actualizado
            renderView(UI.tab);
            if (UI.stack) renderDetail();
            if (SS.classList.contains('open')) renderSearch();
            renderSidebar();
        }
        function renderSidebar() {
            const sbBadge = $('#pcBadgeToday');
            if (sbBadge) {
                const pend = pendToday().filter(i => !i.done).length;
                sbBadge.textContent = pend;
                sbBadge.style.display = pend > 0 ? 'inline-block' : 'none';
            }
            const sbLists = $('#pcSidebarLists');
            if (sbLists) {
                const shopLists = S.lists.map(l => {
                    const count = S.items.filter(i => i.kind === 'shopping' && i.listId === l.id && !i.done).length;
                    const p = palOf(l.color);
                    return `<button type="button" class="pc-sub-item" data-act="open" data-kind="shopping" data-id="${l.id}">
                        <span class="pc-sub-dot" style="background:${p.c}"></span>
                        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(l.name)}</span>
                        ${count ? `<span class="pc-sub-count">${count}</span>` : ''}
                    </button>`;
                }).join('');
                const bdayCount = S.items.filter(i => i.kind === 'birthday').length;
                const wishCount = S.items.filter(i => i.kind === 'wish' && !i.done).length;
                const routineCount = S.items.filter(i => i.kind === 'routine').length;
                const specialLists = `
                    <button type="button" class="pc-sub-item" data-act="open" data-kind="routine">
                        <span class="pc-sub-dot" style="background:${kcol('routine')}"></span>
                        <span style="flex:1">Rutinas</span>
                        ${routineCount ? `<span class="pc-sub-count">${routineCount}</span>` : ''}
                    </button>
                    <button type="button" class="pc-sub-item" data-act="open" data-kind="birthday">
                        <span class="pc-sub-dot" style="background:${kcol('birthday')}"></span>
                        <span style="flex:1">Cumpleaños</span>
                        ${bdayCount ? `<span class="pc-sub-count">${bdayCount}</span>` : ''}
                    </button>
                    <button type="button" class="pc-sub-item" data-act="open" data-kind="wish">
                        <span class="pc-sub-dot" style="background:${kcol('wish')}"></span>
                        <span style="flex:1">Deseos</span>
                        ${wishCount ? `<span class="pc-sub-count">${wishCount}</span>` : ''}
                    </button>
                `;
                sbLists.innerHTML = shopLists + specialLists;
            }
        }

        /* ================= Acciones ================= */
        function toggleDone(rowEl) {
            const it = byId(rowEl.dataset.id); if (!it) return;
            const curDay = UI.selDay || todayY();
            if (it.kind === 'routine' || it.repeat) {
                it.doneDates = it.doneDates || [];
                const idx = it.doneDates.indexOf(curDay);
                if (idx >= 0) {
                    it.doneDates.splice(idx, 1);
                } else {
                    it.doneDates.push(curDay);
                }
                it.done = it.doneDates.includes(todayY());
            } else {
                it.done = !it.done;
                if (it.done) it.doneAt = Date.now(); else delete it.doneAt;
            }
            save();
            api.toggleItem(it.id).catch(e => console.warn('Sync toggle fallo:', e));
            const isDoneNow = isItemDoneOn(it, curDay);
            rowEl.classList.toggle('done', isDoneNow);
            const chk = rowEl.querySelector('.chk');
            if (chk) chk.setAttribute('aria-pressed', isDoneNow ? 'true' : 'false');
            rowEl.classList.add('popping'); setTimeout(() => rowEl.classList.remove('popping'), 380);
            clearTimeout(toggleDone._t); toggleDone._t = setTimeout(refreshAll, 430);
        }
        function delItem(id, rowEl) {
            const idx = S.items.findIndex(i => i.id === id); if (idx < 0) return;
            const item = S.items[idx];
            // Bloquear eliminación de eventos importados de Google Calendar
            if (item.gcalId || item.gcal) {
                toast('Eliminá este evento desde Google Calendar', { icon: 'bell' });
                if (rowEl) { rowEl.style.transform = ''; rowEl.classList.remove('dragging'); }
                return;
            }
            const [removed] = S.items.splice(idx, 1); save();
            api.deleteItem(id).catch(e => console.warn('Sync delete fallo:', e));
            if (rowEl) {
                rowEl.classList.add('slideout');
                setTimeout(() => {
                    rowEl.style.height = rowEl.offsetHeight + 'px'; void rowEl.offsetHeight;
                    rowEl.classList.add('gone'); rowEl.style.height = '0px';
                    setTimeout(refreshAll, 240);
                }, 170);
            } else refreshAll();
            toast(`«${removed.title}» eliminado`, {
                icon: 'trash',
                action: 'Deshacer',
                onAction() {
                    S.items.push(removed);
                    save();
                    api.batchInsert([removed]).catch(e => console.warn('Sync deshacer fallo:', e));
                    refreshAll();
                }
            });
        }
        function cleanDone(listId) {
            const rem = S.items.filter(i => i.kind === 'shopping' && i.listId === listId && i.done);
            if (!rem.length) return;
            S.items = S.items.filter(i => !(i.kind === 'shopping' && i.listId === listId && i.done)); save();
            api.cleanList(listId).catch(e => console.warn('Sync clean fallo:', e));
            refreshAll();
            toast(`${rem.length} artículos vaciados`, {
                icon: 'trash',
                action: 'Deshacer',
                onAction() {
                    S.items.push(...rem);
                    save();
                    api.batchInsert(rem).catch(e => console.warn('Sync deshacer vaciar fallo:', e));
                    refreshAll();
                }
            });
        }
        function cycleStar(id, btn) {
            const it = byId(id); if (!it) return;
            it.prio = ((it.prio || 0) + 1) % 3; save();
            api.patchItem(id, { prio: it.prio }).catch(e => console.warn('Sync prio fallo:', e));
            btn.className = `starb p${it.prio}`;
            btn.innerHTML = ic('star', 21, it.prio ? 2.2 : 1.8);
            btn.setAttribute('aria-label', `Prioridad: ${PRIO[it.prio]}. Toca para cambiar.`);
            const capEl = btn.closest('.fg').querySelector('.t2');
            if (capEl) capEl.textContent = PRIO[it.prio];
        }

        /* ================= Toast ================= */
        let toastTimer = null;
        function toast(msg, { icon = 'check', action, onAction } = {}) {
            window._toast = toast;
            const w = $('#toasts'); w.innerHTML = '';
            const t = document.createElement('div'); t.className = 'toast';
            t.innerHTML = `${ic(icon, 17, icon === 'check' ? 2.6 : 1.9)}<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action)}</button>` : ''}`;
            if (action) t.querySelector('button').onclick = () => { onAction && onAction(); t.classList.remove('in'); setTimeout(() => t.remove(), 350) };
            w.appendChild(t); requestAnimationFrame(() => t.classList.add('in'));
            clearTimeout(toastTimer);
            toastTimer = setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 350) }, 3400);
        }

        /* ================= Sheet (crear / editar) ================= */
        const SW = $('#sheetwrap'), sheet = $('#sheet'), sheetBody = $('#sheetBody'), shTitle = $('#shTitle'), shDone = $('#shDone');
        let composer = { kind: 'task', editing: null, pick: false, ctx: {} };
        let lastFocus = null;

        const segHTML = (name, opts, sel) => {
            const i = opts.findIndex(o => String(o.v) === String(sel));
            return `<div class="seg" data-name="${name}" data-i="${i < 0 ? 0 : i}" role="group" aria-label="${name === 'prio' ? 'Prioridad' : 'Opciones'}"><div class="thumb" aria-hidden="true"></div>
    ${opts.map(o => `<button type="button" data-v="${o.v}" aria-pressed="${String(o.v) === String(sel) ? 'true' : 'false'}" class="${String(o.v) === String(sel) ? 'on' : ''}">${o.label}</button>`).join('')}</div>`;
        };
        const typePicker = cur => `<div class="tps">${Object.entries(KIND).map(([k, v]) => `
  <button type="button" class="tp ${k === cur ? 'on' : ''}" data-tp="${k}" aria-pressed="${k === cur ? 'true' : 'false'}" style="--c:${kcol(k)};--cs:${ksoft(k)}">
    <span class="tpi" aria-hidden="true">${ic(v.icon, 18)}</span><span>${v.label}</span></button>`).join('')}</div>`;

        function fieldsHTML(kind, it, ctx) {
            const dateVal = kind === 'birthday'
                ? (it ? `${it.year || 2000}-${it.date}` : '')
                : (it ? it.date : (ctx.date || todayY()));
            let f = '';
            if (kind === 'event') {
                const isAllDay = it ? (!it.time && !it.end) : false;
                f += `
    <div class="fgroup">
      <div class="frow"><label for="fd-date">Fecha</label><input type="date" id="fd-date" name="date" value="${dateVal}"></div>
      <div class="frow">
        <label for="fd-allday" style="cursor:pointer">Todo el día</label>
        <label class="switch-wrap" for="fd-allday">
          <input type="checkbox" id="fd-allday" name="allday" ${isAllDay ? 'checked' : ''} aria-label="Todo el día">
          <span class="switch-slider" aria-hidden="true"></span>
        </label>
      </div>
      <div class="frow ${isAllDay ? 'is-disabled' : ''}" id="row-from"><label for="fd-time">Desde</label><input type="time" id="fd-time" name="time" value="${it?.time || ''}" ${isAllDay ? 'disabled' : ''}></div>
      <div class="frow ${isAllDay ? 'is-disabled' : ''}" id="row-end"><label for="fd-end">Hasta</label><input type="time" id="fd-end" name="end" value="${it?.end || ''}" ${isAllDay ? 'disabled' : ''}></div>
      <div class="frow"><label for="fd-loc">Ubicación</label><input type="text" id="fd-loc" name="location" placeholder="Lugar o dirección (opcional)" value="${esc(it?.location || '')}" autocomplete="off"></div>
    </div>`;
            }
            else if (kind === 'reminder') {
                const alarmVal = it?.alarm != null ? String(it.alarm) : '';
                f += `
    <div class="fgroup">
      <div class="frow"><label for="fd-date">Fecha</label><input type="date" id="fd-date" name="date" value="${dateVal}"></div>
      <div class="frow"><label for="fd-time">Hora</label><input type="time" id="fd-time" name="time" value="${it?.time || ''}"></div>
      <div class="frow">
        <label for="fd-alarm">Aviso / Alarma</label>
        <select id="fd-alarm" name="alarm" class="fselect" aria-label="Aviso o alarma">
          <option value="" ${alarmVal === '' ? 'selected' : ''}>Sin aviso</option>
          <option value="0" ${alarmVal === '0' ? 'selected' : ''}>A la hora exacta</option>
          <option value="5" ${alarmVal === '5' ? 'selected' : ''}>5 minutos antes</option>
          <option value="10" ${alarmVal === '10' ? 'selected' : ''}>10 minutos antes</option>
          <option value="15" ${alarmVal === '15' ? 'selected' : ''}>15 minutos antes</option>
          <option value="30" ${alarmVal === '30' ? 'selected' : ''}>30 minutos antes</option>
          <option value="60" ${alarmVal === '60' ? 'selected' : ''}>1 hora antes</option>
          <option value="120" ${alarmVal === '120' ? 'selected' : ''}>2 horas antes</option>
          <option value="1440" ${alarmVal === '1440' ? 'selected' : ''}>1 día antes</option>
        </select>
      </div>
      <div class="frow"><label for="fd-loc">Ubicación</label><input type="text" id="fd-loc" name="location" placeholder="Lugar o dirección (opcional)" value="${esc(it?.location || '')}" autocomplete="off"></div>
    </div>`;
            }
            else if (kind === 'routine') {
                const rep = it?.repeat || 'daily';
                const isDaily = rep === 'daily';
                const curDay = !isDaily ? rep : 'mon';
                f += `
    <div class="fgroup">
      <div class="frow"><label for="fd-date">Comienza el</label><input type="date" id="fd-date" name="date" value="${dateVal}"></div>
      <div class="frow"><label for="fd-time">Hora</label><input type="time" id="fd-time" name="time" value="${it?.time || ''}"></div>
    </div>
    <div class="frow" style="padding-top:2px"><span style="flex:none;width:100%;padding:0;font-size: var(--fs-md);font-weight:600">Repetición</span></div>
    <div class="routine-freq-wrap" id="routineFreqWrap">
      <div class="routine-mode-seg" role="group" aria-label="Frecuencia de la rutina">
        <button type="button" class="r-mode-btn ${isDaily ? 'on' : ''}" data-mode="daily" aria-pressed="${isDaily ? 'true' : 'false'}">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" style="margin-right:6px;vertical-align:-2px"><path d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"/></svg>Todos los días
        </button>
        <button type="button" class="r-mode-btn ${!isDaily ? 'on' : ''}" data-mode="specific" aria-pressed="${!isDaily ? 'true' : 'false'}">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" style="margin-right:6px;vertical-align:-2px"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>Día específico
        </button>
      </div>
      <div class="routine-days-container" id="routineDaysContainer" style="display:${isDaily ? 'none' : 'block'}">
        <div class="routine-days-label">Elegí el día en que se repite:</div>
        <div class="routine-days-grid" id="routineDaysGrid">
          ${[
            { d: 'mon', label: 'L', full: 'Lunes' },
            { d: 'tue', label: 'M', full: 'Martes' },
            { d: 'wed', label: 'X', full: 'Miércoles' },
            { d: 'thu', label: 'J', full: 'Jueves' },
            { d: 'fri', label: 'V', full: 'Viernes' },
            { d: 'sat', label: 'S', full: 'Sábado' },
            { d: 'sun', label: 'D', full: 'Domingo' }
          ].map(day => `
            <button type="button" class="r-day-chip ${curDay === day.d ? 'on' : ''}" data-day="${day.d}" aria-pressed="${curDay === day.d ? 'true' : 'false'}" title="${day.full}">
              <span class="r-day-letter">${day.label}</span>
              <span class="r-day-sub">${day.full.slice(0, 3)}</span>
            </button>
          `).join('')}
        </div>
      </div>
    </div>`;
            }
            else if (kind === 'task') f += `
    <div class="fgroup">
      <div class="frow"><label for="fd-date">Fecha</label><input type="date" id="fd-date" name="date" value="${dateVal}"></div>
      <div class="frow"><label for="fd-time">Hora</label><input type="time" id="fd-time" name="time" value="${it?.time || ''}"></div>
    </div>
    <div class="frow" style="padding-top:2px"><span class="frow" style="flex:none;width:100%;padding:0;font-size: var(--fs-md)">Prioridad</span></div>
    ${segHTML('prio', PRIO.map((l, v) => ({ v, label: l })), it?.prio ?? 0)}`;
            else if (kind === 'birthday') f += `
    <div class="fgroup">
      <div class="frow"><label for="fd-date">Fecha de nacimiento</label><input type="date" id="fd-date" name="date" value="${dateVal}"></div>
    </div>
    <div class="capfield">La edad se calcula automáticamente con el año de la fecha.</div>`;
            else if (kind === 'wish') f += `
    <div class="fgroup">
      <div class="frow"><label for="fd-price">Precio (€)</label><input type="number" id="fd-price" name="price" inputmode="decimal" min="0" step="0.01" placeholder="0" value="${it?.price ?? ''}"></div>
    </div>
    <div class="frow" style="padding-top:2px"><span style="flex:none;width:100%;padding:0;font-size: var(--fs-md)">Prioridad</span></div>
    ${segHTML('prio', ['Algún día', 'Me interesa', 'Lo quiero'].map((l, v) => ({ v, label: l })), it?.prio ?? 0)}`;
            else if (kind === 'shopping') {
                const sel = it?.listId || ctx.listId || S.lists[0]?.id;
                f += `<div class="frow" style="padding-bottom:4px"><span style="flex:none;width:100%;padding:0;font-size: var(--fs-md)">Lista</span></div>
      <div class="chips" role="group" aria-label="Lista de compra">${S.lists.map(l => { const p = palOf(l.color); return `<button type="button" class="chip ${l.id === sel ? 'on' : ''}" data-lid="${l.id}" aria-pressed="${l.id === sel ? 'true' : 'false'}" style="--c:${p.c};--cs:${p.cs}"><i aria-hidden="true"></i>${esc(l.name)}</button>` }).join('')}</div>
      <div class="fgroup" style="margin-top:12px">
        <div class="frow"><label for="fd-qty">Cantidad</label><input type="text" id="fd-qty" name="qty" inputmode="text" placeholder="1 kg, ×2…" value="${it?.qty || ''}"></div>
      </div>`;
            }
            if (kind !== 'wish') f += `<div class="fgroup"><textarea class="notes" name="notes" id="fd-notes" rows="3" aria-label="Notas" placeholder="Notas (opcional)">${it?.notes ? esc(it.notes) : ''}</textarea></div>`;
            return f;
        }
        function openComposer(kind, editing, ctx = {}) {
            lastFocus = document.activeElement;
            composer = { kind, editing: editing || null, pick: !editing && !ctx.fixedKind, ctx };
            buildSheet(); SW.classList.add('open');
        }
        function buildSheet() {
            const { kind, editing, pick, ctx } = composer;
            shTitle.textContent = editing ? `Editar ${KIND[kind].label.toLowerCase()}` : (pick ? 'Nuevo' : `Nuevo ${KIND[kind].label.toLowerCase()}`);
            shDone.textContent = editing ? 'Guardar' : 'Añadir';
            sheetBody.innerHTML = (pick ? typePicker(kind) : '') +
                `<div class="fgroup" style="margin-top:${pick ? '12px' : '0'}"><input class="biginp" id="fd-title" name="title" aria-label="Título" placeholder="${kind === 'birthday' ? 'Nombre de la persona' : kind === 'wish' ? '¿Qué deseas?' : kind === 'shopping' ? '¿Qué hay que comprar?' : kind === 'routine' ? 'Nombre de la rutina' : 'Título'}" value="${editing ? esc(editing.title) : ''}" autocomplete="off"></div>` +
                fieldsHTML(kind, editing, ctx) +
                (editing ? `<button type="button" class="ghost" data-act="delcurrent"><span>Eliminar ${KIND[kind].label.toLowerCase()}</span></button>` : '');
            if (!editing) setTimeout(() => sheetBody.querySelector('[name=title]')?.focus(), 380);
        }
        sheetBody.addEventListener('change', e => {
            if (e.target && e.target.id === 'fd-allday') {
                const checked = e.target.checked;
                const timeInp = sheetBody.querySelector('#fd-time');
                const endInp = sheetBody.querySelector('#fd-end');
                const rowFrom = sheetBody.querySelector('#row-from');
                const rowEnd = sheetBody.querySelector('#row-end');
                if (timeInp) timeInp.disabled = checked;
                if (endInp) endInp.disabled = checked;
                if (rowFrom) rowFrom.classList.toggle('is-disabled', checked);
                if (rowEnd) rowEnd.classList.toggle('is-disabled', checked);
            }
        });
        sheetBody.addEventListener('click', e => {
            const tp = e.target.closest('[data-tp]');
            if (tp) {
                const keep = sheetBody.querySelector('[name=title]')?.value || '';
                composer.kind = tp.dataset.tp; buildSheet();
                const inp = sheetBody.querySelector('[name=title]'); if (inp) inp.value = keep;
                sheetBody.querySelectorAll('.tp').forEach(b => b.setAttribute('aria-pressed', b === tp ? 'true' : 'false'));
                return;
            }
            const rMode = e.target.closest('.r-mode-btn');
            if (rMode) {
                const seg = rMode.closest('.routine-mode-seg');
                if (seg) {
                    seg.querySelectorAll('.r-mode-btn').forEach(b => {
                        b.classList.remove('on');
                        b.setAttribute('aria-pressed', 'false');
                    });
                }
                rMode.classList.add('on');
                rMode.setAttribute('aria-pressed', 'true');
                const isDaily = rMode.dataset.mode === 'daily';
                const cont = sheetBody.querySelector('#routineDaysContainer');
                if (cont) cont.style.display = isDaily ? 'none' : 'block';
                return;
            }
            const rDay = e.target.closest('.r-day-chip');
            if (rDay) {
                sheetBody.querySelectorAll('.r-day-chip').forEach(b => {
                    b.classList.remove('on');
                    b.setAttribute('aria-pressed', 'false');
                });
                rDay.classList.add('on');
                rDay.setAttribute('aria-pressed', 'true');
                return;
            }
            const seg = e.target.closest('.seg button');
            if (seg) {
                const s = seg.closest('.seg');
                s.querySelectorAll('button').forEach(b => { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false') });
                seg.classList.add('on'); seg.setAttribute('aria-pressed', 'true');
                s.dataset.i = [...s.children].slice(1).indexOf(seg);
                return;
            }
            const chip = e.target.closest('.chip');
            if (chip) {
                sheetBody.querySelectorAll('.chip').forEach(c => { c.classList.remove('on'); c.setAttribute('aria-pressed', 'false') });
                chip.classList.add('on'); chip.setAttribute('aria-pressed', 'true');
            }
        });
        function closeSheet() {
            if (!SW.classList.contains('open')) return;
            SW.classList.add('closing'); SW.classList.remove('open'); sheet.style.transform = '';
            setTimeout(() => SW.classList.remove('closing'), 320);
            if (lastFocus) { try { lastFocus.focus() } catch (e) { } lastFocus = null; }
        }
        function saveComposer() {
            const { kind, editing } = composer;
            const fd = {}; sheetBody.querySelectorAll('[name]').forEach(i => fd[i.name] = i.value);
            const fail = el => { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); el.focus() };
            const title = (fd.title || '').trim();
            if (!title) return fail(sheetBody.querySelector('[name=title]'));
            if (kind === 'birthday' && !fd.date) return fail(sheetBody.querySelector('[name=date]'));
            const segVal = n => sheetBody.querySelector(`.seg[data-name="${n}"] .on`)?.dataset.v;
            let it = editing || { id: (crypto.randomUUID ? crypto.randomUUID() : 'i' + Date.now() + Math.random()), done: false, createdAt: Date.now() };
            it.kind = kind; it.title = title;
            if (kind === 'birthday') { it.date = fd.date.slice(5); it.year = Number(fd.date.slice(0, 4)) || null; }
            else {
                it.date = fd.date || todayY();
                if (kind === 'event') {
                    const isAllDay = sheetBody.querySelector('#fd-allday')?.checked;
                    if (isAllDay) {
                        it.time = '';
                        it.end = '';
                    } else {
                        it.time = fd.time || '';
                        it.end = fd.end || '';
                    }
                    it.location = (fd.location || '').trim();
                    it.notes = fd.notes || '';
                }
                else if (kind === 'routine') {
                    it.time = fd.time || '';
                    const rMode = sheetBody.querySelector('.r-mode-btn.on')?.dataset.mode || 'daily';
                    if (rMode === 'daily') {
                        it.repeat = 'daily';
                    } else {
                        it.repeat = sheetBody.querySelector('.r-day-chip.on')?.dataset.day || 'mon';
                    }
                    it.notes = fd.notes || '';
                }
                else if (kind === 'task') { it.time = fd.time || ''; it.prio = Number(segVal('prio') || 0); it.notes = fd.notes || ''; }
                else if (kind === 'reminder') {
                    it.time = fd.time || '';
                    it.alarm = fd.alarm !== '' && fd.alarm != null ? Number(fd.alarm) : null;
                    it.location = (fd.location || '').trim();
                    it.notes = fd.notes || '';
                }
            }
            if (kind === 'wish') { it.price = fd.price ? parseFloat(fd.price) : null; it.prio = Number(segVal('prio') || 0); }
            if (kind === 'shopping') { it.listId = sheetBody.querySelector('.chip.on')?.dataset.lid || S.lists[0]?.id; it.qty = fd.qty || ''; }
            if (!editing) S.items.push(it);
            save(); closeSheet();
            api.saveItem(it).catch(e => console.warn('Sync save item fallo:', e));
            if (window.gcalPushItem && (it.kind === 'event' || it.kind === 'birthday' || it.kind === 'routine')) {
                window.gcalPushItem(it);
            }
            toast(editing ? 'Cambios guardados' : `${KIND[kind].label} añadido`);
            refreshAll();
        }
        function contextualAdd() {
            const date = UI.tab === 'calendar' ? UI.selDay : todayY();
            if (UI.stack) {
                const k = UI.stack.kind;
                if (k === 'shopping') return openComposer('shopping', null, { listId: UI.stack.id, fixedKind: true });
                if (k === 'birthday') return openComposer('birthday', null, { fixedKind: true });
                if (k === 'routine') return openComposer('routine', null, { date, fixedKind: true });
                return openComposer(k, null, { date, fixedKind: true });
            }
            openComposer(UI.tab === 'calendar' ? 'event' : 'task', null, { date });
        }

        /* ---- Nueva lista ---- */
        function openNewList() {
            lastFocus = document.activeElement;
            composer = { kind: '__newlist', editing: null, pick: false, ctx: {} };
            shTitle.textContent = 'Nueva lista'; shDone.textContent = 'Crear';
            sheetBody.innerHTML = `
    <div class="fgroup"><input class="biginp" name="lname" aria-label="Nombre de la lista" placeholder="Nombre de la lista" autocomplete="off"></div>
    <div class="frow" style="padding-top:2px"><span style="flex:none;width:100%;padding:0;font-size: var(--fs-md)">Color</span></div>
    <div class="swatches" role="group" aria-label="Color de la lista">${Object.entries(PALETTE).map(([key, p], i) => `
      <button type="button" class="sw ${i === 0 ? 'on' : ''}" data-c="${key}" aria-pressed="${i === 0 ? 'true' : 'false'}" aria-label="Color ${p.name}" style="--c:${p.c};--cs:${p.cs}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P.check}</svg></button>`).join('')}</div>`;
            SW.classList.add('open');
            setTimeout(() => sheetBody.querySelector('[name=lname]')?.focus(), 380);
        }
        sheetBody.addEventListener('click', e => {
            const sw = e.target.closest('.sw'); if (!sw) return;
            sheetBody.querySelectorAll('.sw').forEach(x => { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false') });
            sw.classList.add('on'); sw.setAttribute('aria-pressed', 'true');
        });
        function saveNewList() {
            const inp = sheetBody.querySelector('[name=lname]');
            const name = (inp.value || '').trim();
            if (!name) { inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); inp.focus(); return; }
            const color = sheetBody.querySelector('.sw.on')?.dataset.c || 'salvia';
            const newList = { id: 'sl' + Date.now(), name, color };
            S.lists.push(newList); save();
            api.saveList(newList).catch(e => console.warn('Sync save list fallo:', e));
            closeSheet(); toast(`Lista «${name}» creada`);
            refreshAll();
        }

        /* ---- Arrastre de la hoja para cerrar ---- */
        (function () {
            let d = null;
            function down(e) {
                if (!SW.classList.contains('open')) return;
                if (window.innerWidth > 768 && !document.body.classList.contains('preview-mobile')) return;
                d = { y: e.clientY, dy: 0 }; sheet.style.transition = 'none';
            }
            function move(e) { if (!d) return; d.dy = Math.max(0, e.clientY - d.y); sheet.style.transform = `translateY(${d.dy}px)`; }
            function up() {
                if (!d) return; const dy = d.dy; d = null; sheet.style.transition = '';
                if (dy > 120) closeSheet(); else sheet.style.transform = '';
            }
            [$('#sheetHead'), $('#grabber')].forEach(el => el.addEventListener('pointerdown', e => { down(e); try { el.setPointerCapture(e.pointerId) } catch (_) { } }));
            document.addEventListener('pointermove', move);
            document.addEventListener('pointerup', up);
            document.addEventListener('pointercancel', () => { d = null; sheet.style.transform = ''; });
        })();

        /* ================= Búsqueda con Filtros y Resaltado ================= */
        const SS = $('#searchScreen'), sInput = $('#sInput'), sRes = $('#sRes'), sHint = $('#sHint'), sFilters = $('#sFilters');
        const norm = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        let searchFilter = 'all';

        function highlightMatch(text, query) {
            if (!query || !text) return esc(text);
            const raw = String(text);
            const nRaw = norm(raw);
            const nQ = norm(query);
            const idx = nRaw.indexOf(nQ);
            if (idx === -1) return esc(raw);
            const before = esc(raw.slice(0, idx));
            const match = esc(raw.slice(idx, idx + query.length));
            const after = esc(raw.slice(idx + query.length));
            return `${before}<mark class="sh-mark">${match}</mark>${after}`;
        }

        function openSearch() { SS.classList.add('open'); renderSearch(); setTimeout(() => sInput.focus(), 250); }
        function closeSearch() { SS.classList.remove('open'); sInput.value = ''; sInput.blur(); }

        function renderSearch() {
            const rawQ = sInput.value.trim();
            const q = norm(rawQ);
            sHint.style.display = q ? 'none' : 'flex';
            if (!q) { sRes.innerHTML = ''; return; }
            let hits = S.items.filter(i => norm(i.title).includes(q) || norm(i.notes).includes(q) || norm(i.location).includes(q));
            if (searchFilter !== 'all') {
                hits = hits.filter(i => i.kind === searchFilter);
            }
            if (!hits.length) {
                sRes.innerHTML = emptyHTML('search', 'Sin resultados', `Nada coincide con «${esc(rawQ)}»${searchFilter !== 'all' ? ' en esta categoría' : ''}.`, 'Crear entrada', searchFilter !== 'all' ? searchFilter : 'task');
                return;
            }
            const byKind = {}; hits.forEach(i => (byKind[i.kind] = byKind[i.kind] || []).push(i));
            sRes.innerHTML = Object.entries(byKind).map(([k, arr]) => {
                const rows = arr.map(i => {
                    let when = '';
                    if (i.kind === 'birthday') { const nb = nextBday(i); when = nb.days === 0 ? '¡Hoy!' : `En ${nb.days} días`; }
                    else if (i.date) when = cap(fmtRel(i.date)) + (i.time ? ' · ' + fmtTime(i.time) : '');
                    const row = itemRow(i, { when });
                    return row.replace(`<span class="t1">${esc(i.title)}</span>`, `<span class="t1">${highlightMatch(i.title, rawQ)}</span>`);
                }).join('');
                return `<div class="sech">${KIND[k].label} · ${arr.length}</div><div class="card">${rows}</div>`;
            }).join('');
        }
        sInput.addEventListener('input', renderSearch);
        sFilters?.addEventListener('click', e => {
            const chip = e.target.closest('.s-chip');
            if (!chip) return;
            searchFilter = chip.dataset.filter || 'all';
            sFilters.querySelectorAll('.s-chip').forEach(c => c.classList.toggle('on', c === chip));
            renderSearch();
        });

        /* ================= Swipe en filas ================= */
        let sw = null, swiped = false;
        $('#views').addEventListener('pointerdown', e => {
            const fg = e.target.closest('.row .fg'); if (!fg) return;
            const row = fg.parentElement;
            if (!row.dataset.id) return;
            sw = { row, fg, x: e.clientX, y: e.clientY, dx: 0, cap: false, canR: hasCheck(row.dataset.kind) };
        });
        document.addEventListener('pointermove', e => {
            if (!sw) return;
            const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
            if (!sw.cap) {
                if (Math.abs(dx) < 7 && Math.abs(dy) < 7) return;
                if (Math.abs(dy) > Math.abs(dx)) { sw = null; return; }
                sw.cap = true; swiped = true; sw.fg.classList.add('dragging');
                try { sw.fg.setPointerCapture(e.pointerId) } catch (_) { }
            }
            const M = 88; let v = dx;
            if (dx < -M) v = -M + (dx + M) * .28;
            if (dx > M) v = M + (dx - M) * .28;
            if (dx > 0 && !sw.canR) v = dx * .15;
            sw.dx = v; sw.fg.style.transform = `translateX(${v}px)`;
        });
        function endSwipe(commit) {
            if (!sw) return; const { fg, row, dx, canR } = sw;
            if (!sw.cap) { sw = null; return; }
            sw = null; fg.classList.remove('dragging'); fg.style.transition = 'transform .32s var(--spring)';
            if (commit && dx < -62) { fg.style.transform = ''; delItem(row.dataset.id, row); }
            else if (commit && dx > 62 && canR) { fg.style.transform = ''; toggleDone(row); }
            else fg.style.transform = '';
            setTimeout(() => { swiped = false }, 60);
        }
        document.addEventListener('pointerup', () => endSwipe(true));
        document.addEventListener('pointercancel', () => {
            if (sw && sw.cap) { sw.fg.classList.remove('dragging'); sw.fg.style.transform = ''; }
            sw = null; setTimeout(() => { swiped = false }, 60);
        });

        /* ================= Clicks globales ================= */
        document.addEventListener('click', e => {
            if (swiped) { swiped = false; return; }

            // Manejo de la píldora de clima y popover de pronóstico por hora
            const pillBtn = e.target.closest('#weatherPill');
            const wrap = document.getElementById('weatherWrap');
            if (pillBtn && wrap) {
                const isOpen = wrap.classList.toggle('open');
                pillBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                return;
            } else if (wrap && !e.target.closest('#weatherWrap')) {
                wrap.classList.remove('open');
                wrap.querySelector('#weatherPill')?.setAttribute('aria-expanded', 'false');
            }

            const act = e.target.closest('[data-act]');
            if (act) {
                const a = act.dataset.act, id = act.dataset.id;
                if (a === 'toggle') { const r = act.closest('.row'); if (r) toggleDone(r); return; }
                if (a === 'edit') { const it = byId(id); if (it) openComposer(it.kind, it); return; }
                if (a === 'goto') { UI.selDay = act.dataset.day; UI.cursor = fromYmd(act.dataset.day); setTab('calendar'); return; }
                if (a === 'selday') {
                    UI.selDay = act.dataset.day;
                    if (UI.tab === 'today') renderToday(); else renderCalendar();
                    return;
                }
                if (a === 'calmode') {
                    UI.calMode = act.dataset.m || 'month';
                    if (UI.tab === 'today') renderToday(); else renderCalendar();
                    return;
                }
                if (a === 'calnav') {
                    const d = Number(act.dataset.d);
                    const mode = UI.calMode || 'month';
                    if (d === 0) {
                        UI.cursor = new Date();
                        UI.selDay = todayY();
                    } else if (mode === 'week') {
                        UI.cursor = addDays(UI.cursor, d * 7);
                        UI.selDay = ymd(UI.cursor);
                    } else if (mode === 'day') {
                        UI.cursor = addDays(UI.cursor, d);
                        UI.selDay = ymd(UI.cursor);
                    } else {
                        UI.cursor.setMonth(UI.cursor.getMonth() + d);
                    }
                    if (UI.tab === 'today') renderToday(); else renderCalendar();
                    return;
                }
                if (a === 'add-to-day') {
                    openComposer('event', null, { date: act.dataset.day });
                    return;
                }
                if (a === 'open-composer') {
                    openComposer(act.dataset.kind || 'task');
                    return;
                }
                if (a === 'open') { openDetail(act.dataset.kind, id); return; }
                if (a === 'newlist') { openNewList(); return; }
                if (a === 'cleanlist') { cleanDone(id); return; }
                if (a === 'star') { cycleStar(id, act); return; }
                if (a === 'delcurrent') { if (composer.editing) { const did = composer.editing.id; closeSheet(); setTimeout(() => delItem(did, null), 160); } return; }
                if (a === 'reseed') {
                    api.reseed().then(state => {
                        S = state; save(); refreshAll();
                        toast('Datos de ejemplo restaurados en backend', { icon: 'reset' });
                    }).catch(err => {
                        S = seed(); save(); refreshAll();
                        toast('Datos de ejemplo restaurados (local)', { icon: 'reset' });
                    });
                    return;
                }
                if (a === 'theme') { applyThemePref(act.dataset.v); if (UI.tab === 'lists') renderLists(); return; }
                return;
            }
            if (e.target.closest('#btnBack')) { popDetail(); return; }
            const weatherBtn = e.target.closest('#weatherPill');
            if (weatherBtn) {
                const wrap = document.getElementById('weatherWrap');
                if (wrap) {
                    const isOpen = wrap.classList.toggle('open');
                    weatherBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                }
                return;
            }
            if (!e.target.closest('#weatherWrap')) {
                const wrap = document.getElementById('weatherWrap');
                if (wrap && wrap.classList.contains('open')) {
                    wrap.classList.remove('open');
                    document.getElementById('weatherPill')?.setAttribute('aria-expanded', 'false');
                }
            }
            const tab = e.target.closest('[data-tab]');
            if (tab) { setTab(tab.dataset.tab); return; }
            const row = e.target.closest('.row');
            if (row && row.dataset.id) { const it = byId(row.dataset.id); if (it) openComposer(it.kind, it); }
        });
        $('#scrim').addEventListener('click', closeSheet);
        $('#shCancel').addEventListener('click', closeSheet);
        $('#shDone').addEventListener('click', () => { composer.kind === '__newlist' ? saveNewList() : saveComposer(); });
        function toggleAppTheme() {
            const cur = getThemePref();
            let next;
            if (cur === 'auto') next = 'light';
            else if (cur === 'light') next = 'dark';
            else next = 'auto';

            applyThemePref(next);
            const isDay = isDayTimeNow();
            if (next === 'auto') {
                toast(`Tema automático: ${isDay ? 'Modo Día (07:00 - 19:30)' : 'Modo Noche (19:30 - 07:00)'}`, { icon: isDay ? 'sun' : 'moon' });
            } else if (next === 'light') {
                toast('Tema Claro activado manualmente', { icon: 'sun' });
            } else {
                toast('Tema Oscuro activado manualmente', { icon: 'moon' });
            }
        }
        $('#btnAdd').addEventListener('click', contextualAdd);
        $('#btnSearch').addEventListener('click', openSearch);
        $('#btnSCancel').addEventListener('click', closeSearch);
        $('#btnThemeNav')?.addEventListener('click', toggleAppTheme);

        /* ================= Control de Modo de Visualización (Móvil / PC) ================= */
        const VIEW_PREF_KEY = 'tempo_view_preference';
        const PHONE_W_KEY = 'tempo_phone_width';

        function setPhoneWidth(widthPx) {
            document.documentElement.style.setProperty('--phone-w', widthPx + 'px');
            localStorage.setItem(PHONE_W_KEY, widthPx);
            document.querySelectorAll('.vmb-pill').forEach(btn => {
                btn.classList.toggle('on', btn.dataset.w === String(widthPx));
            });
        }

        function isMobileDevice() {
            return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }

        function setViewMode(mode) {
            const isMobile = mode === 'mobile';
            if (!isMobileDevice()) {
                document.body.classList.toggle('preview-mobile', isMobile);
            } else {
                document.body.classList.remove('preview-mobile');
            }
            localStorage.setItem(VIEW_PREF_KEY, mode);

            // Actualizar botones de la barra superior
            $('#vmbBtnMobile')?.classList.toggle('on', isMobile);
            $('#vmbBtnPc')?.classList.toggle('on', !isMobile);

            fit();
        }

        $('#vmbBtnMobile')?.addEventListener('click', () => {
            setViewMode('mobile');
            toast('Vista móvil activada (tamaño real)');
        });
        $('#vmbBtnPc')?.addEventListener('click', () => {
            setViewMode('pc');
            toast('Vista de escritorio activada');
        });
        document.querySelectorAll('.vmb-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                setPhoneWidth(Number(btn.dataset.w));
                toast(`Ancho de teléfono: ${btn.dataset.w}px`);
            });
        });
        $('#vmbBtnTheme')?.addEventListener('click', toggleAppTheme);

        /* Controles de barra lateral de escritorio */
        $('#pcBtnAdd')?.addEventListener('click', contextualAdd);
        $('#pcBtnSearch')?.addEventListener('click', openSearch);
        $('#pcBtnTheme')?.addEventListener('click', toggleAppTheme);
        $('#pcBtnPreviewMobile')?.addEventListener('click', () => {
            const nextMode = document.body.classList.contains('preview-mobile') ? 'pc' : 'mobile';
            setViewMode(nextMode);
            toast(nextMode === 'mobile' ? 'Vista móvil activada' : 'Vista de escritorio restaurada');
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                if (SW.classList.contains('open')) closeSheet();
                else if (SS.classList.contains('open')) closeSearch();
                return;
            }
            const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
            if (!inInput) {
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                    e.preventDefault();
                    openSearch();
                } else if (e.key.toLowerCase() === 'n' && !SW.classList.contains('open') && !SS.classList.contains('open')) {
                    e.preventDefault();
                    contextualAdd();
                }
            }
        });
        $('#views').addEventListener('scroll', () => {
            const curScroll = V[UI.tab] ? V[UI.tab].scrollTop : 0;
            nav.classList.toggle('solid', !!UI.stack || curScroll > 12);
        }, true);

        /* ================= Reloj y escala ================= */
        function tick() { $('#sbClock').textContent = new Intl.DateTimeFormat('es-ES', { hour: 'numeric', minute: '2-digit' }).format(new Date()) }
        tick(); setInterval(tick, 20000);
        function fit() {
            // Se mantiene a escala real 1:1 para que nunca se vea más pequeño de lo que debería
            $('#phone').style.removeProperty('--s');
        }
        /* ================= Calibración de Altura de Pantalla Móvil y Detección PWA ================= */
        function setAppHeight() {
            const h = window.innerHeight;
            document.documentElement.style.setProperty('--app-height', `${h}px`);
            const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
            document.documentElement.classList.toggle('is-standalone', isStandalone);
            document.body.classList.toggle('is-standalone', isStandalone);
        }
        window.addEventListener('resize', setAppHeight);
        window.addEventListener('orientationchange', setAppHeight);
        window.addEventListener('DOMContentLoaded', setAppHeight);
        setAppHeight();

        /* ================= Init ================= */
        applyThemePref(getThemePref());
        const isMob = isMobileDevice();
        const savedView = isMob ? 'mobile' : (localStorage.getItem(VIEW_PREF_KEY) || 'pc');
        const savedW = localStorage.getItem(PHONE_W_KEY) || '420';
        setPhoneWidth(Number(savedW));
        setViewMode(savedView);

        load().finally(() => {
            setTab('today');
            window._refreshAll = refreshAll; // asegurar exposición post-load
            // Si GCal ya tiene token (de sesión anterior), sincronizar ahora que S está listo
            if (window.gcalSync) window.gcalSync();
        });

(() => {
        const GCAL_CLIENT_ID = '768868441599-5oitrcmaqpifaspoi1b6g5231gnb8d8h.apps.googleusercontent.com';
        const GCAL_SCOPE = 'https://www.googleapis.com/auth/calendar';
        const GCAL_TOKEN_KEY = 'tempo_gcal_token';
        const GCAL_API = 'https://www.googleapis.com/calendar/v3';

        let gcalToken = null;
        let tokenClient = null;

        // --- Token persistence ---
        function loadToken() {
            try {
                const t = JSON.parse(localStorage.getItem(GCAL_TOKEN_KEY));
                if (t && t.expires_at > Date.now()) { gcalToken = t; }
                else { localStorage.removeItem(GCAL_TOKEN_KEY); }
            } catch (_) {}
        }
        function saveToken(tokenResp) {
            gcalToken = { access_token: tokenResp.access_token, expires_at: Date.now() + tokenResp.expires_in * 1000 };
            localStorage.setItem(GCAL_TOKEN_KEY, JSON.stringify(gcalToken));
        }
        function clearToken() {
            gcalToken = null;
            localStorage.removeItem(GCAL_TOKEN_KEY);
        }

        // --- Auth ---
        function initTokenClient() {
            if (tokenClient) return;
            if (!window.google?.accounts?.oauth2) return;
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: GCAL_CLIENT_ID,
                scope: GCAL_SCOPE,
                callback: async (resp) => {
                    if (resp.error) { console.error('GCal OAuth error:', resp.error); return; }
                    saveToken(resp);
                    updateGCalUI();
                    await gcalSync();
                }
            });
        }

        function gcalConnect() {
            initTokenClient();
            if (!tokenClient) { alert('Google Identity Services no cargó todavía. Intentá de nuevo en un segundo.'); return; }
            tokenClient.requestAccessToken({ prompt: gcalToken ? '' : 'consent' });
        }

        function gcalDisconnect() {
            if (gcalToken) google.accounts.oauth2.revoke(gcalToken.access_token, () => {});
            clearToken();
            const S = window._getS ? window._getS() : null;
            if (S) {
                S.items = S.items.filter(i => !i.gcalId);
                window._save && window._save();
                window._refreshAll && window._refreshAll();
            }
            updateGCalUI();
        }

        // --- UI state ---
        function updateGCalUI() {
            const btn = document.getElementById('gcalConnectBtn');
            const lbl = document.getElementById('gcalBtnLabel');
            const sub = document.getElementById('gcalBtnSub');
            if (!btn || !lbl || !sub) return;
            if (gcalToken) {
                lbl.textContent = 'Google Calendar conectado ✓';
                lbl.style.color = 'var(--green)';
                sub.textContent = 'Toca para desconectar y eliminar eventos importados';
                btn.dataset.act = 'gcal-disconnect';
            } else {
                lbl.textContent = 'Conectar Google Calendar';
                lbl.style.color = '';
                sub.textContent = 'Sincroniza tus eventos automáticamente';
                btn.dataset.act = 'gcal-connect';
            }
        }

        // --- API helpers ---
        async function gcalFetch(path, opts = {}) {
            if (!gcalToken) return null;
            const resp = await fetch(`${GCAL_API}${path}`, {
                ...opts,
                headers: { Authorization: `Bearer ${gcalToken.access_token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) }
            });
            if (resp.status === 401) { clearToken(); updateGCalUI(); return null; }
            if (!resp.ok) { console.error('GCal API error', resp.status, await resp.text()); return null; }
            return resp.json();
        }

        // --- Sync: Google → App ---
        async function importFromGoogle() {
            const S = window._getS ? window._getS() : null;
            if (!S) { console.warn('GCal: estado no disponible'); return 0; }
            // 3 años hacia atrás + 1 año hacia adelante
            const now = new Date();
            const timeMin = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate()).toISOString();
            const timeMax = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString();

            // Paginar hasta traer todos los eventos
            let allEvents = [];
            let pageToken = undefined;
            do {
                const qs = new URLSearchParams({
                    timeMin, timeMax,
                    singleEvents: 'true',
                    orderBy: 'startTime',
                    maxResults: '2500',
                    ...(pageToken ? { pageToken } : {})
                });
                const data = await gcalFetch(`/calendars/primary/events?${qs}`);
                if (!data || !data.items) break;
                allEvents = allEvents.concat(data.items);
                pageToken = data.nextPageToken;
            } while (pageToken);

            console.log(`GCal: ${allEvents.length} eventos recibidos de Google`);
            // Limpiar eventos eliminados en Google
            const gcalIds = new Set(allEvents.map(e => e.id));
            S.items = S.items.filter(i => !i.gcalId || gcalIds.has(i.gcalId));

            let added = 0;
            for (const ev of allEvents) {
                if (ev.status === 'cancelled') continue;
                const existing = S.items.find(i => i.gcalId === ev.id);
                const startDate = ev.start?.date || ev.start?.dateTime?.slice(0, 10);
                const startTime = ev.start?.dateTime ? ev.start.dateTime.slice(11, 16) : '';
                const endTime = ev.end?.dateTime ? ev.end.dateTime.slice(11, 16) : '';
                if (existing) {
                    if (existing.kind !== 'birthday' && existing.kind !== 'routine') {
                        existing.kind = 'event';
                    }
                    existing.title = ev.summary || '(sin título)';
                    existing.date = existing.kind === 'birthday' ? (existing.date || startDate) : startDate;
                    existing.time = startTime;
                    existing.end = endTime;
                    existing.location = ev.location || '';
                    existing.notes = ev.description || '';
                } else {
                    S.items.push({
                        id: 'gc_' + ev.id,
                        gcalId: ev.id,
                        kind: 'event',
                        title: ev.summary || '(sin título)',
                        date: startDate,
                        time: startTime,
                        end: endTime,
                        location: ev.location || '',
                        notes: ev.description || '',
                        done: false, prio: 0, star: false, gcal: true
                    });
                    added++;
                }
            }

            console.log(`GCal: ${added} eventos nuevos importados`);
            window._save();
            return added;
        }

        // --- Sync: App → Google (push single item: event, birthday, routine) ---
        window.gcalPushItem = async function(item) {
            if (!gcalToken) return;
            if (item.kind !== 'event' && item.kind !== 'routine' && item.kind !== 'birthday') return;

            let body = {};
            const curYear = new Date().getFullYear();

            if (item.kind === 'birthday') {
                const [mStr, dStr] = (item.date || '01-01').split('-');
                const bYear = item.year || curYear;
                const eventDate = `${curYear}-${mStr.padStart(2, '0')}-${dStr.padStart(2, '0')}`;
                const name = typeof cleanBirthdayName === 'function' ? cleanBirthdayName(item.title) : item.title;
                body = {
                    summary: `🎂 ${name}`,
                    description: item.year ? `Año de nacimiento: ${item.year}` : (item.notes || 'Cumpleaños guardado en Tempo'),
                    start: { date: eventDate },
                    end: { date: eventDate },
                    recurrence: ['RRULE:FREQ=YEARLY'],
                    transparency: 'transparent'
                };
            } else if (item.kind === 'routine') {
                const startDate = item.date || todayY();
                const freqMap = {
                    daily: 'RRULE:FREQ=DAILY',
                    weekdays: 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
                    weekends: 'RRULE:FREQ=WEEKLY;BYDAY=SA,SU',
                    weekly: 'RRULE:FREQ=WEEKLY',
                    monthly: 'RRULE:FREQ=MONTHLY',
                    mon: 'RRULE:FREQ=WEEKLY;BYDAY=MO',
                    tue: 'RRULE:FREQ=WEEKLY;BYDAY=TU',
                    wed: 'RRULE:FREQ=WEEKLY;BYDAY=WE',
                    thu: 'RRULE:FREQ=WEEKLY;BYDAY=TH',
                    fri: 'RRULE:FREQ=WEEKLY;BYDAY=FR',
                    sat: 'RRULE:FREQ=WEEKLY;BYDAY=SA',
                    sun: 'RRULE:FREQ=WEEKLY;BYDAY=SU'
                };
                const rrule = freqMap[item.repeat || 'daily'] || 'RRULE:FREQ=DAILY';
                body = {
                    summary: item.title,
                    description: item.notes || '',
                    start: item.time ? { dateTime: `${startDate}T${item.time}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
                                     : { date: startDate },
                    end: item.end ? { dateTime: `${startDate}T${item.end}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
                                  : item.time ? { dateTime: `${startDate}T${item.time}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
                                  : { date: startDate },
                    recurrence: [rrule]
                };
            } else { // event
                body = {
                    summary: item.title,
                    description: item.notes || '',
                    location: item.location || '',
                    start: item.time ? { dateTime: `${item.date}T${item.time}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
                                     : { date: item.date },
                    end: item.end ? { dateTime: `${item.date}T${item.end}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
                                  : item.time ? { dateTime: `${item.date}T${item.time}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
                                  : { date: item.date }
                };
                if (item.alarm != null) {
                    body.reminders = { useDefault: false, overrides: [{ method: 'popup', minutes: Number(item.alarm) }] };
                }
            }

            try {
                if (item.gcalId) {
                    await gcalFetch(`/calendars/primary/events/${item.gcalId}`, { method: 'PUT', body: JSON.stringify(body) });
                } else {
                    const created = await gcalFetch('/calendars/primary/events', { method: 'POST', body: JSON.stringify(body) });
                    if (created?.id) {
                        item.gcalId = created.id;
                        item.gcal = true;
                        window._save && window._save();
                    }
                }
            } catch (e) {
                console.warn('GCal push error:', e);
            }
        };

        // --- Export unsynced local items to Google Calendar ---
        async function pushUnsyncedToGoogle() {
            const S = window._getS ? window._getS() : null;
            if (!S || !S.items || !gcalToken) return;
            const unsynced = S.items.filter(i => (i.kind === 'birthday' || i.kind === 'event' || i.kind === 'routine') && !i.gcalId);
            for (const it of unsynced) {
                await window.gcalPushItem(it);
            }
        }

        // --- Full sync ---
        window.gcalSync = async function() {
            if (!gcalToken) return;
            await pushUnsyncedToGoogle();
            const n = await importFromGoogle();
            window._refreshAll();
            if (n > 0) window._toast && window._toast(`Google Calendar sincronizado (${n} eventos recibidos)`);
            else window._toast && window._toast('Google Calendar sincronizado ✓');
        };

        // --- Hook into app actions ---
        document.addEventListener('click', e => {
            const btn = e.target.closest('[data-act]');
            if (!btn) return;
            const act = btn.dataset.act;
            if (act === 'gcal-connect') { gcalConnect(); }
            if (act === 'gcal-disconnect') { gcalDisconnect(); }
        }, true);

        window._updateGCalUI = updateGCalUI;

        // --- Init ---
        loadToken();
        window.addEventListener('load', () => {
            initTokenClient();
            updateGCalUI();
            if (gcalToken) {
                // Sincronizar inmediatamente con token guardado
                gcalSync();
            }
        });
    })();
}
