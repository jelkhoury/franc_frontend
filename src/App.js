import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import FrancPage from './pages/FrancPage';
import AboutUsPage from './pages/AboutUsPage';
import ContactUsPage from './pages/ContactUsPage';
import ResumePage from './pages/services/ResumePage';
import ChattingPage from './pages/services/ChattingPage';
import CoverLetterPage from './pages/services/CoverLetterPage';
import ResumeTryPage from './pages/services/ResumeTryPage';
import CoverTryPage from './pages/services/CoverTryPage';
import Chatting from './pages/services/Chatting';
import LogIn from './components/LogIn';
import SignUp from './components/SignUp';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import OTPVerification from './components/OTPVerification';
import { AuthProvider } from './components/AuthContext';
import { MockInterviewPage, MockInterviewTryPage, MockInterviewMajorSelectPage, MockInterviewQuestionsPage } from './pages/services';
import AdminPanel from './pages/AdminPanel';

const App = () => {
  return (
  
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/franc" element={<FrancPage />} />
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/contact-us" element={<ContactUsPage />} />
          <Route path="/resume-evaluation" element={<ResumePage />} />
          <Route path="/chatting" element={<ChattingPage />} />
          <Route path="/cover-letter-evaluation" element={<CoverLetterPage />} />
          <Route path="/resume-evaluation/try" element={<ResumeTryPage />} />
          <Route path="/cover-letter-evaluation/try" element={<CoverTryPage />} />
          <Route path="/chat-franc" element={<Chatting />} />
          <Route path="/login" element={<LogIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/OTP-Verification" element={<OTPVerification />} />
          <Route path="/mock-interview" element={<MockInterviewPage />} />
          <Route path="/mock-interview/try" element={<MockInterviewTryPage />} />
          <Route path="/mock-interview/select-major" element={<MockInterviewMajorSelectPage />} />
          <Route path="/mock-interview/questions" element={<MockInterviewQuestionsPage />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </AuthProvider>
    </Router>
  
  );
};

export default App;
