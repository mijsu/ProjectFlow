import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { updateProfile } from "firebase/auth";
import { User, Mail, Calendar, MapPin, Briefcase } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || "",
    email: user?.email || "",
    bio: "",
    location: "",
    title: "",
    phone: "",
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        displayName: user.displayName || "",
        email: user.email || "",
        bio: "",
        location: "",
        title: "",
        phone: "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: profileData.displayName,
      });

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setProfileData({
        displayName: user.displayName || "",
        email: user.email || "",
        bio: "",
        location: "",
        title: "",
        phone: "",
      });
    }
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">My Account</h1>
        <p className="text-slate-400">Manage your profile information and preferences</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Header */}
        <Card className="bg-slate-950 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.photoURL || ""} />
                <AvatarFallback className="bg-emerald-600 text-white text-xl">
                  {getInitials(profileData.displayName || "U")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-slate-100">
                  {profileData.displayName || "User"}
                </h2>
                <p className="text-slate-400">{profileData.email}</p>
                <div className="mt-4">
                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="space-x-2">
                      <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="bg-slate-950 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-slate-200">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  value={profileData.displayName}
                  onChange={(e) =>
                    setProfileData({ ...profileData, displayName: e.target.value })
                  }
                  disabled={!isEditing}
                  className="bg-slate-900 border-slate-700 text-slate-100 disabled:opacity-60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    value={profileData.email}
                    disabled
                    className="bg-slate-900 border-slate-700 text-slate-100 opacity-60 pl-10"
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-200">
                  Job Title
                </Label>
                <div className="relative">
                  <Input
                    id="title"
                    value={profileData.title}
                    onChange={(e) =>
                      setProfileData({ ...profileData, title: e.target.value })
                    }
                    disabled={!isEditing}
                    className="bg-slate-900 border-slate-700 text-slate-100 disabled:opacity-60 pl-10"
                    placeholder="Software Developer"
                  />
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-slate-200">
                  Location
                </Label>
                <div className="relative">
                  <Input
                    id="location"
                    value={profileData.location}
                    onChange={(e) =>
                      setProfileData({ ...profileData, location: e.target.value })
                    }
                    disabled={!isEditing}
                    className="bg-slate-900 border-slate-700 text-slate-100 disabled:opacity-60 pl-10"
                    placeholder="New York, NY"
                  />
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-slate-200">
                Bio
              </Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) =>
                  setProfileData({ ...profileData, bio: e.target.value })
                }
                disabled={!isEditing}
                className="bg-slate-900 border-slate-700 text-slate-100 disabled:opacity-60 resize-none"
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Statistics */}
        <Card className="bg-slate-950 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Account Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400">
                  {user.metadata.creationTime ? 
                    Math.floor((Date.now() - new Date(user.metadata.creationTime).getTime()) / (1000 * 60 * 60 * 24))
                    : 0}
                </p>
                <p className="text-sm text-slate-400">Days Active</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {user.metadata.lastSignInTime ? 
                    new Date(user.metadata.lastSignInTime).toLocaleDateString()
                    : "Today"}
                </p>
                <p className="text-sm text-slate-400">Last Sign In</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">
                  {user.emailVerified ? "Verified" : "Unverified"}
                </p>
                <p className="text-sm text-slate-400">Email Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}