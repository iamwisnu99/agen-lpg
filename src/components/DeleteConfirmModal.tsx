'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react'

interface DeleteConfirmModalProps {
  open: boolean
  title: string
  description: string
  itemName?: string
  loading?: boolean
  confirmDisabled?: boolean
  children?: React.ReactNode
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmModal({
  open,
  title,
  description,
  itemName,
  loading = false,
  confirmDisabled = false,
  children,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle open: mount then trigger open animation
  useEffect(() => {
    if (open) {
      setIsClosing(false)
      // Small delay so CSS transition has a start state to animate from
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true))
      })
    }
  }, [open])

  // Trigger close animation, then call onCancel after animation ends
  const handleClose = () => {
    if (loading) return
    setIsClosing(true)
    setIsVisible(false)
  }

  const handleAnimationEnd = () => {
    if (isClosing) {
      onCancel()
      setIsClosing(false)
    }
  }

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, loading])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open && !isClosing) return null
  if (!mounted) return null

  const modalContent = (
    <>
      <style>{`
        /* ── Overlay ── */
        .dcm-overlay {
          position: fixed;
          inset: 0;
          z-index: 9000;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          transition: opacity 0.25s ease;
          opacity: 0;
        }
        .dcm-overlay.dcm-open {
          opacity: 1;
        }

        /* ── Desktop Modal Box ── */
        .dcm-box {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: 20px;
          padding: 32px 28px 28px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.3);
          position: relative;
          text-align: center;
          transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0;
          transform: scale(0.85);
        }
        .dcm-overlay.dcm-open .dcm-box {
          opacity: 1;
          transform: scale(1);
        }
        .dcm-overlay.dcm-closing .dcm-box {
          opacity: 0;
          transform: scale(0.85);
        }

        /* ── Mobile: Bottom Sheet ── */
        @media (max-width: 480px) {
          .dcm-overlay {
            align-items: flex-end;
            padding: 0;
          }
          .dcm-box {
            max-width: 100%;
            border-radius: 24px 24px 0 0;
            padding: 8px 24px 40px;
            transform: translateY(100%);
            opacity: 1;
            transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.2s ease;
          }
          .dcm-overlay.dcm-open .dcm-box {
            transform: translateY(0);
            opacity: 1;
          }
          .dcm-overlay.dcm-closing .dcm-box {
            transform: translateY(100%);
            opacity: 1;
          }
        }

        /* ── Drag Handle (mobile only) ── */
        .dcm-drag-handle {
          width: 40px;
          height: 4px;
          background: var(--border-default);
          border-radius: 999px;
          margin: 12px auto 24px;
          display: none;
        }
        @media (max-width: 480px) {
          .dcm-drag-handle { display: block; }
        }

        /* ── Close Button (desktop only) ── */
        .dcm-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          background: var(--bg-muted);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-muted);
          transition: background 0.15s, color 0.15s;
        }
        .dcm-close-btn:hover {
          background: rgba(239,68,68,0.1);
          color: #ef4444;
        }
        @media (max-width: 480px) {
          .dcm-close-btn { display: none; }
        }

        /* ── Icon Ring ── */
        .dcm-icon-ring {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.1);
          border: 2px solid rgba(239, 68, 68, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          animation: dcmPulse 2s ease-in-out infinite;
        }
        @keyframes dcmPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.25); }
          50%       { box-shadow: 0 0 0 10px rgba(239,68,68,0); }
        }

        /* ── Typography ── */
        .dcm-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 8px;
          line-height: 1.3;
        }
        .dcm-desc {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 8px;
        }
        .dcm-item-badge {
          display: inline-block;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
          font-weight: 700;
          font-size: 14px;
          padding: 4px 14px;
          border-radius: 8px;
          margin-bottom: 20px;
          word-break: break-all;
        }

        /* ── Warning box ── */
        .dcm-warning {
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.15);
          border-radius: 10px;
          padding: 10px 14px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          text-align: left;
          margin-bottom: 24px;
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        /* ── Action Buttons ── */
        .dcm-actions {
          display: flex;
          gap: 10px;
        }
        .dcm-btn-cancel {
          flex: 1;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid var(--border-default);
          background: var(--bg-surface);
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .dcm-btn-cancel:hover:not(:disabled) {
          background: var(--bg-muted);
        }
        .dcm-btn-confirm {
          flex: 1;
          padding: 12px 16px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: opacity 0.15s, transform 0.1s;
          box-shadow: 0 4px 12px rgba(239,68,68,0.35);
        }
        .dcm-btn-confirm:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .dcm-btn-confirm:disabled,
        .dcm-btn-cancel:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
      `}</style>

      {/* Overlay */}
      <div
        className={`dcm-overlay ${isVisible ? 'dcm-open' : ''} ${isClosing ? 'dcm-closing' : ''}`}
        onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dcm-title"
        onTransitionEnd={handleAnimationEnd}
      >
        <div className="dcm-box" ref={modalRef}>
          {/* Drag handle — mobile only */}
          <div className="dcm-drag-handle" />

          {/* Close button — desktop only */}
          <button className="dcm-close-btn" onClick={handleClose} disabled={loading} aria-label="Tutup">
            <X size={16} />
          </button>

          {/* Icon */}
          <div className="dcm-icon-ring">
            <Trash2 size={32} color="#ef4444" />
          </div>

          {/* Title */}
          <h2 className="dcm-title" id="dcm-title">{title}</h2>

          {/* Description */}
          <p className="dcm-desc">{description}</p>

          {/* Item badge */}
          {itemName && (
            <div className="dcm-item-badge">{itemName}</div>
          )}

          {/* Warning */}
          <div className="dcm-warning">
            <AlertTriangle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Tindakan ini <strong>tidak dapat dibatalkan</strong>. Data yang dihapus tidak bisa dipulihkan.</span>
          </div>

          {/* Children / Extra Content */}
          {children && (
            <div style={{ marginBottom: 24, textAlign: 'left' }}>
              {children}
            </div>
          )}

          {/* Actions */}
          <div className="dcm-actions">
            <button className="dcm-btn-cancel" onClick={handleClose} disabled={loading}>
              Batal
            </button>
            <button className="dcm-btn-confirm" onClick={onConfirm} disabled={loading || confirmDisabled}>
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Menghapus...</>
                : <><Trash2 size={16} /> Ya, Hapus</>
              }
            </button>
          </div>
        </div>
      </div>
    </>
  )

  return createPortal(modalContent, document.body)
}
