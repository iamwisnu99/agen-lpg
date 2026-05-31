'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface CustomSelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  style?: React.CSSProperties
}

export function CustomSelect({ options, value, onChange, placeholder = 'Pilih...', className = '', style }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={dropdownRef} className={`relative ${className}`} style={{ ...style, position: 'relative' }}>
      <button
        type="button"
        className="form-input flex items-center justify-between text-left"
        style={{ width: '100%', cursor: 'pointer', paddingRight: '12px', background: 'var(--bg-surface)' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ color: selectedOption ? 'var(--text-primary)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
      </button>

      {isOpen && (
        <div 
          style={{ 
            position: 'absolute', 
            top: 'calc(100% + 4px)', 
            left: 0, 
            width: '100%', 
            zIndex: 50, 
            background: 'var(--bg-surface)', 
            border: '1px solid var(--border-default)', 
            borderRadius: '12px', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            maxHeight: '240px',
            overflowY: 'auto',
            padding: '4px'
          }}
        >
          {options.map((option) => {
            const isSelected = value === option.value
            return (
              <button
                key={option.value}
                type="button"
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: isSelected ? 'rgba(22, 163, 74, 0.08)' : 'transparent',
                  color: isSelected ? '#15803d' : 'var(--text-primary)',
                  fontWeight: isSelected ? 600 : 400,
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => { if(!isSelected) e.currentTarget.style.background = 'var(--bg-muted)' }}
                onMouseLeave={(e) => { if(!isSelected) e.currentTarget.style.background = 'transparent' }}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{option.label}</span>
                {isSelected && <Check size={16} style={{ color: '#16a34a', flexShrink: 0, marginLeft: 8 }} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
