import React from 'react'
import type { AgendaItem } from '../../types/agenda'
import { RoutineCard } from '../items/RoutineCard'

interface RoutinesViewProps {
  items: AgendaItem[]
  currentDate: string
  onToggleDate: (id: string, date: string) => void
  onEditItem: (item: AgendaItem) => void
  onDeleteItem: (id: string) => void
  onOpenNew: () => void
}

export const RoutinesView: React.FC<RoutinesViewProps> = ({
  items,
  currentDate,
  onToggleDate,
  onEditItem,
  onDeleteItem,
  onOpenNew,
}) => {
  const routines = items.filter(it => it.kind === 'routine')
  const completedToday = routines.filter(r => (r.done_dates || '').includes(currentDate)).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Resumen Superior */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--card), var(--bg3))',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--sep)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--k-routine)', textTransform: 'uppercase' }}>
            Hábitos & Rutinas
          </span>
          <h2 style={{ fontSize: '24px', color: 'var(--label)', marginTop: '2px' }}>
            Tus Rutinas Diarias
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--label2)', marginTop: '4px' }}>
            Construye hábitos consistentes día tras día.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              background: 'var(--card)',
              padding: '12px 20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--sep)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--k-routine)' }}>
              {completedToday} / {routines.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--label3)', fontWeight: 600 }}>Completadas Hoy</div>
          </div>

          <button
            type="button"
            onClick={onOpenNew}
            style={{
              background: 'var(--k-routine)',
              color: '#FFFFFF',
              padding: '10px 18px',
              borderRadius: 'var(--radius-full)',
              fontSize: '14px',
              fontWeight: 700,
            }}
          >
            + Nueva Rutina
          </button>
        </div>
      </div>

      {/* Lista de Rutinas */}
      {routines.length === 0 ? (
        <div
          style={{
            background: 'var(--card)',
            padding: '48px 24px',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--sep)',
            textAlign: 'center',
            color: 'var(--label3)',
          }}
        >
          <span style={{ fontSize: '36px', display: 'block', marginBottom: '8px' }}>🔁</span>
          <p style={{ fontWeight: 600, fontSize: '16px', color: 'var(--label)' }}>
            No tienes rutinas creadas
          </p>
          <p style={{ fontSize: '14px', marginTop: '4px' }}>
            Crea tu primera rutina o hábito para hacerle seguimiento.
          </p>
          <button
            type="button"
            onClick={onOpenNew}
            style={{
              marginTop: '16px',
              background: 'var(--k-routine)',
              color: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              fontSize: '13px',
            }}
          >
            + Crear Rutina
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
          {routines.map(r => (
            <RoutineCard
              key={r.id}
              item={r}
              currentDate={currentDate}
              onToggleDate={onToggleDate}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
            />
          ))}
        </div>
      )}
    </div>
  )
}
