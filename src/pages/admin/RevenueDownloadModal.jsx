import { useState } from 'react'
import { formatCurrency } from './adminData'

const RevenueDownloadModal = ({ isOpen, onClose, payments, stats }) => {
  const [downloadType, setDownloadType] = useState('custom')
  const [fileFormat, setFileFormat] = useState('csv')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const filterPaymentsByDateRange = () => {
    if (!payments || payments.length === 0) return []

    let filtered = [...payments]
    const now = new Date()
    let start, end

    if (downloadType === 'daily') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      end = new Date(start.getTime() + 86400000)
    } else if (downloadType === 'weekly') {
      const day = now.getDay()
      start = new Date(now)
      start.setDate(now.getDate() - day)
      start.setHours(0, 0, 0, 0)
      end = new Date(start.getTime() + 604800000)
    } else if (downloadType === 'monthly') {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    } else if (downloadType === 'annually') {
      start = new Date(now.getFullYear(), 0, 1)
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
    } else if (downloadType === 'custom' && startDate && endDate) {
      start = new Date(startDate)
      end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
    } else {
      return []
    }

    return filtered.filter((payment) => {
      const paymentDate = payment.createdAt 
        ? new Date(payment.createdAt)
        : (payment.checkIn ? new Date(payment.checkIn) : new Date(payment.date))
      
      return paymentDate >= start && paymentDate <= end
    })
  }

  const generateCSV = () => {
    const filteredPayments = filterPaymentsByDateRange()
    
    if (filteredPayments.length === 0) {
      alert('No data found for the selected date range.')
      return
    }

    const headers = [
      'Date',
      'Reference Number',
      'Guest Name',
      'Email',
      'Phone',
      'Type',
      'Item',
      'Check-in',
      'Check-out',
      'Guests',
      'Deposit Amount',
      'Total Amount',
      'Payment Status'
    ]

    const rows = filteredPayments.map((payment) => [
      payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('en-PH') : '',
      payment.referenceNumber || '',
      `${payment.firstName || ''} ${payment.lastName || ''}`.trim(),
      payment.email || '',
      payment.phone || '',
      payment.type === 'zipline' ? 'Zipline' : 'Room',
      payment.type === 'zipline' 
        ? payment.activity?.title || 'Zipline'
        : payment.room?.title || 'N/A',
      payment.checkIn ? new Date(payment.checkIn).toLocaleDateString('en-PH') : '',
      payment.checkOut ? new Date(payment.checkOut).toLocaleDateString('en-PH') : '',
      payment.guests || '',
      payment.depositAmount || 0,
      payment.totalAmount || 0,
      payment.paymentStatus || 'pending'
    ])

    const totalDeposit = filteredPayments.reduce((sum, p) => sum + Number(p.depositAmount || 0), 0)
    const totalAmount = filteredPayments.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0)

    rows.push([])
    rows.push(['SUMMARY', '', '', '', '', '', '', '', '', '', '', '', ''])
    rows.push(['Total Bookings', filteredPayments.length, '', '', '', '', '', '', '', '', '', '', ''])
    rows.push(['Total Deposit Collected', '', '', '', '', '', '', '', '', '', totalDeposit, '', ''])
    rows.push(['Total Amount', '', '', '', '', '', '', '', '', '', totalAmount, '', ''])

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    downloadFile(csv, 'revenue-report.csv', 'text/csv')
  }

  const generatePDF = () => {
    const filteredPayments = filterPaymentsByDateRange()
    
    if (filteredPayments.length === 0) {
      alert('No data found for the selected date range.')
      return
    }

    // Simple HTML to PDF conversion using a data URI
    const dateRange = getDateRangeLabel()
    const totalDeposit = filteredPayments.reduce((sum, p) => sum + Number(p.depositAmount || 0), 0)
    const totalAmount = filteredPayments.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0)

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Revenue Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; background: white; color: #333; }
          .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #d94e28; padding-bottom: 20px; }
          .header h1 { color: #122b36; font-size: 28px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 14px; }
          .date-range { color: #999; font-size: 12px; margin-top: 10px; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
          .summary-item { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #d94e28; }
          .summary-item label { display: block; color: #999; font-size: 12px; margin-bottom: 5px; text-transform: uppercase; }
          .summary-item .value { font-size: 24px; font-weight: bold; color: #122b36; }
          .table-section { margin-bottom: 40px; }
          .table-section h2 { color: #122b36; font-size: 16px; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #122b36; color: white; padding: 12px; text-align: left; font-size: 12px; font-weight: bold; }
          td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 12px; }
          tr:hover { background: #f9f9f9; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 11px; }
          .date { margin: 5px 0; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Revenue Report</h1>
            <p>Sablayan Adventure Camp Beach Resort</p>
            <div class="date-range">
              <div class="date">Period: ${dateRange}</div>
              <div class="date">Generated: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>

          <div class="summary">
            <div class="summary-item">
              <label>Total Bookings</label>
              <div class="value">${filteredPayments.length}</div>
            </div>
            <div class="summary-item">
              <label>Deposit Collected</label>
              <div class="value">${formatCurrency(totalDeposit)}</div>
            </div>
            <div class="summary-item">
              <label>Total Amount</label>
              <div class="value">${formatCurrency(totalAmount)}</div>
            </div>
          </div>

          <div class="table-section">
            <h2>Booking Details</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Guest</th>
                  <th>Type</th>
                  <th>Item</th>
                  <th>Deposit</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${filteredPayments.map((payment) => `
                  <tr>
                    <td>${payment.createdAt ? new Date(payment.createdAt).toLocaleDateString('en-PH') : ''}</td>
                    <td>${payment.referenceNumber || 'N/A'}</td>
                    <td>${`${payment.firstName || ''} ${payment.lastName || ''}`.trim()}</td>
                    <td>${payment.type === 'zipline' ? 'Zipline' : 'Room'}</td>
                    <td>${payment.type === 'zipline' ? payment.activity?.title || 'Zipline' : payment.room?.title || 'N/A'}</td>
                    <td>${formatCurrency(payment.depositAmount || 0)}</td>
                    <td>${formatCurrency(payment.totalAmount || 0)}</td>
                    <td>${payment.paymentStatus || 'pending'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>This is a system-generated report. For inquiries, contact: sablayanadventurecamp@gmail.com</p>
          </div>
        </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const getDateRangeLabel = () => {
    if (downloadType === 'daily') {
      return `Today - ${new Date().toLocaleDateString('en-PH')}`
    } else if (downloadType === 'weekly') {
      const now = new Date()
      const day = now.getDay()
      const start = new Date(now)
      start.setDate(now.getDate() - day)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      return `${start.toLocaleDateString('en-PH')} to ${end.toLocaleDateString('en-PH')}`
    } else if (downloadType === 'monthly') {
      return new Date().toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
    } else if (downloadType === 'annually') {
      return new Date().getFullYear().toString()
    } else if (downloadType === 'custom' && startDate && endDate) {
      return `${new Date(startDate).toLocaleDateString('en-PH')} to ${new Date(endDate).toLocaleDateString('en-PH')}`
    }
    return 'Custom Range'
  }

  const downloadFile = (content, filename, type) => {
    const element = document.createElement('a')
    element.setAttribute('href', `data:${type};charset=utf-8,${encodeURIComponent(content)}`)
    element.setAttribute('download', filename)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleDownload = () => {
    if (downloadType === 'custom' && (!startDate || !endDate)) {
      alert('Please select both start and end dates for custom range.')
      return
    }

    if (fileFormat === 'csv') {
      generateCSV()
    } else {
      generatePDF()
    }

    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content download-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title-group">
            <div className="modal-icon">
              <i className="fas fa-download"></i>
            </div>
            <div>
              <h2>Download Revenue Report</h2>
              <p className="subtitle">Export revenue data as CSV or PDF</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body download-modal-body">
          <div className="form-section">
            <h3>Select Period</h3>
            <div className="period-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="period"
                  value="daily"
                  checked={downloadType === 'daily'}
                  onChange={(e) => setDownloadType(e.target.value)}
                />
                <span>Daily (Today)</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="period"
                  value="weekly"
                  checked={downloadType === 'weekly'}
                  onChange={(e) => setDownloadType(e.target.value)}
                />
                <span>Weekly (This Week)</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="period"
                  value="monthly"
                  checked={downloadType === 'monthly'}
                  onChange={(e) => setDownloadType(e.target.value)}
                />
                <span>Monthly (This Month)</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="period"
                  value="annually"
                  checked={downloadType === 'annually'}
                  onChange={(e) => setDownloadType(e.target.value)}
                />
                <span>Annually (This Year)</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="period"
                  value="custom"
                  checked={downloadType === 'custom'}
                  onChange={(e) => setDownloadType(e.target.value)}
                />
                <span>Custom Range</span>
              </label>
            </div>
          </div>

          {downloadType === 'custom' && (
            <div className="form-section">
              <h3>Select Dates</h3>
              <div className="date-inputs">
                <div className="date-input-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="date-input-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="form-section">
            <h3>File Format</h3>
            <div className="format-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={fileFormat === 'csv'}
                  onChange={(e) => setFileFormat(e.target.value)}
                />
                <span><i className="fas fa-file-csv"></i> CSV</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={fileFormat === 'pdf'}
                  onChange={(e) => setFileFormat(e.target.value)}
                />
                <span><i className="fas fa-file-pdf"></i> PDF</span>
              </label>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-download" onClick={handleDownload}>
            <i className="fas fa-download"></i> Download Report
          </button>
        </div>
      </div>
    </div>
  )
}

export default RevenueDownloadModal
