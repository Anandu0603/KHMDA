import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

// Public Pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import VisionMissionPage from './pages/VisionMissionPage';
import CommitteePage from './pages/CommitteePage';
import MembershipInfoPage from './pages/MembershipInfoPage';
import NewsPage from './pages/NewsPage';
import ContactPage from './pages/ContactPage';

// Portal Pages
import MemberRegistration from './pages/MemberRegistration';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import MemberProfile from './pages/MemberProfile';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import RazorpayPayment from './pages/RazorpayPayment';
import RenewalPage from './pages/RenewalPage';
import ReportsPage from './pages/ReportsPage';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import Toast from './components/Toast';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <main className="flex-grow">
              <Routes>
                {/* Public Website Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/vision-mission" element={<VisionMissionPage />} />
                <Route path="/committee" element={<CommitteePage />} />
                <Route path="/membership" element={<MembershipInfoPage />} />
                <Route path="/news" element={<NewsPage />} />
                <Route path="/contact" element={<ContactPage />} />

                {/* Member & Admin Portal Routes */}
                <Route path="/register" element={<MemberRegistration />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/reports" element={<ReportsPage />} />
                <Route path="/admin/member/:id" element={<MemberProfile />} />
                <Route path="/member/profile" element={<MemberProfile />} />
                <Route path="/member/renew" element={<RenewalPage />} />
                
                {/* Payment Flow */}
                <Route path="/payment/razorpay" element={<RazorpayPayment />} />
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/cancel" element={<PaymentCancel />} />
              </Routes>
            </main>
            <Footer />
            <Toast />
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
