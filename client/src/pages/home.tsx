import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/header";
import BottomNavigation from "@/components/bottom-navigation";
import ConsultationModal from "@/components/consultation-modal";
import EmergencyPanel from "@/components/emergency-panel";
import HealthMetrics from "@/components/health-metrics";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Bot, 
  Search, 
  FileText, 
  Ambulance, 
  TestTube, 
  Truck, 
  ScanFace, 
  UserRound, 
  Bell,
  PillBottle,
  Mic 
} from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { HealthReport } from "@shared/schema";
import { useLocation } from "wouter";

export default function Home() {
  const { user } = useAuth();
  const [showConsultation, setShowConsultation] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [, setLocation] = useLocation();
  
  const [patientDetails, setPatientDetails] = useState({
    name: "",
    age: "",
    gender: "",
    language: "",
    phoneNumber: "",
    bloodGroup: ""
  });

  const { data: healthReports } = useQuery<HealthReport[]>({
    queryKey: ["/api/health-reports"],
  });

  const handlePatientFormSubmit = () => {
    if (patientDetails.name && patientDetails.age && patientDetails.gender && patientDetails.language) {
      // Store patient details in sessionStorage for the video consultation
      sessionStorage.setItem('patientDetails', JSON.stringify(patientDetails));
      setShowPatientForm(false);
      // Navigate to video consultation with patient details
      setLocation('/ai-doctor-video-consultation-enhanced');
    }
  };

  const handleStartConsultation = () => {
    setShowPatientForm(true);
  };

  const services = [
    {
      name: "Top Doctors",
      icon: UserRound,
      color: "text-primary",
      bgColor: "bg-primary/10",
      path: "/doctors",
    },
    {
      name: "Pharmacy",
      icon: PillBottle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      path: "/pharmacy",
    },
    {
      name: "Ambulance",
      icon: Ambulance,
      color: "text-red-600",
      bgColor: "bg-red-100",
      path: "/ambulance",
    },
  ];

  return (
    <div className="mobile-container">
      <Header />
      
      <main className="pb-20 pt-20">
        {/* Welcome Section - Minimal */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-3 rounded-lg mb-3 mx-4 mt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-800">Welcome !</h2>
              <p className="text-sm font-medium text-gray-600">
                {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <img 
                src={user?.profileImageUrl || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=64&h=64"}
                alt="Profile" 
                className="w-8 h-8 rounded-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* AI Consultation Button - Minimal */}
        <div className="px-4 mb-3">
          <div 
            onClick={handleStartConsultation}
            className="w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-600 rounded-md p-2 shadow-sm border border-gray-200 text-center cursor-pointer hover:shadow-md hover:from-blue-600 hover:via-cyan-600 hover:to-teal-700 transition-all duration-300 group"
          >
            <div className="flex items-center justify-center space-x-2">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-medium text-white text-xs">AI Doctor Consultation</h3>
            </div>
          </div>
        </div>

        {/* Healthcare Services Grid */}
        <div className="px-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Health Services</h3>
          
          {/* Row 1 */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <Link href="/ai-doctor-video">
              <div className="bg-white rounded-xl p-2 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-xs font-medium text-gray-700 leading-tight">AI Doctor</p>
              </div>
            </Link>
            
            <Link href="/medicine-delivery">
              <div className="bg-white rounded-xl p-2 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-1">
                  <Truck className="w-5 h-5 text-teal-600" />
                </div>
                <p className="text-xs font-medium text-gray-700 leading-tight">Medicine</p>
              </div>
            </Link>
            
            <Link href="/medical-scan">
              <div className="bg-white rounded-xl p-2 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-1">
                  <ScanFace className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-xs font-medium text-gray-700 leading-tight">Medical Scan</p>
              </div>
            </Link>
          </div>
          
          {/* Row 2 */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div 
              onClick={() => setShowEmergency(true)}
              className="bg-white rounded-xl p-2 text-center shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-1">
                <Ambulance className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-xs font-medium text-gray-700 leading-tight">Ambulance</p>
            </div>
            
            <Link href="/book-test">
              <div className="bg-white rounded-xl p-2 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-1">
                  <TestTube className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-xs font-medium text-gray-700 leading-tight">Lab Tests</p>
              </div>
            </Link>
            
            <Link href="/medical-records">
              <div className="bg-white rounded-xl p-2 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
                  <Search className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-xs font-medium text-gray-700 leading-tight">Records</p>
              </div>
            </Link>
          </div>
          
          {/* Row 3 */}
          <div className="grid grid-cols-3 gap-2">
            <Link href="/prescription-upload">
              <div className="bg-white rounded-xl p-2 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-1">
                  <FileText className="w-5 h-5 text-pink-600" />
                </div>
                <p className="text-xs font-medium text-gray-700 leading-tight">Prescription</p>
              </div>
            </Link>
            
            <Link href="/global-health-map">
              <div className="bg-white rounded-xl p-2 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-1">
                  <UserRound className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-xs font-medium text-gray-700 leading-tight">Health Map</p>
              </div>
            </Link>
            
            <Link href="/delivery-tracking">
              <div className="bg-white rounded-xl p-2 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-1">
                  <Bell className="w-5 h-5 text-yellow-600" />
                </div>
                <p className="text-xs font-medium text-gray-700 leading-tight">Tracking</p>
              </div>
            </Link>
          </div>
        </div>
      </main>

      {showConsultation && (
        <ConsultationModal 
          isOpen={showConsultation}
          onClose={() => setShowConsultation(false)}
        />
      )}
      
      {showEmergency && (
        <EmergencyPanel 
          isOpen={showEmergency}
          onClose={() => setShowEmergency(false)}
        />
      )}

      {/* Floating Health Assistant Button */}
      <Link href="/health-assistant">
        <div className="fixed bottom-20 right-4 z-50">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div className="relative">
              <div className="w-6 h-6 text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.1 3.89 23 5 23H19C20.1 23 21 22.1 21 21V11L15 5V9H21ZM7 9H13V7H7V9ZM7 11H17V13H7V11ZM7 15H17V17H7V15Z"/>
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </Link>

      {/* Patient Details Modal */}
      {showPatientForm && (
        <Dialog open={showPatientForm} onOpenChange={setShowPatientForm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-lg font-semibold text-gray-800">
                Patient Details & Language Selection
              </DialogTitle>
              <DialogDescription className="text-center text-sm text-gray-600">
                Please provide your details and preferred language for the consultation
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={patientDetails.name}
                  onChange={(e) => setPatientDetails(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Age"
                    value={patientDetails.age}
                    onChange={(e) => setPatientDetails(prev => ({ ...prev, age: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select 
                    value={patientDetails.gender} 
                    onValueChange={(value) => setPatientDetails(prev => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Preferred Language *</Label>
                <Select 
                  value={patientDetails.language} 
                  onValueChange={(value) => setPatientDetails(prev => ({ ...prev, language: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your preferred language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="hindi">हिंदी (Hindi)</SelectItem>
                    <SelectItem value="bengali">বাংলা (Bengali)</SelectItem>
                    <SelectItem value="telugu">తెలుగు (Telugu)</SelectItem>
                    <SelectItem value="marathi">मराठी (Marathi)</SelectItem>
                    <SelectItem value="tamil">தமிழ் (Tamil)</SelectItem>
                    <SelectItem value="gujarati">ગુજરાતી (Gujarati)</SelectItem>
                    <SelectItem value="urdu">اردو (Urdu)</SelectItem>
                    <SelectItem value="kannada">ಕನ್ನಡ (Kannada)</SelectItem>
                    <SelectItem value="odia">ଓଡ଼ିଆ (Odia)</SelectItem>
                    <SelectItem value="punjabi">ਪੰਜਾਬੀ (Punjabi)</SelectItem>
                    <SelectItem value="malayalam">മലയാളം (Malayalam)</SelectItem>
                    <SelectItem value="assamese">অসমীয়া (Assamese)</SelectItem>
                    <SelectItem value="maithili">मैथिली (Maithili)</SelectItem>
                    <SelectItem value="santali">ᱥᱟᱱᱛᱟᱲᱤ (Santali)</SelectItem>
                    <SelectItem value="kashmiri">कॉशुर (Kashmiri)</SelectItem>
                    <SelectItem value="nepali">नेपाली (Nepali)</SelectItem>
                    <SelectItem value="konkani">कोंकणी (Konkani)</SelectItem>
                    <SelectItem value="sindhi">سنڌي (Sindhi)</SelectItem>
                    <SelectItem value="dogri">डोगरी (Dogri)</SelectItem>
                    <SelectItem value="manipuri">মৈতৈলোন্ (Manipuri)</SelectItem>
                    <SelectItem value="bodo">बर' (Bodo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="Phone number"
                    value={patientDetails.phoneNumber}
                    onChange={(e) => setPatientDetails(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bloodGroup">Blood Group</Label>
                  <Select 
                    value={patientDetails.bloodGroup} 
                    onValueChange={(value) => setPatientDetails(prev => ({ ...prev, bloodGroup: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not-known">Not Known</SelectItem>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPatientForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePatientFormSubmit}
                  disabled={!patientDetails.name || !patientDetails.age || !patientDetails.gender || !patientDetails.language}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Start Consultation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
