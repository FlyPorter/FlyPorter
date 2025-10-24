import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SearchResultsPage from "./pages/SearchResultsPage"
import SeatSelectionPage from "./pages/SeatSelectionPage";
import BookingPage from "./pages/BookingPage";
import BookingNotificationPage from './pages/BookingNotificationPage';
import LoginPage from "./pages/LoginPage";
import SettingPage from "./pages/SettingPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import AddFlightPage from './pages/AddFlightPage';
import UpdateFlightPage from './pages/UpdateFlightPage';
import GoogleAuthCallback from "./pages/GoogleAuthCallback";
import SeatModifyPage from './pages/SeatModifyPage';
import AddAircraftPage from './pages/AddAircraftPage';
import AddAirportPage from './pages/AddAirportPage';
import AddAirlinePage from './pages/AddAirlinePage';
import AddRoutePage from './pages/AddRoutePage';
import ProfilePage from './features/profile/pages/ProfilePage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />  
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/settings" element={<SettingPage />} />
          <Route path="/seat-modify" element={<SeatModifyPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/add-flight" element={<AddFlightPage />} />
          <Route path="/admin/add-aircraft" element={<AddAircraftPage />} />
          <Route path="/admin/add-airport" element={<AddAirportPage />} />
          <Route path="/admin/add-airline" element={<AddAirlinePage />} />
          <Route path="/admin/add-route" element={<AddRoutePage />} />
          <Route path="/admin/update-flight/:id" element={<UpdateFlightPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/seat-selection" element={<SeatSelectionPage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/booking-confirmation" element={<BookingNotificationPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
