# FlyPorter API - Postman Collection Guide

## 🚀 Quick Start

1. **Seed the database** (run once per fresh setup)
   ```bash
   cd backend
   npx prisma db seed
   ```
   This inserts the admin account (`admin@123.com` / `admin123`), four Canadian cities, matching airports, two airlines, six routes, and three future-dated flights with seats.

2. **Start the API server**
   ```bash
   npm run dev
   ```

3. **Import the Postman collection**
   - Open Postman → **Import** → select `FlyPorterAPI.postman_collection.json`

4. **Check the base URL**
   - Default is `http://localhost:3000/api`
   - To change it: click the collection → **Variables** tab → edit `baseUrl`

You are now ready to follow the customer booking journey end-to-end.

5. **Demo customers (seeded)**
   - `customer.one@example.com` / `password123`
   - `customer.two@example.com` / `password123`
   - Both accounts already include passenger profiles, so you can log in and book immediately.

---

## 📂 Collection Overview

- `Flights` – public endpoints to discover flights (auto-selects a flight for you)
- `Seats` – public seat availability for the selected flight (auto-selects first open seat)
- `Auth` – register, login, and logout
- `Profile` – maintain passenger details (required before booking)
- `Payment` – mock card validation prior to confirming a booking
- `Bookings` – create, list, and cancel bookings
- `Notifications` – view booking confirmation/cancellation messages
- `PDF Invoices` – generate and upload booking invoices to Digital Ocean Spaces
- `Customers` – direct CRUD on customer info (admins or advanced use)
- `Admin Setup` – optional utilities to create custom airlines/routes/flights
- `Airports` / `Cities` – public reference data

---

## 🧭 Customer Journey (Seed Data)

Follow these steps in order to simulate the user story:

### 1. Search Flights (Public)
- Request: `GET /flight/search`
- Folder: `Flights` → **Search Flights by Filters**
- Optional query params:
  - `departure_airport` / `destination_airport` (3-letter IATA codes)
  - `date` (`YYYY-MM-DD`)
  - `min_price` / `max_price` (non-negative numbers)
  - `min_duration` / `max_duration` (minutes)
  - `min_departure_time` / `max_departure_time` (`HH:mm`, 24-hour)
- Result: returns flights matching the filters and stores the first `flightId` and `departure_time` as `bookingDate`

> Need a quick, unfiltered list? The legacy `GET /flight` request is still in the folder as **List All Flights**.

### 2. View Seats (Public)
- Request: `GET /seat/{{flightId}}`
- Folder: `Seats` → **Get Seats for Flight**
- Result: picks the first available seat and stores it as `seatNumber`

### 3. Register or Login
- Requests: `POST /auth/register` or `POST /auth/login`
- Folder: `Auth`
- Result: saves `authToken` and `userId` for authenticated calls
- Tip: use the seeded accounts above to skip profile setup—they already include name, passport, and DOB.

### 4. Complete Passenger Profile (Required)
- Request: `PATCH /profile`
- Folder: `Profile` → **Update Profile**
- Minimum fields: `full_name`, `passport_number`, `date_of_birth`
- Why: the `POST /bookings` endpoint checks for passenger info and will fail without it

### 5. Validate Payment (Mock)
- Request: `POST /payment/validate`
- Folder: `Payment` → **Validate Payment**
- Sample body:
  ```json
  {
    "cardNumber": "4111111111111111",
    "expiry": "2026-12",
    "ccv": "123",
    "bookingDate": "{{bookingDate}}"
  }
  ```
- Result: confirms the mock payment details before booking

### 6. Confirm Booking
- Request: `POST /bookings`
- Folder: `Bookings` → **Create Booking**
- Body uses the auto-set variables:
  ```json
  {
    "flight_id": {{flightId}},
    "seat_number": "{{seatNumber}}"
  }
  ```
- Result: saves `bookingId`, reaffirms `seatNumber`, and logs the confirmation code

### 7. Get Invoice URL (Optional - Auto-generated!)
- Request: `GET /pdf/invoice/{{bookingId}}`
- Folder: `PDF Invoices` → **Get Invoice URL from Digital Ocean Spaces**
- **How it works:**
  - When you create a booking (step 6), the PDF invoice is **automatically uploaded** to Digital Ocean Spaces
  - Call this endpoint to get a fresh signed URL (valid for 1 hour)
  - URL is regenerated each time (one-time use concept)
- **Alternative:** `GET /pdf/invoice/{{bookingId}}/download` - Direct download bypassing Spaces (for testing)
- Result: Get a secure URL to download your professional PDF invoice
- Note: Digital Ocean Spaces configuration required (see below)

### 8. Manage Booking & Notifications
- View bookings: `GET /bookings` (or `filter=upcoming|past`)
- Cancel: `DELETE /bookings/{{bookingId}}`
- Notifications: `GET /notifications` (confirmation is created automatically)

---

## 📝 Collection Variables

| Variable | Description | Auto-set? | Set by |
|----------|-------------|-----------|--------|
| `baseUrl` | API base URL | Manual | You |
| `authToken` | JWT token for auth routes | Yes | Login/Register |
| `userId` | Logged-in user ID | Yes | Login/Register |
| `flightId` | Selected flight ID | Yes | `GET /flight` or `GET /flight/:id` |
| `bookingDate` | Departure datetime of selected flight | Yes | `GET /flight` |
| `seatNumber` | Selected seat number | Yes | `GET /seat/:flight_id` or booking |
| `bookingId` | Created booking ID | Yes | `POST /bookings` |
| `invoiceUrl` | Signed URL for uploaded invoice | Yes | `POST /pdf/invoice/:id/upload` |
| `routeId` | Last created route ID (admin) | Yes | Admin route creation |

View/edit variables in Postman by opening the collection → **Variables** tab.

---

## 📦 Digital Ocean Spaces Configuration (Optional)

The PDF invoice upload feature requires Digital Ocean Spaces to be configured. This is **optional** - you can still download invoices directly without it.

### Setup Steps:

1. **Create a Digital Ocean Space**
   - Log in to Digital Ocean → Spaces → Create a Space
   - Choose a region (e.g., NYC3, SFO3)
   - Name it (e.g., `flyporter-invoices`)

2. **Generate API Keys**
   - Go to API → Spaces access keys → Generate New Key
   - Save both the Access Key and Secret Key

3. **Configure Backend Environment**
   Add these to your `backend/.env` file:
   ```bash
   SPACES_ENDPOINT="https://nyc3.digitaloceanspaces.com"
   SPACES_REGION="nyc3"
   SPACES_ACCESS_KEY="your-access-key"
   SPACES_SECRET_KEY="your-secret-key"
   SPACES_BUCKET="flyporter-invoices"
   ```

4. **Restart the server** and test with `POST /pdf/invoice/{{bookingId}}/upload`

For detailed setup instructions, see:
- `DIGITAL_OCEAN_SPACES_SETUP.md` - Complete setup guide
- `DO_SPACES_QUICK_REFERENCE.md` - Quick reference
- `TASK_1_CHECKLIST.md` - Setup checklist

---

## 🛠 Troubleshooting

- **401 Unauthorized** – log in again and confirm `authToken` is set
- **403 Access denied** – you are trying to access another user's data; only admins can do that
- **"Customer information required"** – run `PATCH /profile` with name, passport, and date of birth
- **"Seat is not available"** – someone already booked it; re-run `GET /seat/{{flightId}}` to pick another
- **Payment validation failed** – check card number (16 digits), CCV (3 digits), expiry (`YYYY-MM`), and that the expiry date is after `bookingDate`
- **Connection issues** – ensure the server is running (`npm run dev`) and the `baseUrl` matches the port
- **"Spaces configuration is incomplete"** – Digital Ocean Spaces environment variables are missing or incorrect; see the Spaces Configuration section above
- **Invoice upload returns 404** – the booking doesn't exist or you don't own it; verify `bookingId` is correct and you're logged in as the booking owner

---

## 💡 Tips

- Rerun `npx prisma db seed` any time you want a clean slate
- Use the Postman Console to watch auto-saved variables and request logs
- Duplicate requests to experiment without losing the baseline flow
- Admin-only endpoints are optional; the seed data already covers common customer scenarios
- `seatNumber` and `bookingDate` are set automatically when you run the flights/seat requests—no manual typing needed

---

## 🔄 Quick Checklist

### Setup
- [ ] Seed database (`npx prisma db seed`)
- [ ] Start server (`npm run dev`)
- [ ] Import Postman collection

### Customer Booking Flow
- [ ] `GET /flight` – pick a seed flight
- [ ] `GET /seat/{{flightId}}` – choose a seat
- [ ] Register/Login
- [ ] `PATCH /profile` – add passenger info
- [ ] `POST /payment/validate` – mock payment check
- [ ] `POST /bookings` – confirm booking (PDF auto-uploaded to Spaces!)
- [ ] `GET /bookings` – verify it appears
- [ ] `GET /notifications` – see confirmation message
- [ ] (Optional) `GET /pdf/invoice/{{bookingId}}` – get invoice URL from Spaces
- [ ] (Optional) `DELETE /bookings/{{bookingId}}` – cancel booking

### Optional Admin Flow
- [ ] Login as admin (`admin@123.com` / `admin123`)
- [ ] Create airline → route → flight
- [ ] Inspect generated seats

---

## 📚 Need More Help?

- Postman Docs: https://learning.postman.com/
- Backend logs (server console) for detailed error messages
- Postman Console (View → Show Postman Console) for request debugging

Happy testing! 🚀