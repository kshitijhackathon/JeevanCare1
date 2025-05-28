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
import BookTest from "@/pages/book-test";
import MedicineDelivery from "@/pages/medicine-delivery";
import Reports from "@/pages/reports";
import FaceScan from "@/pages/face-scan";
import DoctorEscalation from "@/pages/doctor-escalation";
import AIConsultation from "@/pages/ai-consultation";
import MedicalRecords from "@/pages/medical-records";
import GlobalHealthMap from "@/pages/global-health-map";
import HealthAssistant from "@/pages/health-assistant";
import Notifications from "@/pages/notifications";
import Prescription from "@/pages/prescription";
import SymptomChecker from "@/pages/symptom-checker";
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

  if (isLoading) {
    return (
      <div className="mobile-container flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/auth/get-started" component={GetStarted} />
          <Route path="/auth/signup" component={SignUp} />
          <Route path="/auth/signin" component={SignIn} />
          <Route path="/auth/otp-verification" component={OTPVerification} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/pharmacy" component={Pharmacy} />
          <Route path="/product/:id" component={ProductDetail} />
          <Route path="/cart" component={Cart} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/profile" component={Profile} />
          <Route path="/consultation" component={AIDoctorConsultation} />
          <Route path="/book-test" component={BookTest} />
          <Route path="/medicine-delivery" component={MedicineDelivery} />
          <Route path="/delivery/:orderId" component={MedicineDelivery} />
          <Route path="/reports" component={Reports} />
          <Route path="/face-scan" component={FaceScan} />
          <Route path="/doctor-escalation" component={DoctorEscalation} />
          <Route path="/ai-consultation" component={AIConsultation} />
          <Route path="/medical-records" component={MedicalRecords} />
          <Route path="/global-health-map" component={GlobalHealthMap} />
          <Route path="/health-assistant" component={HealthAssistant} />
          <Route path="/notifications" component={Notifications} />
          <Route path="/prescription" component={Prescription} />
          <Route path="/symptom-checker" component={SymptomChecker} />
        </>
      )}
      <Route component={NotFound} />
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
