export interface Weather { temp: number; code: number; label: string; icon: string }

const CODES: [number[], string, string][] = [
  [[0], 'Despejado', '☀️'],
  [[1, 2], 'Parcialmente nublado', '⛅'],
  [[3], 'Nublado', '☁️'],
  [[45, 48], 'Niebla', '🌫️'],
  [[51, 53, 55, 56, 57], 'Llovizna', '🌦️'],
  [[61, 63, 65, 66, 67, 80, 81, 82], 'Lluvia', '🌧️'],
  [[71, 73, 75, 77, 85, 86], 'Nieve', '❄️'],
  [[95, 96, 99], 'Tormenta', '⛈️'],
]

export async function fetchWeather(lat: number, lon: number): Promise<Weather | null> {
  const key = `tempo.weather.${lat.toFixed(2)},${lon.toFixed(2)}`
  try {
    const cached = sessionStorage.getItem(key)
    if (cached) {
      const c = JSON.parse(cached)
      if (Date.now() - c.t < 20 * 60_000) return c.w as Weather
    }
  } catch { /* sin storage */ }
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`,
    )
    const j = await r.json()
    const code = j.current.weather_code as number
    const hit = CODES.find(c => c[0].includes(code))
    const w: Weather = { temp: Math.round(j.current.temperature_2m), code, label: hit?.[1] ?? '—', icon: hit?.[2] ?? '🌡️' }
    try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), w })) } catch { /* sin storage */ }
    return w
  } catch {
    return null
  }
}
