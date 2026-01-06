"use client";

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function DownloadReceiptButton({ booking }) {
  const downloadPDF = () => {
    const doc = new jsPDF()
    
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)

    // --- HELPER: Draw Logo Icon (SVG) ---
    const drawLogoIcon = (x, y, width) => {
        const scale = width / 120
        const h = 100 * scale
        doc.setDrawColor(17, 24, 39)
        doc.setLineWidth(0.5)
        doc.roundedRect(x + (10 * scale), y + (10 * scale), 100 * scale, 80 * scale, 2, 2)
        doc.line(x + (60 * scale), y + (10 * scale), x + (60 * scale), y + (90 * scale))
        doc.line(x + (10 * scale), y + (50 * scale), x + (110 * scale), y + (50 * scale))
        doc.circle(x + (60 * scale), y + (50 * scale), 15 * scale)
        return h
    }

    // Helper: Draw rounded colored box
    const drawRoundedBox = (y, height, bgColor, borderColor) => {
      doc.setFillColor(...bgColor)
      doc.setDrawColor(...borderColor)
      doc.roundedRect(margin, y, contentWidth, height, 3, 3, 'FD')
    }

    // Start slightly lower to look better
    let currentY = 20 

    // --- 1. LOGO + BRAND NAME ---
    const logoIconWidth = 18 // Restored size
    const logoGap = 5
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18) // Restored size
    const brandName = "CourtBooker"
    const textWidth = doc.getTextWidth(brandName)
    
    const totalLogoWidth = logoIconWidth + logoGap + textWidth
    const startX = (pageWidth - totalLogoWidth) / 2
    
    drawLogoIcon(startX, currentY, logoIconWidth)
    
    doc.setTextColor(17, 24, 39)
    doc.text(brandName, startX + logoIconWidth + logoGap, currentY + 11)
    
    // INCREASED GAP: Logo to Header
    currentY += 25 

    // --- 2. HEADER ---
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    const titleText = 'Booking Confirmed!'
    const titleWidth = doc.getTextWidth(titleText)
    const tickWidth = 10
    const tickGap = 5
    
    const headerGroupWidth = titleWidth + tickGap + tickWidth
    const headerStartX = (pageWidth - headerGroupWidth) / 2
    
    doc.setTextColor(17, 24, 39)
    doc.text(titleText, headerStartX, currentY)
    
    const tickStartX = headerStartX + titleWidth + tickGap
    const tickStartY = currentY - 2
    
    doc.setDrawColor(22, 163, 74)
    doc.setLineWidth(2.5)
    doc.setLineCap('round')
    doc.setLineJoin('round')
    doc.lines([[3, 3], [7, -9]], tickStartX, tickStartY, [1, 1], 'S', false)

    currentY += 10
    doc.setTextColor(107, 114, 128)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Your booking has been successfully created', pageWidth / 2, currentY, { align: 'center' })

    // INCREASED GAP: Header to Reference Box
    currentY += 10 

    // --- 3. Reference Box ---
    const boxHeight = 45 // Restored height
    drawRoundedBox(currentY, boxHeight, [239, 246, 255], [219, 234, 254])

    const boxY = currentY
    doc.setTextColor(59, 130, 246)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Your Booking Reference', margin + 10, boxY + 12)

    doc.setTextColor(30, 64, 175)
    doc.setFontSize(22) 
    doc.text(booking.reference_id || 'REF-MISSING', margin + 10, boxY + 25)

    doc.setTextColor(107, 114, 128)
    doc.setFontSize(11) // Readable size
    doc.setFont('helvetica', 'normal')
    doc.text('Save this reference ID to track your booking', margin + 10, boxY + 35)

    // INCREASED GAP: Reference Box to Booking Details
    currentY += boxHeight + 10

    // --- 4. Booking Details ---
    doc.setTextColor(17, 24, 39)
    doc.setFontSize(15) 
    doc.setFont('helvetica', 'bold')
    doc.text('Booking Details', margin, currentY)

    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.5)
    doc.line(margin, currentY + 3, pageWidth - margin, currentY + 3)

    const startDate = new Date(booking.booking_date)
    const formattedDate = startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const timeRange = `${booking.start_time.substring(0, 5)} - ${booking.end_time.substring(0, 5)}`

    const gridBody = [
        ['Institution', 'Court'],
        [booking.courts.institutions.name, booking.courts.name],
        ['', ''], 
        ['Sport', 'Date'],
        [booking.sports?.name || 'N/A', formattedDate],
        ['', ''],
        ['Time', 'Total Amount'],
        [timeRange, `LKR ${booking.total_price?.toFixed(2) || '0.00'}`],
        ['', ''],
        ['Customer Name', 'Phone Number'],
        [booking.customer_name, booking.customer_phone]
    ]

    autoTable(doc, {
      startY: currentY + 8,
      margin: { left: margin, right: margin },
      head: [],
      body: gridBody,
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 0.5,
        textColor: [31, 41, 55],
      },
      columnStyles: {
        0: { cellWidth: '50%' },
        1: { cellWidth: '50%' }
      },
      didParseCell: (data) => {
        const row = data.row.index
        const col = data.column.index
        if (row % 3 === 0 && row !== 12) {
            data.cell.styles.textColor = [107, 114, 128]
            data.cell.styles.fontSize = 11 
            data.cell.styles.fontStyle = 'bold'
            data.cell.styles.cellPadding = { top: 2, bottom: 0, left: 0.5, right: 0.5 }
        } else if ((row - 1) % 3 === 0) {
            data.cell.styles.fontStyle = 'normal'
            data.cell.styles.cellPadding = { top: 0, bottom: 2, left: 0.5, right: 0.5 }
            if (row === 7 && col === 1) {
                data.cell.styles.textColor = [22, 163, 74]
                data.cell.styles.fontStyle = 'bold'
                data.cell.styles.fontSize = 12
            }
        }
      }
    })

    // INCREASED GAP: Booking Details to Venue Contact
    currentY = doc.lastAutoTable.finalY  + 5

    // --- 5. Venue Contact ---
    const contactHeight = 35 
    drawRoundedBox(currentY, contactHeight, [249, 250, 251], [243, 244, 246])
    
    doc.setTextColor(17, 24, 39)
    doc.setFontSize(15)
    doc.setFont('helvetica', 'bold')
    doc.text('Venue Contact', margin + 10, currentY + 10)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(75, 85, 99)
    doc.text(booking.courts.institutions.address || 'Address not provided', margin + 10, currentY + 18)
    doc.text(`Phone: ${booking.courts.institutions.contact_number || 'N/A'}`, margin + 10, currentY + 25)

    // INCREASED GAP: Venue Contact to Important Notes
    currentY += contactHeight + 10

    // --- 6. Important Notes ---
    const notesHeight = 40 
    drawRoundedBox(currentY, notesHeight, [254, 252, 232], [254, 240, 138])

    doc.setTextColor(161, 98, 7)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Important', margin + 10, currentY + 10)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('• Please arrive 10 minutes before your booking time', margin + 12, currentY + 18)
    doc.text('• Bring your reference ID for verification', margin + 12, currentY + 24)
    doc.text('• Contact the venue if you need to cancel or reschedule', margin + 12, currentY + 60)

    // --- 7. Footer ---
    const footerY = pageHeight - 5
    doc.setTextColor(156, 163, 175)
    doc.setFontSize(8)
    doc.text('This is a computer-generated receipt', pageWidth / 2, footerY, { align: 'center' })

    doc.save(`booking-receipt-${booking.reference_id}.pdf`)
  }

  return (
    <button 
      onClick={downloadPDF}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
    >
      Download Receipt
    </button>
  )
}