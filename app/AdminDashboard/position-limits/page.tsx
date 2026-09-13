"use client";

import { useState, useEffect } from "react";
import { Trash2, Plus, Loader2, AlertTriangle, Edit2, X } from "lucide-react";
import { toast } from "sonner";

interface PositionLimitRule {
  _id: string;
  min_balance: number;
  max_balance: number;
  max_positions: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PositionLimitsPage() {
  const [positionLimits, setPositionLimits] = useState<PositionLimitRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<PositionLimitRule | null>(null);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    min_balance: "",
    max_balance: "",
    max_positions: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchPositionLimits();
  }, []);

const fetchPositionLimits = async () => {
  try {
    const response = await fetch("/api/admin/position-limits");
    const data = await response.json();

    if (response.ok) {
      setPositionLimits(data.positionLimits || []);
    } else {
      toast.error("Failed to fetch position limits");
    }
  } catch (error) {
    console.error("Fetch error:", error);
    toast.error("Failed to fetch position limits");
  } finally {
    setLoading(false);
  }
};

  const handleDelete = (rule: PositionLimitRule) => {
    setSelectedRule(rule);
    setShowConfirmModal(true);
  };

  const handleEdit = (rule: PositionLimitRule) => {
    setIsEditMode(true);
    setEditingRuleId(rule._id);
    setFormData({
      min_balance: rule.min_balance.toString(),
      max_balance: rule.max_balance.toString(),
      max_positions: rule.max_positions.toString(),
    });
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingRuleId(null);
    setFormData({
      min_balance: "",
      max_balance: "",
      max_positions: "",
    });
  };

  const confirmDelete = async () => {
    if (!selectedRule) return;

    setActionLoading(selectedRule._id);

    try {
      const response = await fetch(`/api/admin/position-limits/${selectedRule._id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Position limit rule deleted successfully");
        fetchPositionLimits();
      } else {
        toast.error(data.error || "Failed to delete rule");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete rule");
    } finally {
      setActionLoading(null);
      setShowConfirmModal(false);
      setSelectedRule(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const minBalance = parseFloat(formData.min_balance);
    const maxBalance = parseFloat(formData.max_balance);
    const maxPositions = parseFloat(formData.max_positions);

    if (isNaN(minBalance) || isNaN(maxBalance) || isNaN(maxPositions)) {
      toast.error("Please enter valid numbers");
      return;
    }

    if (minBalance >= maxBalance) {
      toast.error("Minimum balance must be less than maximum balance");
      return;
    }

    if (maxPositions < 1) {
      toast.error("Max positions must be at least 1");
      return;
    }

    setFormLoading(true);

    try {
      let url = "/api/admin/position-limits";
      let method = "POST";

      if (isEditMode && editingRuleId) {
        url = `/api/admin/position-limits/${editingRuleId}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          min_balance: minBalance,
          max_balance: maxBalance,
          max_positions: maxPositions,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          isEditMode
            ? "Position limit rule updated successfully"
            : "Position limit rule created successfully"
        );
        handleCancelEdit();
        fetchPositionLimits();
      } else {
        toast.error(data.error || "Failed to save rule");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save rule");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <main className="flex-grow flex justify-start">
        <div className="w-full max-w-7xl space-y-5 py-5">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-black uppercase tracking-tighter mb-2">
              Open Position Limits
            </h1>
            <p className="text-muted-foreground text-sm">
              Create and manage Open Position limits rules based on account balance
            </p>
          </div>

          {/* Create / Edit Form */}
          <div className="rounded-xl bg-zinc-50 text-zinc-950 border border-border/50 shadow-sm mb-8 dark:bg-zinc-900/50 dark:text-zinc-50">
            <div className="px-4 sm:px-6 py-6 space-y-6">
              <div className="border-b border-border/50 pb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider flex items-center">
                  {isEditMode ? (
                    <>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Rule
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Rule
                    </>
                  )}
                </h2>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="cursor-pointer p-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-600 border border-zinc-200 rounded-lg dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-400 dark:border-zinc-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                    Minimum Balance
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.min_balance}
                    onChange={(e) =>
                      setFormData({ ...formData, min_balance: e.target.value })
                    }
                    className="w-full bg-zinc-50 border border-border/50 text-zinc-950 px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#D4AF37] transition-colors rounded-xl dark:bg-zinc-900/50 dark:text-zinc-50"
                    placeholder="10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                    Maximum Balance
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.max_balance}
                    onChange={(e) =>
                      setFormData({ ...formData, max_balance: e.target.value })
                    }
                    className="w-full bg-zinc-50 border border-border/50 text-zinc-950 px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#D4AF37] transition-colors rounded-xl dark:bg-zinc-900/50 dark:text-zinc-50"
                    placeholder="49"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                    Max Positions
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={formData.max_positions}
                    onChange={(e) =>
                      setFormData({ ...formData, max_positions: e.target.value })
                    }
                    className="w-full bg-zinc-50 border border-border/50 text-zinc-950 px-4 py-3 text-sm font-mono focus:outline-none focus:border-[#D4AF37] transition-colors rounded-xl dark:bg-zinc-900/50 dark:text-zinc-50"
                    placeholder="1"
                    required
                  />
                </div>
                <div className="md:col-span-3">
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="w-full p-3 bg-[#D4AF37] text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#c9a227] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {formLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isEditMode ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        {isEditMode ? (
                          <>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Update Rule
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Rule
                          </>
                        )}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Rules Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-muted-foreground animate-spin mb-4" />
              <p className="text-sm font-bold text-muted-foreground">
                Loading rules...
              </p>
            </div>
          ) : positionLimits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border/50 rounded-xl">
              <p className="text-sm font-bold text-muted-foreground">
                No position limit rules found
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Create your first rule above
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-zinc-50 text-zinc-950 border border-border/50 shadow-sm dark:bg-zinc-900/50 dark:text-zinc-50">
              <div className="px-4 sm:px-6 py-6 space-y-6">
                <div className="border-b border-border/50 pb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider">
                    Position Limit Rules
                  </h2>
                </div>
                <div className="space-y-3">
                  {positionLimits.map((rule) => (
                    <div
                      key={rule._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-zinc-50 text-zinc-950 border border-border/50 rounded-xl dark:bg-zinc-900/50 dark:text-zinc-50"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                            Balance Range
                          </p>
                          <p className="text-sm font-mono text-emerald-600 dark:text-emerald-400">
                            ${rule.min_balance} - ${rule.max_balance}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                            Max Positions
                          </p>
                          <p className="text-sm font-mono">
                            {rule.max_positions}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-1 border rounded-full ${
                            rule.active
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/50"
                              : "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900/50"
                          }`}
                        >
                          {rule.active ? "Active" : "Inactive"}
                        </span>
                        <button
                          onClick={() => handleEdit(rule)}
                          className="flex-1 sm:flex-none cursor-pointer flex items-center justify-center bg-zinc-200 text-zinc-700 rounded-lg border border-zinc-200 hover:bg-zinc-300 font-black text-[10px] uppercase tracking-widest px-4 py-2 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-700 transition-colors"
                        >
                          <Edit2 className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(rule)}
                          disabled={actionLoading === rule._id}
                          className="flex-1 sm:flex-none cursor-pointer flex items-center justify-center bg-red-100 text-red-700 border rounded-lg border-red-200 hover:bg-red-200 font-black text-[10px] uppercase tracking-widest px-4 py-2 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-950/70 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === rule._id ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-1" />
                          )}
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Modal */}
          {showConfirmModal && selectedRule && (
            <div
              className="fixed inset-0 z-500 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
              onClick={() => setShowConfirmModal(false)}
            >
              <div
                className="rounded-xl bg-zinc-50 text-zinc-950 border border-border/50 shadow-none w-full max-w-md relative dark:bg-zinc-900/50 dark:text-zinc-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-4 sm:px-6 py-6 space-y-6">
                  <div className="border-b border-border/50 pb-3 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <h2 className="text-sm font-bold uppercase tracking-wider">
                      Confirm Delete
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to delete this position limit rule?
                  </p>
                  <div className="p-4 bg-zinc-50 text-zinc-950 border border-border/50 rounded-xl dark:bg-zinc-900/50 dark:text-zinc-50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      Balance Range
                    </p>
                    <p className="text-sm font-mono text-emerald-600 dark:text-emerald-400 mb-2">
                      ${selectedRule.min_balance} - ${selectedRule.max_balance}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      Max Positions
                    </p>
                    <p className="text-sm font-mono">
                      {selectedRule.max_positions}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowConfirmModal(false)}
                      className="flex-1 p-3 bg-zinc-200 text-zinc-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-zinc-300 transition-colors cursor-pointer dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="flex-1 p-3 bg-red-100 text-red-700 border border-red-200 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-200 transition-colors cursor-pointer dark:bg-red-950/50 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-950/70"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}