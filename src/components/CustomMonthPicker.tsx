'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", 
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
]

const FULL_MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

interface CustomMonthPickerProps {
  value: string // YYYY-MM
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function CustomMonthPicker({ value, onChange, placeholder = 'Pilih Bulan', className = '' }: CustomMonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Determine initial view year based on value or current year
  const initialYear = value ? parseInt(value.split('-')[0], 10) : new Date().getFullYear()
  const [viewYear, setViewYear] = useState(initialYear)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Sync view year if value changes from outside
  useEffect(() => {
    if (value) {
      setViewYear(parseInt(value.split('-')[0], 10))
    }
  }, [value])

  const handleMonthClick = (monthIndex: number) => {
    const mm = String(monthIndex + 1).padStart(2, '0')
    onChange(`${viewYear}-${mm}`)
    setIsOpen(false)
  }

  // Parse current value to highlight it
  let selectedYear = -1
  let selectedMonth = -1
  if (value) {
    const [y, m] = value.split('-')
    selectedYear = parseInt(y, 10)
    selectedMonth = parseInt(m, 10) - 1
  }

  const getDisplayValue = () => {
    if (!value) return placeholder
    if (selectedYear !== -1 && selectedMonth !== -1) {
      return `${FULL_MONTH_NAMES[selectedMonth]} ${selectedYear}`
    }
    return value
  }

  return (
    <div className={`relative ${className}`} ref={containerRef} style={{ width: '100%' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="form-input"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          cursor: 'pointer',
          background: 'var(--bg-surface)',
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
          width: '100%',
          padding: '10px 14px'
        }}
      >
        <CalendarIcon size={16} style={{ color: '#16a34a' }} />
        <span style={{ fontSize: 14 }}>{getDisplayValue()}</span>
      </div>

      {isOpen && (
        <div 
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            zIndex: 9999,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 12,
            padding: 16,
            boxShadow: 'var(--shadow-lg)',
            width: 280,
          }}
          className="animate-in fade-in slide-in-from-top-2"
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <button 
              type="button" 
              onClick={() => setViewYear(y => y - 1)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-secondary)' }}
            >
              <ChevronLeft size={18} />
            </button>

            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
              {viewYear}
            </div>

            <button 
              type="button" 
              onClick={() => setViewYear(y => y + 1)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-secondary)' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Grid of Months */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {MONTH_NAMES.map((monthStr, index) => {
              const isSelected = selectedYear === viewYear && selectedMonth === index
              const isCurrentMonth = new Date().getFullYear() === viewYear && new Date().getMonth() === index

              return (
                <div
                  key={index}
                  onClick={() => handleMonthClick(index)}
                  style={{
                    padding: '10px 0',
                    textAlign: 'center',
                    cursor: 'pointer',
                    fontSize: 13,
                    borderRadius: 8,
                    background: isSelected ? '#16a34a' : 'transparent',
                    color: isSelected ? '#fff' : isCurrentMonth ? '#16a34a' : 'var(--text-primary)',
                    fontWeight: isSelected || isCurrentMonth ? 600 : 400,
                    transition: 'all 0.2s',
                    border: isCurrentMonth && !isSelected ? '1px solid #16a34a' : '1px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(22, 163, 74, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {monthStr}
                </div>
              )
            })}
          </div>
          
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'center' }}>
            <button 
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                const today = new Date()
                setViewYear(today.getFullYear())
                handleMonthClick(today.getMonth())
              }}
              style={{ fontSize: 12, color: '#16a34a' }}
            >
              Pilih Bulan Ini
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
