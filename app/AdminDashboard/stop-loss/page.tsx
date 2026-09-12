"use client";

import { useState, useEffect } from "react";
import { Trash2, Plus, Loader2, AlertTriangle, Edit2, X } from "lucide-react";
import { toast } from "sonner";

interface StopLossRule {
  _id: string;
  min_balance: number;
  max_balance: number;
  stop_loss: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function StopLossPage() {
  const [stopLossRules, setStopLossRules] = useState<StopLossRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<StopLossRule | null>(null);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    min_balance: '',
    max_balance: '',
    stop_loss: ''
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchStopLossRules();
  }, []);

  const fetchStopLossRules = async () => {
    try {
      const response = await fetch('/api/admin/stop-loss');
      const data = await response.json();
      if (response.ok) {
        setStopLossRules(data.stopLossRules);
      } else {
        toast.error('Failed to fetch stop loss rules');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to fetch stop loss rules');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (rule: StopLossRule) => {
    setSelectedRule(rule);
    setShowConfirmModal(true);
  };

  const handleEdit = (rule: StopLossRule) => {
    setIsEditMode(true);
    setEditingRuleId(rule._id);
    setFormData({
      min_balance: rule.min_balance.toString(),
      max_balance: rule.max_balance.toString(),
      stop_loss: rule.stop_loss.toString()
    });
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingRuleId(null);
    setFormData({
      min_balance: '',
      max_balance: '',
      stop_loss: ''
    });
  };

  const confirmDelete = async () => {
    if (!selectedRule) return;

    setActionLoading(selectedRule._id);

    try {
      const response = await fetch(`/api/admin/stop-loss/${selectedRule._id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Stop loss rule deleted successfully');
        fetchStopLossRules();
      } else {
        toast.error(data.error || 'Failed to delete rule');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete rule');
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
    const stopLoss = parseFloat(formData.stop_loss);

    if (isNaN(minBalance) || isNaN(maxBalance) || isNaN(stopLoss)) {
      toast.error('Please enter valid numbers');
      return;
    }

    if (minBalance >= maxBalance) {
      toast.error('Minimum balance must be less than maximum balance');
      return;
    }

    setFormLoading(true);

    try {
      let url = '/api/admin/stop-loss';
      let method = 'POST';

      if (isEditMode && editingRuleId) {
        url = `/api/admin/stop-loss/${editingRuleId}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          min_balance: minBalance,
          max_balance: maxBalance,
          stop_loss: stopLoss,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(isEditMode ? 'Stop loss rule updated successfully' : 'Stop loss rule created successfully');
        handleCancelEdit();
        fetchStopLossRules();
      } else {
        toast.error(data.error || 'Failed to save rule');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save rule');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="bg-white text-neutral-950 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">
            Stop Loss Management
          </h1>
          <p className="text-neutral-500 text-sm">
            Create and manage stop loss rules based on account balance
          </p>
        </div>

        {/* Create Form */}
        <div className="bg-neutral-950 border-2 border-black rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
              {isEditMode ? (
                <>
                  <Edit2 className="w-5 h-5" />
                  Edit Rule
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create New Rule
                </>
              )}
            </h2>
            {isEditMode && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="cursor-pointer p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-neutral-700 transition-colors rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2">
                Minimum Balance
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.min_balance}
                onChange={(e) => setFormData({ ...formData, min_balance: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                placeholder="10"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2">
                Maximum Balance
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.max_balance}
                onChange={(e) => setFormData({ ...formData, max_balance: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                placeholder="49"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2">
                Stop Loss
              </label>
              <input
                type="number"
                step="1"
                value={formData.stop_loss}
                onChange={(e) => setFormData({ ...formData, stop_loss: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                placeholder="5, 50, 100"
                required
              />
            </div>
            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={formLoading}
                className="cursor-pointer font-black font-mono text-xs uppercase tracking-wider py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-neutral-950 border border-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Rule
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Rules Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
          </div>
        ) : stopLossRules.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            No stop loss rules found. Create your first rule above.
          </div>
        ) : (
          <div className="bg-neutral-950 border-2 border-black rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-950">
                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                      Minimum Balance
                    </th>
                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                      Maximum Balance
                    </th>
                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                      Stop Loss
                    </th>
                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                      Status
                    </th>
                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                      Created
                    </th>
                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stopLossRules.map((rule) => (
                    <tr key={rule._id} className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors">
                      <td className="p-4 text-sm font-mono text-emerald-400">${rule.min_balance}</td>
                      <td className="p-4 text-sm font-mono text-emerald-400">${rule.max_balance}</td>
                      <td className="p-4 text-sm font-mono text-white">{rule.stop_loss}</td>
                      <td className="p-4">
                        <span className={`text-[9px] px-2 py-1 font-black border rounded-full ${
                          rule.active 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20'
                        }`}>
                          {rule.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-neutral-400">
                        {new Date(rule.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(rule)}
                            className="cursor-pointer p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors rounded-xl"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(rule)}
                            disabled={actionLoading === rule._id}
                            className="cursor-pointer p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-colors disabled:opacity-50 rounded-xl"
                          >
                            {actionLoading === rule._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedRule && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="bg-neutral-950 border-2 border-black rounded-xl shadow-none w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
                <h2 className="text-xl font-black uppercase tracking-tighter">
                  Confirm Delete
                </h2>
              </div>
              <p className="text-sm text-neutral-300">
                Are you sure you want to delete this stop loss rule?
              </p>
              <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-xl">
                <p className="text-xs text-neutral-400">
                  <span className="font-bold text-white">Balance:</span> ${selectedRule.min_balance} - ${selectedRule.max_balance}
                </p>
                <p className="text-xs text-neutral-400">
                  <span className="font-bold text-white">Stop Loss:</span> {selectedRule.stop_loss}
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 cursor-pointer font-black font-mono text-xs uppercase tracking-wider py-3 rounded-xl transition-all duration-300 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 cursor-pointer font-black font-mono text-xs uppercase tracking-wider py-3 rounded-xl transition-all duration-300 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white border border-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
