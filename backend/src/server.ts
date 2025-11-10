import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import airlineRoutes from "./routes/airline.routes.js";
import cityRoutes from "./routes/city.routes.js";
import airportRoutes from "./routes/airport.routes.js";
import routeRoutes from "./routes/route.routes.js";
import flightRoutes from "./routes/flight.routes.js";
import seatRoutes from "./routes/seat.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import pdfRoutes from "./routes/pdf.routes.js";
import { env } from "./config/env.js";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use(`${env.API_PREFIX}/auth`, authRoutes);
app.use(`${env.API_PREFIX}/airline`, airlineRoutes);
app.use(`${env.API_PREFIX}/city`, cityRoutes);
app.use(`${env.API_PREFIX}/airport`, airportRoutes);
app.use(`${env.API_PREFIX}/route`, routeRoutes);
app.use(`${env.API_PREFIX}/flight`, flightRoutes);
app.use(`${env.API_PREFIX}/seat`, seatRoutes);
app.use(`${env.API_PREFIX}/payment`, paymentRoutes);
app.use(`${env.API_PREFIX}/profile`, profileRoutes);
app.use(`${env.API_PREFIX}/bookings`, bookingRoutes);
app.use(`${env.API_PREFIX}/notifications`, notificationRoutes);
app.use(`${env.API_PREFIX}/customers`, customerRoutes);
app.use(`${env.API_PREFIX}/pdf`, pdfRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
