// Tempo 1:1 Complete Engine with GCal Integration
export function initTempoEngine() {

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
