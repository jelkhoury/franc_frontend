import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
import AvatarDemoPage from './pages/services/AvatarDemoPage';
import AvatarAdvancedDemoPage from './pages/services/AvatarAdvancedDemoPage';
import AdminPanel from './pages/AdminPanel';
import SdsPage from './pages/services/SdsPage';
import SdsOnBoarding from './pages/services/SdsOnBoarding';
import SdsTry from './pages/services/SdsTry';
import SdsFunDemo from './pages/services/SdsFunDemo';
import SdsResult from './pages/services/SdsResult';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </Router>
  );
};

const MainLayout = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <Navbar />}
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
        <Route path="/mock-interview/avatar-demo" element={<AvatarDemoPage />} />
        <Route path="/mock-interview/avatar-advanced" element={<AvatarAdvancedDemoPage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/self-directed-search" element={<SdsPage />} />
        <Route
          path="/self-directed-search/brief"
          element={
            <SdsOnBoarding
              embedSrcs={[
                "https://www.youtube.com/embed/gNQ7n530Pkw?si=s7_iR263l08hDIao",
                "https://www.youtube.com/embed/WNF1-gY6bNo?si=VulDTXSIm0-flCTW",
                "https://www.youtube.com/embed/Bp1C1BULYdc?si=CMgX7jQ2O6o2El3e",
                "https://www.youtube.com/embed/Lfs-Ww_VZJw?si=JfRIDiaMnWiPEYjB",
                "https://www.youtube.com/embed/hXZVaf9ig20?si=1uWOdNCowGfwi6VW",
                "https://www.youtube.com/embed/CYgCCDw0wys?si=-yQBiiCVjI8TKvza"
              ]}
            />
          }
        />
        <Route path="/self-directed-search/try" element={<SdsTry />} />
        <Route path="/self-directed-search/result" element={<SdsResult />} />
        <Route path="/sds/fun-demo" element={<SdsFunDemo />} />
      </Routes>
    </>
  );
};

export default App;