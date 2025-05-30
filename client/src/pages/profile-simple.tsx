import React, { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User as UserIcon, Edit2, Save } from "lucide-react";

export default function Profile() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    age: "",
    weight: "",
    height: "",
    gender: "",
    bloodGroup: "",
    phone: "",
    address: "",
    emergencyContact: "",
    medicalHistory: "",
    allergies: "",
    currentMedications: "",
    smokingStatus: "",
    alcoholConsumption: "",
    exerciseFrequency: "",
    dietType: "",
    familyHistory: ""
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Also store in localStorage for immediate access
      localStorage.setItem('userProfile', JSON.stringify(data));
      return await apiRequest("PUT", "/api/user/profile", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your health information has been saved successfully.",
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Load existing profile data on component mount
  React.useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        const profileData = JSON.parse(savedProfile);
        setFormData({
          age: profileData.age || "",
          weight: profileData.weight || "",
          height: profileData.height || "",
          gender: profileData.gender || "",
          bloodGroup: profileData.bloodGroup || "",
          phone: profileData.phone || "",
          address: profileData.address || "",
          emergencyContact: profileData.emergencyContact || "",
          medicalHistory: profileData.medicalHistory || "",
          allergies: profileData.allergies || "",
          currentMedications: profileData.currentMedications || "",
          smokingStatus: profileData.smokingStatus || "",
          alcoholConsumption: profileData.alcoholConsumption || "",
          exerciseFrequency: profileData.exerciseFrequency || "",
          dietType: profileData.dietType || "",
          familyHistory: profileData.familyHistory || ""
        });
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    // Clear JWT token and user data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Show logout message
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    
    // Redirect to landing page (which will show signin option)
    window.location.href = '/';
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-800">Profile</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            disabled={updateProfileMutation.isPending}
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserIcon className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-1">
              {user?.firstName} {user?.lastName}
            </h3>
            <p className="text-gray-600">{user?.email}</p>
          </CardContent>
        </Card>

        {/* Health Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">
              Health Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Age */}
            <div className="space-y-2">
              <Label htmlFor="age" className="text-sm font-medium text-gray-700">
                Age
              </Label>
              <div className="min-h-[40px] flex items-center">
                {isEditing ? (
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                  />
                ) : (
                  <span className="text-gray-700">{formData.age || "Not set"}</span>
                )}
              </div>
            </div>

            {/* Height */}
            <div className="space-y-2">
              <Label htmlFor="height" className="text-sm font-medium text-gray-700">
                Height (cm)
              </Label>
              <div className="min-h-[40px] flex items-center">
                {isEditing ? (
                  <Input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({...formData, height: e.target.value})}
                    placeholder="e.g., 170"
                  />
                ) : (
                  <span className="text-gray-700">{formData.height ? `${formData.height} cm` : "Not set"}</span>
                )}
              </div>
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight" className="text-sm font-medium text-gray-700">
                Weight (kg)
              </Label>
              <div className="min-h-[40px] flex items-center">
                {isEditing ? (
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                    placeholder="e.g., 70"
                  />
                ) : (
                  <span className="text-gray-700">{formData.weight ? `${formData.weight} kg` : "Not set"}</span>
                )}
              </div>
            </div>

            {/* Blood Group */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Blood Group
              </Label>
              <div className="min-h-[40px] flex items-center">
                {isEditing ? (
                  <RadioGroup
                    value={formData.bloodGroup}
                    onValueChange={(value) => setFormData({...formData, bloodGroup: value})}
                    className="flex flex-wrap gap-4"
                  >
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => (
                      <div key={group} className="flex items-center space-x-2">
                        <RadioGroupItem value={group} id={group} />
                        <Label htmlFor={group} className="text-sm">{group}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <span className="text-gray-700">Not set</span>
                )}
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Gender
              </Label>
              <div className="min-h-[40px] flex items-center">
                {isEditing ? (
                  <RadioGroup
                    value={formData.gender}
                    onValueChange={(value) => setFormData({...formData, gender: value})}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male" className="text-sm">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female" className="text-sm">Female</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other" className="text-sm">Other</Label>
                    </div>
                  </RadioGroup>
                ) : (
                  <span className="text-gray-700">{formData.bloodGroup || "Not set"}</span>
                )}
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Gender</Label>
              <div className="min-h-[40px] flex items-center">
                {isEditing ? (
                  <RadioGroup
                    value={formData.gender}
                    onValueChange={(value) => setFormData({...formData, gender: value})}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female">Female</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other">Other</Label>
                    </div>
                  </RadioGroup>
                ) : (
                  <span className="text-gray-700">{formData.gender || "Not set"}</span>
                )}
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
              <div className="min-h-[40px] flex items-center">
                {isEditing ? (
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <span className="text-gray-700">{formData.phone || "Not set"}</span>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium text-gray-700">Address</Label>
              <div className="min-h-[40px] flex items-center">
                {isEditing ? (
                  <textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Enter your full address"
                    className="w-full p-2 border rounded-md resize-none"
                    rows={2}
                  />
                ) : (
                  <span className="text-gray-700">{formData.address || "Not set"}</span>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-2">
              <Label htmlFor="emergencyContact" className="text-sm font-medium text-gray-700">Emergency Contact</Label>
              <div className="min-h-[40px] flex items-center">
                {isEditing ? (
                  <Input
                    id="emergencyContact"
                    type="tel"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                    placeholder="Emergency contact number"
                  />
                ) : (
                  <span className="text-gray-700">{formData.emergencyContact || "Not set"}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical History */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Medical History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Past Medical History */}
            <div className="space-y-2">
              <Label htmlFor="medicalHistory" className="text-sm font-medium text-gray-700">Past Medical History</Label>
              <div className="min-h-[40px] flex items-center">
                {isEditing ? (
                  <textarea
                    id="medicalHistory"
                    value={formData.medicalHistory}
                    onChange={(e) => setFormData({...formData, medicalHistory: e.target.value})}
                    placeholder="List any past medical conditions, surgeries, or hospitalizations"
                    className="w-full p-2 border rounded-md resize-none"
                    rows={3}
                  />
                ) : (
                  <span className="text-gray-700">{formData.medicalHistory || "None reported"}</span>
                )}
              </div>
            </div>

            {/* Allergies */}
            <div className="space-y-2">
              <Label htmlFor="allergies" className="text-sm font-medium text-gray-700">Allergies</Label>
              <div className="min-h-[40px] flex items-center">
                {isEditing ? (
                  <textarea
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                    placeholder="List any food, drug, or environmental allergies"
                    className="w-full p-2 border rounded-md resize-none"
                    rows={2}
                  />
                ) : (
                  <span className="text-gray-700">{formData.allergies || "None reported"}</span>
                )}
              </div>
            </div>

            {/* Current Medications */}
            <div className="space-y-2">
              <Label htmlFor="currentMedications" className="text-sm font-medium text-gray-700">Current Medications</Label>
              <div className="min-h-[40px] flex items-center">
                {isEditing ? (
                  <textarea
                    id="currentMedications"
                    value={formData.currentMedications}
                    onChange={(e) => setFormData({...formData, currentMedications: e.target.value})}
                    placeholder="List all current medications and supplements"
                    className="w-full p-2 border rounded-md resize-none"
                    rows={2}
                  />
                ) : (
                  <span className="text-gray-700">{formData.currentMedications || "None reported"}</span>
                )}
              </div>
            </div>

            {/* Family History */}
            <div className="space-y-2">
              <Label htmlFor="familyHistory" className="text-sm font-medium text-gray-700">Family Medical History</Label>
              <div className="min-h-[40px] flex items-center">
                {isEditing ? (
                  <textarea
                    id="familyHistory"
                    value={formData.familyHistory}
                    onChange={(e) => setFormData({...formData, familyHistory: e.target.value})}
                    placeholder="List any significant family medical history (diabetes, heart disease, cancer, etc.)"
                    className="w-full p-2 border rounded-md resize-none"
                    rows={3}
                  />
                ) : (
                  <span className="text-gray-700">{formData.familyHistory || "None reported"}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lifestyle Information */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Lifestyle Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Smoking Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Smoking Status</Label>
              <div className="min-h-[40px] flex items-center">
                {isEditing ? (
                  <RadioGroup
                    value={formData.smokingStatus}
                    onValueChange={(value) => setFormData({...formData, smokingStatus: value})}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="never" id="never" />
                      <Label htmlFor="never">Never</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="former" id="former" />
                      <Label htmlFor="former">Former</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="current" id="current" />
                      <Label htmlFor="current">Current</Label>
                    </div>
                  </RadioGroup>
                ) : (
                  <span className="text-gray-700">{formData.smokingStatus || "Not specified"}</span>
                )}
              </div>
            </div>

            {/* Alcohol Consumption */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Alcohol Consumption</Label>
              <div className="min-h-[40px] flex items-center">
                {isEditing ? (
                  <RadioGroup
                    value={formData.alcoholConsumption}
                    onValueChange={(value) => setFormData({...formData, alcoholConsumption: value})}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="none" />
                      <Label htmlFor="none">None</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="occasional" id="occasional" />
                      <Label htmlFor="occasional">Occasional</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="moderate" id="moderate" />
                      <Label htmlFor="moderate">Moderate</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="heavy" id="heavy" />
                      <Label htmlFor="heavy">Heavy</Label>
                    </div>
                  </RadioGroup>
                ) : (
                  <span className="text-gray-700">{formData.alcoholConsumption || "Not specified"}</span>
                )}
              </div>
            </div>

            {/* Exercise Frequency */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Exercise Frequency</Label>
              <div className="min-h-[40px] flex items-center">
                {isEditing ? (
                  <RadioGroup
                    value={formData.exerciseFrequency}
                    onValueChange={(value) => setFormData({...formData, exerciseFrequency: value})}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="exercise-none" />
                      <Label htmlFor="exercise-none">None</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1-2" id="1-2" />
                      <Label htmlFor="1-2">1-2 times/week</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="3-4" id="3-4" />
                      <Label htmlFor="3-4">3-4 times/week</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="daily" id="daily" />
                      <Label htmlFor="daily">Daily</Label>
                    </div>
                  </RadioGroup>
                ) : (
                  <span className="text-gray-700">{formData.exerciseFrequency || "Not specified"}</span>
                )}
              </div>
            </div>

            {/* Diet Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Diet Type</Label>
              <div className="min-h-[40px] flex items-center">
                {isEditing ? (
                  <RadioGroup
                    value={formData.dietType}
                    onValueChange={(value) => setFormData({...formData, dietType: value})}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="vegetarian" id="vegetarian" />
                      <Label htmlFor="vegetarian">Vegetarian</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="vegan" id="vegan" />
                      <Label htmlFor="vegan">Vegan</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="non-vegetarian" id="non-vegetarian" />
                      <Label htmlFor="non-vegetarian">Non-Vegetarian</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mixed" id="mixed" />
                      <Label htmlFor="mixed">Mixed</Label>
                    </div>
                  </RadioGroup>
                ) : (
                  <span className="text-gray-700">{formData.dietType || "Not specified"}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}