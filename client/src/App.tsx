import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Pharmacy from "@/pages/pharmacy";
import ProductDetail from "@/pages/product-detail";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import Profile from "@/pages/profile-simple";
import AIDoctorConsultation from "@/pages/ai-doctor-consultation";
// Removed problematic enhanced consultation
import MultilingualConsultation from "@/pages/multilingual-consultation";
import NaturalAIConsultation from "@/pages/natural-ai-consultation";
import WhisperAIConsultation from "@/pages/whisper-ai-consultation";
import AIDoctorVideoConsultation from "@/pages/ai-doctor-video-consultation";
import AIDoctorVideoConsultationEnhanced from "@/pages/ai-doctor-video-consultation-enhanced";
import CompactAIDoctorConsultation from "@/pages/ai-doctor-compact";
import BookTest from "@/pages/book-test";
import MedicineDelivery from "@/pages/medicine-delivery";
import Reports from "@/pages/reports";
import MedicalScan from "@/pages/medical-scan";
import DoctorEscalation from "@/pages/doctor-escalation";
import AIConsultation from "@/pages/ai-consultation";
import MedicalRecords from "@/pages/medical-records";
import GlobalHealthMap from "@/pages/global-health-map";
import FraudHeatmap from "@/pages/fraud-heatmap";
import HealthAssistant from "@/pages/health-assistant";
import Notifications from "@/pages/notifications";
import Prescription from "@/pages/prescription";
import SymptomChecker from "@/pages/symptom-checker";
import VoiceCompanion from "@/pages/voice-companion";
import VoiceToneTest from "@/pages/voice-tone-test";
import GeminiGrokMedicalTest from "@/pages/gemini-grok-medical-test";
import MedicalTest from "@/pages/medical-test";
import DeliveryTracking from "@/pages/delivery-tracking";
import PrescriptionUpload from "@/pages/prescription-upload";
import NotFound from "@/pages/not-found";
import GetStarted from "@/pages/auth/get-started";
import SignUp from "@/pages/auth/signup";
import SignIn from "@/pages/auth/signin";
import OTPVerification from "@/pages/auth/otp-verification";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Handle OAuth callback (Google/Facebook login)
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');

    if (token && userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(userData));

        // Clean URL and reload to update auth state
        window.history.replaceState({}, document.title, '/');
        window.location.reload();
      } catch (error) {
        console.error('Error handling OAuth callback:', error);
      }
    }
  }, []);

  // Always render the same structure to avoid hook order issues
  if (isLoading) {
    return (
      <div className="mobile-container flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Auth routes - always available */}
      <Route path="/auth/get-started" component={GetStarted} />
      <Route path="/auth/signup" component={SignUp} />
      <Route path="/auth/signin" component={SignIn} />
      <Route path="/auth/otp-verification" component={OTPVerification} />
      
      {/* Main app routes - protected */}
      <Route path="/" component={isAuthenticated ? Home : Landing} />
      <Route path="/pharmacy" component={isAuthenticated ? Pharmacy : Landing} />
      <Route path="/product/:id" component={isAuthenticated ? ProductDetail : Landing} />
      <Route path="/cart" component={isAuthenticated ? Cart : Landing} />
      <Route path="/checkout" component={isAuthenticated ? Checkout : Landing} />
      <Route path="/profile" component={isAuthenticated ? Profile : Landing} />
      <Route path="/ai-doctor-video" component={isAuthenticated ? AIDoctorVideoConsultationEnhanced : Landing} />
      <Route path="/book-test" component={isAuthenticated ? BookTest : Landing} />
      <Route path="/medicine-delivery" component={isAuthenticated ? MedicineDelivery : Landing} />
      <Route path="/reports" component={isAuthenticated ? Reports : Landing} />
      <Route path="/medical-scan" component={isAuthenticated ? MedicalScan : Landing} />
      <Route path="/medical-records" component={isAuthenticated ? MedicalRecords : Landing} />
      <Route path="/global-health-map" component={isAuthenticated ? GlobalHealthMap : Landing} />
      <Route path="/delivery-tracking" component={isAuthenticated ? DeliveryTracking : Landing} />
      <Route path="/prescription-upload" component={isAuthenticated ? PrescriptionUpload : Landing} />

      {/* Fallback route */}
      <Route path="*" component={isAuthenticated ? Home : Landing} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;