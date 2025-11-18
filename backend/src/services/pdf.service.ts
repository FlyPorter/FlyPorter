import PDFDocument from "pdfkit";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";

interface InvoiceGenerationOptions {
  bookingId: number;
  userId?: number;
}

export interface InvoicePdfResult {
  filename: string;
  buffer: Buffer;
  mimeType: string;
}

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  minimumFractionDigits: 2,
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return CURRENCY_FORMATTER.format(value);
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  return DATE_FORMATTER.format(date);
}

function humanizeSeatClass(seatClass?: string | null) {
  if (!seatClass) return "—";
  return seatClass.charAt(0).toUpperCase() + seatClass.slice(1).toLowerCase();
}

async function fetchBookingDetails({ bookingId, userId }: InvoiceGenerationOptions) {
  return prisma.booking.findFirst({
    where: {
      booking_id: bookingId,
      ...(userId ? { user_id: userId } : {}),
    },
    include: {
      user: {
        select: {
          email: true,
          customer_info: {
            select: {
              full_name: true,
              phone: true,
              passport_number: true,
            },
          },
        },
      },
      seat: {
        select: {
          seat_number: true,
          class: true,
          price_modifier: true,
        },
      },
      flight: {
        select: {
          departure_time: true,
          arrival_time: true,
          base_price: true,
          airline: {
            select: {
              airline_code: true,
              airline_name: true,
            },
          },
          route: {
            select: {
              origin_airport: {
                select: {
                  airport_code: true,
                  airport_name: true,
                  city_name: true,
                },
              },
              destination_airport: {
                select: {
                  airport_code: true,
                  airport_name: true,
                  city_name: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function generateBookingInvoicePdf(
  options: InvoiceGenerationOptions
): Promise<InvoicePdfResult> {
  const booking = await fetchBookingDetails(options);

  if (!booking) {
    throw new Error("Booking not found or access denied");
  }

  const customerProfile = booking.user.customer_info;
  const totalPrice = booking.total_price ? Number(booking.total_price) : null;
  const airline = booking.flight?.airline;
  const origin = booking.flight?.route?.origin_airport;
  const destination = booking.flight?.route?.destination_airport;

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const chunks: Buffer[] = [];

  const filename = `booking-confirmation-${booking.confirmation_code ?? booking.booking_id}.pdf`;

  // Define colors
  const brandRed = "#DC143C";
  const textBlack = "#000000";
  const textGray = "#666666";
  const lightGray = "#F5F5F5";
  const darkGray = "#4A4A4A";

  const pageWidth = 595;
  const margin = 40;

  return new Promise<InvoicePdfResult>((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk as Buffer));
    doc.on("end", () => {
      resolve({
        filename,
        buffer: Buffer.concat(chunks),
        mimeType: "application/pdf",
      });
    });
    doc.on("error", reject);

    // ===== HEADER =====
    doc.font("Helvetica-Bold")
      .fontSize(18)
      .fillColor(textBlack)
      .text("FlyPorter Airlines", margin, margin);
    
    doc.moveDown(0.3);
    doc.font("Helvetica")
      .fontSize(14)
      .fillColor(textBlack)
      .text("Booking Confirmation", margin);

    doc.moveDown(1);

    // Gray box for booking reference
    const boxY = doc.y;
    doc.rect(margin, boxY, pageWidth - 2 * margin, 30).fill(lightGray);
    
    doc.font("Helvetica")
      .fontSize(10)
      .fillColor(textBlack)
      .text(
        `Booking Reference: ${booking.confirmation_code ?? `BKG-${booking.booking_id}`}`,
        margin + 10,
        boxY + 10
      );
    
    const issueDate = new Date().toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    doc.text(`Date of issue: ${issueDate}`, pageWidth - 180, boxY + 10);

    doc.moveDown(2);

    // Legal notice
    doc.font("Helvetica")
      .fontSize(7)
      .fillColor(textGray)
      .text(
        "This is your official itinerary/receipt. Please keep it for your records and bring it to the airport for check-in.",
        margin,
        doc.y,
        { width: pageWidth - 2 * margin, align: "left" }
      );

    doc.moveDown(1.5);

    // ===== DEPART SECTION =====
    doc.font("Helvetica")
      .fontSize(12)
      .fillColor(textBlack)
      .text("Depart", margin);

    doc.moveDown(0.3);

    // Dark gray header bar
    const headerY = doc.y;
    doc.rect(margin, headerY, pageWidth - 2 * margin, 20).fill(darkGray);
    doc.font("Helvetica")
      .fontSize(10)
      .fillColor("#FFFFFF")
      .text("Economy - Basic", pageWidth - 160, headerY + 5);

    doc.moveDown(1.5);

    // Flight details
    const flightY = doc.y;
    const departureDate = booking.flight?.departure_time
      ? new Date(booking.flight.departure_time)
      : new Date();

    // Map airport codes to IANA timezones
    const airportTimezones: { [key: string]: string } = {
      'YVR': 'America/Vancouver',
      'YYZ': 'America/Toronto',
      'YYC': 'America/Calgary',
      'YEG': 'America/Edmonton',
      'YUL': 'America/Montreal',
      'YHZ': 'America/Halifax',
      'YOW': 'America/Toronto',
      'YWG': 'America/Winnipeg',
      'YYJ': 'America/Vancouver',
      'YQR': 'America/Regina',
      'YXE': 'America/Regina',
      'YQT': 'America/Thunder_Bay',
      'YFC': 'America/Moncton',
      'YQM': 'America/Moncton',
      'YQB': 'America/Toronto',
      'YDF': 'America/St_Johns',
      'YYT': 'America/St_Johns',
    };

    const originCode = origin?.airport_code || '';
    const destCode = destination?.airport_code || '';
    const originTimezone = airportTimezones[originCode] || 'America/Toronto';
    const destTimezone = airportTimezones[destCode] || 'America/Toronto';

    const dayOfWeek = departureDate.toLocaleDateString("en-US", { 
      weekday: "long",
      timeZone: originTimezone
    });
    const flightDate = departureDate.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: originTimezone
    });

    doc.font("Helvetica")
      .fontSize(9)
      .fillColor(textGray)
      .text(dayOfWeek, margin, flightY);
    doc.text(flightDate, margin, flightY + 12);

    const depTime = booking.flight?.departure_time
      ? new Date(booking.flight.departure_time).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: originTimezone
        })
      : "—";
    const arrTime = booking.flight?.arrival_time
      ? new Date(booking.flight.arrival_time).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: destTimezone
        })
      : "—";

    // Departure airport code with city beneath it
    doc.font("Helvetica-Bold")
      .fontSize(16)
      .fillColor(textBlack)
      .text(originCode || "—", 120, flightY);
    doc.font("Helvetica")
      .fontSize(11)
      .fillColor(textBlack)
      .text(origin?.city_name ?? "—", 120, flightY + 18);
    doc.fontSize(9)
      .fillColor(textGray)
      .text(depTime, 120, flightY + 32);
    doc.fontSize(8)
      .fillColor(textGray)
      .text(
        `${origin?.airport_name ?? ""}`, 
        120, 
        flightY + 44,
        { width: 150 }
      );

    // Arrow - use simple ASCII instead of unicode
    doc.fontSize(16)
      .fillColor(textGray)
      .text("-->", 280, flightY + 10);

    // Arrival city and time
    doc.font("Helvetica-Bold")
      .fontSize(16)
      .fillColor(textBlack)
      .text(destCode || "—", 330, flightY);
    doc.font("Helvetica")
      .fontSize(11)
      .fillColor(textBlack)
      .text(destination?.city_name ?? "—", 330, flightY + 18);
    doc.fontSize(9)
      .fillColor(textGray)
      .text(arrTime, 330, flightY + 32);
    doc.fontSize(8)
      .fillColor(textGray)
      .text(
        `${destination?.airport_name ?? ""}`,
        330,
        flightY + 44,
        { width: 150 }
      );

    // Flight info on right - moved down to avoid overlap
    const flightNumber = airline?.airline_code
      ? `${airline.airline_code}${booking.flight_id}`
      : `FP${booking.flight_id}`;
    
    let infoY = flightY + 55;
    
    doc.fontSize(10)
      .fillColor(textBlack)
      .text(flightNumber, pageWidth - 120, infoY, { width: 80, align: "right" });
    infoY += 15;
    
    // Calculate flight duration
    if (booking.flight?.departure_time && booking.flight?.arrival_time) {
      const depTimeMs = new Date(booking.flight.departure_time).getTime();
      const arrTimeMs = new Date(booking.flight.arrival_time).getTime();
      const durationMs = arrTimeMs - depTimeMs;
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      doc.fontSize(9)
        .fillColor(textGray)
        .text(`${hours}h ${minutes}m`, pageWidth - 120, infoY, { width: 80, align: "right" });
      infoY += 15;
    }
    
    const seatClass = booking.seat?.class ?? "Economy";
    doc.fontSize(8)
      .fillColor(textGray)
      .text(
        `Cabin: ${humanizeSeatClass(seatClass)}`,
        pageWidth - 120,
        infoY,
        { width: 80, align: "right" }
      );
    infoY += 12;
    
    doc.text(
      `Operated by: ${airline?.airline_name ?? "FlyPorter"}`, 
      pageWidth - 120, 
      infoY,
      { width: 80, align: "right" }
    );

    doc.moveDown(5);

    // ===== PASSENGERS SECTION =====
    doc.font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(textBlack)
      .text("Passengers", margin);

    doc.moveDown(0.5);

    const passengerY = doc.y;
    doc.font("Helvetica")
      .fontSize(10)
      .fillColor(textBlack)
      .text(`${customerProfile?.full_name ?? "Passenger"}`, margin, passengerY);

    doc.font("Helvetica")
      .fontSize(9)
      .fillColor(textGray)
      .text("Seats", 300, passengerY);
    doc.font("Helvetica")
      .fontSize(10)
      .fillColor(textBlack)
      .text(booking.seat?.seat_number ?? "—", 300, passengerY + 15);

    doc.font("Helvetica")
      .fontSize(9)
      .fillColor(textGray)
      .text("Ticket number", margin, passengerY + 20);
    doc.fontSize(9)
      .fillColor(textBlack)
      .text(`${booking.confirmation_code ?? booking.booking_id}`, margin, passengerY + 32);

    doc.moveDown(4);

    // ===== PURCHASE SUMMARY =====
    doc.font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(textBlack)
      .text("Purchase summary", margin);

    doc.moveDown(0.5);

    // Calculate price breakdown
    const basePrice = booking.flight?.base_price ? Number(booking.flight.base_price) : 0;
    const taxes = totalPrice ? totalPrice * 0.13 : 0; // 13% tax
    const airportFee = 35;
    const securityCharge = 9.46;

    doc.fontSize(9).fillColor(textGray).text("1 adult", pageWidth - 100, doc.y, { align: "right" });

    doc.moveDown(0.5);

    const summaryY = doc.y;
    doc.font("Helvetica")
      .fontSize(9)
      .fillColor(textBlack)
      .text("Base fare Economy - Basic", margin + 20, summaryY);
    doc.text(formatCurrency(basePrice), pageWidth - 100, summaryY, { align: "right" });

    doc.moveDown(0.8);
    doc.fontSize(9)
      .fillColor(textBlack)
      .text("Goods and Services Tax - Canada", margin + 20, doc.y);
    doc.text(formatCurrency(taxes), pageWidth - 100, doc.y, { align: "right" });

    doc.moveDown(0.8);
    doc.text("Airport Improvement Fee - Canada", margin + 20, doc.y);
    doc.text(formatCurrency(airportFee), pageWidth - 100, doc.y, { align: "right" });

    doc.moveDown(0.8);
    doc.text("Air Travellers Security Charge - Canada", margin + 20, doc.y);
    doc.text(formatCurrency(securityCharge), pageWidth - 100, doc.y, { align: "right" });

    doc.moveDown(1);
    doc.font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(textBlack)
      .text("GRAND TOTAL (Canadian dollars)", margin + 20, doc.y);
    doc.text(formatCurrency(totalPrice), pageWidth - 100, doc.y, { align: "right" });

    // ===== NEW PAGE - CHECK-IN DEADLINES =====
    doc.addPage();

    doc.font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(textBlack)
      .text("Check-in and boarding gate deadlines", margin, margin);

    doc.moveDown(1);

    const checkInInfo = [
      { time: "240", label: "Check-in and baggage drop-off opens", desc: "Get a head start and drop your bags off as early as four hours before departure." },
      { time: "45", label: "Check-in and baggage drop-off closes", desc: "Make sure you've checked in, have your boarding pass and have dropped off your bags before the end of the check-in period for your flight." },
      { time: "30", label: "Boarding gate deadline", desc: "This is the latest you should be at the departure gate, ready to board." },
      { time: "15", label: "Boarding gate closes", desc: "Arriving after this time could result in reassignment of reserved seats, cancellation of reservations, or disqualification from denied boarding compensation." },
    ];

    checkInInfo.forEach((info) => {
      const infoY = doc.y;
      doc.rect(margin, infoY, 60, 40).fill(lightGray);
      doc.font("Helvetica-Bold")
        .fontSize(20)
        .fillColor(textBlack)
        .text(info.time, margin + 10, infoY + 5);
      doc.fontSize(8).fillColor(textGray).text("minutes", margin + 10, infoY + 28);

      doc.font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(textBlack)
        .text(info.label, margin + 75, infoY + 5, { width: pageWidth - margin * 2 - 75 });
      doc.font("Helvetica")
        .fontSize(8)
        .fillColor(textGray)
        .text(info.desc, margin + 75, infoY + 20, { width: pageWidth - margin * 2 - 75 });

      doc.moveDown(2.5);
    });

    doc.moveDown(1);

    // ===== IMPORTANT NOTICE =====
    doc.rect(margin, doc.y, pageWidth - 2 * margin, 40).fill(lightGray);
    doc.font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(textBlack)
      .text(
        "Important: ",
        margin + 10,
        doc.y + 10,
        { continued: true }
      );
    doc.font("Helvetica")
      .fontSize(9)
      .text(
        "Please arrive at the airport at least 2 hours before departure for domestic flights and 3 hours for international flights.",
        { width: pageWidth - 2 * margin - 20 }
      );

    doc.moveDown(1.5);

    doc.font("Helvetica")
      .fontSize(9)
      .fillColor(textBlack)
      .text(
        "For any queries, please contact us at support@flyporter.com or call +1-800-FLY-PORT",
        margin,
        doc.y,
        { width: pageWidth - 2 * margin }
      );

    doc.end();
  });
}

interface InvoiceUploadResult {
  key: string;
  url: string;
  bucket: string;
}

function ensureSpacesConfig() {
  const {
    SPACES_ENDPOINT,
    SPACES_REGION,
    SPACES_ACCESS_KEY,
    SPACES_SECRET_KEY,
    SPACES_BUCKET,
  } = env;

  if (
    !SPACES_ENDPOINT ||
    !SPACES_REGION ||
    !SPACES_ACCESS_KEY ||
    !SPACES_SECRET_KEY ||
    !SPACES_BUCKET
  ) {
    throw new Error("Spaces configuration is incomplete");
  }
}

let spacesClient: S3Client | null = null;

function getSpacesClient(): S3Client {
  if (!spacesClient) {
    ensureSpacesConfig();
    spacesClient = new S3Client({
      region: env.SPACES_REGION,
      endpoint: env.SPACES_ENDPOINT,
      forcePathStyle: true, // Use path-style URLs for Digital Ocean Spaces
      credentials: {
        accessKeyId: env.SPACES_ACCESS_KEY,
        secretAccessKey: env.SPACES_SECRET_KEY,
      },
    });
  }

  return spacesClient;
}

function buildPublicUrl(key: string) {
  if (env.SPACES_CDN_BASE_URL) {
    const base = env.SPACES_CDN_BASE_URL.replace(/\/+$/, "");
    return `${base}/${key}`;
  }

  // Use path-style URL format for Digital Ocean Spaces
  // Format: https://tor1.digitaloceanspaces.com/bucket-name/key
  const endpointBase = env.SPACES_ENDPOINT.replace(/\/+$/, "");
  return `${endpointBase}/${env.SPACES_BUCKET}/${key}`;
}

export async function generateSignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  ensureSpacesConfig();

  const client = getSpacesClient();

  const command = new GetObjectCommand({
    Bucket: env.SPACES_BUCKET,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Upload booking invoice to Digital Ocean Spaces
 * Uses a consistent key format for each booking (no timestamp)
 * This allows us to regenerate signed URLs without re-uploading
 */
export async function uploadBookingInvoiceToSpaces(
  options: InvoiceGenerationOptions
): Promise<InvoiceUploadResult> {
  const invoice = await generateBookingInvoicePdf(options);

  ensureSpacesConfig();

  const client = getSpacesClient();

  const prefix = env.SPACES_INVOICE_PREFIX.replace(/\/+$/, "");
  // Use consistent key (no timestamp) so we can regenerate URLs
  const key = `${prefix}/booking-${options.bookingId}.pdf`;

  const command = new PutObjectCommand({
    Bucket: env.SPACES_BUCKET,
    Key: key,
    Body: invoice.buffer,
    ContentType: invoice.mimeType,
    ACL: "private",
  });

  await client.send(command);

  // Generate a signed URL (valid for 1 hour by default)
  const signedUrl = await generateSignedUrl(key, 3600);

  return {
    key,
    bucket: env.SPACES_BUCKET,
    url: signedUrl,
  };
}

/**
 * Get signed URL for an invoice
 * If the PDF doesn't exist in Spaces, it will be uploaded first
 * Returns a fresh signed URL (valid for 1 hour)
 */
export async function getInvoiceSignedUrl(
  options: InvoiceGenerationOptions
): Promise<{ url: string; filename: string }> {
  ensureSpacesConfig();

  const prefix = env.SPACES_INVOICE_PREFIX.replace(/\/+$/, "");
  const key = `${prefix}/booking-${options.bookingId}.pdf`;
  const filename = `invoice-booking-${options.bookingId}.pdf`;
  const client = getSpacesClient();

  try {
    // Check if invoice exists before generating signed URL
    const headCommand = new HeadObjectCommand({
      Bucket: env.SPACES_BUCKET,
      Key: key,
    });
    await client.send(headCommand);

    const signedUrl = await generateSignedUrl(key, 3600);
    return { url: signedUrl, filename };
  } catch (error: any) {
    const isMissing =
      error?.name === "NoSuchKey" ||
      error?.name === "NotFound" ||
      error?.$metadata?.httpStatusCode === 404;

    if (isMissing) {
      console.log(`Invoice not found in Spaces, uploading for booking ${options.bookingId}`);
      const uploadResult = await uploadBookingInvoiceToSpaces(options);
      return { url: uploadResult.url, filename };
    }
    // For other errors, try uploading anyway
    console.log(`Error checking invoice, re-uploading for booking ${options.bookingId}`);
    const uploadResult = await uploadBookingInvoiceToSpaces(options);
    return { url: uploadResult.url, filename };
  }
}
