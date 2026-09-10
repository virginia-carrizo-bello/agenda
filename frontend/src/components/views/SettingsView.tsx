import React, { useState } from 'react'
import type { ThemeMode, GCalConfig, AgendaItem } from '../../types/agenda'
import { gcalService } from '../../api/gcal'

interface SettingsViewProps {
  theme: ThemeMode
  onToggleTheme: () => void
  gcalConfig: GCalConfig
  onUpdateGCalConfig: (cfg: Partial<GCalConfig>) => void
  onReseed: () => Promise<void>
  items: AgendaItem[]
  onSyncAllGCal: () => Promise<void>
  onImportGCal: () => Promise<void>
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  onToggleTheme,
  gcalConfig,
  onUpdateGCalConfig,
  onReseed,
  items,
  onSyncAllGCal,
  onImportGCal,
}) => {
  const [clientId, setClientId] = useState(gcalConfig.clientId || '')
  const [syncStatus, setSyncStatus] = useState<string | null>(null)
  const [isAuthorizing, setIsAuthorizing] = useState(false)

  const handleSaveClientId = () => {
    onUpdateGCalConfig({ clientId: clientId.trim() })
    setSyncStatus('Client ID guardado')
    setTimeout(() => setSyncStatus(null), 3000)
  }

  const handleConnectGoogle = () => {
    if (!clientId.trim()) {
      alert('Por favor ingresa primero tu Google Client ID')
      return
    }
    setIsAuthorizing(true)
    gcalService.requestAccessToken(clientId.trim(), token => {
      onUpdateGCalConfig({ accessToken: token, clientId: clientId.trim() })
      setIsAuthorizing(false)
      setSyncStatus('Conectado con Google Calendar exitosamente')
    })
  }

  const handleDisconnectGoogle = () => {
    onUpdateGCalConfig({ accessToken: null })
    setSyncStatus('Desconectado de Google Calendar')
  }

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2))
    const dlAnchorElem = document.createElement('a')
    dlAnchorElem.setAttribute('href', dataStr)
    dlAnchorElem.setAttribute('download', `tempo_backup_${new Date().toISOString().split('T')[0]}.json`)
    dlAnchorElem.click()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '700px' }}>
      <div>
        <h2 style={{ fontSize: '24px', color: 'var(--label)' }}>Ajustes & Sincronización</h2>
        <p style={{ fontSize: '14px', color: 'var(--label2)', marginTop: '4px' }}>
          Configura tus preferencias visuales, copias de seguridad y Google Calendar.
        </p>
      </div>

      {/* Sección Apariencia */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--sep)',
          boxShadow: 'var(--shadow-sm)',
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--label)' }}>Tema Visual</h3>
          <p style={{ fontSize: '13px', color: 'var(--label3)' }}>
            Actualmente: {theme === 'dark' ? 'Oscuro 🌙' : 'Claro ☀️'}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          style={{
            background: 'var(--bg3)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 700,
            fontSize: '14px',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {theme === 'dark' ? '☀️ Cambiar a Claro' : '🌙 Cambiar a Oscuro'}
        </button>
      </div>

      {/* Sección Google Calendar */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--sep)',
          boxShadow: 'var(--shadow-sm)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--label)' }}>
              📅 Google Calendar
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--label3)' }}>
              Sincroniza tus eventos, cumpleaños y recordatorios en tiempo real.
            </p>
          </div>

          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: gcalConfig.accessToken ? 'var(--k-shopping-soft)' : 'var(--bg3)',
              color: gcalConfig.accessToken ? 'var(--green)' : 'var(--label3)',
            }}
          >
            {gcalConfig.accessToken ? '● Conectado' : '○ No conectado'}
          </span>
        </div>

        <div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--label2)', display: 'block', marginBottom: '6px' }}>
            Google Client ID (OAuth 2.0)
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Ej: 123456789-abc.apps.googleusercontent.com"
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              style={{ flex: 1, fontSize: '13px' }}
            />
            <button
              type="button"
              onClick={handleSaveClientId}
              style={{
                background: 'var(--bg3)',
                padding: '0 14px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '13px',
              }}
            >
              Guardar
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {!gcalConfig.accessToken ? (
            <button
              type="button"
              onClick={handleConnectGoogle}
              disabled={isAuthorizing}
              style={{
                background: 'var(--accent)',
                color: 'var(--on-accent)',
                padding: '8px 18px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '14px',
              }}
            >
              {isAuthorizing ? 'Conectando...' : '🔗 Conectar Google Account'}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onSyncAllGCal}
                style={{
                  background: 'var(--accent)',
                  color: 'var(--on-accent)',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                ⬆ Exportar a Google Calendar
              </button>

              <button
                type="button"
                onClick={onImportGCal}
                style={{
                  background: 'var(--bg3)',
                  color: 'var(--label)',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                ⬇ Importar de Google
              </button>

              <button
                type="button"
                onClick={handleDisconnectGoogle}
                style={{
                  background: 'transparent',
                  color: 'var(--red)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                Desconectar
              </button>
            </>
          )}
        </div>

        {syncStatus && (
          <div style={{ fontSize: '13px', color: 'var(--green)', fontWeight: 600 }}>
            {syncStatus}
          </div>
        )}
      </div>

      {/* Sección Copias de Seguridad & Base de Datos */}
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--sep)',
          boxShadow: 'var(--shadow-sm)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--label)' }}>
          💾 Datos y Respaldo
        </h3>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleExportJSON}
            style={{
              background: 'var(--bg3)',
              color: 'var(--label)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            📦 Descargar Backup (JSON)
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('¿Restaurar los datos semilla iniciales de Tempo?')) {
                onReseed()
              }
            }}
            style={{
              background: 'transparent',
              color: 'var(--amber)',
              border: '1px solid var(--amber)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            🔄 Restaurar Datos Semilla
          </button>
        </div>
      </div>
    </div>
  )
}
