import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User as UserIcon, Edit2, Save } from "lucide-react";
import type { User } from "@shared/schema";

export default function Profile() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    age: (user as any)?.age || "",
    weight: (user as any)?.weight || "",
    gender: (user as any)?.gender || "",
    bloodGroup: (user as any)?.bloodGroup || "",
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("PUT", "/api/user/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="mobile-container">
      <header className="sticky top-0 bg-white shadow-sm border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="font-semibold text-lg text-gray-800">Profile</h2>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? <Save className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
          </Button>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="w-12 h-12 text-primary" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-1">
              {user?.firstName} {user?.lastName}
            </h3>
            <p className="text-gray-600">{user?.email}</p>
          </CardContent>
        </Card>

        {/* Health Information */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h4 className="font-semibold text-lg text-gray-800 mb-4">Health Information</h4>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="age">Age</Label>
                {isEditing ? (
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                    placeholder="Enter your age"
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-gray-800">{user?.age || "Not specified"} years</p>
                )}
              </div>

              <div>
                <Label htmlFor="weight">Weight</Label>
                {isEditing ? (
                  <Input
                    id="weight"
                    type="text"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="Enter your weight (e.g., 70kg)"
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-gray-800">{user?.weight || "Not specified"}</p>
                )}
              </div>

              <div>
                <Label htmlFor="bloodGroup">Blood Group</Label>
                {isEditing ? (
                  <Input
                    id="bloodGroup"
                    type="text"
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    placeholder="Enter your blood group (e.g., A+)"
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-gray-800">{user?.bloodGroup || "Not specified"}</p>
                )}
              </div>

              <div>
                <Label>Gender</Label>
                {isEditing ? (
                  <RadioGroup 
                    value={formData.gender} 
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    className="mt-2"
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
                      <RadioGroupItem value="non-binary" id="non-binary" />
                      <Label htmlFor="non-binary">Non-binary</Label>
                    </div>
                  </RadioGroup>
                ) : (
                  <p className="mt-1 text-gray-800 capitalize">{user?.gender || "Not specified"}</p>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardContent className="p-6">
            <h4 className="font-semibold text-lg text-gray-800 mb-4">Account</h4>
            
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                Privacy Policy
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Terms of Service
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Help & Support
              </Button>
              <Button 
                variant="destructive" 
                className="w-full justify-start"
                onClick={handleLogout}
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
