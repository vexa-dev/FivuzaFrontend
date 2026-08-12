import { Palette, RotateCcw, Settings as SettingsIcon } from 'lucide-react'
import { useBrandTheme } from '../../theme/useBrandTheme'
import '../core/CorePage.css'
import './SettingsPage.css'

const PRESETS: { hex: string; label: string }[] = [
  { hex: '#3B82F6', label: 'Azul' },
  { hex: '#22A6B3', label: 'Teal' },
  { hex: '#C9A15A', label: 'Dorado' },
  { hex: '#9B6DD6', label: 'Violeta' },
  { hex: '#B6486A', label: 'Vino' },
  { hex: '#5F7A52', label: 'Salvia' },
  { hex: '#E5484D', label: 'Rojo' },
]

const DEFAULT_COLOR = '#3B82F6'

export function SettingsPage() {
  const { brandColor, setBrandColor, adaptBackground, setAdaptBackground, result, reset } = useBrandTheme()
  const activeColor = brandColor ?? DEFAULT_COLOR

  return (
    <div className="settings-page">
      <div className="page-header">
        <div className="page-header-title-group">
          <span className="page-header-icon">
            <SettingsIcon size={20} strokeWidth={2} />
          </span>
          <div>
            <h1 className="core-page-title">Configuración</h1>
            <p className="core-page-subtitle">Personaliza cómo se ve tu sistema</p>
          </div>
        </div>
      </div>

      <div className="card settings-section">
        <h2 className="settings-section-title">
          <Palette size={15} strokeWidth={2} style={{ verticalAlign: -2, marginRight: 6 }} />
          Color de tu negocio
        </h2>
        <p className="settings-section-desc">
          Elige el color con el que se identifica tu negocio. Se usará en los botones, el menú y los
          gráficos de todo el sistema.
        </p>

        <div className="settings-color-row">
          <span className="settings-color-swatch" style={{ background: activeColor }}>
            <input
              type="color"
              value={activeColor}
              onChange={(e) => setBrandColor(e.target.value)}
              aria-label="Elegir color personalizado"
            />
          </span>
          <div>
            <div className="settings-color-hex">{activeColor.toUpperCase()}</div>
            <div className="settings-section-desc" style={{ margin: 0 }}>
              Toca el cuadro para elegir cualquier color
            </div>
          </div>
        </div>

        <div className="settings-presets">
          {PRESETS.map((preset) => (
            <button
              key={preset.hex}
              type="button"
              className={`settings-preset-swatch ${
                activeColor.toLowerCase() === preset.hex.toLowerCase() ? 'settings-preset-swatch-active' : ''
              }`}
              style={{ background: preset.hex }}
              title={preset.label}
              aria-label={preset.label}
              onClick={() => setBrandColor(preset.hex)}
            />
          ))}
        </div>

        <div className="settings-toggle-row">
          <div>
            <p className="settings-toggle-label">Adaptar el fondo a tu color</p>
            <p className="settings-toggle-desc">
              Le da al fondo un tinte muy sutil de tu color, para que se sienta más propio.
            </p>
          </div>
          <button
            type="button"
            className="theme-switch"
            aria-pressed={adaptBackground}
            onClick={() => setAdaptBackground(!adaptBackground)}
          >
            <span className="theme-switch-thumb" />
          </button>
        </div>

        {result && (
          <>
            <div className="settings-preview">
              <button type="button" className="btn btn-primary" style={{ pointerEvents: 'none' }}>
                Botón de ejemplo
              </button>
              <span
                className="settings-preview-avatar"
                style={{ background: result.vars['--primary-subtle-bg'], color: result.vars['--primary'] }}
              >
                A
              </span>
              <span className="badge" style={{ background: result.vars['--primary-subtle-bg'], color: result.vars['--primary'] }}>
                Badge de ejemplo
              </span>
            </div>

            {result.contrast.primaryPassesAA && result.contrast.textOnPrimaryPassesAA ? (
              <div className="settings-feedback settings-feedback-ok">
                ✓ Este color se ve bien y es fácil de leer en todo el sistema.
              </div>
            ) : (
              <div className="settings-feedback settings-feedback-warn">
                ⚠ Este color puede ser difícil de leer en los botones. Prueba un tono
                {result.clampDirection === 'wasTooLight' ? ' más oscuro' : ' más claro o más saturado'}.
              </div>
            )}
          </>
        )}

        <button type="button" className="btn btn-ghost btn-sm settings-reset" onClick={reset}>
          <RotateCcw size={14} strokeWidth={2} />
          Restablecer al color de Fivuza
        </button>
      </div>
    </div>
  )
}
