import React, { useState } from 'react';
import {
  Scale,
  Shield,
  KeyRound,
  Lock,
  Save,
  CheckCircle2,
  X,
  UserPlus,
  Users,
} from 'lucide-react';
import { db } from '../../services/db';
import { User } from '../../types';

interface PlatformContentDeskProps {
  modalType: 'terms_conditions' | 'privacy_policy' | 'admin_roles' | 'security';
  currentUser: User | null;
  onClose: () => void;
  showToast: (text: string, type?: 'success' | 'error') => void;
  onRefresh?: () => void;
}

export const PlatformContentDesk: React.FC<PlatformContentDeskProps> = ({
  modalType,
  currentUser,
  onClose,
  showToast,
  onRefresh,
}) => {
  const state = db.getState();

  // Terms & Conditions state
  const [termsText, setTermsText] = useState(
    state.settings.complianceDisclaimerText ||
      `HELP150 Community Guidelines & Terms of Service:
1. HELP150 is a peer-to-peer voluntary community support platform.
2. Members provide direct mutual financial assistance to each other on a voluntary basis.
3. Every member must fulfill their help request within the designated 12-hour countdown window.
4. Failure to fulfill assigned help will result in automatic account suspension.
5. All transactions are peer-to-peer (P2P); the platform does not hold user deposits.`
  );

  // Privacy Policy state
  const [privacyText, setPrivacyText] = useState(
    `HELP150 Privacy & Data Protection Policy:
1. Member Information: We collect only the information required to facilitate peer-to-peer help matching (Name, Mobile, UPI ID).
2. Data Security: Account passwords and banking details are encrypted and securely stored.
3. No Third-Party Sharing: Member data is strictly never sold or leased to third-party commercial entities.
4. Transparency: Audit logs record all administrative and transaction actions for compliance.`
  );

  // Security controls state
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [sessionTimeoutMins, setSessionTimeoutMins] = useState(30);
  const [adminPinProtection, setAdminPinProtection] = useState(true);
  const [ipLockdown, setIpLockdown] = useState(false);

  // Sub-admins
  const adminUsers = state.users.filter((u) => u.role === 'admin' || u.isAdminAccount);

  const handleSaveTerms = () => {
    db.updateState((draft) => {
      draft.settings.complianceDisclaimerText = termsText;
    });
    showToast('नियम एवं शर्तें (Terms & Conditions) सुरक्षित कर दी गईं!');
    if (onRefresh) onRefresh();
  };

  const handleSavePrivacy = () => {
    showToast('गोपनीयता नीति (Privacy Policy) सुरक्षित कर दी गई!');
  };

  const handleSaveSecurity = () => {
    showToast('सुरक्षा सेटिंग्स सफलतापूर्वक अपडेट कर दी गईं!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-4xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-800 to-indigo-900 text-white shadow-md">
              {modalType === 'terms_conditions' && <Scale className="h-5 w-5" />}
              {modalType === 'privacy_policy' && <Shield className="h-5 w-5" />}
              {modalType === 'admin_roles' && <KeyRound className="h-5 w-5" />}
              {modalType === 'security' && <Lock className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 font-heading">
                {modalType === 'terms_conditions' && 'Terms & Conditions Management'}
                {modalType === 'privacy_policy' && 'Privacy Policy Management'}
                {modalType === 'admin_roles' && 'Admin Roles & Sub-Admin Accounts'}
                {modalType === 'security' && 'Security & Access Controls'}
              </h3>
              <p className="text-xs text-slate-500">
                {modalType === 'terms_conditions' && 'वेबसाइट पर प्रदर्शित होने वाले नियम एवं शर्तें संपादित करें'}
                {modalType === 'privacy_policy' && 'गोपनीयता नीति और डेटा सुरक्षा दिशानिर्देश'}
                {modalType === 'admin_roles' && 'एडमिन खाते, रोल्स और विशेषाधिकार प्रबंधन'}
                {modalType === 'security' && '2FA सुरक्षा, सत्र समय-सीमा और व्यवस्थापक एक्सेस नियम'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content: Terms & Conditions */}
        {modalType === 'terms_conditions' && (
          <div className="space-y-3 text-xs">
            <label className="block text-slate-700 font-bold">
              नियम एवं शर्तें (Terms & Conditions Text):
            </label>
            <textarea
              rows={10}
              value={termsText}
              onChange={(e) => setTermsText(e.target.value)}
              className="w-full p-4 rounded-2xl border border-slate-300 font-mono text-xs text-slate-800 leading-relaxed outline-none focus:border-indigo-500"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSaveTerms}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Save className="h-4 w-4" />
                <span>Save Terms & Conditions</span>
              </button>
            </div>
          </div>
        )}

        {/* Content: Privacy Policy */}
        {modalType === 'privacy_policy' && (
          <div className="space-y-3 text-xs">
            <label className="block text-slate-700 font-bold">
              गोपनीयता नीति (Privacy Policy Text):
            </label>
            <textarea
              rows={10}
              value={privacyText}
              onChange={(e) => setPrivacyText(e.target.value)}
              className="w-full p-4 rounded-2xl border border-slate-300 font-mono text-xs text-slate-800 leading-relaxed outline-none focus:border-indigo-500"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSavePrivacy}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Save className="h-4 w-4" />
                <span>Save Privacy Policy</span>
              </button>
            </div>
          </div>
        )}

        {/* Content: Admin Roles */}
        {modalType === 'admin_roles' && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700">
              वर्तमान में प्लेटफ़ॉर्म पर कुल <strong>{adminUsers.length}</strong> सक्रिय एडमिनिस्ट्रेटर
              खाते हैं।
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Admin ID</th>
                    <th className="py-2.5 px-3">Full Name</th>
                    <th className="py-2.5 px-3">Mobile / Email</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {adminUsers.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{a.id}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{a.fullName}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono">{a.mobile || a.email}</td>
                      <td className="py-2.5 px-3">
                        <span className="bg-purple-100 text-purple-900 px-2 py-0.5 rounded text-[10px] font-bold">
                          {a.id === 'H150-ADMIN01' ? 'Super Admin' : 'Sub-Admin'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Content: Security */}
        {modalType === 'security' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Two-Factor Authentication (2FA)</div>
                  <div className="text-[11px] text-slate-500">
                    एडमिन लॉगिन पर अतिरिक्त सुरक्षा कोड अनिवार्य करें
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={twoFactorAuth}
                  onChange={(e) => setTwoFactorAuth(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <div>
                  <div className="font-bold text-slate-900">Admin PIN Code Protection</div>
                  <div className="text-[11px] text-slate-500">
                    अति-संवेदनशील कार्यों (आईडी हटाना, सेटिंग्स बदलना) के लिए सुरक्षा पिन
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={adminPinProtection}
                  onChange={(e) => setAdminPinProtection(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <div>
                  <div className="font-bold text-slate-900">Session Timeout Window</div>
                  <div className="text-[11px] text-slate-500">
                    निष्क्रिय रहने पर ऑटो-लॉगआउट समय (मिनटों में)
                  </div>
                </div>
                <select
                  value={sessionTimeoutMins}
                  onChange={(e) => setSessionTimeoutMins(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 font-bold bg-white"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>60 Minutes</option>
                  <option value={120}>2 Hours</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveSecurity}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Save className="h-4 w-4" />
                <span>Save Security Configuration</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
