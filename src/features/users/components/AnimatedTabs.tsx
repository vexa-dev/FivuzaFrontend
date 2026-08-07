import { useLayoutEffect, useRef, useState } from 'react'
import './AnimatedTabs.css'

interface AnimatedTabsProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: [T, string][]
}

/** Selector de pestañas con una píldora que se desliza hasta la opción
 * activa en vez de saltar de golpe -prueba acotada a Usuarios antes de
 * llevarla al `.tabs`/`.tab` global que usan el resto de las pantallas. */
export function AnimatedTabs<T extends string>({ value, onChange, options }: AnimatedTabsProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const [sliderStyle, setSliderStyle] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    const activeButton = buttonRefs.current.get(value)
    if (!container || !activeButton) return

    const containerRect = container.getBoundingClientRect()
    const buttonRect = activeButton.getBoundingClientRect()
    setSliderStyle({
      left: buttonRect.left - containerRect.left,
      width: buttonRect.width,
    })
  }, [value, options])

  return (
    <div className="animated-tabs" ref={containerRef}>
      {sliderStyle && (
        <span
          className="animated-tabs-slider"
          style={{ transform: `translateX(${sliderStyle.left}px)`, width: sliderStyle.width }}
        />
      )}
      {options.map(([optionValue, label]) => (
        <button
          key={optionValue}
          type="button"
          ref={(el) => {
            if (el) buttonRefs.current.set(optionValue, el)
            else buttonRefs.current.delete(optionValue)
          }}
          className={`animated-tab ${value === optionValue ? 'animated-tab-active' : ''}`}
          onClick={() => onChange(optionValue)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
