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
  const basePrice = booking.flight?.base_price ? Number(booking.flight.base_price) : null;
  const priceModifier = booking.seat?.price_modifier
    ? Number(booking.seat.price_modifier)
    : null;

  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const chunks: Buffer[] = [];

  const filename = `invoice-booking-${booking.booking_id}.pdf`;

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

    doc.fontSize(22).text("FlyPorter Airlines", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(16).text("Booking Invoice", { align: "center" });
    doc.moveDown(1.5);

    doc.fontSize(11);
    const issuedAt = formatDateTime(new Date());
    doc.text(`Invoice #: ${booking.confirmation_code ?? `BKG-${booking.booking_id}`}`);
    doc.text(`Booking ID: ${booking.booking_id}`);
    doc.text(`Issued: ${issuedAt}`);
    doc.moveDown(1);

    doc.fontSize(13).text("Bill To", { underline: true });
    doc.moveDown(0.3);
    if (customerProfile?.full_name) {
      doc.text(customerProfile.full_name);
    }
    doc.text(booking.user.email);
    if (customerProfile?.phone) {
      doc.text(`Phone: ${customerProfile.phone}`);
    }
    if (customerProfile?.passport_number) {
      doc.text(`Passport: ${customerProfile.passport_number}`);
    }
    doc.moveDown(1);

    doc.fontSize(13).text("Booking Details", { underline: true });
    doc.moveDown(0.3);

    const airline = booking.flight?.airline;
    const origin = booking.flight?.route?.origin_airport;
    const destination = booking.flight?.route?.destination_airport;

    if (airline) {
      doc.fontSize(11).text(`Airline: ${airline.airline_name} (${airline.airline_code})`);
    }
    if (origin && destination) {
      doc
        .fontSize(11)
        .text(
          `Route: ${origin.city_name} (${origin.airport_code}) → ${destination.city_name} (${destination.airport_code})`
        );
    }

    doc
      .fontSize(11)
      .text(
        `Departure: ${formatDateTime(booking.flight?.departure_time)}`
      );
    doc
      .fontSize(11)
      .text(
        `Arrival: ${formatDateTime(booking.flight?.arrival_time)}`
      );
    doc
      .fontSize(11)
      .text(`Seat: ${booking.seat?.seat_number ?? "—"} (${humanizeSeatClass(booking.seat?.class)})`);
    doc
      .fontSize(11)
      .text(`Status: ${humanizeSeatClass(booking.status)}`);
    if (booking.confirmation_code) {
      doc.fontSize(11).text(`Confirmation Code: ${booking.confirmation_code}`);
    }

    doc.moveDown(1);

    doc.fontSize(13).text("Fare Summary", { underline: true });
    doc.moveDown(0.3);

    doc
      .fontSize(11)
      .text(`Base Fare: ${formatCurrency(basePrice)}`);
    doc
      .fontSize(11)
      .text(
        `Seat Multiplier: ${priceModifier ? `${priceModifier.toFixed(2)}x` : "—"}`
      );

    doc.moveDown(0.8);
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(`Total Due: ${formatCurrency(totalPrice)}`);
    doc.font("Helvetica");

    doc.moveDown(2);
    doc
      .fontSize(9)
      .fillColor("#555555")
      .text(
        "Thank you for choosing FlyPorter. This invoice serves as proof of purchase for your booking. Please contact support if you require any adjustments.",
        { align: "left" }
      )
      .fillColor("#000000");

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
