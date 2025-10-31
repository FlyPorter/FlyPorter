export function validatePayment(
  cardNumber: string,
  expiry: string, // YYYY-MM
  ccv: string,
  bookingDateISO: string
): boolean {
  if (!cardNumber || !expiry || !ccv || !bookingDateISO) return false;

  // 16-digit numeric card
  const normalizedCard = cardNumber.replace(/\s|-/g, "");
  if (!/^\d{16}$/.test(normalizedCard)) return false;

  // 3-digit CCV
  if (!/^\d{3}$/.test(ccv)) return false;

  // Parse dates
  const bookingDate = new Date(bookingDateISO);
  if (Number.isNaN(bookingDate.getTime())) return false;

  // Expiry format YYYY-MM
  const m = /^(\d{4})-(\d{2})$/.exec(expiry);
  if (!m) return false;
  const year = Number(m[1]);
  const month = Number(m[2]); // 1-12
  if (month < 1 || month > 12) return false;

  // Expiry date taken as last moment of the expiry month
  const expiryDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  // expiry > booking
  if (!(expiryDate.getTime() > bookingDate.getTime())) return false;

  return true;
}

