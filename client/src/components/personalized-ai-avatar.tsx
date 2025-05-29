import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, User, Heart, Stethoscope } from 'lucide-react';

interface PatientDetails {
  name: string;
  age: string;
  gender: string;
  language: string;
}

interface PersonalizedAIAvatarProps {
  patientDetails: PatientDetails;
  isActive?: boolean;
  doctorTone?: 'friendly' | 'formal' | 'quick';
  onToneChange?: (tone: 'friendly' | 'formal' | 'quick') => void;
}

export default function PersonalizedAIAvatar({ 
  patientDetails, 
  isActive = false,
  doctorTone = 'friendly',
  onToneChange 
}: PersonalizedAIAvatarProps) {
  const [currentAnimation, setCurrentAnimation] = useState<'idle' | 'speaking' | 'listening'>('idle');

  // Generate avatar characteristics based on patient demographics
  const getAvatarStyle = () => {
    const age = parseInt(patientDetails.age) || 30;
    const isElderly = age >= 60;
    const isChild = age < 18;
    const isOppositeGender = patientDetails.gender === 'male' ? 'female' : 'male';
    
    return {
      gender: isOppositeGender,
      ageGroup: isElderly ? 'elderly' : isChild ? 'young' : 'adult',
      ethnicity: 'indian',
      attire: 'professional'
    };
  };

  // Generate doctor image based on patient gender (opposite gender)
  const getDoctorImageUrl = () => {
    const patientGender = patientDetails.gender?.toLowerCase();
    const doctorGender = patientGender === 'male' ? 'female' : 'male';
    
    // Female doctor images for male patients
    if (doctorGender === 'female') {
      return 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face';
    }
    // Male doctor images for female patients  
    else {
      return 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face';
    }
  };

  const avatarStyle = getAvatarStyle();

  // Avatar appearance based on characteristics
  const getAvatarAppearance = () => {
    const baseStyle = "w-48 h-48 rounded-full flex items-center justify-center text-white font-bold text-6xl shadow-2xl border-4 border-white";
    
    // Color scheme based on gender and tone
    let bgGradient = '';
    if (avatarStyle.gender === 'female') {
      bgGradient = doctorTone === 'formal' 
        ? 'bg-gradient-to-br from-purple-600 to-purple-800'
        : 'bg-gradient-to-br from-pink-500 to-purple-600';
    } else {
      bgGradient = doctorTone === 'formal'
        ? 'bg-gradient-to-br from-blue-700 to-blue-900'
        : 'bg-gradient-to-br from-blue-500 to-cyan-600';
    }

    // Animation based on state
    let animation = '';
    if (isActive) {
      animation = currentAnimation === 'speaking' 
        ? 'animate-pulse' 
        : currentAnimation === 'listening'
        ? 'animate-bounce'
        : '';
    }

    return `${baseStyle} ${bgGradient} ${animation}`;
  };

  // Get doctor's name based on characteristics
  const getDoctorName = () => {
    const femaleNames = ['Dr. Priya Sharma', 'Dr. Anita Patel', 'Dr. Kavya Singh'];
    const maleNames = ['Dr. Rajesh Kumar', 'Dr. Amit Gupta', 'Dr. Vikash Joshi'];
    
    const names = avatarStyle.gender === 'female' ? femaleNames : maleNames;
    return names[Math.floor(Math.random() * names.length)];
  };

  // Get greeting message based on patient and doctor characteristics
  const getGreetingMessage = () => {
    const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';
    const greeting = patientDetails.language === 'hindi' 
      ? timeOfDay === 'morning' ? 'Namaste' : timeOfDay === 'afternoon' ? 'Namaskar' : 'Namaste'
      : `Good ${timeOfDay}`;
    
    const doctorName = getDoctorName();
    
    if (doctorTone === 'formal') {
      return patientDetails.language === 'hindi'
        ? `${greeting} ${patientDetails.name} ji. Main ${doctorName} hun. Aaj aapki health ke liye kya kar sakti hun?`
        : `${greeting} ${patientDetails.name}. I am ${doctorName}. How may I assist you with your health concerns today?`;
    } else if (doctorTone === 'quick') {
      return patientDetails.language === 'hindi'
        ? `${greeting}! Main ${doctorName}. Bataaiye, kya problem hai?`
        : `${greeting}! I'm ${doctorName}. What seems to be the problem?`;
    } else {
      return patientDetails.language === 'hindi'
        ? `${greeting} ${patientDetails.name}! Main ${doctorName} hun. Aap bilkul tension na lein, main yahan aapki help karne ke liye hun. Apni problem detail mein bataaiye.`
        : `${greeting} ${patientDetails.name}! I'm ${doctorName}. Please don't worry, I'm here to help you. Tell me about your concerns in detail.`;
    }
  };

  // Update animation based on activity
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setCurrentAnimation(prev => {
          if (prev === 'idle') return 'listening';
          if (prev === 'listening') return 'speaking';
          return 'idle';
        });
      }, 3000);
      
      return () => clearInterval(interval);
    } else {
      setCurrentAnimation('idle');
    }
  }, [isActive]);

  const toneDescriptions = {
    friendly: 'Warm and caring approach',
    formal: 'Professional and precise',
    quick: 'Direct and efficient'
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      {/* Avatar Display */}
      <div className="relative">
        <div className="w-48 h-48 rounded-full overflow-hidden shadow-2xl border-4 border-white">
          <img 
            src={getDoctorImageUrl()} 
            alt={`${avatarStyle.gender === 'female' ? 'Female' : 'Male'} AI Doctor`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to icon if image fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling.style.display = 'flex';
            }}
          />
          {/* Fallback icon display */}
          <div className={`${getAvatarAppearance()} hidden`}>
            {avatarStyle.gender === 'female' ? (
              <div className="flex flex-col items-center">
                <Bot className="h-20 w-20 mb-2" />
                <Stethoscope className="h-8 w-8" />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Bot className="h-20 w-20 mb-2" />
                <Heart className="h-8 w-8" />
              </div>
            )}
          </div>
        </div>
        
        {/* Status indicator */}
        {isActive && (
          <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Doctor Information */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800">{getDoctorName()}</h3>
        <p className="text-sm text-gray-600">
          {avatarStyle.gender === 'female' ? 'Female' : 'Male'} AI Doctor • 
          {avatarStyle.ageGroup === 'elderly' ? ' Senior Consultant' : ' General Physician'}
        </p>
        <div className="flex items-center justify-center mt-2 space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-green-600">Available Now</span>
        </div>
      </div>

      {/* Doctor Tone Selection */}
      {onToneChange && (
        <Card className="w-full max-w-md">
          <CardContent className="p-4">
            <h4 className="text-sm font-medium mb-3">Choose Doctor's Communication Style:</h4>
            <div className="space-y-2">
              {(['friendly', 'formal', 'quick'] as const).map((tone) => (
                <Button
                  key={tone}
                  variant={doctorTone === tone ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onToneChange(tone)}
                  className="w-full justify-start"
                >
                  <div className="text-left">
                    <div className="font-medium capitalize">{tone}</div>
                    <div className="text-xs text-gray-500">{toneDescriptions[tone]}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Greeting Message */}
      <Card className="w-full max-w-md">
        <CardContent className="p-4">
          <div className="text-sm text-gray-700 leading-relaxed">
            <div className="flex items-start space-x-2">
              <Bot className="h-4 w-4 mt-1 text-blue-500 flex-shrink-0" />
              <p>{getGreetingMessage()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Status */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          {currentAnimation === 'listening' && '🎧 Listening...'}
          {currentAnimation === 'speaking' && '💬 Speaking...'}
          {currentAnimation === 'idle' && '💭 Ready to help'}
        </p>
      </div>
    </div>
  );
}