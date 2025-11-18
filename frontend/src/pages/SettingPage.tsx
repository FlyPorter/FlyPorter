import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavigationBar from '../components/NavigationBar';
import Sidebar from '../features/dashboard/components/Sidebar';
import { Menu, X, Plus, Trash2, CreditCard, Pencil } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { getStoredPayments, addPayment, deletePayment, setDefaultPayment, PaymentInfo, maskCardNumber } from '../utils/paymentStorage';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [payments, setPayments] = useState<PaymentInfo[]>([]);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [paymentErrors, setPaymentErrors] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

  // Disable body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      // Check if we're on mobile (window width < 1024px which is lg breakpoint)
      const isMobile = window.innerWidth < 1024;
      if (isMobile) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (!token || !user) {
      navigate('/');
    }
  }, [navigate]);

  // Get user role
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role || "user";
  const isAdmin = role?.toUpperCase() === "ADMIN";
  const userId = user?.user_id || user?.id;

  // Load payments on mount
  useEffect(() => {
    if (userId) {
      const storedPayments = getStoredPayments(userId);
      setPayments(storedPayments);
    }
  }, [userId]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // Payment validation functions
  const validateCardNumber = (cardNumber: string): boolean => {
    const cleaned = cardNumber.replace(/\s/g, '');
    return /^\d{16}$/.test(cleaned);
  };

  const validateCVV = (cvv: string): boolean => {
    return /^\d{3,4}$/.test(cvv);
  };

  const validateCardholderName = (name: string): boolean => {
    return name.trim().length >= 2;
  };

  const validateExpiryDate = (expiryDate: string): string => {
    if (!expiryDate || expiryDate.trim() === '') {
      return 'Expiry date is required';
    }
    const datePattern = /^(\d{2})\/(\d{2})$/;
    const match = expiryDate.match(datePattern);
    if (!match) {
      return 'Please enter a valid expiry date (MM/YY)';
    }
    const month = parseInt(match[1], 10);
    const year = parseInt(match[2], 10);
    if (month < 1 || month > 12) {
      return 'Month must be between 01 and 12';
    }
    const fullYear = 2000 + year;
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    if (fullYear < currentYear || (fullYear === currentYear && month < currentMonth)) {
      return 'This card has expired. Please use a valid card.';
    }
    if (fullYear > currentYear + 20) {
      return 'Expiry date seems too far in the future. Please check your card.';
    }
    return '';
  };

  const handlePaymentChange = (field: string, value: string) => {
    setPaymentErrors(prev => ({ ...prev, [field]: '' }));
    
    if (field === 'cardholderName') {
      const filtered = value.replace(/[^a-zA-Z\s'-]/g, '');
      setNewPayment(prev => ({ ...prev, cardholderName: filtered }));
      return;
    }
    
    if (field === 'cvv') {
      const filtered = value.replace(/\D/g, '');
      if (filtered.length <= 4) {
        setNewPayment(prev => ({ ...prev, cvv: filtered }));
      }
      return;
    }
    
    if (field === 'cardNumber') {
      const cleaned = value.replace(/[^\d\s]/g, '').replace(/\s/g, '');
      if (cleaned.length <= 16) {
        const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
        setNewPayment(prev => ({ ...prev, cardNumber: formatted }));
      }
      return;
    }
    
    if (field === 'expiryDate') {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length <= 4) {
        const formatted = cleaned.replace(/(\d{2})(?=\d)/g, '$1/');
        setNewPayment(prev => ({ ...prev, expiryDate: formatted }));
      }
      return;
    }
    
    setNewPayment(prev => ({ ...prev, [field]: value }));
  };

  const handleAddPayment = () => {
    const errors = {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: ''
    };

    if (!validateCardNumber(newPayment.cardNumber)) {
      errors.cardNumber = 'Please enter a valid 16-digit card number';
    }

    const expiryError = validateExpiryDate(newPayment.expiryDate);
    if (expiryError) {
      errors.expiryDate = expiryError;
    }

    if (!validateCVV(newPayment.cvv)) {
      errors.cvv = 'Please enter a valid CVV (3-4 digits)';
    }

    if (!validateCardholderName(newPayment.cardholderName)) {
      errors.cardholderName = 'Please enter the cardholder name';
    }

    setPaymentErrors(errors);

    if (Object.values(errors).every(error => error === '')) {
      try {
        addPayment({
          cardNumber: newPayment.cardNumber,
          expiryDate: newPayment.expiryDate,
          cardholderName: newPayment.cardholderName,
          account_id: userId
        }, userId);
        
        const updatedPayments = getStoredPayments(userId);
        setPayments(updatedPayments);
        setNewPayment({
          cardNumber: '',
          expiryDate: '',
          cvv: '',
          cardholderName: ''
        });
        setShowAddPayment(false);
        setPaymentErrors({
          cardNumber: '',
          expiryDate: '',
          cvv: '',
          cardholderName: ''
        });
      } catch (error: any) {
        alert(error.message || 'Failed to add payment method');
      }
    }
  };

  const handleDeletePayment = (id: number) => {
    if (window.confirm('Are you sure you want to delete this payment method?')) {
      deletePayment(id, userId);
      const updatedPayments = getStoredPayments(userId);
      setPayments(updatedPayments);
    }
  };

  const handleSetDefault = (id: number) => {
    setDefaultPayment(id, userId);
    const updatedPayments = getStoredPayments(userId);
    setPayments(updatedPayments);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/50 via-cyan-50/50 to-teal-100/20">
      <NavigationBar />
      <div className="flex flex-col lg:flex-row relative lg:h-[calc(100vh-3.5rem)]">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Collapsible on mobile, always visible on desktop */}
        <div 
          className={`
            fixed lg:sticky top-14 left-0 z-50 lg:z-10
            h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-3.5rem)]
            transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            lg:top-14 lg:self-start
          `}
        >
          <Sidebar role={role} onClose={() => setIsSidebarOpen(false)} />
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full lg:w-auto lg:overflow-y-auto">
          {/* Mobile Menu Button */}
          <div className="lg:hidden sticky z-30 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-200/50 px-4 py-2 -mt-[1px]" style={{ top: 'calc(3.5rem - 1px)' }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-teal-700 hover:text-teal-900"
            >
              {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          <div className="p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">Settings</h2>
            
            <div className="space-y-6">
              {/* Profile Section - Hidden for admin users */}
              {!isAdmin && (
                <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-teal-200/50 p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-teal-800">Profile</h3>
                    <button
                      onClick={() => navigate('/profile', { state: { from: '/settings' } })}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer text-sm"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit Profile
                    </button>
                  </div>
                  <p className="text-teal-700">
                    Manage your profile for easy booking
                  </p>
                </div>
              )}

              {/* Payment Information Section - Hidden for admin users */}
              {!isAdmin && (
                <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-teal-200/50 p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-teal-800">Payment Information</h3>
                    {!showAddPayment && (
                      <button
                        onClick={() => setShowAddPayment(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer text-sm"
                      >
                        <Plus className="h-4 w-4" />
                        Add Payment
                      </button>
                    )}
                  </div>

                  {/* Add Payment Form */}
                  {showAddPayment && (
                    <div className="mb-6 p-4 bg-teal-50/50 rounded-lg border border-teal-200">
                      <h4 className="text-md font-semibold mb-4 text-teal-800">Add New Payment Method</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-teal-700 mb-1">Card Number</label>
                          <Input
                            type="text"
                            placeholder="1234 5678 9012 3456"
                            value={newPayment.cardNumber}
                            onChange={(e) => handlePaymentChange('cardNumber', e.target.value)}
                            className={paymentErrors.cardNumber ? 'border-red-300' : ''}
                            maxLength={19}
                          />
                          {paymentErrors.cardNumber && (
                            <p className="text-xs text-red-500 mt-1">{paymentErrors.cardNumber}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-teal-700 mb-1">Expiry Date</label>
                            <Input
                              type="text"
                              placeholder="MM/YY"
                              value={newPayment.expiryDate}
                              onChange={(e) => handlePaymentChange('expiryDate', e.target.value)}
                              className={paymentErrors.expiryDate ? 'border-red-300' : ''}
                              maxLength={5}
                            />
                            {paymentErrors.expiryDate && (
                              <p className="text-xs text-red-500 mt-1">{paymentErrors.expiryDate}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-teal-700 mb-1">CVV</label>
                            <Input
                              type="text"
                              placeholder="123"
                              value={newPayment.cvv}
                              onChange={(e) => handlePaymentChange('cvv', e.target.value)}
                              className={paymentErrors.cvv ? 'border-red-300' : ''}
                              maxLength={4}
                            />
                            {paymentErrors.cvv && (
                              <p className="text-xs text-red-500 mt-1">{paymentErrors.cvv}</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-teal-700 mb-1">Cardholder Name</label>
                          <Input
                            type="text"
                            placeholder="John Doe"
                            value={newPayment.cardholderName}
                            onChange={(e) => handlePaymentChange('cardholderName', e.target.value)}
                            className={paymentErrors.cardholderName ? 'border-red-300' : ''}
                          />
                          {paymentErrors.cardholderName && (
                            <p className="text-xs text-red-500 mt-1">{paymentErrors.cardholderName}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleAddPayment}
                            className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
                          >
                            Save Payment
                          </Button>
                          <Button
                            onClick={() => {
                              setShowAddPayment(false);
                              setNewPayment({
                                cardNumber: '',
                                expiryDate: '',
                                cvv: '',
                                cardholderName: ''
                              });
                              setPaymentErrors({
                                cardNumber: '',
                                expiryDate: '',
                                cvv: '',
                                cardholderName: ''
                              });
                            }}
                            variant="outline"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Methods List */}
                  <div className="space-y-3">
                    {payments.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No payment methods saved. Add one to get started.
                      </p>
                    ) : (
                      payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-4 bg-teal-50/30 rounded-lg border border-teal-200/50"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <CreditCard className="h-5 w-5 text-teal-600" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-teal-800">
                                  {maskCardNumber(payment.fullCardNumber || payment.cardNumber)}
                                </span>
                                {payment.isDefault && (
                                  <span className="text-xs bg-teal-600 text-white px-2 py-0.5 rounded">Default</span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                {payment.cardholderName} • Expires {payment.expiryDate}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!payment.isDefault && (
                              <button
                                onClick={() => handleSetDefault(payment.id)}
                                className="text-xs text-teal-600 hover:text-teal-800 font-medium"
                              >
                                Set Default
                              </button>
                            )}
                            <button
                              onClick={() => handleDeletePayment(payment.id)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              title="Delete payment method"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Account Actions */}
              <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-teal-200/50 p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4 text-teal-800">Account</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleLogoutClick}
                    className="w-full text-left px-4 py-3 border border-red-300 rounded-lg hover:bg-red-50 transition-colors text-red-600 hover:border-red-400 cursor-pointer"
                  >
                    <div className="font-medium">Logout</div>
                    <div className="text-sm text-red-500">Sign out of your account</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Popup */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-teal-200/50 p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-teal-800">Confirm Logout</h3>
            <p className="text-teal-700 mb-6">
              Are you sure you want to sign out of your account? You will need to log in again to access your bookings.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelLogout}
                className="px-4 py-2 border border-teal-300 rounded-lg text-teal-700 hover:bg-teal-50 hover:border-teal-400 transition-colors cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer font-medium shadow-md hover:shadow-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Footer */}
      <footer className="mt-4 py-2 text-center text-gray-600 text-xs">
        © 2025 FlyPorter
      </footer>
    </div>
  );
};

export default SettingsPage;
