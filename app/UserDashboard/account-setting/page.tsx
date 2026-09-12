"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  User,
  Lock,
  Mail,
  Globe,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Trash2,
  ShieldAlert,
  Image as ImageIcon,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// --- Types ---
interface PersonalInfo {
  username: string;
  email: string;
  phone: string;
  country: string;
  profileImage: string;
  emailVerified: boolean;
  createdAt: string;
  role: string;
  status: string;
}

interface UserData {
  _id: string;
  username: string;
  email: string;
  role: string;
  emailVerified: boolean;
  status: string;
  avatar: string;
  phone?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  activeDerivAccountType?: string;
}

const GOLD = "#D4AF37";

export default function UserSettingsPage() {
  // --- Personal Info State ---
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    username: "",
    email: "",
    phone: "",
    country: "",
    profileImage: "",
    emailVerified: false,
    createdAt: "",
    role: "user",
    status: "active",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // --- Password States ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // --- Danger Zone / Delete Account State ---
  const [deleteInput, setDeleteInput] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // --- Profile Image Picker State ---
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);
  const availableImages = [
    "/PFP_IMG/1.jfif",
    "/PFP_IMG/2.jfif",
    "/PFP_IMG/3.jfif",
    "/PFP_IMG/4.jfif",
    "/PFP_IMG/5.jfif",
    "/PFP_IMG/6.jfif",
    "/PFP_IMG/7.jfif",
    "/PFP_IMG/8.jfif",
    "/PFP_IMG/9.jfif",
    "/PFP_IMG/10.jfif",
    "/PFP_IMG/11.jfif",
    "/PFP_IMG/12.jfif",
    "/PFP_IMG/13.jfif",
    "/PFP_IMG/14.jfif",
    "/PFP_IMG/15.jfif",
    "/PFP_IMG/16.jfif",
    "/PFP_IMG/17.jfif",
    "/PFP_IMG/18.jfif",
    "/PFP_IMG/19.jfif",
    "/PFP_IMG/20.jfif",
    "/PFP_IMG/21.jfif",
    "/PFP_IMG/22.jfif",
    "/PFP_IMG/23.jfif",
    "/PFP_IMG/24.jfif",
    "/PFP_IMG/25.jfif",
    "/PFP_IMG/26.jfif",
    "/PFP_IMG/27.jfif",
    "/PFP_IMG/28.jfif",
    "/PFP_IMG/29.jfif",
    "/PFP_IMG/30.jfif",
    "/PFP_IMG/31.jfif",
    "/PFP_IMG/32.jfif",
    "/PFP_IMG/33.jfif",
  ];

  // --- Fetch User Data ---
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/me');
        const data = await response.json();

        if (response.ok && data.user) {
          const user: UserData = data.user;
          setPersonalInfo({
            username: user.username,
            email: user.email,
            phone: user.phone || "",
            country: user.country || "",
            profileImage: user.avatar || "/PFP_IMG/14.jfif",
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            role: user.role,
            status: user.status,
          });
        } else {
          toast.error('Failed to load user data');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // --- Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    try {
      const response = await fetch('/api/user/update-profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: personalInfo.username,
          phone: personalInfo.phone,
          country: personalInfo.country,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state with the returned data
        if (data.user) {
          setPersonalInfo(prev => ({
            ...prev,
            username: data.user.username,
            phone: data.user.phone || "",
            country: data.user.country || "",
          }));
        }
        toast.success("Profile details updated successfully");
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const response = await fetch('/api/user/update-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast.success("Your password has been changed successfully");
      } else {
        toast.error(data.error || "Failed to update password");
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error("Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteInput !== "DELETE") {
      toast.error("Please type DELETE to confirm account closure.");
      return;
    }

    if (!deletePassword) {
      toast.error("Please enter your password to confirm account deletion.");
      return;
    }

    setIsDeletingAccount(true);

    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: deletePassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setDeleteInput("");
        setDeletePassword("");
        // Redirect to home page after successful deletion
        window.location.href = '/';
      } else {
        toast.error(data.error || "Failed to delete account");
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error("Failed to delete account");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleImageSelect = async (imagePath: string) => {
    setIsUpdatingImage(true);
    try {
      const response = await fetch('/api/user/update-profile-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileImage: imagePath }),
      });

      const data = await response.json();

      if (response.ok) {
        setPersonalInfo((prev) => ({ ...prev, profileImage: data.avatar || imagePath }));
        toast.success("Profile image updated successfully");
        setShowImagePicker(false);
      } else {
        toast.error(data.error || "Failed to update profile image");
      }
    } catch (error) {
      console.error('Error updating profile image:', error);
      toast.error("Failed to update profile image");
    } finally {
      setIsUpdatingImage(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl space-y-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-2xl font-bold uppercase tracking-tight">
                  Account Settings
                </h1>
                <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                  Update credentials and manage account settings
                </p>
              </div>
            </div>

            {/* Left and Right Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* LEFT COLUMN: Sidebar Card (Quick Identity Overview & Status) */}
              <div className="space-y-6 lg:sticky lg:top-4 lg:self-start">
                <Card className="border-border/50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4 text-[#D4AF37]" /> Profile Identity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center text-center justify-center">
                      <div className="relative">
                        <div className="relative w-40 h-40 flex items-center text-center justify-center rounded-xl overflow-hidden border-2 border-border bg-muted shadow-lg mb-4">
                          {personalInfo.profileImage ? (
                            <img
                              src={personalInfo.profileImage}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-10 h-10 text-muted-foreground" />
                          )}
                        </div>
                        <button
                          onClick={() => setShowImagePicker(true)}
                          className="absolute bottom-3 right-0 bg-white border border-border p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer dark:bg-zinc-950 dark:text-white"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <h4 className="text-base font-bold uppercase tracking-tight">
                        {personalInfo.username || "User Account"}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {personalInfo.email || "user@example.com"}
                      </p>
                    </div>

                    <hr className="my-6 border-border/40" />

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-muted-foreground uppercase">Access Level</span>
                        <span className="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 px-2 py-0.5 rounded-lg font-bold uppercase border border-emerald-500/20 text-[10px]">
                          {personalInfo.role?.toUpperCase() || "USER"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-muted-foreground uppercase">Identity Status</span>
                        <span className={`${personalInfo.emailVerified ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-700 dark:bg-red-950/50 dark:text-red-400 border-red-500/20'} px-2 py-0.5 rounded-lg font-bold uppercase border text-[10px]`}>
                          {personalInfo.emailVerified ? "VERIFIED" : "UNVERIFIED"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-muted-foreground uppercase">Account Status</span>
                        <span className={`${personalInfo.status === 'active' ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-500/20' : personalInfo.status === 'suspended' ? 'bg-amber-500/10 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-700 dark:bg-red-950/50 dark:text-red-400 border-red-500/20'} px-2 py-0.5 rounded-lg font-bold uppercase border text-[10px]`}>
                          {personalInfo.status?.toUpperCase() || "ACTIVE"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-muted-foreground uppercase">Date Joined</span>
                        <span className="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 px-2 py-0.5 rounded-lg font-bold uppercase border border-emerald-500/20 text-[10px]">
                          {personalInfo.createdAt ? new Date(personalInfo.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* RIGHT COLUMN: Action Blocks */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Component 1: Account Information Form */}
                <Card className="border-border/50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                      <User className="w-4 h-4 text-[#D4AF37]" /> Personal Information
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs">
                      Manage your active contact information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Username</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              name="username"
                              type="text"
                              value={personalInfo.username}
                              readOnly
                              className="w-full bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-3 text-sm text-muted-foreground cursor-not-allowed opacity-70"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              name="email"
                              type="email"
                              value={personalInfo.email}
                              readOnly
                              className="w-full bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-3 text-sm text-muted-foreground cursor-not-allowed opacity-70"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Country</label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              name="country"
                              type="text"
                              value={personalInfo.country}
                              onChange={handleInputChange}
                              className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 ring-[#D4AF37]/20 outline-none transition"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Phone Number</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              name="phone"
                              type="tel"
                              value={personalInfo.phone}
                              onChange={handleInputChange}
                              className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-2 ring-[#D4AF37]/20 outline-none transition"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button
                          type="submit"
                          disabled={isUpdatingProfile}
                          className="w-full gap-2 rounded-xl bg-[#D4AF37] p-5 text-xs font-bold uppercase tracking-wider text-black hover:bg-[#c9a227]"
                        >
                          {isUpdatingProfile ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Component 2: Forgot / Change Password Section */}
                <Card className="border-border/50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#D4AF37]" /> Credentials & Password
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs">
                      Change your current portal password
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordUpdate} className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Password</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type={showCurrentPassword ? "text" : "password"}
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full bg-background border border-border rounded-lg pl-10 pr-10 py-3 text-sm focus:ring-2 ring-[#D4AF37]/20 outline-none transition"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                            >
                              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">New Password</label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <input
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-background border border-border rounded-lg pl-10 pr-10 py-3 text-sm focus:ring-2 ring-[#D4AF37]/20 outline-none transition"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                              >
                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Confirm New Password</label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-background border border-border rounded-lg pl-10 pr-10 py-3 text-sm focus:ring-2 ring-[#D4AF37]/20 outline-none transition"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                              >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button
                          type="submit"
                          disabled={isUpdatingPassword}
                          className="w-full gap-2 rounded-xl bg-[#D4AF37] p-5 text-xs font-bold uppercase tracking-wider text-black hover:bg-[#c9a227]"
                        >
                          {isUpdatingPassword ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Changing Password...
                            </>
                          ) : (
                            "Update Password"
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Component 3: Danger Zone */}
                <Card className="border-red-500/50 shadow-sm">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-red-600 dark:text-red-400">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                          Danger Zone
                        </CardTitle>
                        <CardDescription className="mt-1 text-xs">
                          Once you delete your account, there is no going back. Please be certain.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleDeleteAccount} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                          Type <span className="font-mono bg-red-500/10 px-1 py-0.5 rounded-lg border border-red-500/20 text-red-600 dark:text-red-400">DELETE</span> to confirm
                        </label>
                        <input
                          type="text"
                          value={deleteInput}
                          onChange={(e) => setDeleteInput(e.target.value)}
                          placeholder="DELETE"
                          className="w-full bg-background border border-red-500/50 rounded-lg px-4 py-3 text-sm focus:ring-2 ring-red-500/20 outline-none transition"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                          Enter your password
                        </label>
                        <input
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          placeholder="Your password"
                          className="w-full bg-background border border-red-500/50 rounded-lg px-4 py-3 text-sm focus:ring-2 ring-red-500/20 outline-none transition"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isDeletingAccount || deleteInput !== "DELETE" || !deletePassword}
                        className="w-full gap-2 rounded-xl bg-red-600 p-5 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-700 disabled:opacity-30"
                      >
                        {isDeletingAccount ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" /> Delete Account
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

              </div>

            </div>
          </>
        )}
      </div>

      {/* Profile Image Picker Modal */}
      {showImagePicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowImagePicker(false)}
        >
          <Card
            className="w-full max-w-3xl max-h-[80vh] overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex items-center justify-between space-y-0">
              <CardTitle className="text-lg font-bold uppercase tracking-tighter flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#D4AF37]" /> Select Profile Image
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowImagePicker(false)}
                className="h-8 w-8"
              >
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>

            <CardContent className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {availableImages.map((imagePath) => (
                  <button
                    key={imagePath}
                    onClick={() => handleImageSelect(imagePath)}
                    disabled={isUpdatingImage}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:border-[#D4AF37] ${
                      personalInfo.profileImage === imagePath
                        ? 'border-emerald-500 ring-2 ring-emerald-500/50'
                        : 'border-border'
                    } ${isUpdatingImage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <img
                      src={imagePath}
                      alt={`Profile option ${imagePath}`}
                      className="w-full h-full object-cover"
                    />
                    {personalInfo.profileImage === imagePath && (
                      <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                        <div className="bg-emerald-500 rounded-full p-1">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>

            <div className="p-4 border-t border-border flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowImagePicker(false)}
                disabled={isUpdatingImage}
                className="rounded-full"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </main>
  );
}