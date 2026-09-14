"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserCheck,
  UserMinus,
  Briefcase,
  Search,
  Filter,
  Trash2,
  Ban,
  MoreVertical,
  Mail,
  Loader2,
  DollarSign,
  ChevronDown,
  Eye,
  XCircle,
  Phone,
  Globe,
  CreditCard,
  TrendingUp,
  ArrowDownUp,
  FileText,
  Shield,
  Wallet,
  User,
  MapPin,
  Building,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import UserManagementSkeleton from "@/components/LoadingSkeleton/UserManagementSkeleton";

// Types
interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  username: string;
  status: string;
  balance: string;
  profit: string;
  totalDeposit: number;
  totalWithdrawal: number;
  roles: string[];
  country: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  // Additional fields from database
  fullName?: string;
  accountBalance?: number;
  welcomeBonus?: number;
  totalProfits?: number;
  referralBonus?: number;
  totalReferrals?: number;
  activeReferrals?: number;
  myReferralId?: string;
  referralId?: string;
  withdrawalAddresses?: {
    tron: string | null;
    doge: string | null;
    swiftCode: string | null;
    bitcoin: string | null;
    ethereum: string | null;
    litecoin: string | null;
    bnb: string | null;
    usdt: string | null;
  };
  isActive?: boolean;
  profileImage?: string;
}

interface KYC {
  _id: string;
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  countryOfResidence: string;
  documentType: string;
  frontIdUrl: string;
  backIdUrl: string;
  status: string;
  reviewedAt: string;
  reviewedBy: string;
  rejectionReason: string | null;
  submittedAt: string;
}

interface Withdrawal {
  _id: string;
  userId: string;
  amount: number;
  address: string;
  paymentMethod: string;
  status: string;
  charge: number;
  netAmount: number;
  createdAt: string;
}

interface InvestmentPlan {
  _id: string;
  userId: string;
  selectedPlan: string;
  amount: number;
  duration: number;
  profit: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  totalProfitEarned: number;
  daysCompleted: number;
}

interface ProfitHistoryEntry {
  date: string;
  rate: number;
  amount: number;
  timestamp: string;
}

interface UserInvestment {
  id: string;
  userId: string;
  planId: number;
  planName: string;
  roiRate: number;
  investmentAmount: number;
  durationDays: number;
  daysPassed: number;
  profitEarned: number;
  completionPercentage: number;
  status: string;
  profitHistory: ProfitHistoryEntry[];
  startDate: string;
  endDate: string;
  lastProfitDate: string;
  updatedAt: string;
}

interface Deposit {
  _id: string;
  paymentMethod: string;
  amount: number;
  proofImageUrl: string;
  status: string;
  userId: string;
  walletAddress: string;
  network: string;
  createdAt: string;
}

interface UserDetails {
  user: User;
  kyc?: KYC;
  withdrawals?: Withdrawal[];
  investmentPlans?: InvestmentPlan[];
  deposits?: Deposit[];
  investments?: UserInvestment[];
}

export default function AdminUsersPage() {
  // Default profile image constant
  const defaultProfileImage = "https://github.com/shadcn.png";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState<string | null>(
    null,
  );
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; action: 'suspend' | 'activate' | 'delete'; userId: string; userName: string; currentStatus?: string } | null>(null);
  const [stats, setStats] = useState([
    {
      label: "Total Users",
      value: "0",
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Active Users",
      value: "0",
      icon: UserCheck,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "Blocked Users",
      value: "0",
      icon: UserMinus,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      label: "Users Deposited",
      value: "0",
      icon: Briefcase,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ]);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();

      if (data.success) {
        const fetchedUsers = data.users || [];
        setUsers(fetchedUsers);

        // Calculate stats
        const activeUsers = fetchedUsers.filter(
          (u: User) => u.status === "Active",
        ).length;
        const blockedUsers = fetchedUsers.filter(
          (u: User) => u.status === "Blocked",
        ).length;
        const investedUsers = fetchedUsers.filter(
          (u: User) => u.totalDeposit > 0,
        ).length;

        setStats([
          {
            label: "Total Users",
            value: fetchedUsers.length.toString(),
            icon: Users,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "Active Users",
            value: activeUsers.toString(),
            icon: UserCheck,
            color: "text-teal-600",
            bg: "bg-teal-50",
          },
          {
            label: "Blocked Users",
            value: blockedUsers.toString(),
            icon: UserMinus,
            color: "text-red-500",
            bg: "bg-red-500/10",
          },
          {
            label: "Total Deposited Users",
            value: investedUsers.toString(),
            icon: Briefcase,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
        ]);
      } else {
        toast.error(data.error || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Suspend/unsuspend user
  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    setUpdatingUserId(userId);

    try {
      const newStatus = currentStatus === "Active" ? false : true;

      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user status");
      }

      const data = await response.json();

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: data.status } : u)),
      );

      toast.success(data.message);

      // Refresh stats
      fetchUsers();
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Failed to update user status");
    } finally {
      setUpdatingUserId(null);
      setConfirmModal(null);
    }
  };

  // Delete user
  const deleteUser = async (userId: string, userName: string) => {
    setUpdatingUserId(userId);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      const data = await response.json();

      // Remove user from local state
      setUsers((prev) => prev.filter((u) => u.id !== userId));

      toast.success(data.message);

      // Refresh stats
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setUpdatingUserId(null);
      setConfirmModal(null);
    }
  };

  const openConfirmModal = (action: 'suspend' | 'activate' | 'delete', userId: string, userName: string, currentStatus?: string) => {
    setConfirmModal({ isOpen: true, action, userId, userName, currentStatus });
  };

  const closeConfirmModal = () => {
    setConfirmModal(null);
  };

  const confirmAction = () => {
    if (!confirmModal) return;

    if (confirmModal.action === 'delete') {
      deleteUser(confirmModal.userId, confirmModal.userName);
    } else {
      toggleUserStatus(confirmModal.userId, confirmModal.currentStatus || 'Active');
    }
  };

  // Fetch user detailed information
  const fetchUserDetails = async (userId: string) => {
    setLoadingUserDetails(userId);

    try {
      // Find the user from existing users array
      const currentUser = users.find((u) => u.id === userId);

      if (currentUser) {
        console.log("User data for debugging:", currentUser);
        console.log("totalProfits:", currentUser.totalProfits);
        console.log("welcomeBonus:", currentUser.welcomeBonus);

        // Fetch user investments
        let investments: UserInvestment[] = [];
        try {
          const investmentsResponse = await fetch(`/api/admin/users/${userId}/investments`);
          const investmentsData = await investmentsResponse.json();
          if (investmentsData.success) {
            investments = investmentsData.investments || [];
          }
        } catch (error) {
          console.error("Error fetching investments:", error);
        }

        setSelectedUser({
          user: currentUser,
          kyc: undefined,
          withdrawals: [],
          investmentPlans: [],
          deposits: [],
          investments: investments,
        });
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to fetch user details");
    } finally {
      setLoadingUserDetails(null);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Format currency
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(num);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };



  return (
    <div className="flex h-screen bg-background">

      <div className="flex-1 flex flex-col">

        <main className="flex-1 py-5">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-2xl font-black uppercase tracking-tighter leading-none flex items-center gap-4">
                User Management
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 mt-1">
                <Users className="w-3 h-3 text-primary" />
                Community Control
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                <input
                  type="text"
                  placeholder="Search by /email/username"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="
      bg-card
      border border-border
      rounded-xl
      py-3 pl-10 pr-4
      text-sm
      text-foreground
      placeholder:text-gray-400
      dark:placeholder:text-gray-300
      focus:ring-2 focus:ring-primary/50
      w-full md:w-64
      shadow-sm
    "
                />
              </div>
              <button className="p-3 bg-card border border-border rounded-xl text-primary shadow-sm">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="bg-card p-4 md:p-5 md:py-4 rounded-2xl border border-border shadow-sm"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}
                >
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-lg md:text-xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* User Table */}
          <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            {filteredUsers.length === 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <tbody>
                    <tr>
                      <td colSpan={5} className="px-6 py-10">
                        <div className="flex items-center justify-center py-20">
                          <div className="text-center">
                            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-sm font-black uppercase tracking-tighter mb-2">
                              {searchTerm ? "No users found" : "No users found"}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase mb-6">
                              {searchTerm
                                ? "Try adjusting your search terms"
                                : "When users register, they will appear here"}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-muted text-muted-foreground text-[10px] uppercase tracking-widest font-bold">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4 hidden md:table-cell">Joined</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 hidden sm:table-cell">
                        Account Balance
                      </th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="group hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.profileImage || defaultProfileImage}
                              alt={user.name}
                              className="w-10 h-10 rounded-lg object-cover cursor-pointer"
                              onError={(e) => {
                                // Fallback to initials if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                target.nextElementSibling?.classList.remove(
                                  "hidden",
                                );
                              }}
                            />
                            <div
                              className={`w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs hidden`}
                            >
                              {user.name.charAt(0)}
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="font-bold  text-sm text-foreground">
                                {user.name}
                              </span>
                              {/* <span className="text-xs text-muted-foreground">
                                @{user.username}
                              </span> */}
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {user.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell text-gray-500 font-medium">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                              user.status === "Active"
                                ? "bg-teal-500/10 text-teal-600 border-teal-500/20"
                                : "bg-red-500/10 text-red-600 border-red-500/20"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell font-bold text-[#1D429A]">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            {formatCurrency(
                              user.accountBalance || user.balance || 0,
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => fetchUserDetails(user.id)}
                              disabled={loadingUserDetails === user.id}
                              className="p-3 bg-blue-500/10 text-blue-500 cursor-pointer hover:bg-blue-500/20 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              title="View User Details"
                            >
                              {loadingUserDetails === user.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </button>
                            <button
                              onClick={() =>
                                openConfirmModal(
                                  user.status === "Active" ? 'suspend' : 'activate',
                                  user.id,
                                  user.name,
                                  user.status
                                )
                              }
                              disabled={updatingUserId === user.id}
                              className={`p-3 cursor-pointer rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                user.status === "Active"
                                  ? "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20"
                                  : "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                              }`}
                              title={
                                user.status === "Active"
                                  ? "Suspend User"
                                  : "Activate User"
                              }
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openConfirmModal('delete', user.id, user.name)}
                              disabled={updatingUserId === user.id}
                              className="p-3 bg-red-500/10 text-red-500 cursor-pointer hover:bg-red-500/20 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

      </div>

      {/* User Details Modal */}
      {selectedUser && (
  <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/10 backdrop-blur-sm px-4">
    <div
      className="bg-card border border-border rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col"
      style={{ 
        height: '90vh',
        animation: "popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)" 
      }}
    >

      {/* Fixed Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-border rounded-t-3xl">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-foreground">User Details</h3>
          <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
            selectedUser.user.status === "Active"
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-600 border-rose-500/20"
          }`}>
            {selectedUser.user.status}
          </span>
        </div>
        <button
          onClick={() => setSelectedUser(null)}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

        {/* User Profile */}
        <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-border">
          <img
            src={selectedUser.user.profileImage || defaultProfileImage}
            alt={selectedUser.user.fullName || selectedUser.user.name}
            className="w-14 h-14 rounded-xl object-cover border border-border flex-shrink-0"
          />
          <div>
            <h4 className="text-sm font-medium text-foreground">
              {selectedUser.user.fullName || selectedUser.user.name}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              @{selectedUser.user.username} · {selectedUser.user.email}
            </p>
          </div>
        </div>

        {/* Personal Information */}
        <div>
          <p className="text-[11px] font-medium text-blue-600 uppercase tracking-widest mb-3">
            Personal Information
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <p className="text-[11px] text-muted-foreground mb-1">Full name</p>
              <p className="text-sm font-medium text-foreground">
                {selectedUser.user.fullName || selectedUser.user.name}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <p className="text-[11px] text-muted-foreground mb-1">Phone number</p>
              <p className="text-sm font-medium text-foreground">
                {selectedUser.user.phone}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <p className="text-[11px] text-muted-foreground mb-1">Country</p>
              <p className="text-sm font-medium text-foreground">
                {selectedUser.user.country}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <p className="text-[11px] text-muted-foreground mb-1">Joined</p>
              <p className="text-sm font-medium text-foreground">
                {formatDate(selectedUser.user.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <hr className="border-border" />

        {/* Financial Information */}
        <div>
          <p className="text-[11px] font-medium text-green-600 uppercase tracking-widest mb-3">
            Financial Information
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <p className="text-[11px] text-muted-foreground mb-1">Account balance</p>
              <p className="text-sm font-medium text-foreground">
                {formatCurrency(selectedUser.user.accountBalance || selectedUser.user.balance || 0)}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <p className="text-[11px] text-muted-foreground mb-1">Total deposits</p>
              <p className="text-sm font-medium text-foreground">
                {formatCurrency(selectedUser.user.totalDeposit)}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <p className="text-[11px] text-muted-foreground mb-1">Total withdrawals</p>
              <p className="text-sm font-medium text-foreground">
                {formatCurrency(selectedUser.user.totalWithdrawal)}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <p className="text-[11px] text-muted-foreground mb-1">Total profit</p>
              <p className="text-sm font-medium text-foreground">
                {formatCurrency(selectedUser.user.totalProfits || 0)}
              </p>
            </div>
            <div className="col-span-2 p-3 bg-muted/30 rounded-lg border border-border">
              <p className="text-[11px] text-muted-foreground mb-1">Welcome bonus</p>
              <p className="text-sm font-medium text-foreground">
                {formatCurrency(selectedUser.user.welcomeBonus || 0)}
              </p>
            </div>
          </div>
        </div>

        <hr className="border-border" />

        {/* Role Information */}
        <div>
          <p className="text-[11px] font-medium text-purple-600 uppercase tracking-widest mb-3">
            Role Information
          </p>
          <div className="p-3 bg-muted/30 rounded-lg border border-border">
            <p className="text-[11px] text-muted-foreground mb-1">Roles</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {(selectedUser.user.roles?.length ? selectedUser.user.roles : ["N/A"]).map((role) => (
                <span
                  key={role}
                  className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>

        <hr className="border-border" />

        {/* Referral Information */}
        <div>
          <p className="text-[11px] font-medium text-orange-600 uppercase tracking-widest mb-3">
            Referral Information
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <p className="text-[11px] text-muted-foreground mb-1">My referral ID</p>
              <p className="text-sm font-medium text-foreground font-mono">
                {selectedUser.user.myReferralId || "N/A"}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <p className="text-[11px] text-muted-foreground mb-1">Referred by</p>
              <p className="text-sm font-medium text-foreground font-mono">
                {selectedUser.user.referralId || "N/A"}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <p className="text-[11px] text-muted-foreground mb-1">Total referrals</p>
              <p className="text-sm font-medium text-foreground">
                {selectedUser.user.totalReferrals || 0}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <p className="text-[11px] text-muted-foreground mb-1">Active referrals</p>
              <p className="text-sm font-medium text-foreground">
                {selectedUser.user.activeReferrals || 0}
              </p>
            </div>
          </div>
        </div>

        <hr className="border-border" />

        {/* Investment Information */}
        <div>
          <p className="text-[11px] font-medium text-teal-600 uppercase tracking-widest mb-3">
            Investment Information
          </p>
          
          {selectedUser.investments && selectedUser.investments.length > 0 ? (
            <div className="space-y-3">
              {selectedUser.investments.map((investment) => (
                <div key={investment.id} className="p-4 bg-muted/30 rounded-xl border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-foreground">{investment.planName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(investment.startDate)} - {formatDate(investment.endDate)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      investment.status === 'active'
                        ? 'bg-teal-500/10 text-teal-600 border-teal-500/20'
                        : investment.status === 'completed'
                          ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                          : 'bg-gray-500/10 text-gray-600 border-gray-500/20'
                    }`}>
                      {investment.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="p-2 bg-background/50 rounded-lg">
                      <p className="text-[10px] text-muted-foreground mb-1">Invested</p>
                      <p className="text-sm font-bold text-foreground">
                        {formatCurrency(investment.investmentAmount)}
                      </p>
                    </div>
                    <div className="p-2 bg-background/50 rounded-lg">
                      <p className="text-[10px] text-muted-foreground mb-1">Profit Earned</p>
                      <p className="text-sm font-bold text-green-600">
                        {formatCurrency(investment.profitEarned)}
                      </p>
                    </div>
                    <div className="p-2 bg-background/50 rounded-lg">
                      <p className="text-[10px] text-muted-foreground mb-1">ROI Rate</p>
                      <p className="text-sm font-bold text-foreground">
                        {investment.roiRate}%
                      </p>
                    </div>
                    <div className="p-2 bg-background/50 rounded-lg">
                      <p className="text-[10px] text-muted-foreground mb-1">Progress</p>
                      <p className="text-sm font-bold text-foreground">
                        {investment.daysPassed}/{investment.durationDays} days
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Completion</span>
                      <span>{investment.completionPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2">
                      <div
                        className="bg-teal-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, investment.completionPercentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Profit History */}
                  {investment.profitHistory && investment.profitHistory.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Profit History ({investment.profitHistory.length} entries)
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {investment.profitHistory.slice(-5).reverse().map((entry, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-background/50 rounded-lg text-[10px]"
                          >
                            <span className="text-muted-foreground">{entry.date}</span>
                            <span className="font-bold text-green-600">
                              +{formatCurrency(entry.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-muted/30 rounded-xl border border-border text-center">
              <Wallet className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No investments found</p>
            </div>
          )}
        </div>

      </div>

      {/* Fixed Footer */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t border-border rounded-b-3xl">
        <p className="text-xs text-muted-foreground font-mono">
          ID: {selectedUser.user._id || selectedUser.user.id}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedUser(null)}
            className="text-xs font-medium px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            className={`text-xs font-medium px-4 py-2 rounded-lg border cursor-pointer transition-opacity hover:opacity-80 ${
              selectedUser.user.status === "Active"
                ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
            }`}
          >
            {selectedUser.user.status === "Active" ? "Suspend user" : "Activate user"}
          </button>
        </div>
      </div>

    </div>
  </div>
)}
      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            onClick={closeConfirmModal}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Modal */}
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all">
            {/* Icon */}
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              confirmModal.action === 'delete'
                ? 'bg-red-500/10'
                : confirmModal.action === 'suspend'
                  ? 'bg-orange-500/10'
                  : 'bg-green-500/10'
            }`}>
              {confirmModal.action === 'delete' ? (
                <Trash2 className="w-8 h-8 text-red-500" />
              ) : confirmModal.action === 'suspend' ? (
                <Ban className="w-8 h-8 text-orange-500" />
              ) : (
                <UserCheck className="w-8 h-8 text-green-500" />
              )}
            </div>

            {/* Title */}
            <h2 className="text-xl font-black text-center uppercase tracking-tight mb-2">
              {confirmModal.action === 'delete' ? 'Delete User' : confirmModal.action === 'suspend' ? 'Suspend User' : 'Activate User'}
            </h2>

            {/* Warning */}
            <div className="bg-muted/50 border border-border rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This action <strong>cannot be undone</strong>. Please review the details below before confirming.
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">User</span>
                <span className="text-sm font-bold text-foreground">{confirmModal.userName}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Action</span>
                <span className={`text-sm font-bold uppercase ${
                  confirmModal.action === 'delete' ? 'text-red-500' : confirmModal.action === 'suspend' ? 'text-orange-500' : 'text-green-500'
                }`}>
                  {confirmModal.action}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={closeConfirmModal}
                disabled={updatingUserId === confirmModal.userId}
                className="flex-1 px-4 py-3 cursor-pointer bg-muted text-foreground rounded-lg text-xs font-black uppercase tracking-wider hover:bg-muted/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={updatingUserId === confirmModal.userId}
                className={`flex-1 px-4 py-3 cursor-pointer rounded-lg text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  confirmModal.action === 'delete'
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : confirmModal.action === 'suspend'
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {updatingUserId === confirmModal.userId ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {confirmModal.action === 'delete' ? (
                      <Trash2 className="w-4 h-4" />
                    ) : confirmModal.action === 'suspend' ? (
                      <Ban className="w-4 h-4" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                    {confirmModal.action === 'delete' ? 'Delete' : confirmModal.action}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
