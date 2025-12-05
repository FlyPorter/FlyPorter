# Simple Dockerfile using Vite Preview (no nginx needed)
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_URL
ARG VITE_GOOGLE_AUTH_URL
ARG VITE_AUTH_URL

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_AUTH_URL=$VITE_GOOGLE_AUTH_URL
ENV VITE_AUTH_URL=$VITE_AUTH_URL

# Build the application
RUN npm run build

# Expose port (Vite preview uses 4173 by default)
EXPOSE 4173

# Use Vite preview to serve the built files
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]

