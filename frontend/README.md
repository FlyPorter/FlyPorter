# Setup

Under frontend folder:

```bash
cd frontend
```

Install dependencies

```bash
npm install
```

## Environment Configuration

Create a `.env` file in the frontend directory with the following variables:

```env
# API Base URL
# For development: http://localhost:3000/api
# For production: https://{domain}/api
VITE_API_URL=http://localhost:3000/api

# Optional: Google OAuth URL (defaults to ${domain}/auth/google)
# VITE_GOOGLE_AUTH_URL=

# Optional: General Auth URL (defaults to ${domain}/auth)
# VITE_AUTH_URL=
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

## Production Deployment

For production deployment, set the `VITE_API_URL` environment variable to the production API URL:

```env
VITE_API_URL=https://api.{domain}.com/api
```

All API calls will automatically use this URL.
