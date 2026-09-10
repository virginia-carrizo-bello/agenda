import './styles/globals.css'
import { initTempoEngine } from './tempoEngine'

// Inicializar motor de Tempo con todas sus funciones y reactividad
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initTempoEngine()
  })
} else {
  initTempoEngine()
}
