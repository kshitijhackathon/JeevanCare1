import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Phone, 
  MapPin, 
  Navigation, 
  Heart, 
  Brain, 
  Zap, 
  Car, 
  Flame, 
  AlertTriangle,
  CheckCircle,
  X,
  Clock,
  Shield,
  Ambulance
} from "lucide-react";

interface EmergencyPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmergencyPanel({ isOpen, onClose }: EmergencyPanelProps) {
  const [checkedItems, setCheckedItems] = useState<{[key: string]: boolean}>({});

  const emergencyNumbers = [
    { name: "Ambulance", number: "108", icon: "🚑", color: "bg-red-500" },
    { name: "Health Helpline", number: "102", icon: "🏥", color: "bg-blue-500" },
    { name: "Police", number: "100", icon: "👮", color: "bg-gray-700" },
    { name: "Disaster Services", number: "101", icon: "🚒", color: "bg-orange-500" }
  ];

  const nearbyHospitals = [
    { name: "Apollo Hospital", distance: "2.1 km", phone: "+91-9876543210" },
    { name: "Fortis Healthcare", distance: "3.5 km", phone: "+91-9876543211" },
    { name: "Max Hospital", distance: "4.2 km", phone: "+91-9876543212" },
    { name: "AIIMS Delhi", distance: "5.8 km", phone: "+91-9876543213" }
  ];

  const emergencyConditions = [
    {
      title: "Heart Attack",
      icon: <Heart className="w-6 h-6 text-red-500" />,
      symptoms: ["Chest pain", "Shortness of breath", "Cold sweats", "Nausea"],
      firstAid: ["Keep person calm", "Loosen tight clothing", "Give aspirin if available", "Call ambulance immediately"],
      color: "border-red-500"
    },
    {
      title: "Stroke/Paralysis", 
      icon: <Brain className="w-6 h-6 text-purple-500" />,
      symptoms: ["Face drooping", "Arm weakness", "Speech difficulty", "Sudden confusion"],
      firstAid: ["Note time of symptoms", "Keep person lying down", "Don't give food/water", "Call emergency services"],
      color: "border-purple-500"
    },
    {
      title: "Breathing Difficulty",
      icon: <Zap className="w-6 h-6 text-blue-500" />,
      symptoms: ["Gasping for air", "Blue lips/fingers", "Cannot speak", "Wheezing sounds"],
      firstAid: ["Keep person upright", "Loosen clothing around neck", "Use inhaler if available", "Stay calm and call help"],
      color: "border-blue-500"
    },
    {
      title: "Accident/Injury",
      icon: <Car className="w-6 h-6 text-orange-500" />,
      symptoms: ["Severe bleeding", "Broken bones", "Head injury", "Unconsciousness"],
      firstAid: ["Don't move person", "Control bleeding with pressure", "Keep airways clear", "Call ambulance"],
      color: "border-orange-500"
    }
  ];

  const firstAidTips = [
    {
      title: "Heart Attack",
      icon: <Heart className="w-5 h-5 text-red-500" />,
      steps: [
        "Call emergency services immediately",
        "Give aspirin (if not allergic)",
        "Help person sit comfortably",
        "Loosen tight clothing",
        "Monitor breathing and pulse"
      ]
    },
    {
      title: "Burns",
      icon: <Flame className="w-5 h-5 text-orange-500" />,
      steps: [
        "Cool burn with running water for 10-20 minutes",
        "Remove jewelry/clothing from burned area",
        "Cover with clean, dry cloth",
        "Don't apply ice or creams",
        "Seek medical attention"
      ]
    },
    {
      title: "Choking",
      icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
      steps: [
        "Encourage coughing if conscious",
        "Give 5 back blows between shoulder blades",
        "Give 5 abdominal thrusts",
        "Alternate back blows and thrusts",
        "Call emergency if object doesn't come out"
      ]
    },
    {
      title: "Snake Bite",
      icon: <Shield className="w-5 h-5 text-green-500" />,
      steps: [
        "Keep person calm and still",
        "Remove jewelry near bite area",
        "Mark swelling progression with pen",
        "Don't cut wound or suck venom",
        "Get to hospital immediately"
      ]
    }
  ];

  const emergencyChecklist = [
    "First aid kit is ready",
    "Emergency contacts saved in phone",
    "Family knows emergency numbers",
    "Know nearest hospitals location",
    "Know how to give CPR",
    "Have medical insurance details ready",
    "Keep emergency medicines available",
    "Know blood group of family members"
  ];

  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  const getUserLocation = () => {
    return new Promise<{lat: number, lng: number}>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          resolve(location);
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
      );
    });
  };

  const sendEmergencyAlert = async () => {
    try {
      const location = await getUserLocation();
      const googleMapsLink = `https://maps.google.com/maps?q=${location.lat},${location.lng}`;
      
      // Create emergency message
      const emergencyMessage = `🚨 MEDICAL EMERGENCY 🚨
पैशेंट को तुरंत एम्बुलेंस की जरूरत है!

Location: ${googleMapsLink}
Time: ${new Date().toLocaleString('hi-IN')}

कृपया तुरंत ambulance भेजें!`;

      // Send WhatsApp message to ambulance service
      const whatsappNumber = "918800000000"; // Ambulance service number
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(emergencyMessage)}`;
      
      // Also call ambulance
      makeCall("108");
      
      // Open WhatsApp after a short delay
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 1000);

      alert("Emergency alert sent! Ambulance call initiated and WhatsApp message prepared.");
      
    } catch (error) {
      console.error("Error getting location:", error);
      // Fallback - just call ambulance
      makeCall("108");
      alert("Location access denied. Emergency call initiated to 108.");
    }
  };

  const makeCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  const openDirections = (hospitalName: string) => {
    const query = encodeURIComponent(hospitalName + " near me");
    window.open(`https://www.google.com/maps/search/${query}`, '_blank');
  };

  const handleCheckboxChange = (item: string, checked: boolean) => {
    setCheckedItems(prev => ({
      ...prev,
      [item]: checked
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-red-500 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">🚨</div>
            <h2 className="text-xl font-bold">Emergency Services</h2>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm" className="text-white hover:bg-red-600">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-8">
          {/* Instant Ambulance Button */}
          <section>
            <Button
              onClick={sendEmergencyAlert}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-4 text-lg font-bold flex items-center justify-center space-x-3 animate-pulse"
              size="lg"
            >
              <Ambulance className="w-8 h-8" />
              <span>🚨 INSTANT AMBULANCE CALL 🚨</span>
              <Phone className="w-6 h-6" />
            </Button>
            <p className="text-center text-sm text-gray-600 mt-2">
              तुरंत ambulance के लिए click करें - Location automatically share होगी
            </p>
          </section>

          {/* 1. Emergency Numbers */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Phone className="w-5 h-5 mr-2 text-red-500" />
              Emergency Numbers
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {emergencyNumbers.map((emergency) => (
                <Button
                  key={emergency.number}
                  onClick={() => makeCall(emergency.number)}
                  className={`${emergency.color} hover:opacity-90 h-auto p-3 flex flex-col items-center space-y-1`}
                >
                  <div className="text-xl">{emergency.icon}</div>
                  <div className="text-sm font-medium">{emergency.name}</div>
                  <div className="text-lg font-bold">{emergency.number}</div>
                </Button>
              ))}
            </div>
          </section>

          <Separator />

          {/* 2. Nearby Hospitals */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-blue-500" />
              Nearby Hospitals
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {nearbyHospitals.map((hospital, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{hospital.name}</h4>
                      <Badge variant="outline">{hospital.distance}</Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => makeCall(hospital.phone)}
                        size="sm" 
                        className="flex-1"
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        Call
                      </Button>
                      <Button 
                        onClick={() => openDirections(hospital.name)}
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                      >
                        <Navigation className="w-4 h-4 mr-1" />
                        Directions
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <Separator />

          {/* 3. Emergency Conditions */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
              Emergency Conditions
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {emergencyConditions.map((condition, index) => (
                <Card key={index} className={`border-2 ${condition.color}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-base">
                      {condition.icon}
                      <span>{condition.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h5 className="font-medium text-sm mb-2">Symptoms:</h5>
                      <ul className="text-sm space-y-1">
                        {condition.symptoms.map((symptom, i) => (
                          <li key={i} className="flex items-center">
                            <div className="w-1 h-1 bg-red-500 rounded-full mr-2"></div>
                            {symptom}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-sm mb-2">First Aid:</h5>
                      <ul className="text-sm space-y-1">
                        {condition.firstAid.map((aid, i) => (
                          <li key={i} className="flex items-center">
                            <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                            {aid}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button 
                      onClick={() => makeCall("108")}
                      className="w-full bg-red-500 hover:bg-red-600"
                      size="sm"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call Ambulance
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <Separator />

          {/* 4. First Aid Tips */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-green-500" />
              First Aid Tips
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {firstAidTips.map((tip, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-base">
                      {tip.icon}
                      <span>{tip.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2">
                      {tip.steps.map((step, i) => (
                        <li key={i} className="flex items-start text-sm">
                          <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <Separator />

          {/* 5. Emergency Checklist */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-purple-500" />
              Emergency Checklist
            </h3>
            <Card>
              <CardContent className="p-4">
                <div className="grid md:grid-cols-2 gap-3">
                  {emergencyChecklist.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Checkbox
                        id={`checklist-${index}`}
                        checked={checkedItems[item] || false}
                        onCheckedChange={(checked) => handleCheckboxChange(item, checked as boolean)}
                      />
                      <label 
                        htmlFor={`checklist-${index}`} 
                        className={`text-sm cursor-pointer ${checkedItems[item] ? 'line-through text-gray-500' : ''}`}
                      >
                        {item}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Quick Action Footer */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-red-500" />
                <span className="font-medium text-red-700">In case of emergency:</span>
              </div>
              <Button 
                onClick={() => makeCall("108")}
                className="bg-red-500 hover:bg-red-600"
              >
                <Phone className="w-4 h-4 mr-2" />
                Call 108 Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}