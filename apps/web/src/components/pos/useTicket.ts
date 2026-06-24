'use client'

import { useRef, useCallback } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export function useTicket() {
  const ticketRef = useRef<HTMLDivElement>(null)

  const capturarCanvas = useCallback(async () => {
    if (!ticketRef.current) throw new Error('Ticket no disponible')
    return await html2canvas(ticketRef.current, {
      scale:           3,
      backgroundColor: '#ffffff',
      useCORS:         true,
      logging:         false,
    })
  }, [])

  const imprimir = useCallback(async (termica: boolean) => {
    if (!ticketRef.current) return

    const ventana = window.open('', '_blank')
    if (!ventana) return

    const estilos = termica
      ? `
        body { margin: 0; padding: 0; }
        @page { size: 80mm auto; margin: 0; }
        @media print { body { width: 80mm; } }
      `
      : `
        body { margin: 20px; }
        @page { size: A4; margin: 20mm; }
      `

    ventana.document.write(`
      <html>
        <head>
          <title>Ticket ${new Date().toISOString()}</title>
          <style>
            ${estilos}
            body { font-family: monospace; font-size: 12px; color: #000; }
          </style>
        </head>
        <body>
          ${ticketRef.current.innerHTML}
        </body>
      </html>
    `)
    ventana.document.close()
    ventana.focus()
    setTimeout(() => {
      ventana.print()
      ventana.close()
    }, 500)
  }, [])

  const descargarPDF = useCallback(async (folio: string) => {
    const canvas = await capturarCanvas()
    const imgData = canvas.toDataURL('image/png')

    const pdf    = new jsPDF('p', 'mm', 'a4')
    const pdfW   = pdf.internal.pageSize.getWidth()
    const ratio  = canvas.height / canvas.width
    const imgW   = pdfW * 0.6
    const imgH   = imgW * ratio
    const x      = (pdfW - imgW) / 2

    pdf.addImage(imgData, 'PNG', x, 20, imgW, imgH)
    pdf.save(`ticket-${folio}.pdf`)
  }, [capturarCanvas])

  const descargarImagen = useCallback(async (folio: string) => {
    const canvas = await capturarCanvas()
    const link   = document.createElement('a')
    link.download = `ticket-${folio}.png`
    link.href     = canvas.toDataURL('image/png')
    link.click()
  }, [capturarCanvas])

  const compartirWhatsApp = useCallback(async (
    folio:   string,
    total:   number,
    tipo:    'imagen' | 'pdf'
  ) => {
    try {
      if (tipo === 'imagen') {
        const canvas = await capturarCanvas()
        canvas.toBlob(async (blob) => {
          if (!blob) return
          const file = new File([blob], `ticket-${folio}.png`, { type: 'image/png' })

          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({
              files:  [file],
              title:  `Ticket ${folio}`,
            })
          } else {
            // Fallback: abrir WhatsApp con mensaje de texto
            const mensaje = encodeURIComponent(
              `🧾 *Ticket ${folio}*\nTotal: $${total.toFixed(2)}\n\nGracias por su compra.`
            )
            window.open(`https://wa.me/?text=${mensaje}`, '_blank')
          }
        }, 'image/png')
      } else {
        await descargarPDF(folio)
        const mensaje = encodeURIComponent(
          `🧾 *Ticket ${folio}*\nTotal: $${total.toFixed(2)}\n\nAdjunto encontrará su ticket en PDF.`
        )
        window.open(`https://wa.me/?text=${mensaje}`, '_blank')
      }
    } catch {
      const mensaje = encodeURIComponent(
        `🧾 *Ticket ${folio}*\nTotal: $${total.toFixed(2)}\n\nGracias por su compra.`
      )
      window.open(`https://wa.me/?text=${mensaje}`, '_blank')
    }
  }, [capturarCanvas, descargarPDF])

  return {
    ticketRef,
    imprimir,
    descargarPDF,
    descargarImagen,
    compartirWhatsApp,
  }
}