'use client'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function DownloadReceiptButton({ booking }) {
  const downloadPDF = () => {
    const doc = new jsPDF()
    
    // Header
    doc.setFillColor(59, 130, 246) // Blue
    doc.rect(0, 0, 210, 40, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.text('BOOKING RECEIPT', 105, 15, { align: 'center' })
    
    doc.setFontSize(12)
    doc.text('Sports Booking System', 105, 25, { align: 'center' })
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, 32, { align: 'center' })
    
    // Reference ID Box
    doc.setFillColor(239, 246, 255)
    doc.setDrawColor(191, 219, 254)
    doc.rect(15, 50, 180, 20, 'FD')
    
    doc.setTextColor(30, 64, 175)
    doc.setFontSize(10)
    doc.text('BOOKING REFERENCE', 105, 58, { align: 'center' })
    
    doc.setFontSize(18)
    doc.setFont(undefined, 'bold')
    doc.text(booking.reference_id, 105, 67, { align: 'center' })
    
    // Booking Details Table
    doc.setFont(undefined, 'normal')
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.text('Booking Details', 15, 85)
    
    const bookingDetails = [
      ['Institution', booking.courts.institutions.name],
      ['Court', booking.courts.name],
      ['Sport', booking.sports?.name || 'N/A'],
      ['Date', new Date(booking.booking_date).toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })],
      ['Time', `${booking.start_time.substring(0, 5)} - ${booking.end_time.substring(0, 5)}`],
      ['Status', booking.status.charAt(0).toUpperCase() + booking.status.slice(1)]
    ]
    
    doc.autoTable({
      startY: 90,
      head: [],
      body: bookingDetails,
      theme: 'plain',
      styles: { fontSize: 11, cellPadding: 5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 120 }
      }
    })
    
    // Customer Details
    let currentY = doc.lastAutoTable.finalY + 10
    doc.setFontSize(12)
    doc.text('Customer Details', 15, currentY)
    
    const customerDetails = [
      ['Name', booking.customer_name],
      ['Phone', booking.customer_phone],
      ['Email', booking.customer_email || 'Not provided']
    ]
    
    doc.autoTable({
      startY: currentY + 5,
      head: [],
      body: customerDetails,
      theme: 'plain',
      styles: { fontSize: 11, cellPadding: 5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 120 }
      }
    })
    
    // Total Amount Box
    currentY = doc.lastAutoTable.finalY + 15
    doc.setFillColor(34, 197, 94) // Green
    doc.rect(15, currentY, 180, 15, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text('TOTAL AMOUNT', 25, currentY + 10)
    doc.text(`LKR ${booking.total_price?.toFixed(2) || '0.00'}`, 185, currentY + 10, { align: 'right' })
    
    // Venue Contact
    currentY = currentY + 25
    doc.setFont(undefined, 'normal')
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(10)
    doc.text('Venue Contact Information', 15, currentY)
    
    doc.setFontSize(9)
    doc.text(booking.courts.institutions.address, 15, currentY + 6)
    doc.text(`Phone: ${booking.courts.institutions.contact_number}`, 15, currentY + 12)
    
    // Important Notes
    currentY = currentY + 25
    doc.setFillColor(254, 243, 199)
    doc.setDrawColor(251, 191, 36)
    doc.rect(15, currentY, 180, 30, 'FD')
    
    doc.setTextColor(146, 64, 14)
    doc.setFont(undefined, 'bold')
    doc.setFontSize(10)
    doc.text('Important Notes:', 20, currentY + 7)
    
    doc.setFont(undefined, 'normal')
    doc.setFontSize(8)
    doc.text('• Please arrive 10 minutes before your booking time', 20, currentY + 13)
    doc.text('• Bring this reference ID for verification', 20, currentY + 18)
    doc.text('• Contact the venue if you need to cancel or reschedule', 20, currentY + 23)
    
    // Footer
    doc.setTextColor(150, 150, 150)
    doc.setFontSize(8)
    doc.text('Thank you for your booking!', 105, 280, { align: 'center' })
    doc.text('This is a computer-generated receipt', 105, 285, { align: 'center' })
    
    // Save PDF
    doc.save(`booking-receipt-${booking.reference_id}.pdf`)
  }

  return (
    <button
      onClick={downloadPDF}
      className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Download Receipt (PDF)
    </button>
  )
}
