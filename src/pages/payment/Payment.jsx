// Payment page imports.
// This page receives booking details from the prior booking flow,
// displays QR payment instructions, and submits the receipt with
// the user's GCash reference number to Firebase.
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ref, push, set } from 'firebase/database'
import { db } from '../../firebase'
import { useAuth } from '../../AuthContext'
import Navbar from '../../components/Navbar'
import PageLoader from '../../components/PageLoader'
import { uploadToCloudinaryUnsigned } from '../../utils/cloudinary'
import { preloadImage } from '../../utils/pageLoad'
import { CHECK_IN_TIME, CHECK_OUT_TIME, formatPolicyTime } from '../../utils/bookingPolicy'
import './Payment.css'

// QR Code image for the GCash scan card section.
import qrImage from '../../assets/images/qr.png'

const Payment = () => {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  const bookingData = location.state?.bookingData || null
  const [referenceNumber, setReferenceNumber] = useState('')
  const [receiptFile, setReceiptFile] = useState(null)
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [pageReady, setPageReady] = useState(false)

  // Preload the QR image so the payment screen is ready before display.
  useEffect(() => {
    let active = true

    preloadImage(qrImage).finally(() => {
      if (active) {
        setPageReady(true)
      }
    })

    return () => {
      active = false
    }
  }, [])

  // Submit the payment form.
  // Uploads the receipt to Cloudinary, builds the booking payload,
  // and stores the booking record in Firebase with pending approval.
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!referenceNumber.trim()) {
      alert('Please enter your GCash reference number')
      return
    }

    if (!user?.email) {
      alert('Please sign in before completing your booking.')
      navigate('/auth', { state: { from: { pathname: '/payment' } } })
      return
    }

    if (!bookingData) {
      alert('No booking data found. Please start a new booking.')
      navigate('/booking')
      return
    }

    if (!receiptFile) {
      alert('Please upload your payment receipt screenshot.')
      return
    }

    setIsSubmitting(true)

    try {
      const uploadResult = await uploadToCloudinaryUnsigned(receiptFile)
      const fullName = bookingData.name || ''
      const [firstName, ...restNames] = fullName.trim().split(' ')
      const lastName = restNames.join(' ')

      const bookingPayload = {
        ...bookingData,
        email: user.email,
        userId: user.uid,
        firstName: firstName || bookingData.name || 'Guest',
        lastName: lastName || '',
        referenceNumber,
        paymentReceiptUrl: uploadResult.secure_url || '',
        paymentStatus: 'pending',
        bookingStatus: 'pending',
        createdAt: new Date().toISOString()
      }

      const bookingsRef = ref(db, 'bookings')
      const bookingRef = push(bookingsRef)
      await set(bookingRef, bookingPayload)

      // Send booking confirmation email
      try {
        const emailResponse = await fetch('https://sablayan-backend.onrender.com/emailjs/booking-confirmation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: bookingData.name,
            email: user.email,
            booking_type: bookingData.type === 'room' ? 'Room' : 'Zipline',
            date: bookingData.type === 'room' ? bookingData.checkIn : bookingData.date,
            guests: bookingData.guests.toString()
          })
        })

        const emailResult = await emailResponse.json()
        if (emailResult.success) {
          console.log('✓ Confirmation email sent successfully')
        } else {
          console.warn('Email sending failed, but booking was created:', emailResult.error)
        }
      } catch (emailError) {
        console.warn('Email service error (booking still created):', emailError)
      }

      setShowApprovalModal(true)
      
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to process payment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update receipt file state and create a temporary preview URL.
  const handleReceiptChange = (e) => {
    const file = e.target.files?.[0] || null
    setReceiptFile(file)
    if (file) {
      setReceiptPreviewUrl(URL.createObjectURL(file))
    } else {
      setReceiptPreviewUrl('')
    }
  }

  // If the page is loaded without booking details, show an error and
  // route the user back to the booking page.
  if (!bookingData) {
    return (
      <div id="payment-page-root">
        <Navbar />
        <div className="payment-error">
          <h2>No Booking Data Found</h2>
          <p>Please complete the booking form first.</p>
          <button onClick={() => navigate('/booking')} className="back-btn">
            Go to Booking
          </button>
        </div>
      </div>
    )
  }

  // Guard against a mismatch between the booking owner and the signed-in user.
  if (bookingData.email && user?.email && bookingData.email !== user.email) {
    return (
      <div id="payment-page-root">
        <Navbar />
        <div className="payment-error">
          <h2>Account Mismatch</h2>
          <p>Please restart the booking using the currently signed-in account.</p>
          <button onClick={() => navigate('/booking')} className="back-btn">
            Back to Booking
          </button>
        </div>
      </div>
    )
  }

  if (showApprovalModal) {
    return (
      <div id="payment-page-root">
        <Navbar />
        <div className="approval-modal-overlay">
          <div className="approval-modal">
            <div className="approval-modal-body">
              <div className="approval-left">
                <div className="approval-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <h2>Payment Successful!</h2>
                <p>Your payment has been received. Please wait for approval.</p>
              </div>
              <div className="approval-right">
                <div className="approval-details">
                  <p><strong>Reference:</strong> {referenceNumber}</p>
                  <p><strong>Status:</strong> <span className="pending">Pending Approval</span></p>
                </div>
                <p className="approval-message">
                  You will receive a confirmation once your booking is approved. 
                  Thank you for choosing Sablayan Adventure Camp!
                </p>
                <button 
                  className="approval-home-btn"
                  onClick={() => navigate('/')}
                >
                  Return to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showSuccess) {
    return (
      <div id="payment-page-root">
        <Navbar />
        <div className="payment-success">
          <div className="success-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <h2>Payment Submitted!</h2>
          <p>Your booking has been confirmed.</p>
          <p className="success-details">
            Reference: <strong>{referenceNumber}</strong>
          </p>
          <p className="redirect-message">Redirecting to home...</p>
        </div>
      </div>
    )
  }

  return (
    <div id="payment-page-root">
      {!pageReady && <PageLoader text="Loading payment details..." />}
      <Navbar />
      
      <main className="payment-page-content">
        <header className="payment-hero">
          <div className="hero-content">
            <h1>Complete Your Payment</h1>
            <p>Scan the QR code using your GCash app</p>
          </div>
        </header>

        <div className="payment-container">
          <div className="payment-grid">
            {/* Payment Instructions */}
            <section className="payment-instructions">
              <div className="instruction-card">
                <h2><i className="fas fa-mobile-alt"></i> How to Pay</h2>
                <ol className="steps-list">
                  <li>
                    <span className="step-number">1</span>
                    <div className="step-content">
                      <strong>Open GCash App</strong>
                      <p>Launch your GCash application on your phone</p>
                    </div>
                  </li>
                  <li>
                    <span className="step-number">2</span>
                    <div className="step-content">
                      <strong>Scan QR Code</strong>
                      <p>Use the QR scanner to scan the payment code</p>
                    </div>
                  </li>
                  <li>
                    <span className="step-number">3</span>
                    <div className="step-content">
                      <strong>Enter Amount</strong>
                      <p>Enter the exact amount shown below</p>
                    </div>
                  </li>
                  <li>
                    <span className="step-number">4</span>
                    <div className="step-content">
                      <strong>Confirm Payment</strong>
                      <p>Complete the transaction and copy the reference number</p>
                    </div>
                  </li>
                  <li>
                    <span className="step-number">5</span>
                    <div className="step-content">
                      <strong>Enter Reference</strong>
                      <p>Paste your GCash reference number below</p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Booking Summary */}
              <div className="payment-summary">
                <h3>Booking Summary</h3>
                <div className="summary-details">
                  {bookingData.type === 'room' ? (
                    <>
                      <div className="detail-row">
                        <span>Activity</span>
                        <span><i className="fas fa-bed"></i> Room Accommodation</span>
                      </div>
                      <div className="detail-row">
                        <span>Room</span>
                        <span>{bookingData.room?.title} - {bookingData.room?.subtitle}</span>
                      </div>
                      <div className="detail-row">
                        <span>Check-in</span>
                        <span>{bookingData.checkIn ? new Date(bookingData.checkIn).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set'}</span>
                      </div>
                      <div className="detail-row">
                        <span>Check-out</span>
                        <span>{bookingData.checkOut ? new Date(bookingData.checkOut).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set'}</span>
                      </div>
                      <div className="detail-row">
                        <span>Check-in Time</span>
                        <span>{formatPolicyTime(CHECK_IN_TIME)}</span>
                      </div>
                      <div className="detail-row">
                        <span>Check-out Time</span>
                        <span>{formatPolicyTime(CHECK_OUT_TIME)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="detail-row">
                        <span>Activity</span>
                        <span><i className="fas fa-wind"></i> Zipline Adventure</span>
                      </div>
                      <div className="detail-row">
                        <span>Experience</span>
                        <span>{bookingData.activity?.title} - {bookingData.ziplineType === 'local' ? 'Sablayeño' : 'Tourist'} Rate</span>
                      </div>
                      <div className="detail-row">
                        <span>Date</span>
                        <span>{bookingData.date ? new Date(bookingData.date).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set'}</span>
                      </div>
                      <div className="detail-row">
                        <span>Duration</span>
                        <span>15-20 minutes</span>
                      </div>
                      <div className="detail-row">
                        <span>Regular Guests</span>
                        <span>{bookingData.regularGuests || 0}</span>
                      </div>
                      <div className="detail-row">
                        <span>Matanda</span>
                        <span>{bookingData.seniorGuests || 0} ({bookingData.seniorDiscountPercent || 0}% off)</span>
                      </div>
                      <div className="detail-row">
                        <span>Bata</span>
                        <span>{bookingData.childGuests || 0} ({bookingData.childDiscountPercent || 0}% off)</span>
                      </div>
                      <div className="detail-row">
                        <span>Base Amount</span>
                        <span>₱{Number(bookingData.baseAmount || 0).toLocaleString()}</span>
                      </div>
                      <div className="detail-row">
                        <span>Total Discount</span>
                        <span>-₱{Number(bookingData.discountAmount || 0).toLocaleString()}</span>
                      </div>
                    </>
                  )}
                  <div className="detail-row">
                    <span>Guests</span>
                    <span>{bookingData.guests} guest(s)</span>
                  </div>
                  {bookingData.type === 'zipline' && (
                    <div className="detail-row">
                      <span>Final Amount</span>
                      <span>₱{Number(bookingData.totalAmount || 0).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="detail-row total">
                    <span>Deposit Amount (50%)</span>
                    <span>₱{bookingData.depositAmount?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* QR Code & Payment Form */}
            <section className="payment-form-section">
              <div className="qr-card">
                <div className="qr-header">
                  <i className="fas fa-qrcode"></i>
                  <span>Scan to Pay</span>
                </div>
                <div className="qr-image-container">
                  <img src={qrImage} alt="GCash QR Code" className="qr-image" />
                </div>
                <div className="qr-amount">
                  <span className="label">Amount to Pay</span>
                  <span className="amount">₱{bookingData.depositAmount?.toLocaleString()}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="reference-form">
                <h3><i className="fas fa-receipt"></i> Confirm Payment</h3>
                {bookingData.type === 'room' && (
                  <div className="payment-policy-note">
                    <i className="fas fa-clock"></i>
                    <span>Guest stay begins at {formatPolicyTime(CHECK_IN_TIME)} on the check-in date and ends at {formatPolicyTime(CHECK_OUT_TIME)} on the check-out date.</span>
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="referenceNumber">GCash Reference Number</label>
                  <input 
                    type="text" 
                    id="referenceNumber"
                    name="referenceNumber"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="Enter your GCash reference number"
                    required
                  />
                  <span className="input-hint">
                    <i className="fas fa-info-circle"></i>
                    Find this in your GCash transaction history
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="paymentReceipt">Payment Receipt Screenshot</label>
                  <input
                    type="file"
                    id="paymentReceipt"
                    name="paymentReceipt"
                    accept="image/*"
                    onChange={handleReceiptChange}
                    required
                  />
                  <span className="input-hint">
                    <i className="fas fa-cloud-upload-alt"></i>
                    Uploaded directly to Cloudinary (unsigned)
                  </span>
                  {receiptPreviewUrl && (
                    <img src={receiptPreviewUrl} alt="Receipt preview" className="receipt-preview" />
                  )}
                </div>

                <button 
                  type="submit" 
                  className="submit-payment-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check"></i>
                      Confirm Payment
                    </>
                  )}
                </button>

                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => navigate('/booking')}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </form>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Payment
