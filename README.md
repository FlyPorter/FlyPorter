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

## Team Information

| Name        | Student Number | Email                          |
| ----------- | -------------- | ------------------------------ |
| Yueheng Shi | 1012569267     | yh.shi@mail.utoronto.ca           |
| Zihan Wan   | 1011617779     | zihanzane.wan@mail.utoronto.ca |
| Yiyang Wang | 1010033278     | ydev.wang@mail.utoronto.ca     |

## Video Demo
Watch the Demo here: [Demo](https://youtu.be/WjgvvVngZCI)

## Motivation

In the digital age, people expect flight booking websites to work quickly and reliably. But many platforms still have problems, especially when lots of people try to book at the same time during holidays or sales. Users run into slow loading times, booking errors, or the site crashing completely when traffic spikes. These issues usually happen because the systems use outdated technology, don't have enough server power, and can't adjust when demand suddenly increases. Without a solid setup, these platforms can't handle many users at once or adapt to changes in traffic, which leads to frustrating experiences and frequent crashes.

FlyPorter is built to fix these problems by creating a modern flight booking platform that runs on the cloud. The project focuses on making sure the system stays stable and responsive even when many people are using it at once, so users can always complete their bookings without issues. By using cloud technology like spreading the workload across multiple servers, storing data reliably, and automatically adjusting resources based on demand, FlyPorter can handle busy periods smoothly and recover quickly if something goes wrong. This not only makes the system more reliable but also keeps everything running well during peak travel times.

FlyPorter is designed for people booking flights within Canada. The main users are business travellers who need quick and reliable booking, students and regular flyers looking for affordable options, and airline staff who manage flight schedules and seat availability. Travellers can easily search for flights, pick their seats, and complete bookings through a simple interface that shows seat availability in real time. Airline staff can add or update flight information quickly, and these changes sync immediately so users always see accurate schedules and seat options.

For airline staff, FlyPorter includes a management dashboard that makes it easy to handle flights and routes. They can create, edit, and update flight details with instant synchronization, ensuring travellers always see the right information. This focus on both travellers and administrators makes FlyPorter practical for real use and good for showing how reliable systems work.

This project is worth building because it shows how cloud-based solutions can solve the problems that older systems have. Many existing platforms still rely on outdated technology and rigid architectures with fixed setups that can't adapt during peak periods, sudden traffic spikes, or when handling access from different regions. FlyPorter, on the other hand, demonstrates the advantages of using the cloud, like being able to scale up or down, having backup systems, and automating processes. Features like load balancing, storing data securely, and monitoring performance help the system run better and last longer.

Overall, FlyPorter aims to create a flight booking system that's both technically solid and easy to use. It shows how cloud computing ideas like scalability, backup systems, and constant availability can turn a regular website into a dependable platform. By improving reliability, speed, and ease of use, FlyPorter creates a better experience for both travellers and staff, while demonstrating how modern cloud technology can solve real problems in online services.

## Objectives

The primary objective of the FlyPorter project is to design and implement a fully cloud-native, scalable, and reliable flight booking platform that supports real-world operational requirements. The goal is to build an end-to-end system that allows users to efficiently search, book, and manage flights while ensuring high availability, security, and consistent performance across environments.

Through this implementation, the project aims to achieve the following objectives:

**Cloud-Native Architecture**

Build a modern application stack using React (TypeScript), Node.js (Express.js), and PostgreSQL, packaged and deployed through Docker and Kubernetes for consistent behavior across development and production.

**Reliable Data Persistence**

Ensure stateful and resilient data storage using DigitalOcean Managed PostgreSQL, allowing data to persist across deployments, container restarts, and system updates.

**Modern DevOps and Orchestration**

Use Kubernetes for orchestration, auto-scaling, and high availability, and set up a GitHub Actions CI/CD pipeline to automate building and deployment.

**Monitoring and Observability**

Implement system-level monitoring (CPU, memory, disk) using DigitalOcean metrics, Prometheus, and Grafana to gain full visibility into application health and performance.

**Scalability and Performance**

Achieve dynamic scaling using Horizontal Pod Autoscalers on DigitalOcean Kubernetes, ensuring the system automatically adapts to traffic load.

**Security Enhancements**

Strengthen security with Google OAuth authentication, HTTPS enforcement, secure secrets management (GitHub Secrets + Kubernetes Secrets), and proper container isolation.

**REST API Testing and Visualization**

Provide a robust API layer with proper testing and developer-facing visualization tools to ensure correctness and maintainability.

**Integration With External Services**

Implement reliable communication features such as email notifications via SendGrid and automated PDF invoice generation stored securely in DigitalOcean Spaces.

**Multi-Environment Consistency**

Maintain a multi-container architecture locally using Docker Compose and a production-grade distributed environment in Kubernetes, ensuring smooth transitions between development and deployment environments.

## Technical Stack

**Backend:** Express.js + TypeScript + Prisma + PostgreSQL

**Frontend:** React + TypeScript + Vite + React Router

### Core Technologies

**Containerization and Local Development:**
- **Docker**: Containerized application components (backend, frontend, database)
- **Docker Compose**: Multi-container setup for local development and testing

**State Management:**
- **PostgreSQL**: Relational database for persistent data storage.
- **Prisma**: Type-safe ORM for database access and migrations
- **DigitalOcean Managed PostgreSQL**: Production database with persistent storage

**Deployment Provider:**
- **DigitalOcean**: Cloud infrastructure provider (IaaS)
- **DigitalOcean Kubernetes (DOKS)**: Managed Kubernetes cluster for orchestration
- **DigitalOcean Container Registry**: Docker image storage and distribution

**Orchestration Approach:**
- **Kubernetes**: Container orchestration platform for production deployment
  - Deployments with replica management
  - Services for load balancing
  - Ingress for HTTPS routing
  - Horizontal Pod Autoscaler (HPA) for auto-scaling

**Monitoring and Observability:**
- **DigitalOcean Metrics**: System-level monitoring (CPU, memory, disk) via DigitalOcean's built-in monitoring tools
- **Prometheus**: Metrics collection and alerting system with automated alerts for CPU, memory, disk usage, pod restarts, and crash loop detection
- **Grafana**: Visualization and dashboarding for monitoring metrics

### Application Stack

**Backend:**
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **TypeScript**: Type-safe JavaScript
- **Prisma**: Database ORM and migration tool

**Frontend:**
- **React**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Build tool and development server
- **React Router**: Client-side routing

### Advanced Features

**Auto-scaling and High Availability:**
- **Kubernetes Horizontal Pod Autoscaler (HPA)**: Automatic scaling based on CPU and memory utilization (2-4 replicas)
- **Pod Anti-Affinity**: Ensures high availability by distributing pods across nodes
- **Rolling Updates**: Zero-downtime deployments

**CI/CD Pipeline:**
- **GitHub Actions**: Automated build and deployment pipeline
  - Automated Docker image builds
  - Push to DigitalOcean Container Registry
  - Automated Kubernetes deployment on code push

**Security Enhancements:**
- **Google OAuth 2.0**: Authentication via Google accounts (using Passport.js)
- **JWT (JSON Web Tokens)**: Secure session management
- **HTTPS**: TLS/SSL encryption via NGINX Ingress Controller with Let's Encrypt certificates managed by cert-manager
- **Kubernetes Secrets**: Secure management of sensitive credentials (database URLs, API keys)
- **Role-Based Access Control (RBAC)**: Admin and customer user roles

**Integration with External Services:**
- **SendGrid**: Email notification service for booking confirmations and cancellations
- **DigitalOcean Spaces**: Object storage for PDF invoice/receipt storage and retrieval

## Features

### Ⅰ. Application Features

**User Authentication and Authorization**: Google OAuth 2.0 integration, email/password registration, role-based access control (admin/customer), and JWT-based session management.

**Flight Search and Discovery**: One-way and round-trip searches with filtering by origin/destination, dates, airlines, and price ranges. Autocomplete suggestions and public access (no login required for search).

**Seat Selection and Management**: Interactive seat maps with real-time availability (AVAILABLE, BOOKED, UNAVAILABLE), seat reservation during booking, and seat modification for existing bookings.

**Booking Management**: Complete booking flow with passenger profile management, round-trip support, booking dashboard, cancellation with automatic seat release, and seat modification.

**Payment Processing**: Mock payment processing with credit card validation and secure transaction handling.

**Invoice and Receipt Management**: Automated PDF generation, cloud storage in DigitalOcean Spaces, download functionality, and email attachments.

**Email Notifications**: Automated booking confirmations and cancellations via SendGrid with professional email templates and PDF invoice attachments.

**Admin Dashboard**: Flight, route, airport, and airline management with comprehensive filtering, booking oversight, and system monitoring.

**Profile Management**: User profile updates and multiple passenger profile storage for quick booking reuse.

### Ⅱ. How Features Fulfill Course Project Requirements

#### Core Technical Requirements 

**1. Containerization and Local Development**
- **Docker**: All components (frontend, backend, database) are containerized with individual Dockerfiles
- **Docker Compose**: Multi-container local development setup (`compose.yml`) enables running the entire stack with `docker compose up`

**2. State Management**
- **PostgreSQL**: Relational database for all persistent data (users, flights, bookings, seats, routes, airports, airlines) managed with Prisma ORM
- **Persistent Storage**: DigitalOcean Managed PostgreSQL ensures data persists across container restarts and deployments with automatic backups

**3. Deployment Provider**
- **DigitalOcean (IaaS)**: Deployment using DigitalOcean Kubernetes (DOKS), Container Registry, Managed PostgreSQL, and Spaces for object storage

**4. Orchestration Approach (Kubernetes - Option B)**
- **Kubernetes**: Production orchestration with Deployments (replica management), Services (load balancing), Ingress (HTTPS routing), HPA (auto-scaling 2-4 replicas), and Pod Anti-Affinity (fault tolerance)

**5. Monitoring and Observability**
- **DigitalOcean Metrics**: System-level monitoring for CPU, memory, and disk usage
- **Prometheus**: Metrics collection with automated alerts for CPU (70%/90%), memory (75%/90%), disk (25%/10% available), pod health, and HPA status
- **Grafana**: Visualization dashboards for application health and performance metrics

#### Advanced Features 

**1. Auto-scaling and High Availability**
- **HPA**: Automatic scaling from 2 to 4 replicas based on CPU (60% threshold) and memory (70% threshold) utilization
- **High Availability**: Pod anti-affinity across nodes, minimum 2 replicas, rolling updates, and Pod Disruption Budget

**2. CI/CD Pipeline**
- **GitHub Actions**: Automated pipeline that builds Docker images, pushes to DigitalOcean Container Registry, deploys to Kubernetes, and performs health checks on code push to main branch

**3. Security Enhancements**
- **Authentication/Authorization**: Google OAuth 2.0, JWT sessions, and role-based access control (admin/customer)
- **HTTPS**: TLS/SSL via NGINX Ingress Controller with Let's Encrypt certificates managed by cert-manager
- **Secrets Management**: Kubernetes Secrets for database URLs, JWT secrets, and API keys (created from GitHub Secrets during deployment)

**4. Integration with External Services**
- **SendGrid**: Email notifications for booking confirmations and cancellations with PDF invoice attachments
- **DigitalOcean Spaces**: Cloud storage for PDF invoices with signed URL access
- **Google OAuth**: External authentication service integration

### Ⅲ. How Features Achieve Project Objectives

**Cloud-Native Architecture**: React/TypeScript frontend, Node.js/Express.js backend, and PostgreSQL database, all containerized with Docker and orchestrated using Kubernetes for consistent deployment across environments.

**Reliable Data Persistence**: DigitalOcean Managed PostgreSQL with automatic backups ensures all data persists reliably across deployments and container restarts.

**Modern DevOps and Orchestration**: Kubernetes enables automatic scaling, load balancing, and high availability. GitHub Actions CI/CD automates builds and deployments.

**Monitoring and Observability**: DigitalOcean Metrics, Prometheus, and Grafana provide visibility into system health, performance, and resource utilization.

**Scalability and Performance**: HPA automatically adjusts pod replicas based on load. Load balancing distributes requests across multiple instances.

**Security Enhancements**: OAuth authentication, HTTPS encryption, Kubernetes Secrets management, and role-based access control protect user data.

**REST API Testing and Visualization**: RESTful API with Postman collection and Swagger documentation for testing and integration.

**Integration with External Services**: SendGrid email notifications and DigitalOcean Spaces file storage enhance user experience.

**Multi-Environment Consistency**: Docker Compose enables local development with the same containerized architecture as production.

## User Guide

> **Quick Test:**
>
> - To test the app without setup, try the app live at https://app.flyporter.website.
> - For local developemnt, follow the setup instructions in [Development Guide](#development-guide).

### Search without Logging in

FlyPorter supports flight search without logging in. All users can search available flights. But booking and seat selection require login. Users will be redirected to the login page if they try to select a flight without logging in.

![Image](https://github.com/user-attachments/assets/c219c0a8-9d5b-4fa1-b7ba-98405e1d8619)

### Registration & Login

FlyPorter supports both email/password registration and Google OAuth 2.0 authentication. Users can register as either a normal user or an admin (admin accounts require special permissions). After registration or login, you are automatically authenticated and redirected to the appropriate dashboard based on your role.

#### Test Credentials

| Role  | Email                    | Password    |
| ----- | ------------------------ | ----------- |
| Admin | admin@123.com            | admin123    |
| User  | customer.one@example.com | password123 |
| User  | customer.two@example.com | password123 |

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

**Current Available Flights: Canadian Flights between 12.7 - 12.31, 2025**

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

### Docker Instructions

If you use Docker to run the application:

**Start the application:**

```bash
docker compose up --build
```

**Stop the application (keeping containers):**

```bash
docker compose stop
```

**Stop and remove containers, networks, and volumes:**

```bash
docker compose down
```

Frontend: http://localhost:5173

Backend: http://localhost:3000

Database: http://localhost:5432

### Local Development Setup

The following guide has been tested on:

**MacOS:**

- Node.js: v20.15.0
- npm: 10.7.0
- PostgreSQL: 14.16 (Homebrew)

**Windows PowerShell:**

- Node.js: v20.17.0
- npm: 10.8.2
- PostgreSQL x64: 17.3

**Verified Browser:**

- Chrome

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

   > Note: On Windows, if you don't know the PostgreSQL password for your Windows username, use the following command instead (the installer only sets up the password for the `postgres` user):
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

   > Note: You need to change `username` to your psql username, `password` to your psql password.

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

   - Admin user
   - Demo customer user with passenger profiles:
     - `customer.one@example.com` / `password123`
     - `customer.two@example.com` / `password123`
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

3. Access the backend API documentation at `https://editor.swagger.io/`

   ```
   Import FlyPorter/FlyPorter.ymal
   ```

   Or import `FlyPorter/backend/FlyPorterAPI.postman_collection.json` to your Postman

   > Note: To transfer Postman collection to OpenAPI format:
   >
   > ```
   > postman-to-openapi FlyPorterAPI.postman_collection.json FlyPorterAPI_openapi.yaml
   > ```

### Test Backend APIs Manually after Database Setup and Server Start

Under `backend` folder, run the seed script to populate initial data for testing.

The seed script will create:

- Admin account: `admin@123.com` with password `admin123`
- Demo customer users:
  - `customer.one@example.com` with password `password123`
  - `customer.two@example.com` with password `password123`
- 4 Cities: Toronto, Vancouver, Montreal, Ottawa
- 4 Airports: YYZ, YVR, YUL, YOW
- 2 Airlines: FlyPorter, Air Canada
- 6 Routes between the cities
- 3 future-dated flights with generated seats (ready to book)

> Note: This step is optional, you can skip it if you do not want to populate data. Also, the seed script does not reset the database, so the id will increase in each run. You can check the seed.log file or your terminal output for the created data that can be used to test our application.

After running the seed script, you can test the APIs by using the Postman Collection or access the swagger UI at `https://editor.swagger.io/` to test the APIs.

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

### Postman Collection Demo

#### 1. Create a Workspace

Start by creating a new workspace in Postman.

#### 2. Import API Collection

Import the `FlyPorter/FlyPorter.ymal` file into your workspace.

#### 3. Create an Environment

In the top-left corner, create a new environment.  
The environment is used to store the authentication token after login (the token is automatically saved via the Postman script in the login API's response).

> Note:  
> You must run the `Login API` first to authenticate and get the token before accessing other APIs. Check out environment variables.

![Image](https://github.com/user-attachments/assets/ccecb479-7129-4099-aa6f-c14a52e4a7e5)

#### API Usage Made Easy

All sample inputs (parameters, request bodies) are pre-configured.  
As a developer, you do not need to manually input anything — just select the API you want to test and click Send.

---

## Contribution Guidelines

We welcome contributions to FlyPorter! This document outlines the process and guidelines for contributing to the project.

### Getting Started

1. **Fork the repository**

2. **Clone your fork**

   ```
   git clone https://github.com/your-username/FlyPorter.git
   ```

3. **Set up your development environment** following the Development Guide

4. **Create a new branch for your feature/fix:**

   ```
   git checkout -b feature/your-feature-name
   ```

### Development Process

\*\*Follow the devlopment guide

- Setup database and enviornments
- Check APIs using Swagger or Postman

**Make your changes following our coding standards:**

- Use TypeScript for both frontend and backend development
- Follow the existing code style and patterns
- Write clear, descriptive commit messages
- Add comments for complex logic
- Update documentation as needed

**Test your changes:**

- Test using the Postman Collection
- Test the mobile app on both iOS and Android platforms
- Write your own test cases

**Commit your changes:**

```
git add .
git commit -m "Description of your changes"
```

**Push to your fork:**

```
git push origin feature/your-feature-name
```

### Pull Request Process

1. Create a Pull Request (PR) from your fork to the main repository
2. Ensure your PR description clearly describes the problem and solution
3. Include the relevant issue number if applicable
4. The PR will be reviewed by our team members
5. Address any feedback or requested changes
6. Once approved, your PR will be merged

### Code Review Guidelines

- All code must be reviewed by at least one team member
- Code should be well-documented and follow our coding standards
- Tests should be included for new features
- The PR should not introduce any new linting errors
- The changes should be focused and not include unrelated modifications

### Questions or Problems?

If you have any questions or run into problems, please:

- Check the Development Guide
- Open an issue in the repository
- Contact the team members listed in Team Information

---

## Deployment Information

### Backend Deployment

The backend server is deployed on Digital Ocean. And we use GitHub Actions for automated builds/deployments. To test backend APIs, the prefix is https://api.flyporter.website/api

### Frontend Deployment

The frontend server is deployed on Digital Ocean App Platfom, you can access it on https://app.flyporter.website

---

## Individual Contributions

### Yiyang Wang

- Backend (Admin):
  - Designed and implemented the flyporter database schema using Prisma
  - Implemented user authentication and authorization using JWT
  - Integrated Google OAuth 2.0 to support sign-in with Google accounts
  - Developed APIs to retrieve passenger tickets and generate ticket PDFs, storing them in DigitalOcean Spaces for download
  - Built admin-side operational APIs and prepared corresponding API documentation
  - Created Docker Compose configurations to run the database and backend services simultaneously

### Yueheng Shi

- Frontend (Customer & Admin):
  - Implemented customer features: flight search, seat selection, booking flow
  - Built admin dashboard for flight, airport, airline, and route management
  - Developed user profile and booking dashboard
  - Connected frontend to backend APIs and integrated Google OAuth 2.0 authentication
- Frontend Deployment:
  - Configured and deployed frontend application on Digital Ocean App Platform

### Zihan Wan

- Backend (Customer):
  - Implemented RESTful APIs for flights, routes, airports, airlines, bookings, and customer operations
  - Developed flight search API with filtering by city, date, airline, and price
  - Refactored booking logic and invoice generation for one-way and round-trip bookings
  - Implemented payment validation, confirmation code generation, and booking notification system

- Deployment and Infrastructure:
  - Configured and deployed backend to DigitalOcean Kubernetes (DOKS) with Managed PostgreSQL
  - Implemented GitHub Actions CI/CD pipeline for automated builds and deployments
  - Set up HTTPS with Let's Encrypt certificates, Kubernetes configurations (Deployments, Services, Ingress, HPA), and GitHub Secrets integration
  - Configured backend containerization with Docker
  - Set up Prometheus and Grafana with alert rules for CPU, memory, disk usage, and pod health

- External Services Integration:
  - Integrated SendGrid for email notifications and DigitalOcean Spaces for PDF invoice storage
---

## Lessons Learned and Concluding Remarks

Through this project, we have gained hands-on experience with various cloud service models (IaaS, PaaS, SaaS), containerization with Docker, orchestration using Kubernetes, serverless architectures, edge deployment with DigitalOcean, and monitoring of distributed applications. Additionally, we have implemented several advanced features, including auto-scaling, CI/CD pipelines, Google authentication, email notifications, and cloud PDF file storage.

### Future Enhancements

Looking ahead, we plan to enhance the system with the following improvements:

- **Integrate external weather APIs** to enhance travel insights and provide users with real-time weather information for their destinations
- **Integrate AI-powered services** for user consultation, enabling intelligent flight recommendations and personalized travel assistance
