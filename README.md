# FlyPorter

## Table of Contents

- [Team Information](#team-information)
- [Video Demo](#video-demo)
- [Motivation](#motivation)
- [Objectives](#objectives)
- [Technical Stack](#technical-stack)
- [Features](#features)
- [User Guide](#user-guide)
- [Development Guide](#development-guide)
- [Contribution Guidelines](#contribution-guidelines)
- [Deployment Information](#deployment-information)
- [Individual Contributions](#individual-contributions)
- [Lessons Learned and Concluding Remarks](#lessons-learned-and-concluding-remarks)

---

Backend stack: Express.js + TypeScript + Prisma + PostgreSQL

## User Guide

> Note: GIF animations will be added for each feature section below.

### Registration & Login

FlyPorter supports both email/password registration and Google OAuth 2.0 authentication. Users can register as either a normal user or an admin (admin accounts require special permissions). After registration or login, you are automatically authenticated and redirected to the appropriate dashboard based on your role.

#### Test Credentials

| Role   | Email           | Password |
| ------ | --------------- | -------- |
| Admin  | admin@123.com   | admin123 |
| User   | customer.one@example.com  | password123 |
| User   | customer.two@example.com  | password123 |

<!-- GIF placeholder for Registration & Login -->

---

### Admin Features (Admin Users Only)

Admin users have access to a comprehensive flight management system to create, update, and manage all aspects of the flight booking system.

#### Flight Management

Admins can view, search, update, and delete flights from the admin dashboard. Use the search panel on the left to filter flights by origin, destination, date, airline, or price range. All flights are displayed in a list format with options to update or delete each flight.

<!-- GIF placeholder for Flight Management -->

#### Add Flight

Create new flights by selecting an existing route and specifying the departure date and available ticket count. The seat capacity must match the aircraft's capacity for the selected route.

<!-- GIF placeholder for Add Flight -->

#### Add Airport

Add new airports to the system by entering the airport code (e.g., YYZ, YVR) and the corresponding city name. Airports are used when creating routes.

<!-- GIF placeholder for Add Airport -->

#### Add Airline

Add new airlines by entering the airline code and airline name. Airlines are associated with routes and flights in the system.

<!-- GIF placeholder for Add Airline -->

#### Add Route

Create flight routes by selecting an airline, aircraft, origin airport, destination airport, and setting the operation period (start and end dates). Routes define the path that flights will follow, and flights are generated within the specified time window.


<!-- GIF placeholder for Add Route -->

---

### Normal User Features

Normal users can search for flights, select seats, make bookings, and manage their reservations through an intuitive interface.

#### Flight Search

Search for flights using the search panel. Features include:
- Choose between one-way or round trip
- Enter origin and destination (with autocomplete suggestions)
- Select departure date (and return date for round trips)
- Filter by airline and price range
- View flight recommendations when no search is performed

<!-- GIF placeholder for Flight Search -->

#### Seat Selection

After selecting a flight, choose your preferred seat from an interactive seat map. The seat map displays:
- **AVAILABLE**: Seats ready to be selected
- **BOOKED**: Seats already taken by other passengers
- **UNAVAILABLE**: Seats that cannot be selected

For round trips, select seats for both outbound and return flights sequentially. Seat prices vary based on class (Economy, Business, First).

<!-- GIF placeholder for Seat Selection -->

#### Booking

Complete your booking by filling in passenger information. You can:
- Select an existing passenger from your profile
- Create a new passenger profile
- Enter passenger details (name, birth date, gender, address, phone number, passport number)
- Review flight and seat details
- Confirm booking to lock in your seat

<!-- GIF placeholder for Booking -->

#### Booking Confirmation

After completing a booking, you'll be redirected to the booking confirmation page where you can:
- View booking details for outbound and return flights (if applicable)
- Download PDF invoice/receipt
- See confirmation notifications

<!-- GIF placeholder for Booking Confirmation -->

#### View Bookings (Dashboard)

Access your bookings dashboard from the sidebar to:
- View all your current and past bookings
- See flight details, seat numbers, and booking status
- Cancel bookings
- Modify seat selections

<!-- GIF placeholder for View Bookings -->

#### Modify Seat

Change your seat selection for an existing booking. Select a new available seat from the seat map, and the system will update your booking accordingly.

<!-- GIF placeholder for Modify Seat -->

#### Passenger Profile Management

Manage your passenger profiles from the profile page:
- View all passengers associated with your account
- Add new passenger profiles
- Edit existing passenger information (name, birth date, gender, address, phone number, passport number)
- Use passenger profiles for quick booking

<!-- GIF placeholder for Passenger Profile Management -->


---

## Development Guide

backend:

admin account:

admin@123.com

admin123

### Database Setup

#### Install PostgreSQL and create the database

1. Download and install PostgreSQL from https://www.postgresql.org/download/

   - Mac/Linux Setup via Homebrew:

     ```
     /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
     brew install postgresql
     ```

     start psql

     ```
     brew services start postgresql
     ```

     or if your version is 16:

     ```
     brew services start postgresql@16
     ```

   - Windows Setup: Download and run the installer to install and start PostgreSQL

2. Create a new database named `flyporter_db`:
   ```
   createdb flyporter_db
   ```
   > Note: On Windows, if you don't know the PostgreSQL password for your Windows username,
   > use the following command instead (the installer only sets up the password for the `postgres` user):
   >
   > ```
   > createdb flyporter_db -U postgres
   > ```

#### Set up the Prisma schema

Under `backend` folder:

```
cd backend
```

1. Install dependencies:

   ```
   npm install
   ```

2. For convenience, we provide `.env.dev` for local development. Simply copy it to `.env` and update the database credentials. For custom Google OAuth 2.0 and DigitalOcean Spaces configuration, use `.env.example` as a template.

   ```
   cp .env.dev .env
   ```

   > Note: You need to chenge `username` to your psql username, `password` to your psql password.

3. Run the migration:

   ```
   npx prisma migrate dev --name init
   ```

   This creates and runs the SQL migration file and generates an Entity Relationship Diagram.

4. Verify the setup:
   - Check for `backend/prisma/migrations/<yyyyMMddHHmmss>_init/migration.sql`
   - Verify `backend/prisma/ERD.svg` exists
   - Confirm tables are created in the `flyporter_db` database

> Reset and re-create the prisma schema (Optional, only if you want to reset the database from a previous schema)
>
> 1. Delete `backend/prisma/migrations` folder.
> 2. Reset the prisma schema
>    ```
>    npx prisma migrate reset
>    ```
> 3. Re-create the prisma schema
>    ```
>    npx prisma migrate dev --name init
>    ```

### Seed the Database

Under `backend` folder:

1. Seed initial data (run once per fresh setup)

   ```
   cd backend
   npx prisma db seed
   ```

   This creates:

   - Admin user: `admin@123.com` / `admin123`
   - 4 Cities: Toronto, Vancouver, Montreal, Ottawa
   - 4 Airports: YYZ, YVR, YUL, YOW
   - 2 Airlines: FlyPorter, Air Canada
   - 6 Routes between the cities
   - 3 future-dated flights with generated seats (ready to book)

2. Re-seed (optional)

   - You can run `npx prisma db seed` again to add the same baseline data if you cleared the tables.
   - For a clean reset, run:
     ```
     npx prisma migrate reset
     npx prisma db seed
     ```

3. Quick test (optional)
   - Start the server (see below), then import `backend/FlyPorterAPI.postman_collection.json` into Postman.
   - Follow the flow: `GET /flight` → `GET /seat/{flightId}` → `POST /auth/register|login` → `PATCH /profile` (add name, passport, DOB) → `POST /payment/validate` → `POST /bookings`.
   - See `backend/POSTMAN_GUIDE.md` for details.

### Run the Backend Server after Database Setup

Under `backend` folder:

1. Install dependencies
   ```
   npm install
   ```
2. Start the server
   ```
   npm start
   ```
   OR
   ```
   npm run dev
   ```
3. Check the backend API documentation at `https://editor.swagger.io/`
   ```
   Import FlyPorterAPI_openapi.yaml
   ```
   Or import FlyPorterAPI.postman_collection.json to your postman

Transfer postman collection to openapi
postman-to-openapi FlyPorterAPI.postman_collection.json FlyPorterAPI_openapi.yaml

### Postman Collection Demo

#### 1. Create a Workspace

Start by creating a new workspace in Postman.

#### 2. Import API Collection

Import the `FlyPorter.postman_collection.json` file into your workspace.

#### 3. Create an Environment

In the top-left corner, create a new environment.  
The environment is used to store the authentication token after login (the token is automatically saved via the Postman script in the login API's response).

> Note:  
> You must run the `Login API` first to authenticate and get the token before accessing other APIs. Check out environment variables.

#### API Usage Made Easy

All sample inputs (parameters, request bodies) are pre-configured.  
As a developer, you do not need to manually input anything — just select the API you want to test and click Send.

### Frontend Setup

Under `frontend` folder:

```bash
cd frontend
```

Install dependencies

```bash
npm install
```

#### Environment Configuration

Create a `.env` file in the frontend directory with the following variables:

```env
# API Base URL
# For development: http://localhost:3000/api
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_AUTH_URL=http://localhost:3000/api/auth/google 
VITE_AUTH_URL=http://localhost:3000/api/auth
```

If `.env.dev` exists, you can copy it:

```bash
cp .env.dev .env
```

**Note:** All API calls use the `API_BASE_URL` from `src/config.ts`, which reads from the `VITE_API_URL` environment variable.

Start the frontend server

```bash
npm run dev
```

Access the frontend at

http://localhost:5173
