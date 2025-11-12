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

### Search without Logging in

FlyPorter supports flight search without logging in. All users can search available flights. But booking and seat selection require login. Users will be redirected to the login page if they try to select a flight without logging in.

![Image](https://github.com/user-attachments/assets/c219c0a8-9d5b-4fa1-b7ba-98405e1d8619)


### Registration & Login

FlyPorter supports both email/password registration and Google OAuth 2.0 authentication. Users can register as either a normal user or an admin (admin accounts require special permissions). After registration or login, you are automatically authenticated and redirected to the appropriate dashboard based on your role.

#### Test Credentials

| Role   | Email           | Password |
| ------ | --------------- | -------- |
| Admin  | admin@123.com   | admin123 |
| User   | customer.one@example.com  | password123 |
| User   | customer.two@example.com  | password123 |


![Image](https://github.com/user-attachments/assets/638428fa-ca42-4dfb-800d-291ea95fe868)

![Image](https://github.com/user-attachments/assets/4bc7a10b-e297-4e6e-a9a0-2e01a5a4bac8)

---

### Admin Features (Admin Users Only)

Admin users have access to a comprehensive flight management system to create, update, and manage all aspects of the flight booking system.

#### Flight Management

Admins can view, search, update, and delete flights from the admin dashboard. Use the search panel on the left to filter flights by origin, destination, date, airline, or price range. All flights are displayed in a list format with options to update or delete each flight.

![Image](https://github.com/user-attachments/assets/a10af753-65fd-485e-a0ec-9570922fd4c7)

#### Add Flight

Create new flights by selecting an existing route or by airports and specifying the departure date and available ticket count.

![Image](https://github.com/user-attachments/assets/f3c19397-f98b-457d-9199-860d3c4f8bd6)

#### Add Airport

Add new airports to the system by entering the airport code (e.g., YYZ, YVR) and the corresponding airport name and city name. Airports are used when creating routes and flights.

![Image](https://github.com/user-attachments/assets/1886a2ce-910d-4a64-ae15-6c4078a66df6)

#### Add Airline

Add new airlines by entering the airline code and airline name. Airlines are associated with routes and flights in the system.

![Image](https://github.com/user-attachments/assets/78bfd011-709b-4e6f-888d-fba1767b84ef)

#### Add Route

Create flight routes by selecting the origin airport and destination airport. Routes define the path that flights will follow.

![Image](https://github.com/user-attachments/assets/0447d67f-85e7-4e2b-9a43-9314f60bebb2)

#### All Bookings Management

Admin users can view all user bookings to monitor system activity.
Admin users can cancel any booking to handle exceptions or flight changes.

![Image](https://github.com/user-attachments/assets/b7b2a8a5-6837-40d8-bba5-20c21c125416)

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

![Image](https://github.com/user-attachments/assets/61a6391c-12e6-4d68-af56-e7e11a030583)

#### Seat Selection

After selecting a flight, choose your preferred seat from an interactive seat map. The seat map displays:
- **AVAILABLE**: Seats ready to be selected
- **BOOKED**: Seats already taken by other passengers
- **UNAVAILABLE**: Seats that cannot be selected

![Image](https://github.com/user-attachments/assets/cf5212cc-0c85-41cf-bc61-6e66feb27c87)

#### Booking

Complete your booking by filling in passenger information. You can:
- Select an existing passenger from your profile
- Create a new passenger profile
- Enter passenger details (name, birth date, gender, address, phone number, passport number)
- Review flight and seat details
- Enter payment info
- Confirm booking to lock in your seat

![Image](https://github.com/user-attachments/assets/587de127-25a8-42a1-9705-5c5d76572154)

#### Booking Confirmation

After completing a booking, you'll be redirected to the booking confirmation page where you can:
- View booking details for outbound and return flights (if applicable)
- Download PDF invoice/receipt
- See confirmation notifications

![Image](https://github.com/user-attachments/assets/adb98e99-5d14-4aaf-86e4-b183090e08a4)

#### View Bookings (Dashboard)

Access your bookings dashboard from the sidebar to:
- View all your current and past bookings
- See flight details, seat numbers, and booking status
- Cancel bookings
- Modify seat selections

![Image](https://github.com/user-attachments/assets/b446520d-0591-4669-a72e-5f9351892f6b)

#### Profile Management

Manage your profile from the profile page:
- Edit existing information (name, birth date, gender, address, phone number, passport number)
- Use profile for quick booking

![Image](https://github.com/user-attachments/assets/08b630f4-60e1-4e22-8a46-09c162e2223c)


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

### Docker Instruction

### 1. Start Docker

Open **Docker Desktop** and verify it’s running:

```sh
docker --version
docker info
```

---

### 2. Build and Run with Docker Compose

```sh
docker compose build
```

Run in foreground:

```sh
docker compose up
```

Or run in background:

```sh
docker compose up -d
```

---

### Optional Commands

```sh
docker ps                 # list running containers
docker compose down       # stop and remove containers
```

```

```

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
