import sgMail from "@sendgrid/mail";
import { env } from "../config/env.js";
import { generateBookingInvoicePdf } from "../services/pdf.service.js";

// Initialize SendGrid with API key
if (env.SENDGRID_API_KEY) {
    sgMail.setApiKey(env.SENDGRID_API_KEY);
}

interface BookingEmailData {
    customerName: string;
    customerEmail: string;
    confirmationCode: string;
    flightNumber: string;
    departureAirport: string;
    destinationAirport: string;
    departureDate: string;
    departureTime: string;
    arrivalTime: string;
    seatNumber: string;
    totalPrice: string;
    departureCity?: string;
    destinationCity?: string;
    departureAirportName?: string;
    destinationAirportName?: string;
    flightDuration?: string;
}

/**
 * Generate HTML email body for booking confirmation
 * Precisely matching Air Canada's email format
 */
function generateBookingConfirmationHTML(data: BookingEmailData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            color: #333333;
            font-size: 14px;
        }
        .email-container {
            max-width: 650px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            padding: 25px 30px 15px 30px;
            background-color: #ffffff;
        }
        .logo-img {
            width: 120px;
            height: auto;
            margin-bottom: 15px;
        }
        .title {
            font-size: 26px;
            font-weight: 600;
            color: #000000;
            margin: 0;
            padding-bottom: 20px;
        }
        .ref-box {
            background-color: #ffffff;
            border: 1px solid #d0d0d0;
            border-radius: 6px;
            padding: 18px 20px;
            margin: 0 30px 20px 30px;
        }
        .ref-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }
        .ref-label {
            font-size: 13px;
            color: #666666;
            font-weight: 500;
        }
        .ref-links {
            text-align: right;
        }
        .ref-link {
            color: #0066cc;
            text-decoration: none;
            font-size: 12px;
            margin-left: 12px;
        }
        .ref-value {
            font-size: 22px;
            font-weight: 700;
            color: #000000;
            margin-bottom: 5px;
        }
        .ref-date {
            font-size: 11px;
            color: #666666;
        }
        .content {
            padding: 0 30px 30px 30px;
        }
        .notice {
            font-size: 11px;
            color: #333333;
            line-height: 1.5;
            margin: 20px 0;
            padding: 12px 15px;
            background-color: #fffbf0;
            border-left: 3px solid #ffc107;
        }
        .intro-text {
            font-size: 13px;
            color: #333333;
            line-height: 1.6;
            margin: 15px 0;
        }
        .section-title {
            font-size: 17px;
            font-weight: 600;
            color: #000000;
            margin: 25px 0 12px 0;
            padding-bottom: 8px;
            border-bottom: 1px solid #e0e0e0;
        }
        .passenger-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            font-size: 14px;
        }
        .passenger-name {
            font-weight: 600;
            color: #000000;
        }
        .passenger-detail {
            font-size: 12px;
            color: #666666;
            margin-top: 4px;
        }
        .seats-label {
            font-size: 12px;
            color: #666666;
            text-align: right;
        }
        .seat-value {
            font-weight: 600;
            color: #000000;
            text-align: right;
        }
        .flight-card {
            border: 1px solid #d0d0d0;
            border-radius: 6px;
            padding: 0;
            margin: 15px 0;
            overflow: hidden;
        }
        .flight-header-bar {
            background-color: #f5f5f5;
            padding: 10px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #d0d0d0;
        }
        .flight-date {
            font-size: 14px;
            font-weight: 600;
            color: #000000;
        }
        .flight-class {
            font-size: 13px;
            color: #666666;
        }
        .flight-body {
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .city-block {
            flex: 1;
        }
        .city-code {
            font-size: 18px;
            font-weight: 700;
            color: #000000;
            margin-bottom: 4px;
        }
        .city-time {
            font-size: 22px;
            font-weight: 600;
            color: #000000;
            margin-bottom: 4px;
        }
        .city-airport {
            font-size: 11px;
            color: #666666;
        }
        .route-arrow {
            padding: 0 25px;
            color: #666666;
            font-size: 24px;
        }
        .flight-info {
            text-align: right;
            min-width: 150px;
        }
        .flight-number {
            font-size: 13px;
            color: #666666;
            margin-bottom: 4px;
        }
        .duration {
            font-size: 13px;
            color: #666666;
            margin-bottom: 4px;
        }
        .cabin-class {
            font-size: 11px;
            color: #666666;
        }
        .summary-card {
            border: 1px solid #d0d0d0;
            border-radius: 6px;
            padding: 20px;
            margin: 15px 0;
        }
        .summary-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
        }
        .payment-method {
            font-size: 12px;
            color: #666666;
        }
        .amount-paid {
            font-size: 16px;
            font-weight: 700;
            color: #000000;
        }
        .charges-section {
            background-color: #f5f5f5;
            padding: 12px 15px;
            border-radius: 4px;
            margin: 10px 0;
        }
        .charges-title {
            font-size: 13px;
            font-weight: 600;
            color: #000000;
            margin-bottom: 10px;
        }
        .price-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 13px;
            color: #333333;
        }
        .price-row.subtotal {
            font-weight: 600;
            padding-top: 10px;
            border-top: 1px solid #d0d0d0;
            margin-top: 6px;
        }
        .price-row.total {
            font-weight: 700;
            font-size: 15px;
            padding-top: 12px;
            border-top: 2px solid #000000;
            margin-top: 10px;
            color: #000000;
        }
        .baggage-section {
            background-color: #f8f8f8;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
            font-size: 12px;
            color: #333333;
            line-height: 1.6;
        }
        .baggage-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 10px;
        }
        .footer {
            background-color: #f5f5f5;
            padding: 25px 30px;
            font-size: 11px;
            color: #666666;
            line-height: 1.6;
        }
        .footer-text {
            margin: 8px 0;
        }
        .footer-link {
            color: #0066cc;
            text-decoration: none;
        }
        @media only screen and (max-width: 600px) {
            .flight-body {
                flex-direction: column;
            }
            .route-arrow {
                transform: rotate(90deg);
                padding: 10px 0;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div style="font-size: 20px; font-weight: 600; color: #DC143C;">✈ FLYPORTER</div>
            <h1 class="title">Booking Confirmation</h1>
        </div>

        <!-- Booking Reference Box -->
        <div class="ref-box">
            <div class="ref-header">
                <span class="ref-label">Booking reference</span>
                <div class="ref-links">
                    <a href="#" class="ref-link">Select Seats</a>
                    <a href="#" class="ref-link">Check in</a>
                    <a href="#" class="ref-link">Manage my booking</a>
                </div>
            </div>
            <div class="ref-value">${data.confirmationCode}</div>
            <div class="ref-date">Date of issue: ${data.departureDate}</div>
        </div>

        <!-- Content -->
        <div class="content">
            <!-- Important Notice -->
            <div class="notice">
                <strong>IMPORTANT:</strong> Your official itinerary/receipt is attached to this email. You must bring it with you to the airport for check-in and we recommend you keep a copy for your records. Please also take the time to review it as it contains the general conditions of carriage and applicable tariffs that apply to the tickets, bookings and air services detailed below, as well as baggage, dangerous goods and other important information related to your trip.
            </div>

            <p class="intro-text">
                Thank you for choosing <strong>FlyPorter</strong>. Below are your flight details and other useful information for your trip.
            </p>

            <!-- Passengers Section -->
            <div class="section-title">Passengers</div>
            <div class="passenger-row">
                <div>
                    <div class="passenger-name">${data.customerName}</div>
                    <div class="passenger-detail">Ticket #: ${data.confirmationCode}570950</div>
                </div>
                <div>
                    <div class="seats-label">Seats</div>
                    <div class="seat-value">${data.seatNumber}</div>
                </div>
            </div>

            <!-- Flight Section -->
            <div class="section-title">Depart  •  ${data.departureDate}</div>
            <div class="flight-card">
                <div class="flight-header-bar">
                    <span class="flight-date"></span>
                    <span class="flight-class">Economy - Basic</span>
                </div>
                <div class="flight-body">
                    <div class="city-block">
                        <div class="city-code">${data.departureAirport}</div>
                        <div class="city-time">${data.departureTime}</div>
                        <div class="city-airport">${data.departureAirportName || data.departureCity || ''}</div>
                    </div>
                    <div class="route-arrow">→</div>
                    <div class="city-block">
                        <div class="city-code">${data.destinationAirport}</div>
                        <div class="city-time">${data.arrivalTime}</div>
                        <div class="city-airport">${data.destinationAirportName || data.destinationCity || ''}</div>
                    </div>
                    <div class="flight-info">
                        <div class="flight-number">✈ ${data.flightNumber}</div>
                        <div class="duration">${data.flightDuration || ''}</div>
                        <div class="cabin-class">Cabin: Economy Class (G)</div>
                        <div class="cabin-class">Operated by: FlyPorter</div>
                        <div class="cabin-class" style="color: #0066cc;">Wi-Fi</div>
                    </div>
                </div>
            </div>

            <!-- Purchase Summary -->
            <div class="section-title">Purchase summary</div>
            <div class="summary-card">
                <div class="summary-header">
                    <div>
                        <div style="font-size: 12px; color: #0066cc; margin-bottom: 4px;">💳 VISA</div>
                        <div style="font-size: 11px; color: #666666;">••••0387</div>
                        <div style="font-size: 11px; color: #666666; margin-top: 8px;">Amount paid: CA $${data.totalPrice}</div>
                    </div>
                    <div style="text-align: right;">
                        <div class="amount-paid">CA $${data.totalPrice}</div>
                        <div style="font-size: 11px; color: #666666; margin-top: 4px;">1 adult</div>
                    </div>
                </div>

                <div class="charges-section">
                    <div class="charges-title">Air transportation charges</div>
                    <div class="price-row">
                        <span>Base fare - Economy - Basic</span>
                        <span>CA $${(parseFloat(data.totalPrice) - 49.46).toFixed(2)}</span>
                    </div>
                    <div class="price-row subtotal">
                        <span>Subtotal</span>
                        <span>CA $${(parseFloat(data.totalPrice) - 49.46).toFixed(2)}</span>
                    </div>
                </div>

                <div class="charges-section">
                    <div class="charges-title">Taxes, fees and charges</div>
                    <div class="price-row">
                        <span>Air Travellers Security Charge - Canada</span>
                        <span>CA $9.46</span>
                    </div>
                    <div class="price-row">
                        <span>Goods and Services Tax - Canada - 100092287 RT0001</span>
                        <span>CA $5.62</span>
                    </div>
                    <div class="price-row">
                        <span>Airport Improvement Fee - Canada</span>
                        <span>CA $35.00</span>
                    </div>
                </div>

                <div class="price-row" style="margin-top: 15px; font-weight: 600;">
                    <span>Airfare and taxes, per passenger (before travel options)</span>
                    <span>CA $${data.totalPrice}</span>
        </div>

                <div class="price-row" style="font-size: 12px; color: #666666;">
                    <span>Number of passengers</span>
                    <span>1</span>
                </div>

                <div class="price-row subtotal">
                    <span>Total</span>
                    <span>CA $${data.totalPrice}</span>
                </div>

                <div class="price-row total">
                    <span>GRAND TOTAL Canadian dollars (CAD)</span>
                    <span>CA $${data.totalPrice}</span>
                </div>
            </div>

            <!-- Baggage Allowance -->
            <div class="section-title">Baggage allowance</div>
            <div class="baggage-section">
                <div class="baggage-title">Carry-on baggage</div>
                <p>On flights operated by FlyPorter, FlyPorter Rouge or FlyPorter Express, you may carry with you in the cabin 1 standard item (max. size: 23 x 40 x 55 cm [9 x 15.5 x 21.5 in]) and 1 personal item (max. size: 16 x 33 x 43 cm [6 x 13 x 17 in]). Your carry-on baggage must be light enough that you can store it in the overhead bin unassisted.</p>
                
                <div class="baggage-title" style="margin-top: 15px;">Checked baggage</div>
                <p>Please see the attached itinerary/receipt for details on the bags you plan on checking at the baggage counter.</p>
            </div>

            <p style="font-size: 12px; color: #666666; margin-top: 25px; line-height: 1.6;">
                <strong style="color: #000000;">Important:</strong> Please arrive at the airport at least 2 hours before departure for domestic flights and 3 hours for international flights.
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p class="footer-text">
                <strong>FlyPorter</strong> applies travel document and animal entry and exit requirements contained in IATA's Travel Information Manual, available on the IATA Travel Centre website.
            </p>
            <p class="footer-text">
                To ensure delivery to your inbox, please add <a href="mailto:confirmation@flyporter.com" class="footer-link">confirmation@flyporter.com</a> to your address book's safe sender list. This service email was sent to you because you purchased a <strong>FlyPorter</strong> flight. It provides important flight information that must be communicated to you. This service email is not a promotional email. Please do not reply to this email as this inbox is not monitored. If you have questions, please visit <a href="https://flyporter.website" class="footer-link">flyporter.website</a>.
            </p>
            <p class="footer-text">
                Your privacy is important to us. To learn how <strong>FlyPorter</strong> collects, uses and protects the personal information you provide, please view our <a href="https://flyporter.website/privacy" class="footer-link">Privacy Policy</a>.
            </p>
            <p class="footer-text" style="margin-top: 15px;">
                <strong>FlyPorter Airlines</strong>, P.O. Box 64239, RPO Thorncliffe, Calgary Alberta - T2K 6J7
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();
}

/**
 * Generate plain text email body (fallback for email clients that don't support HTML)
 */
function generateBookingConfirmationText(data: BookingEmailData): string {
    return `
FlyPorter Airlines
BOOKING CONFIRMATION & RECEIPT

Dear ${data.customerName},

Thank you for choosing FlyPorter Airlines!

CONFIRMATION CODE: ${data.confirmationCode}

FLIGHT DETAILS:
--------------
Flight Number: ${data.flightNumber}
Route: ${data.departureAirport} → ${data.destinationAirport}
Departure Date: ${data.departureDate}
Departure Time: ${data.departureTime}
Arrival Time: ${data.arrivalTime}
Seat Number: ${data.seatNumber}

TOTAL AMOUNT: $${data.totalPrice}

Your invoice is attached to this email as a PDF.

Please arrive at the airport at least 2 hours before departure for domestic flights.

Need Help?
Customer Service: 1-800-FLY-PORT
Email: support@flyporter.com
Website: flyporter.website

Safe travels!
The FlyPorter Team

---
This email was sent by FlyPorter Airlines.
Please do not reply to this automated message.

© ${new Date().getFullYear()} FlyPorter Airlines. All rights reserved.
    `.trim();
}

/**
 * Send booking confirmation email with PDF invoice attachment
 */
export async function sendBookingConfirmationEmail(params: {
    bookingId: number;
    userId: number;
    emailData: BookingEmailData;
}): Promise<void> {
    const { bookingId, userId, emailData } = params;

    // Check if SendGrid is configured
    if (!env.SENDGRID_API_KEY) {
        console.warn("⚠️  SendGrid API key not configured. Skipping email for booking", bookingId);
        return;
    }

    console.log(`📧 Attempting to send booking confirmation email for booking ${bookingId} to ${emailData.customerEmail}...`);

    try {
        // Generate PDF invoice
        const invoice = await generateBookingInvoicePdf({
            bookingId,
            userId,
        });

        // Prepare email content
        const htmlContent = generateBookingConfirmationHTML(emailData);
        const textContent = generateBookingConfirmationText(emailData);

        // Send email with attachment
        const msg = {
            to: emailData.customerEmail,
            from: {
                email: env.SENDGRID_FROM_EMAIL,
                name: env.SENDGRID_FROM_NAME,
            },
            subject: `FlyPorter - ${emailData.departureDate}: ${emailData.departureAirport} - ${emailData.destinationAirport} (Booking Reference: ${emailData.confirmationCode})`,
            text: textContent,
            html: htmlContent,
            attachments: [
                {
                    content: invoice.buffer.toString("base64"),
                    filename: invoice.filename,
                    type: invoice.mimeType,
                    disposition: "attachment",
                },
            ],
            trackingSettings: {
                clickTracking: {
                    enable: false,
                },
                openTracking: {
                    enable: false,
                },
            },
        };

        await sgMail.send(msg);
        console.log(`✓ Booking confirmation email sent successfully to ${emailData.customerEmail} for booking ${bookingId}`);
    } catch (error: any) {
        console.error(`✗ Failed to send booking confirmation email for booking ${bookingId}:`, error.message);
        if (error.response?.body?.errors) {
            console.error('   SendGrid error details:', JSON.stringify(error.response.body.errors, null, 2));
        }
        // Don't throw - email is best-effort, booking is already confirmed
    }
}

/**
 * Send booking cancellation email notification
 */
export async function sendBookingCancellationEmail(params: {
    customerName: string;
    customerEmail: string;
    confirmationCode: string;
    flightNumber: string;
    departureAirport: string;
    destinationAirport: string;
}): Promise<void> {
    const { customerName, customerEmail, confirmationCode, flightNumber, departureAirport, destinationAirport } = params;

    if (!env.SENDGRID_API_KEY) {
        console.warn("SendGrid API key not configured. Skipping email.");
        return;
    }

    try {
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 40px 30px; text-align: center; }
        .logo { color: #ffffff; font-size: 32px; font-weight: 700; margin: 0; }
        .content { padding: 30px; }
        .alert-box { background-color: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .alert-title { font-size: 20px; font-weight: 600; color: #991b1b; margin: 0 0 10px 0; }
        .confirmation-code { font-size: 24px; font-weight: 700; color: #dc2626; letter-spacing: 2px; margin: 10px 0; }
        .footer { background-color: #1e293b; color: #94a3b8; padding: 30px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1 class="logo">✈️ FLYPORTER</h1>
        </div>
        <div class="content">
            <div class="alert-box">
                <p class="alert-title">⚠️ BOOKING CANCELLATION NOTICE</p>
                <p class="confirmation-code">${confirmationCode}</p>
            </div>
            <p>Dear ${customerName},</p>
            <p>Your booking for flight <strong>${flightNumber}</strong> (${departureAirport} → ${destinationAirport}) has been cancelled.</p>
            <p>If you did not request this cancellation, please contact our customer service immediately.</p>
            <p>Customer Service: 1-800-FLY-PORT<br>Email: support@flyporter.com</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} FlyPorter Airlines. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        `.trim();

        const msg = {
            to: customerEmail,
            from: {
                email: env.SENDGRID_FROM_EMAIL,
                name: env.SENDGRID_FROM_NAME,
            },
            subject: `FlyPorter Booking Cancellation: ${departureAirport} - ${destinationAirport} (Reference: ${confirmationCode})`,
            html: htmlContent,
            trackingSettings: {
                clickTracking: { enable: false },
                openTracking: { enable: false },
            },
        };

        await sgMail.send(msg);
        console.log(`✓ Cancellation email sent to ${customerEmail} for booking ${confirmationCode}`);
    } catch (error: any) {
        console.error(`✗ Failed to send cancellation email:`, error.message);
    }
}

