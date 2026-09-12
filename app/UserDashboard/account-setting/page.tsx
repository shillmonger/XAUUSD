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
    <div className="min-h-screen bg-white text-neutral-950 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          </div>
        ) : (
          <>
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b-2 border-black pb-3 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-mono font-black uppercase text-neutral-950 mb-0 lg:mb-2">
                  Account Settings
                </h1>
                <p className="text-sm text-neutral-600 font-semibold max-w-xl leading-relaxed">
                  Update credentials and manage account settings
                </p>
              </div>
            </div>

            {/* Left and Right Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* LEFT COLUMN: Sidebar Card (Quick Identity Overview & Status) */}
              <div className="space-y-6 lg:sticky lg:top-4 lg:self-start">
                <div className="bg-neutral-950 text-white rounded-2xl border-2 border-black shadow-none p-6">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                    <User className="w-4 h-4 text-neutral-400" /> Profile Identity
                  </h3>
                  <div className="flex flex-col items-center text-center justify-center">
                    <div className="relative">
                      <div className="relative w-40 h-40 flex items-center text-center justify-center rounded-xl overflow-hidden border-2 border-neutral-800 bg-neutral-900 shadow-lg mb-4">
                        {personalInfo.profileImage ? (
                          <img 
                            src={personalInfo.profileImage} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-10 h-10 text-neutral-400" />
                        )}
                      </div>
                      <button
                        onClick={() => setShowImagePicker(true)}
                        className="absolute bottom-3 right-0 bg-white border border-neutral-300 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                      >
                        <ImageIcon className="w-4 h-4 text-black" />
                      </button>
                    </div>
                    <h4 className="text-base font-black uppercase tracking-tight text-white">
                      {personalInfo.username || "User Account"}
                    </h4>
                    <p className="text-xs text-neutral-400 font-mono">
                      {personalInfo.email || "user@example.com"}
                    </p>
                  </div>

                  <hr className="my-6 border-neutral-800" />

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-neutral-400 uppercase">Access Level</span>
                      <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-lg font-black uppercase border border-emerald-500/20 text-[10px]">
                        {personalInfo.role?.toUpperCase() || "USER"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-neutral-400 uppercase">Identity Status</span>
                      <span className={`${personalInfo.emailVerified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'} px-2 py-0.5 rounded-lg font-black uppercase border text-[10px]`}>
                        {personalInfo.emailVerified ? "VERIFIED" : "UNVERIFIED"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-neutral-400 uppercase">Account Status</span>
                      <span className={`${personalInfo.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : personalInfo.status === 'suspended' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'} px-2 py-0.5 rounded-lg font-black uppercase border text-[10px]`}>
                        {personalInfo.status?.toUpperCase() || "ACTIVE"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-neutral-400 uppercase">Date Joined</span>
                      <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-lg font-black uppercase border border-emerald-500/20 text-[10px]">
                        {personalInfo.createdAt ? new Date(personalInfo.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Action Blocks */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Component 1: Account Information Form */}
                <form onSubmit={handleProfileUpdate} className="bg-neutral-950 text-white rounded-2xl border-2 border-black shadow-none  p-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <User className="w-4 h-4 text-neutral-400" /> Personal Information
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">Manage your active contact information</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Username</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          name="username"
                          type="text"
                          value={personalInfo.username}
                          readOnly
                          className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg pl-10 pr-4 py-3 text-sm text-neutral-400 cursor-not-allowed opacity-70"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          name="email"
                          type="email"
                          value={personalInfo.email}
                          readOnly
                          className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg pl-10 pr-4 py-3 text-sm text-neutral-400 cursor-not-allowed opacity-70"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Country</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          name="country"
                          type="text"
                          value={personalInfo.country}
                          onChange={handleInputChange}
                          className="w-full bg-neutral-900/60 border border-neutral-800 rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:ring-2 ring-neutral-700 outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          name="phone"
                          type="tel"
                          value={personalInfo.phone}
                          onChange={handleInputChange}
                          className="w-full bg-neutral-900/60 border border-neutral-800 rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:ring-2 ring-neutral-700 outline-none transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="w-full cursor-pointer bg-indigo-600 text-white px-8 py-3 rounded-xl font-black font-mono text-xs uppercase tracking-wider hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2 border border-indigo-500 shadow-lg shadow-indigo-500/30 transition"
                    >
                      {isUpdatingProfile ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </div>
                </form>

                {/* Component 2: Forgot / Change Password Section */}
                <form onSubmit={handlePasswordUpdate} className="bg-neutral-950 text-white rounded-2xl border-2 border-black shadow-none  p-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <Lock className="w-4 h-4 text-neutral-400" /> Credentials & Password
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">Change your current portal password</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Current Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-neutral-900/60 border border-neutral-800 rounded-lg pl-10 pr-10 py-3 text-sm text-white focus:ring-2 ring-neutral-700 outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-neutral-900/60 border border-neutral-800 rounded-lg pl-10 pr-10 py-3 text-sm text-white focus:ring-2 ring-neutral-700 outline-none transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Confirm New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-neutral-900/60 border border-neutral-800 rounded-lg pl-10 pr-10 py-3 text-sm text-white focus:ring-2 ring-neutral-700 outline-none transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="w-full cursor-pointer bg-indigo-600 text-white px-8 py-3 rounded-xl font-black font-mono text-xs uppercase tracking-wider hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2 border border-indigo-500 shadow-lg shadow-indigo-500/30 transition"
                    >
                      {isUpdatingPassword ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Changing Password...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </button>
                  </div>
                </form>

                {/* Component 3: Danger Zone */}
                <div className="bg-rose-950/30 text-white rounded-2xl border-2 border-rose-900 p-6 space-y-6 shadow-none ">
                  <div className="flex items-start gap-4">
                    <div className="bg-rose-900/30 p-3 rounded-lg border border-rose-800 text-red-800">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-rose-400">
                        Danger Zone
                      </h3>
                      <p className="text-xs text-neutral-700 font-semibold mt-1">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleDeleteAccount} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-rose-400">
                        Type <span className="font-mono bg-red-900/30 px-1 py-0.5 rounded-lg border border-red-800 text-red-800">DELETE</span> to confirm
                      </label>
                      <input
                        type="text"
                        value={deleteInput}
                        onChange={(e) => setDeleteInput(e.target.value)}
                        placeholder="DELETE"
                        className="w-full bg-neutral-900/60 border mt-2 border-rose-900 rounded-lg px-4 py-3 text-sm text-white focus:ring-2 ring-rose-900 outline-none transition"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-rose-400">
                        Enter your password
                      </label>
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Your password"
                        className="w-full bg-neutral-900/60 border mt-2 border-rose-900 rounded-lg px-4 py-3 text-sm text-white focus:ring-2 ring-rose-900 outline-none transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isDeletingAccount || deleteInput !== "DELETE" || !deletePassword}
                      className="w-full cursor-pointer bg-rose-600 text-white px-8 py-3 rounded-xl font-black font-mono text-xs uppercase tracking-wider hover:bg-rose-500 disabled:opacity-30 flex items-center justify-center gap-2 border border-rose-500 shadow-lg shadow-rose-500/30 transition"
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
                    </button>
                  </form>
                </div>

              </div>

            </div>
          </>
        )}
      </div>

      {/* Profile Image Picker Modal */}
      {showImagePicker && (
        <div
          className="fixed inset-0 z-500 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowImagePicker(false)}
        >
          <div
            className="bg-neutral-950 border-2 border-neutral-800 rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <h2 className="text-lg font-black uppercase tracking-tighter text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-neutral-400" /> Select Pfp Image
              </h2>
              <button
                onClick={() => setShowImagePicker(false)}
                className="text-neutral-500 cursor-pointer hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {availableImages.map((imagePath) => (
                  <button
                    key={imagePath}
                    onClick={() => handleImageSelect(imagePath)}
                    disabled={isUpdatingImage}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:border-white ${
                      personalInfo.profileImage === imagePath
                        ? 'border-emerald-500 ring-2 ring-emerald-500/50'
                        : 'border-neutral-800'
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
            </div>

            <div className="p-4 border-t border-neutral-800 flex justify-end">
              <button
                onClick={() => setShowImagePicker(false)}
                disabled={isUpdatingImage}
                className="px-6 py-2 rounded-xl cursor-pointer border border-indigo-800 bg-indigo-900 text-indigo-300 hover:text-white font-black text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}