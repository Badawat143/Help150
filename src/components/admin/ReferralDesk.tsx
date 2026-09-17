import React, { useState, useMemo } from 'react';
import {
  Share2,
  Sliders,
  Users,
  Award,
  ChevronRight,
  Save,
  CheckCircle2,
  X,
  Search,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { db } from '../../services/db';
import { User, ReferralLevelConfig } from '../../types';

interface ReferralDeskProps {
  mode: 'management' | 'settings';
  currentUser: User | null;
  onClose: () => void;
  showToast: (text: string, type?: 'success' | 'error') => void;
  onRefresh?: () => void;
}

export const ReferralDesk: React.FC<ReferralDeskProps> = ({
  mode: initialMode,
  currentUser,
  onClose,
  showToast,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'management' | 'settings'>(initialMode);
  const [state, setState] = useState(db.getState());
  const [levels, setLevels] = useState<ReferralLevelConfig[]>(
    state.referralLevels && state.referralLevels.length > 0
      ? state.referralLevels
      : [
          { level: 1, name: 'Level 1 (Direct)', percentage: 5, fixedRewardAmount: 5, minDirectRequirement: 0, qualifyingActivityRequirement: 'Completed 1 ₹150 Help', enabled: true },
          { level: 2, name: 'Level 2', percentage: 4, fixedRewardAmount: 4, minDirectRequirement: 1, qualifyingActivityRequirement: 'Completed 1 ₹150 Help', enabled: true },
          { level: 3, name: 'Level 3', percentage: 3, fixedRewardAmount: 3, minDirectRequirement: 2, qualifyingActivityRequirement: 'Completed 1 ₹150 Help', enabled: true },
          { level: 4, name: 'Level 4', percentage: 2, fixedRewardAmount: 2, minDirectRequirement: 3, qualifyingActivityRequirement: 'Completed 1 ₹150 Help', enabled: true },
          { level: 5, name: 'Level 5', percentage: 1, fixedRewardAmount: 1, minDirectRequirement: 4, qualifyingActivityRequirement: 'Completed 1 ₹150 Help', enabled: true },
          { level: 6, name: 'Level 6', percentage: 0.5, fixedRewardAmount: 0.5, minDirectRequirement: 5, qualifyingActivityRequirement: 'Completed 1 ₹150 Help', enabled: true },
        ]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserForTree, setSelectedUserForTree] = useState<User | null>(null);

  // Top sponsors calculation
  const sponsorStats = useMemo(() => {
    const counts: Record<string, number> = {};
    (state.users || []).forEach((u) => {
      const spId = u.sponsorId || 'H150-ADMIN01';
      counts[spId] = (counts[spId] || 0) + 1;
    });

    return (state.users || [])
      .map((u) => ({
        ...u,
        directCount: counts[u.id] || 0,
      }))
      .sort((a, b) => b.directCount - a.directCount);
  }, [state.users]);

  const filteredSponsors = useMemo(() => {
    if (!searchQuery.trim()) return sponsorStats;
    const q = searchQuery.toLowerCase();
    return sponsorStats.filter(
      (u) => u.id.toLowerCase().includes(q) || u.fullName.toLowerCase().includes(q)
    );
  }, [sponsorStats, searchQuery]);

  // Direct downlines of selected user
  const downlinesOfSelected = useMemo(() => {
    if (!selectedUserForTree) return [];
    return (state.users || []).filter((u) => u.sponsorId === selectedUserForTree.id);
  }, [state.users, selectedUserForTree]);

  const handleSaveSettings = () => {
    db.updateState((draft) => {
      draft.referralLevels = levels;
    });
    showToast('रेफरल सेटिंग्स सफलतापूर्वक सुरक्षित कर दी गईं!');
    if (onRefresh) onRefresh();
  };

  const handleLevelChange = (index: number, field: keyof ReferralLevelConfig, val: any) => {
    setLevels((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-5xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20">
              {activeTab === 'management' ? <Share2 className="h-5 w-5" /> : <Sliders className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 font-heading">
                {activeTab === 'management' ? 'Referral Tree & Team Management' : 'Referral Reward Configuration'}
              </h3>
              <p className="text-xs text-slate-500">
                मल्टी-लेवल इनकम, डायरेक्ट डाउनलाइन ट्रैकिंग और रिवॉर्ड्स कंट्रोल
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActiveTab('management')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeTab === 'management' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Team Tree
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  activeTab === 'settings' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Level Settings
              </button>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Referral Management */}
        {activeTab === 'management' && (
          <div className="space-y-4">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="यूजर ID या नाम खोजें..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column: Top Sponsors List */}
              <div className="lg:col-span-7 border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 font-bold text-xs text-slate-700 border-b border-slate-200">
                  सभी स्पॉन्सर और डायरेक्ट टीम संख्या
                </div>
                <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 text-xs custom-scrollbar">
                  {filteredSponsors.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => setSelectedUserForTree(u)}
                      className={`p-3 flex items-center justify-between cursor-pointer transition ${
                        selectedUserForTree?.id === u.id
                          ? 'bg-amber-50 border-l-4 border-amber-500'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{u.fullName}</span>
                          <span className="font-mono text-blue-600 text-[11px]">({u.id})</span>
                          {u.id === 'H150-ADMIN01' && (
                            <span className="bg-purple-100 text-purple-800 text-[9px] px-1.5 py-0.5 rounded font-bold">
                              Master Admin
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          स्पॉन्सर: {u.sponsorId || 'Direct (Admin)'} • मोबाइल: {u.mobile}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 font-bold font-mono text-xs">
                          {u.directCount} डायरेक्ट
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Downlines Tree View */}
              <div className="lg:col-span-5 border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex flex-col">
                <div className="font-bold text-xs text-slate-800 pb-2 border-b border-slate-200 flex items-center justify-between">
                  <span>डायरेक्ट डाउनलाइन ट्री</span>
                  {selectedUserForTree && (
                    <span className="font-mono text-amber-700">{selectedUserForTree.id}</span>
                  )}
                </div>

                {!selectedUserForTree ? (
                  <div className="my-auto py-12 text-center text-slate-400 text-xs">
                    <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <span>बाईं ओर से किसी भी सदस्य पर क्लिक करके उसकी डायरेक्ट टीम देखें</span>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2 max-h-80 overflow-y-auto custom-scrollbar text-xs">
                    <div className="p-2.5 rounded-xl bg-amber-100/60 border border-amber-200 font-bold text-slate-900 flex items-center gap-2">
                      <Award className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>{selectedUserForTree.fullName} की टीम ({downlinesOfSelected.length} सदस्य)</span>
                    </div>

                    {downlinesOfSelected.length === 0 ? (
                      <p className="text-slate-400 text-center py-6 text-xs">
                        इस आईडी के नीचे कोई डायरेक्ट सदस्य नहीं है।
                      </p>
                    ) : (
                      downlinesOfSelected.map((downline) => (
                        <div
                          key={downline.id}
                          className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-900">{downline.fullName}</div>
                            <div className="text-[11px] font-mono text-blue-600">{downline.id}</div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              downline.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {downline.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Referral Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs leading-relaxed">
              💡 <strong>स्तर कमीशन नियम:</strong> प्रत्येक स्तर पर मिलने वाला प्रतिशत अथवा निश्चित कमीशन नीचे सेट करें।
              ये बदलाव सिस्टम में तत्काल प्रभाव से लागू होंगे।
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Level</th>
                    <th className="py-2.5 px-3">Level Name</th>
                    <th className="py-2.5 px-3">Commission %</th>
                    <th className="py-2.5 px-3">Fixed Reward (₹)</th>
                    <th className="py-2.5 px-3">Min Direct Requirement</th>
                    <th className="py-2.5 px-3">Enabled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {levels.map((lvl, idx) => (
                    <tr key={lvl.level} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        Level {lvl.level}
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={lvl.name}
                          onChange={(e) => handleLevelChange(idx, 'name', e.target.value)}
                          className="px-2 py-1 border border-slate-200 rounded-lg text-xs w-36 font-semibold"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            value={lvl.percentage}
                            onChange={(e) => handleLevelChange(idx, 'percentage', Number(e.target.value))}
                            className="px-2 py-1 border border-slate-200 rounded-lg text-xs w-20 font-mono font-bold"
                          />
                          <span>%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          <span>₹</span>
                          <input
                            type="number"
                            value={lvl.fixedRewardAmount}
                            onChange={(e) =>
                              handleLevelChange(idx, 'fixedRewardAmount', Number(e.target.value))
                            }
                            className="px-2 py-1 border border-slate-200 rounded-lg text-xs w-20 font-mono font-bold"
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          value={lvl.minDirectRequirement}
                          onChange={(e) =>
                            handleLevelChange(idx, 'minDirectRequirement', Number(e.target.value))
                          }
                          className="px-2 py-1 border border-slate-200 rounded-lg text-xs w-20 font-mono"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="checkbox"
                          checked={lvl.enabled}
                          onChange={(e) => handleLevelChange(idx, 'enabled', e.target.checked)}
                          className="h-4 w-4 rounded text-amber-600 cursor-pointer"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Save className="h-4 w-4" />
                <span>Save Referral Settings (सेटिंग्स सुरक्षित करें)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
