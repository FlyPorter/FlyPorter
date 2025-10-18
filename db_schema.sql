-- ===================================================
-- FlyPorter Database Schema (PostgreSQL Version)
-- Copyright (c) 2025 FlyPorter
-- Licensed under the MIT License
-- ===================================================

CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'CUSTOMER')),
  email VARCHAR(100) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name VARCHAR(100),
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE customer_info (
  info_id SERIAL PRIMARY KEY,
  user_id INT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  passport_number VARCHAR(30),
  nationality VARCHAR(50),
  date_of_birth DATE,
  gender VARCHAR(10),
  address TEXT,
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20)
);

CREATE TABLE cities (
  city_id SERIAL PRIMARY KEY,
  city_name VARCHAR(100) NOT NULL,
  country VARCHAR(100),
  timezone VARCHAR(50)
);

CREATE TABLE airports (
  airport_id SERIAL PRIMARY KEY,
  city_id INT REFERENCES cities(city_id) ON DELETE CASCADE,
  airport_code VARCHAR(10) UNIQUE NOT NULL,
  airport_name VARCHAR(150) NOT NULL
);

CREATE TABLE airlines (
  airline_id SERIAL PRIMARY KEY,
  airline_name VARCHAR(100) NOT NULL,
  airline_code VARCHAR(10) UNIQUE NOT NULL
);

CREATE TABLE routes (
  route_id SERIAL PRIMARY KEY,
  airline_id INT REFERENCES airlines(airline_id) ON DELETE CASCADE,
  origin_airport_id INT REFERENCES airports(airport_id),
  destination_airport_id INT REFERENCES airports(airport_id),
  domestic BOOLEAN DEFAULT TRUE,
  seasonal BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  notes TEXT
);

CREATE TABLE flights (
  flight_id SERIAL PRIMARY KEY,
  airline_id INT REFERENCES airlines(airline_id),
  route_id INT REFERENCES routes(route_id),
  departure_airport_id INT REFERENCES airports(airport_id),
  arrival_airport_id INT REFERENCES airports(airport_id),
  departure_time TIMESTAMPTZ NOT NULL,
  arrival_time TIMESTAMPTZ NOT NULL,
  base_price NUMERIC(10,2) NOT NULL,
  seat_capacity INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  flight_duration INTERVAL GENERATED ALWAYS AS (arrival_time - departure_time) STORED
);

CREATE TABLE seats (
  seat_id SERIAL PRIMARY KEY,
  flight_id INT REFERENCES flights(flight_id) ON DELETE CASCADE,
  seat_number VARCHAR(5) NOT NULL,
  class VARCHAR(20) NOT NULL CHECK (class IN ('economy', 'business', 'first')),
  price_modifier NUMERIC(5,2) DEFAULT 1.0,
  is_available BOOLEAN DEFAULT TRUE,
  UNIQUE (flight_id, seat_number)
);

CREATE TABLE bookings (
  booking_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(user_id),
  flight_id INT REFERENCES flights(flight_id),
  seat_id INT REFERENCES seats(seat_id),
  booking_time TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
  total_price NUMERIC(10,2),
  confirmation_code VARCHAR(12) UNIQUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
