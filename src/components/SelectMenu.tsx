import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'

export interface SelectMenuOption {
  value: string
  label: string
  disabled?: boolean
}

export function SelectMenu({
  id,
  value,
  options,
  onChange,
  ariaLabel,
  invalid,
  disabled,
  className,
  style,
}: {
  id?: string
  value: string
  options: SelectMenuOption[]
  onChange: (value: string) => void
  ariaLabel?: string
  invalid?: boolean
  disabled?: boolean
  className?: string
  style?: CSSProperties
}) {
  const generatedId = useId()
  const controlId = id ?? `select-${generatedId}`
  const listId = `${controlId}-listbox`
  const rootRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<Array<HTMLLIElement | null>>([])
  const [open, setOpen] = useState(false)
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value))
  const [activeIndex, setActiveIndex] = useState(selectedIndex)
  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    if (!open) return

    function closeWhenOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('pointerdown', closeWhenOutside)
    return () => document.removeEventListener('pointerdown', closeWhenOutside)
  }, [open])

  useEffect(() => {
    if (!open) return
    optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  function firstEnabled(direction: 1 | -1): number {
    const start = direction === 1 ? 0 : options.length - 1
    for (let index = start; index >= 0 && index < options.length; index += direction) {
      if (!options[index]?.disabled) return index
    }
    return 0
  }

  function moveActive(direction: 1 | -1) {
    if (options.length === 0) return
    let next = activeIndex
    for (let count = 0; count < options.length; count += 1) {
      next = (next + direction + options.length) % options.length
      if (!options[next]?.disabled) {
        setActiveIndex(next)
        return
      }
    }
  }

  function openMenu(direction: 1 | -1 = 1) {
    const current = options.findIndex((option) => option.value === value && !option.disabled)
    setActiveIndex(current >= 0 ? current : firstEnabled(direction))
    setOpen(true)
  }

  function choose(index: number) {
    const option = options[index]
    if (!option || option.disabled) return
    onChange(option.value)
    setActiveIndex(index)
    setOpen(false)
  }

  return (
    <div
      className={`select-menu${className ? ` ${className}` : ''}`}
      data-open={open}
      ref={rootRef}
      style={style}
    >
      <button
        id={controlId}
        type="button"
        className="select-menu__trigger"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-expanded={open}
        aria-activedescendant={open ? `${controlId}-option-${activeIndex}` : undefined}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            const direction = event.key === 'ArrowDown' ? 1 : -1
            if (open) moveActive(direction)
            else openMenu(direction)
            return
          }
          if (event.key === 'Home' && open) {
            event.preventDefault()
            setActiveIndex(firstEnabled(1))
            return
          }
          if (event.key === 'End' && open) {
            event.preventDefault()
            setActiveIndex(firstEnabled(-1))
            return
          }
          if ((event.key === 'Enter' || event.key === ' ') && open) {
            event.preventDefault()
            choose(activeIndex)
            return
          }
          if (event.key === 'Escape' && open) {
            event.preventDefault()
            setOpen(false)
          }
          if (event.key === 'Tab') setOpen(false)
        }}
      >
        <span className="select-menu__value">{selected?.label ?? 'Choose an option'}</span>
        <span className="select-menu__indicator mono" aria-hidden="true">
          {open ? 'CLOSE' : 'SELECT'}
        </span>
      </button>

      {open && (
        <ul className="select-menu__list" id={listId} role="listbox">
          {options.map((option, index) => (
            <li
              id={`${controlId}-option-${index}`}
              key={`${option.value}-${index}`}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled || undefined}
              data-active={index === activeIndex}
              data-selected={option.value === value}
              ref={(node) => {
                optionRefs.current[index] = node
              }}
              onPointerMove={() => !option.disabled && setActiveIndex(index)}
              onPointerDown={(event) => {
                event.preventDefault()
                choose(index)
              }}
            >
              <span>{option.label}</span>
              {option.value === value && <small className="mono">SELECTED</small>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
