'use client'

import { useState, useEffect } from 'react'
import { FileText, Copy, RefreshCw, X, ChevronRight, CheckSquare, Settings2, Play, Package, Plus } from 'lucide-react'
import useSWR from 'swr'
import { getPangkalanList } from '@/lib/db'
import type { Pangkalan } from '@/types'
import toast from 'react-hot-toast'

interface GenerateParams {
  totalDo: number
  do360: number
  liburIds: string[]
  kurang100Ids: string[]
}

function generatePerencanaan(
  pangkalans: Pangkalan[],
  params: GenerateParams
) {
  const available = pangkalans.filter(p => p.status === 'aktif' && !params.liburIds.includes(p.id))
  const lowStock = available.filter(p => params.kurang100Ids.includes(p.id))
  const normal = available.filter(p => !params.kurang100Ids.includes(p.id))

  const totalRits = params.totalDo
  const rits = []

  let lowPool = [...lowStock].sort(() => Math.random() - 0.5)
  let normalPool = [...normal].sort(() => Math.random() - 0.5)

  const pickPangkalan = (forceLowStock = false): Pangkalan => {
    if (lowPool.length === 0 && normalPool.length === 0) {
      if (lowStock.length === 0 && normal.length === 0) {
        return { nama_pangkalan: 'Belum Ada Pangkalan' } as Pangkalan
      }
      lowPool = [...lowStock].sort(() => Math.random() - 0.5)
      normalPool = [...normal].sort(() => Math.random() - 0.5)
    }

    if ((forceLowStock || normalPool.length === 0) && lowPool.length > 0) {
      return lowPool.shift()!
    }
    
    if (normalPool.length > 0) {
      return normalPool.shift()!
    }
    
    return normalPool.shift()! || lowPool.shift()!
  }

  for (let i = 0; i < totalRits; i++) {
    const is360 = i >= (totalRits - params.do360)
    const targetTabung = is360 ? 360 : 560

    let currentSum = 0
    const allocations: { nama: string, qty: number }[] = []

    // Prevent infinite loop if something goes wrong
    let safeGuard = 0
    while (currentSum < targetTabung && safeGuard < 100) {
      safeGuard++
      const remaining = targetTabung - currentSum
      
      const useLowStock = lowPool.length > 0
      const p = pickPangkalan(useLowStock)
      
      let alloc = 0
      if (useLowStock) {
        const opts = [40, 60, 80]
        alloc = opts[Math.floor(Math.random() * opts.length)]
      } else {
        const opts = [100, 110, 120, 150, 160]
        alloc = opts[Math.floor(Math.random() * opts.length)]
      }

      if (alloc >= remaining) {
        alloc = remaining
      } else if (remaining - alloc < 40) {
        alloc = remaining
      }

      alloc = Math.round(alloc / 10) * 10
      if (alloc <= 0) alloc = 10
      if (alloc > remaining) alloc = remaining

      allocations.push({ nama: p.nama_pangkalan.split(' ')[0] || p.nama_pangkalan, qty: alloc })
      currentSum += alloc
    }

    rits.push({ ritIndex: i + 1, is360, allocations })
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dateStr = tomorrow.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })
  const dateShort = tomorrow.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })
  
  let result = `Rencana ${dateStr}\n\n`
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
  
  rits.forEach(rit => {
     result += `RIT ${roman[(rit.ritIndex - 1) % 10] || rit.ritIndex} {nama sopir} {nama SPBE}\n`
     rit.allocations.forEach(a => {
        result += `${a.nama} : ${a.qty} (${dateShort})\n`
     })
     result += '\n'
  })

  result += `{Plat Nomor Armada} Inap Jakpro\n{Plat Nomor Armada} Inap Sadikun\n`
  return result
}

export default function PerencanaanPage() {
  const { data: pangkalanList = [], isLoading } = useSWR<Pangkalan[]>('pangkalanList', () => getPangkalanList(), {
    revalidateOnFocus: false
  })

  const [showModal, setShowModal] = useState(false)
  const [closingModal, setClosingModal] = useState(false)
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState<'left' | 'right'>('right')

  // Form State
  const [totalDo, setTotalDo] = useState<number | 'custom'>(1)
  const [customTotalDo, setCustomTotalDo] = useState(5)
  
  const [do360, setDo360] = useState<number | 'custom' | 'tidak'>(0)
  const [customDo360, setCustomDo360] = useState(1)

  const [liburIds, setLiburIds] = useState<string[]>([])
  const [kurang100Ids, setKurang100Ids] = useState<string[]>([])

  const [generatedText, setGeneratedText] = useState('')

  const handleCloseModal = () => {
    setClosingModal(true)
    setTimeout(() => {
      setShowModal(false)
      setClosingModal(false)
      setStep(1)
    }, 300)
  }

  const handleNext = () => {
    setDirection('right')
    setStep(prev => prev + 1)
  }

  const handlePrev = () => {
    setDirection('left')
    setStep(prev => prev - 1)
  }

  const handleGenerate = () => {
    const finalTotalDo = totalDo === 'custom' ? customTotalDo : totalDo
    const finalDo360 = do360 === 'tidak' ? 0 : (do360 === 'custom' ? customDo360 : do360)

    if (finalDo360 > finalTotalDo) {
      toast.error('Jumlah DO 360 tidak boleh melebihi Total DO')
      return
    }

    const res = generatePerencanaan(pangkalanList, {
      totalDo: finalTotalDo,
      do360: finalDo360,
      liburIds,
      kurang100Ids
    })
    setGeneratedText(res)
    handleCloseModal()
    toast.success('Perencanaan berhasil dibuat!')
  }

  const copyToClipboard = () => {
    if (!generatedText) return
    navigator.clipboard.writeText(generatedText)
    toast.success('Disalin ke Clipboard')
  }

  const handleRegenerate = () => {
    const finalTotalDo = totalDo === 'custom' ? customTotalDo : totalDo
    const finalDo360 = do360 === 'tidak' ? 0 : (do360 === 'custom' ? customDo360 : do360)
    
    const res = generatePerencanaan(pangkalanList, {
      totalDo: finalTotalDo,
      do360: finalDo360,
      liburIds,
      kurang100Ids
    })
    setGeneratedText(res)
    toast.success('Rencana diacak ulang')
  }

  const renderStep1 = () => (
    <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>1. Berapa DO yang akan di kirim Besok?</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {[1, 2, 3, 4, 'custom'].map(val => (
          <button
            key={val}
            className={`btn ${totalDo === val ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTotalDo(val as any)}
            style={{ flex: 1, minWidth: 80 }}
          >
            {val === 'custom' ? 'Custom' : val}
          </button>
        ))}
      </div>
      {totalDo === 'custom' && (
        <input 
          type="number" 
          className="form-input" 
          value={customTotalDo} 
          onChange={e => setCustomTotalDo(parseInt(e.target.value) || 0)} 
          placeholder="Masukkan jumlah DO..." 
          min={1}
        />
      )}
    </div>
  )

  const renderStep2 = () => (
    <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>2. Apakah terdapat DO yang per-DO 360?</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {['tidak', 1, 2, 3, 4, 'custom'].map(val => {
          // Disable options that exceed totalDo
          const finalTotalDo = totalDo === 'custom' ? customTotalDo : totalDo;
          const isDisabled = typeof val === 'number' && val > finalTotalDo;
          return (
            <button
              key={val}
              className={`btn ${do360 === val ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDo360(val as any)}
              disabled={isDisabled}
              style={{ flex: 1, minWidth: 80, opacity: isDisabled ? 0.5 : 1 }}
            >
              {val === 'tidak' ? 'Tidak Ada' : (val === 'custom' ? 'Custom' : val)}
            </button>
          )
        })}
      </div>
      {do360 === 'custom' && (
        <input 
          type="number" 
          className="form-input" 
          value={customDo360} 
          onChange={e => setCustomDo360(parseInt(e.target.value) || 0)} 
          placeholder="Masukkan jumlah DO 360..." 
          min={1}
        />
      )}
    </div>
  )

  const renderStep3 = () => (
    <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>3. Pilih Pangkalan yang libur / tidak dikirim</h3>
      <div style={{ maxHeight: '40vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 8 }}>
        {pangkalanList.filter(p => p.status === 'aktif').map(p => (
          <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              style={{ width: 18, height: 18, accentColor: '#16a34a' }}
              checked={liburIds.includes(p.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setLiburIds([...liburIds, p.id])
                } else {
                  setLiburIds(liburIds.filter(id => id !== p.id))
                }
              }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nama_pangkalan}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{p.nama_pemilik}</div>
            </div>
          </label>
        ))}
        {pangkalanList.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Belum ada data pangkalan.</p>}
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>4. Pilih Pangkalan dengan stok kosong &lt; 100</h3>
      <div style={{ maxHeight: '40vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 8 }}>
        {pangkalanList.filter(p => p.status === 'aktif' && !liburIds.includes(p.id)).map(p => (
          <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              style={{ width: 18, height: 18, accentColor: '#16a34a' }}
              checked={kurang100Ids.includes(p.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setKurang100Ids([...kurang100Ids, p.id])
                } else {
                  setKurang100Ids(kurang100Ids.filter(id => id !== p.id))
                }
              }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nama_pangkalan}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{p.nama_pemilik}</div>
            </div>
          </label>
        ))}
        {pangkalanList.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Belum ada data pangkalan.</p>}
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '100%', padding: '0 0 40px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Perencanaan</h1>
          <p className="page-subtitle">Atur rencana alokasi DO untuk besok</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> BUAT PERENCANAAN
        </button>
      </div>

      {!generatedText ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
          <div style={{ padding: 24, background: 'rgba(22, 163, 74, 0.1)', borderRadius: '50%', color: '#16a34a' }}>
            <Settings2 size={48} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Belum Ada Perencanaan</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 400, textAlign: 'center' }}>
            Klik tombol "Buat Perencanaan" di atas untuk membagikan alokasi tabung secara otomatis ke pangkalan-pangkalan Anda.
          </p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: 8 }}>
            <Play size={16} /> Mulai Sekarang
          </button>
        </div>
      ) : (
        <div className="card animate-fade-in" style={{ padding: 24, marginTop: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={20} color="#16a34a" /> Hasil Generate
            </h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={handleRegenerate}>
                <RefreshCw size={16} /> Acak Ulang
              </button>
              <button className="btn btn-primary" onClick={copyToClipboard}>
                <Copy size={16} /> Salin
              </button>
            </div>
          </div>
          
          <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 12, padding: 24, overflowX: 'auto' }}>
            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 14, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
              {generatedText}
            </pre>
          </div>
        </div>
      )}

      {/* BOTTOM SHEET MODAL */}
      {(showModal || closingModal) && (
        <div className={`content-modal-overlay ${closingModal ? 'modal-overlay-exit' : 'modal-overlay-enter'}`} style={{ alignItems: 'flex-end', padding: 0 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={handleCloseModal} />
          
          <div className="card" style={{ 
            position: 'relative', 
            width: '100%', 
            maxWidth: 600, 
            margin: '0 auto',
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            padding: 0,
            zIndex: 101,
            animation: closingModal ? 'slideDown 0.3s ease forwards' : 'slideUp 0.3s ease backwards'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                Langkah {step} dari 4
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            
            <div style={{ padding: '32px 24px', minHeight: 300 }}>
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', gap: 12, background: 'var(--bg-surface)' }}>
              {step > 1 ? (
                <button className="btn btn-secondary" onClick={handlePrev}>
                  Kembali
                </button>
              ) : <div></div>}
              
              {step < 4 ? (
                <button className="btn btn-primary" onClick={handleNext}>
                  Lanjut <ChevronRight size={16} />
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleGenerate}>
                  <CheckSquare size={16} /> Buat Perencanaan
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes slideDown {
          from { transform: translateY(0); }
          to { transform: translateY(100%); }
        }
      `}} />
    </div>
  )
}
