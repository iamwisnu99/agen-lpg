'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays 
} from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'

interface CustomDatePickerProps {
  value: string // YYYY-MM-DD
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function CustomDatePicker({ value, onChange, placeholder = 'Pilih Tanggal', className = '' }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState<{ top?: number, bottom?: number, left: number, isDropup: boolean } | null>(null)
  const [currentMonth, setCurrentMonth] = useState(() => value ? new Date(value) : new Date())
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedDate = value ? new Date(value) : null

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Also check if the click is inside the portal dropdown. The dropdown has a specific id or we can check closest
        if (!(event.target as Element).closest('.date-picker-dropdown')) {
          setIsOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    
    // Close on scroll to prevent detached dropdowns
    const handleScroll = (e: Event) => {
      // Don't close if scrolling inside the dropdown itself
      if (!(e.target as Element).closest?.('.date-picker-dropdown')) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      window.addEventListener('scroll', handleScroll, true)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isOpen])

  const handleDateClick = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'))
    setIsOpen(false)
  }

  const renderHeader = () => {
    const currentYear = currentMonth.getFullYear()
    const years = []
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i)
    }

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button 
          type="button" 
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-secondary)' }}
        >
          <ChevronLeft size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
            {format(currentMonth, 'MMMM', { locale: idLocale })}
          </div>
          <div style={{ position: 'relative' }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#16a34a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
              {currentYear} <ChevronDown size={14} />
            </span>
            <select
              value={currentYear}
              onChange={(e) => {
                const newDate = new Date(currentMonth)
                newDate.setFullYear(parseInt(e.target.value))
                setCurrentMonth(newDate)
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer'
              }}
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          type="button" 
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-secondary)' }}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    )
  }

  const renderDays = () => {
    const days = []
    const startDate = startOfWeek(currentMonth, { weekStartsOn: 1 })
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
          {format(addDays(startDate, i), 'EEEEEE', { locale: idLocale })}
        </div>
      )
    }
    return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>{days}</div>
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const rows = []
    let days = []
    let day = startDate
    let formattedDate = ''

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd')
        const cloneDay = day
        const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
        const isCurrentMonth = isSameMonth(day, monthStart)

        days.push(
          <div
            key={day.toString()}
            onClick={() => handleDateClick(cloneDay)}
            style={{
              padding: '6px 0',
              textAlign: 'center',
              cursor: 'pointer',
              fontSize: 13,
              borderRadius: 8,
              background: isSelected ? '#16a34a' : 'transparent',
              color: isSelected ? '#fff' : isCurrentMonth ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: isSelected ? 600 : 400,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isSelected) e.currentTarget.style.background = 'rgba(22, 163, 74, 0.1)'
            }}
            onMouseLeave={(e) => {
              if (!isSelected) e.currentTarget.style.background = 'transparent'
            }}
          >
            {formattedDate}
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div key={day.toString()} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
          {days}
        </div>
      )
      days = []
    }
    return <div>{rows}</div>
  }

  return (
    <div className={`relative ${className}`} ref={containerRef} style={{ zIndex: isOpen ? 50 : 'auto' }}>
      <div 
        onClick={(e) => {
          if (!isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            const spaceBelow = window.innerHeight - rect.bottom
            const dropup = spaceBelow < 350
            setDropdownPos({
              left: rect.left,
              top: dropup ? undefined : rect.bottom + 8,
              bottom: dropup ? window.innerHeight - rect.top + 8 : undefined,
              isDropup: dropup
            })
          }
          setIsOpen(!isOpen)
        }}
        className="form-input"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          cursor: 'pointer',
          background: 'var(--bg-surface)',
          color: value ? 'var(--text-primary)' : 'var(--text-muted)'
        }}
      >
        <CalendarIcon size={16} style={{ color: '#16a34a' }} />
        <span style={{ fontSize: 14 }}>
          {value ? format(new Date(value), 'dd MMMM yyyy', { locale: idLocale }) : placeholder}
        </span>
      </div>

      {isOpen && dropdownPos && createPortal(
        <div 
          className={`date-picker-dropdown animate-in fade-in ${dropdownPos.isDropup ? 'slide-in-from-bottom-2' : 'slide-in-from-top-2'}`}
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            bottom: dropdownPos.bottom,
            left: dropdownPos.left,
            zIndex: 9999,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 12,
            padding: 16,
            boxShadow: 'var(--shadow-lg)',
            width: 280
          }}
        >
          {renderHeader()}
          {renderDays()}
          {renderCells()}
          
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'center' }}>
            <button 
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                const today = new Date()
                setCurrentMonth(today)
                handleDateClick(today)
              }}
              style={{ fontSize: 12, color: '#16a34a' }}
            >
              Pilih Hari Ini
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
