import * as XLSX from 'xlsx-js-style'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { LaporanDO } from '@/types'

export function exportLaporanDOExcel(data: LaporanDO[], spbe: string, periode: string) {
  const generateSingleExcel = (spbeName: string, filteredData: LaporanDO[]) => {
    if (filteredData.length === 0) return

    const now = new Date()
    let periodeText = periode
    if (periode === 'Bulanan') {
      const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
      periodeText = `${monthNames[now.getMonth()]} ${now.getFullYear()}`
    } else if (periode === 'Mingguan') {
      periodeText = '1 Minggu Terakhir'
    } else {
      const [year, month] = periode.split('-')
      const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
      periodeText = `${monthNames[parseInt(month, 10) - 1]} ${year}`
    }

    const dicetak = `Dicetak: ${now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`

    const rows: any[] = []
    
    // Header
    rows.push([{ v: 'LAPORAN PENEBUSAN DO', s: { font: { bold: true, sz: 14 }, alignment: { horizontal: 'center' } } }, null, null, null, null])
    rows.push([{ v: `SPBE: ${spbeName}`, s: { font: { bold: true } } }])
    rows.push([{ v: `Periode: ${periodeText}`, s: { font: { bold: true } } }])
    rows.push([{ v: dicetak, s: { font: { italic: true } } }])
    rows.push([])

    let items: any[] = []
    filteredData.forEach(laporan => {
      laporan.items?.forEach(item => items.push(item))
    })

    if (items.length > 0) {
      rows.push([{ v: 'Rincian DO', s: { font: { bold: true, sz: 12 } } }])
      
      // Table Header
      const headStyle = { font: { bold: true }, alignment: { horizontal: 'center' }, fill: { fgColor: { rgb: "F0F0F0" } } }
      rows.push([
        { v: 'NO', s: headStyle },
        { v: 'Tanggal', s: headStyle },
        { v: 'Jenis', s: headStyle },
        { v: 'Alokasi', s: headStyle },
        { v: 'Jumlah DO', s: headStyle }
      ])

      let totalAlokasi = 0
      let totalDo = 0
      let d_normal = 0
      let td_normal = 0
      let d_fakul = 0
      let td_fakul = 0

      items.forEach((item, index) => {
        totalAlokasi += item.alokasi
        totalDo += item.jumlah_do
        
        if (item.status_tebus) {
          if (item.jenis === 'Fakultatif') d_fakul += item.jumlah_do
          else d_normal += item.jumlah_do
        } else {
          if (item.jenis === 'Fakultatif') td_fakul += item.jumlah_do
          else td_normal += item.jumlah_do
        }

        const checkMark = item.status_tebus ? ' (v)' : ''
        const centerStyle = { alignment: { horizontal: 'center' } }

        rows.push([
          { v: index + 1, t: 'n', s: centerStyle },
          { v: new Date(item.tanggal).toLocaleDateString('id-ID'), s: centerStyle },
          { v: item.jenis, s: centerStyle },
          { v: item.alokasi, t: 'n', s: centerStyle },
          { v: `${item.jumlah_do}${checkMark}`, s: centerStyle }
        ])
      })

      // Table Footer
      const footerStyle = { font: { bold: true }, alignment: { horizontal: 'center' }, fill: { fgColor: { rgb: "F8FAFC" } } }
      rows.push([
        { v: 'Total', s: { font: { bold: true }, alignment: { horizontal: 'right' }, fill: { fgColor: { rgb: "F8FAFC" } } } },
        null,
        null,
        { v: totalAlokasi, t: 'n', s: footerStyle },
        { v: totalDo, t: 'n', s: footerStyle }
      ])

      rows.push([])
      rows.push([])

      // Summary Table
      rows.push([
        null,
        { v: 'Ditebus', s: headStyle },
        { v: 'Tidak Ditebus', s: headStyle }
      ])
      rows.push([
        { v: 'Normal', s: { font: { bold: true } } },
        { v: d_normal, t: 'n', s: { font: { bold: true }, alignment: { horizontal: 'center' } } },
        { v: td_normal, t: 'n', s: { font: { bold: true }, alignment: { horizontal: 'center' } } }
      ])
      rows.push([
        { v: 'Fakultatif', s: { font: { bold: true } } },
        { v: d_fakul, t: 'n', s: { font: { bold: true }, alignment: { horizontal: 'center' } } },
        { v: td_fakul, t: 'n', s: { font: { bold: true }, alignment: { horizontal: 'center' } } }
      ])
    }

    const ws = XLSX.utils.aoa_to_sheet(rows)
    
    // Merge LAPORAN PENEBUSAN DO row
    if(!ws['!merges']) ws['!merges'] = []
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } })
    // Merge Total row (NO to Jenis)
    const totalRowIdx = rows.findIndex(r => r[0] && r[0].v === 'Total')
    if (totalRowIdx !== -1) {
      ws['!merges'].push({ s: { r: totalRowIdx, c: 0 }, e: { r: totalRowIdx, c: 2 } })
    }

    // Column widths
    ws['!cols'] = [
      { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan DO')
    XLSX.writeFile(wb, `Laporan_DO_${spbeName}_${periode}.xlsx`)
  }

  const now = new Date()
  const filteredByDate = data.filter(d => {
    const dDate = new Date(d.created_at)
    if (periode === 'Mingguan') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return dDate >= oneWeekAgo
    } else if (periode === 'Bulanan') { 
      return dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear()
    } else {
      const [year, month] = periode.split('-')
      return dDate.getFullYear() === parseInt(year, 10) && dDate.getMonth() === parseInt(month, 10) - 1
    }
  })

  if (spbe === 'Semua') {
    const dataSadikun = filteredByDate.filter(d => d.spbe === 'SADIKUN')
    const dataJakpro = filteredByDate.filter(d => d.spbe === 'JAKPRO')
    if (dataSadikun.length > 0) generateSingleExcel('SADIKUN', dataSadikun)
    if (dataJakpro.length > 0) generateSingleExcel('JAKPRO', dataJakpro)
  } else {
    const dataSpbe = filteredByDate.filter(d => d.spbe === spbe)
    if (dataSpbe.length > 0) generateSingleExcel(spbe, dataSpbe)
  }
}

export function exportLaporanDOPDF(data: LaporanDO[], spbe: string, periode: string) {
  const generateSinglePDF = (spbeName: string, filteredData: LaporanDO[]) => {
    if (filteredData.length === 0) return

    const doc = new jsPDF()
    const now = new Date()
    
    let periodeText = periode
    if (periode === 'Bulanan') {
      const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
      periodeText = `${monthNames[now.getMonth()]} ${now.getFullYear()}`
    } else if (periode === 'Mingguan') {
      periodeText = '1 Minggu Terakhir'
    } else {
      const [year, month] = periode.split('-')
      const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
      periodeText = `${monthNames[parseInt(month, 10) - 1]} ${year}`
    }

    const pageWidth = doc.internal.pageSize.width

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('LAPORAN PENEBUSAN DO', pageWidth / 2, 20, { align: 'center' })
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`SPBE: `, 14, 28)
    doc.setFont('helvetica', 'bold')
    doc.text(`${spbeName}`, 26, 28)

    doc.setFont('helvetica', 'normal')
    doc.text(`Periode: `, 14, 34)
    doc.setFont('helvetica', 'bold')
    doc.text(`${periodeText}`, 28, 34)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Dicetak: ${now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - 14, 34, { align: 'right' })

    // Removed double line header per request

    let currentY = 42

    let items: any[] = []
    filteredData.forEach(laporan => {
      laporan.items?.forEach(item => items.push(item))
    })

    if (items.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text('Rincian DO', 14, currentY)
      
      let totalAlokasi = 0
      let totalDo = 0

      let d_normal = 0
      let td_normal = 0
      let d_fakul = 0
      let td_fakul = 0

      const body = items.map((item, index) => {
        totalAlokasi += item.alokasi
        totalDo += item.jumlah_do
        
        if (item.status_tebus) {
          if (item.jenis === 'Fakultatif') d_fakul += item.jumlah_do
          else d_normal += item.jumlah_do
        } else {
          if (item.jenis === 'Fakultatif') td_fakul += item.jumlah_do
          else td_normal += item.jumlah_do
        }

        const checkMark = item.status_tebus ? ' (v)' : ''

        return [
          { content: (index + 1).toString(), styles: { halign: 'center' } } as any,
          { content: new Date(item.tanggal).toLocaleDateString('id-ID'), styles: { halign: 'center' } } as any,
          { content: item.jenis, styles: { halign: 'center' } } as any,
          { content: item.alokasi.toLocaleString('id-ID'), styles: { halign: 'center' } } as any,
          { content: item.jumlah_do.toLocaleString('id-ID') + checkMark, styles: { halign: 'center' } } as any
        ]
      })

      body.push([
        { content: 'Total', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold', fillColor: [248, 250, 252] } } as any,
        { content: totalAlokasi.toLocaleString('id-ID'), styles: { halign: 'center', fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: totalDo.toLocaleString('id-ID'), styles: { halign: 'center', fontStyle: 'bold', fillColor: [248, 250, 252] } }
      ])

      autoTable(doc, {
        startY: currentY + 2,
        head: [[
          { content: 'NO', styles: { halign: 'center' } } as any,
          { content: 'Tanggal', styles: { halign: 'center' } } as any,
          { content: 'Jenis', styles: { halign: 'center' } } as any,
          { content: 'Alokasi', styles: { halign: 'center' } } as any,
          { content: 'Jumlah DO', styles: { halign: 'center' } } as any
        ]],
        body: body,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2, textColor: [40, 40, 40] },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1, lineColor: [200, 200, 200] },
        bodyStyles: { lineWidth: 0.1, lineColor: [220, 220, 220] },
        rowPageBreak: 'avoid',
        margin: { bottom: 15 }
      })

      const finalY = (doc as any).lastAutoTable.finalY

      autoTable(doc, {
        startY: finalY + 4,
        head: [[
          { content: '', styles: { halign: 'center' } } as any,
          { content: 'Ditebus', styles: { halign: 'center' } } as any,
          { content: 'Tidak Ditebus', styles: { halign: 'center' } } as any
        ]],
        body: [
          [
            { content: 'Normal', styles: { halign: 'left' } } as any, 
            { content: d_normal.toLocaleString('id-ID'), styles: { halign: 'center', fontStyle: 'bold' } } as any,
            { content: td_normal.toLocaleString('id-ID'), styles: { halign: 'center', fontStyle: 'bold' } } as any
          ],
          [
            { content: 'Fakultatif', styles: { halign: 'left' } } as any, 
            { content: d_fakul.toLocaleString('id-ID'), styles: { halign: 'center', fontStyle: 'bold' } } as any,
            { content: td_fakul.toLocaleString('id-ID'), styles: { halign: 'center', fontStyle: 'bold' } } as any
          ]
        ],
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2, textColor: [40, 40, 40] },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1, lineColor: [200, 200, 200] },
        bodyStyles: { lineWidth: 0.1, lineColor: [220, 220, 220] },
        tableWidth: 100,
        margin: { left: 14, bottom: 15 }
      })
    }

    // PAGE NUMBERS
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 10, { align: 'right' })
    }

    doc.save(`Laporan_DO_${spbeName}_${periode}.pdf`)
  }

  const now = new Date()
  const filteredByDate = data.filter(d => {
    const dDate = new Date(d.created_at)
    if (periode === 'Mingguan') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return dDate >= oneWeekAgo
    } else if (periode === 'Bulanan') { 
      return dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear()
    } else {
      const [year, month] = periode.split('-')
      return dDate.getFullYear() === parseInt(year, 10) && dDate.getMonth() === parseInt(month, 10) - 1
    }
  })

  if (spbe === 'Semua') {
    const dataSadikun = filteredByDate.filter(d => d.spbe === 'SADIKUN')
    const dataJakpro = filteredByDate.filter(d => d.spbe === 'JAKPRO')
    if (dataSadikun.length > 0) generateSinglePDF('SADIKUN', dataSadikun)
    if (dataJakpro.length > 0) generateSinglePDF('JAKPRO', dataJakpro)
  } else {
    const dataSpbe = filteredByDate.filter(d => d.spbe === spbe)
    if (dataSpbe.length > 0) generateSinglePDF(spbe, dataSpbe)
  }
}
