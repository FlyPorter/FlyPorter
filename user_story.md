# Web Flow Overview

## Not Logged In
- Can search for available flights (by origin, destination, and date).  
- Cannot proceed to seat selection or booking without logging in.  
- Can view flight details but not booking information.  

---

## Customer (Logged In)

### Flow
Search → Choose flight → Seat selection → Input passenger info (name, passport) → Payment (mock) → Confirm booking → PDF invoice  

### Features
- Can view profile and update customer information.  
- Can view bookings (past and upcoming).  
- Can cancel bookings.  
- Receives notifications for booking confirmations or cancellations.  

---

## Admin

### Flow
Add and manage data → Monitor bookings → Manage cancellations and notifications  

### Features
- Add cities, airports, airlines.  
- Create routes (based on origin airport, destination airport, and airline).  
- Add flights (based on routes) with departure/arrival time, seat capacity, and price.  
- Modify flight prices.  
- View all bookings and cancel bookings.  
- Delete cities, airports, or airlines — when deleted, related flights are cancelled, and users are notified.  

---

# Customer Stories

- As a customer, I can search for flights without logging in, but booking and seat selection require login.  
- As a customer, I want to register an account so that I can make flight bookings.  
- As a customer, I want to log in securely so that I can access my profile and bookings.  
- As a customer, I want to log out so that my session ends securely.  
- As a customer, I want to search for flights by origin, destination, and departure date so that I can find available options.  
- As a customer, I want to filter search results by airline and price range so that I can choose the most suitable flight.  
- As a customer, I want to select a one-way or round-trip option so that I can plan my travel accordingly.  
- As a customer, I want to view detailed flight information including times, airline, and price before booking.  
- As a customer, I want to select my preferred seat from available ones so that I can travel comfortably.  
- As a customer, I want to input passenger information (full name, passport number) so that my booking is complete and accurate.  
- As a customer, I want to make secure payments online (mock page) so that I can finalize my booking.  
- As a customer, I want to confirm my booking and receive a PDF invoice so that I have a record of my purchase.  
- As a customer, I want to receive notifications about booking confirmations or cancellations (either by myself or the airline) so that I stay updated.  
- As a customer, I want to view and update my profile (name, email, phone) so that my contact details remain current.  
- As a customer, I want to view my past and upcoming bookings so that I can manage or cancel my travel plans easily.  

---

# Admin Stories

- As an admin, I want to view all user bookings so that I can monitor system activity.  
- As an admin, I want to cancel any booking so that I can handle exceptions or flight changes.  
- As an admin, I want to add cities, airports, and airlines so that new routes can be created.  
- As an admin, I want to add routes based on origin and destination airports and assign them to airlines.  
- As an admin, I want to add flights based on existing routes, including departure/arrival times, seat capacity, and base price.  
- As an admin, I want to modify flight prices so that I can adjust for demand or promotions.  
- As an admin, I want to cancel flights so that unavailable routes do not appear to users.  
- As an admin, I want to delete cities, airports, or airlines, and when I do, all related flights and bookings should be cancelled automatically, with users notified accordingly.  

