import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Copy,
  Check,
  RefreshCw,
  Code,
  FileText,
  Sparkles,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { db } from '../../services/db';

interface BrevoCampaignDeskProps {
  onClose?: () => void;
  onToast: (text: string, type?: 'success' | 'error') => void;
}

export const BrevoCampaignDesk: React.FC<BrevoCampaignDeskProps> = ({ onClose, onToast }) => {
  const state = db.getState();
  const registeredUsers = state.users.filter((u) => u.email && u.email.includes('@'));

  // Connection & Account state
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Campaign Form State (Matching Brevo API v3 cURL spec)
  const [campaignName, setCampaignName] = useState('HELP150 Community Update Campaign');
  const [subject, setSubject] = useState('Important Announcement from HELP150 Community');
  const [senderName, setSenderName] = useState('HELP150 Admin');
  const [senderEmail, setSenderEmail] = useState('admin@help150.org');
  const [campaignType] = useState('classic');
  const [recipientMode, setRecipientMode] = useState<'all_members' | 'list_ids'>('all_members');
  const [listIdsInput, setListIdsInput] = useState('2, 7');
  const [dispatchTiming, setDispatchTiming] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledAt, setScheduledAt] = useState(
    new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 16)
  );

  // Content & Templates
  const [htmlContent, setHtmlContent] = useState<string>(
    `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h1 style="color: #1e3a8a; margin: 0; font-size: 24px;">HELP150 Community</h1>
    <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Together We Grow • Peer-to-Peer Assistance</p>
  </div>
  <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
  <h2 style="color: #0f172a; font-size: 18px;">Dear Valued Community Member,</h2>
  <p style="color: #334155; line-height: 1.6; font-size: 14px;">
    We are pleased to inform you that new peer-to-peer assistance cycles are currently active in the community.
  </p>
  <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #3b82f6;">
    <p style="margin: 0; color: #1e293b; font-weight: bold; font-size: 14px;">📢 Platform Announcement:</p>
    <p style="margin: 6px 0 0 0; color: #475569; font-size: 13px;">Please make sure your KYC status and UPI ID are up to date on your member dashboard.</p>
  </div>
  <p style="color: #334155; line-height: 1.6; font-size: 14px;">
    Thank you for being part of our mutual empowerment initiative.
  </p>
  <div style="text-align: center; margin-top: 28px;">
    <a href="https://help150.org" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Visit Member Portal</a>
  </div>
  <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
  <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
    HELP150 Community Support Desk • Email: support@help150.org
  </p>
</div>`
  );

  const [previewTab, setPreviewTab] = useState<'editor' | 'preview' | 'curl'>('editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // Campaign History
  const [campaignsList, setCampaignsList] = useState<any[]>([]);

  // Fetch Brevo API status
  const checkStatus = async () => {
    setLoadingStatus(true);
    setErrorMessage(null);
    try {
      const resp = await fetch('/api/brevo/status');
      const data = await resp.json();
      setIsConfigured(data.configured && data.valid);
      if (data.account) {
        setAccountInfo(data.account);
      }
      if (data.error) {
        setErrorMessage(data.error);
      }
    } catch {
      setIsConfigured(false);
    } finally {
      setLoadingStatus(false);
    }
  };

  // Fetch Existing Campaigns
  const loadCampaigns = async () => {
    try {
      const resp = await fetch('/api/brevo/campaigns');
      const data = await resp.json();
      if (Array.isArray(data.campaigns)) {
        setCampaignsList(data.campaigns);
      }
    } catch (e) {
      console.warn('Could not fetch campaigns:', e);
    }
  };

  useEffect(() => {
    checkStatus();
    loadCampaigns();
  }, []);

  // Quick Template Injector
  const applyTemplate = (templateType: 'welcome' | 'cycle' | 'kyc') => {
    if (templateType === 'welcome') {
      setSubject('Welcome to HELP150 Community! Complete Your Profile');
      setHtmlContent(
        `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #1e3a8a;">Welcome to HELP150!</h2>
          <p style="color: #334155;">Your account is ready. Log in to explore mutual assistance and connect with peer members.</p>
          <p><strong>Support Helpline:</strong> +91 98000 00001</p>
        </div>`
      );
    } else if (templateType === 'cycle') {
      setSubject('Action Required: New Peer Assistance Link Available');
      setHtmlContent(
        `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #059669;">Peer Assistance Notice</h2>
          <p style="color: #334155;">A new peer help link has been matched to your account. Please check your dual box dashboard to proceed.</p>
        </div>`
      );
    } else if (templateType === 'kyc') {
      setSubject('Reminder: Please complete your KYC Verification on HELP150');
      setHtmlContent(
        `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #d97706;">KYC Verification Required</h2>
          <p style="color: #334155;">To ensure safety and seamless assistance, please upload your Aadhaar/PAN details for verification.</p>
        </div>`
      );
    }
    onToast('Template loaded into editor!');
  };

  // Generate User cURL Command exactly as requested
  const parsedListIds = listIdsInput
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));

  const generatedCurl = `curl -X POST 'https://api.brevo.com/v3/emailCampaigns' \\
  -H 'accept: application/json' \\
  -H 'api-key: YOUR_API_V3_KEY' \\
  -H 'content-type: application/json' \\
  -d '{
    "name": "${campaignName.replace(/"/g, '\\"')}",
    "subject": "${subject.replace(/"/g, '\\"')}",
    "sender": {
      "name": "${senderName.replace(/"/g, '\\"')}",
      "email": "${senderEmail}"
    },
    "type": "classic",
    "htmlContent": "${htmlContent.replace(/\n/g, '').replace(/"/g, '\\"')}",
    "recipients": { "listIds": [${parsedListIds.length > 0 ? parsedListIds.join(', ') : '2, 7'}] }${
      dispatchTiming === 'scheduled'
        ? `,\n    "scheduledAt": "${new Date(scheduledAt).toISOString()}"`
        : ''
    }
  }'`;

  // Submit Handler
  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim() || !subject.trim() || !htmlContent.trim()) {
      onToast('Please provide campaign name, subject, and content', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      if (recipientMode === 'all_members') {
        // Direct Broadcast to all registered members
        const resp = await fetch('/api/brevo/send-broadcast', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            subject,
            htmlContent,
            sender: { name: senderName, email: senderEmail },
            recipientEmails: registeredUsers.map((u) => u.email),
          }),
        });
        const data = await resp.json();

        if (resp.ok && data.success) {
          onToast(data.message || `Campaign broadcasted to ${data.recipientCount} members!`);
          loadCampaigns();
        } else {
          onToast(data.error || 'Failed to dispatch broadcast', 'error');
        }
      } else {
        // Brevo Campaign API /v3/emailCampaigns
        const payload: any = {
          name: campaignName,
          subject,
          sender: { name: senderName, email: senderEmail },
          type: campaignType,
          htmlContent,
          recipients: { listIds: parsedListIds.length > 0 ? parsedListIds : [2] },
          sendNow: dispatchTiming === 'immediate',
        };

        if (dispatchTiming === 'scheduled') {
          payload.scheduledAt = new Date(scheduledAt).toISOString();
        }

        const resp = await fetch('/api/brevo/campaign', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await resp.json();

        if (resp.ok && data.success) {
          onToast(data.message || 'Brevo email campaign successfully created!');
          loadCampaigns();
        } else {
          onToast(data.error || 'Failed to create campaign via Brevo', 'error');
        }
      }
    } catch (err: any) {
      onToast(err.message || 'Error communicating with campaign server', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(generatedCurl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
    onToast('cURL command copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Status Header */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-3xl p-6 text-white border border-blue-800/40 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight font-heading">
                  Brevo Email Campaign Desk
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold">
                  API v3
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Create campaigns, schedule bulk emails, and broadcast announcements to HELP150 members via Brevo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                checkStatus();
                loadCampaigns();
              }}
              disabled={loadingStatus}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingStatus ? 'animate-spin' : ''}`} />
              <span>Check Status</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Connection Card */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Brevo API Status
              </div>
              <div className="flex items-center gap-2">
                {isConfigured ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Connected (Live)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>API Key Required</span>
                  </span>
                )}
              </div>
            </div>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Recipients Card */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Registered Member Emails
              </div>
              <div className="text-sm font-black text-white flex items-center gap-1.5">
                <Users className="h-4 w-4 text-blue-400" />
                <span>{registeredUsers.length} Active Members</span>
              </div>
            </div>
            <span className="text-[10px] text-blue-300 font-mono font-bold bg-blue-950 px-2 py-0.5 rounded-lg border border-blue-800">
              Ready
            </span>
          </div>

          {/* Account Plan / Credits */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Brevo Credits / Plan
              </div>
              <div className="text-xs font-bold text-slate-200">
                {accountInfo ? (
                  <span>{accountInfo.companyName || accountInfo.email}</span>
                ) : (
                  <span>Standard v3 API Plan</span>
                )}
              </div>
            </div>
            <span className="text-[10px] text-purple-300 font-mono font-bold bg-purple-950 px-2 py-0.5 rounded-lg border border-purple-800">
              v3 REST
            </span>
          </div>
        </div>

        {/* API Key Guide Notice */}
        {!isConfigured && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                To send live email campaigns, set <strong>BREVO_API_KEY</strong> in your AI Studio Settings/Secrets panel. You can still test, compose, and preview campaigns right now.
              </span>
            </div>
            <a
              href="https://app.brevo.com/settings/keys/api"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center gap-1 shrink-0 whitespace-nowrap transition"
            >
              <span>Get Brevo API Key</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      {/* Main Campaign Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Settings (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900 font-heading">
                Compose Email Campaign
              </h3>
              <p className="text-xs text-slate-500">
                Define the campaign payload adhering to Brevo v3 specification.
              </p>
            </div>

            {/* Quick Template Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => applyTemplate('welcome')}
                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold transition"
              >
                Welcome
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('cycle')}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold transition"
              >
                Peer Link
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('kyc')}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold transition"
              >
                KYC Alert
              </button>
            </div>
          </div>

          <form onSubmit={handleDispatch} className="space-y-4 text-xs font-semibold text-slate-700">
            {/* Campaign Name */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Campaign Name (अभियान का नाम) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. HELP150 Community Update"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Subject Line */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Email Subject Line (ईमेल विषय) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Important Announcement from HELP150 Community"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sender Details: Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Sender Name (प्रेषक का नाम)
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Sender Email (प्रेषक का ईमेल) <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400 font-normal">
                  Must be a verified sender domain in Brevo.
                </span>
              </div>
            </div>

            {/* Recipients Selection */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <label className="block text-slate-800 font-bold">
                Target Recipients (प्राप्तकर्ता चयन)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRecipientMode('all_members')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    recipientMode === 'all_members'
                      ? 'bg-blue-50 border-blue-400 text-blue-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-blue-600" />
                    <span>All HELP150 Registered Users</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 font-normal">
                    Direct broadcast to {registeredUsers.length} members with registered email.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipientMode('list_ids')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    recipientMode === 'list_ids'
                      ? 'bg-blue-50 border-blue-400 text-blue-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Brevo Contact List IDs</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 font-normal">
                    Use specific Brevo list IDs (e.g. listIds: [2, 7]).
                  </div>
                </button>
              </div>

              {recipientMode === 'list_ids' && (
                <div>
                  <label className="block text-slate-600 font-bold text-[11px] mb-1">
                    Brevo List IDs (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={listIdsInput}
                    onChange={(e) => setListIdsInput(e.target.value)}
                    placeholder="e.g. 2, 7"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono text-slate-900"
                  />
                </div>
              )}
            </div>

            {/* Timing: Immediate vs Scheduled */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <label className="block text-slate-800 font-bold">
                Dispatch Schedule (भेजने का समय)
              </label>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="timing"
                    checked={dispatchTiming === 'immediate'}
                    onChange={() => setDispatchTiming('immediate')}
                    className="text-blue-600"
                  />
                  <span>Send Immediately (तुरंत भेजें)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="timing"
                    checked={dispatchTiming === 'scheduled'}
                    onChange={() => setDispatchTiming('scheduled')}
                    className="text-blue-600"
                  />
                  <span>Schedule in Advance (भविष्य के लिए शेड्यूल करें)</span>
                </label>
              </div>

              {dispatchTiming === 'scheduled' && (
                <div className="pt-2">
                  <label className="block text-slate-600 font-bold text-[11px] mb-1">
                    Schedule Date & Time (ISO 8601 UTC)
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono text-slate-900 bg-white"
                  />
                </div>
              )}
            </div>

            {/* Email HTML Editor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-700 font-bold">
                  Email HTML Content (htmlContent) <span className="text-red-500">*</span>
                </label>
                <div className="text-[11px] text-slate-400 font-normal">
                  Standard HTML supported
                </div>
              </div>
              <textarea
                rows={7}
                required
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            {/* Submit Dispatch Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Processing Campaign...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>
                      {dispatchTiming === 'immediate'
                        ? '🚀 Dispatch Campaign via Brevo'
                        : '🕒 Schedule Campaign via Brevo'}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyCurl}
                className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedCurl ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-600" />}
                <span>{copiedCurl ? 'Copied cURL' : 'Copy cURL'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live HTML Preview & Exact cURL (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Preview / cURL Tabs */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPreviewTab('preview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    previewTab === 'preview'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Email Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewTab('curl')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    previewTab === 'curl'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Code className="h-3.5 w-3.5" />
                  <span>Exact cURL</span>
                </button>
              </div>

              <span className="text-[10px] text-slate-400 font-medium">
                {previewTab === 'preview' ? 'Visual Rendering' : 'API v3 Payload'}
              </span>
            </div>

            {previewTab === 'preview' ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs space-y-1">
                  <div className="text-slate-500 text-[11px]">
                    <strong>From:</strong> {senderName} &lt;{senderEmail}&gt;
                  </div>
                  <div className="text-slate-900 font-bold">
                    <strong>Subject:</strong> {subject}
                  </div>
                </div>

                {/* Sandboxed HTML View */}
                <div className="border border-slate-200 rounded-2xl p-3 bg-slate-100/50 max-h-[360px] overflow-y-auto">
                  <div
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                    className="prose max-w-none text-xs"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <pre className="p-3.5 bg-slate-950 text-slate-200 rounded-2xl text-[11px] font-mono leading-relaxed overflow-x-auto max-h-[360px] custom-scrollbar border border-slate-800">
                    {generatedCurl}
                  </pre>
                  <button
                    type="button"
                    onClick={handleCopyCurl}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                    title="Copy command"
                  >
                    {copiedCurl ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Registered Member Email Directory Preview */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-blue-600" />
                <span>Recipient Member List ({registeredUsers.length})</span>
              </h4>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            <div className="space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
              {registeredUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="truncate mr-2">
                    <div className="font-bold text-slate-900 truncate">{u.fullName}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{u.email}</div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                    {u.id}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Campaign History Log */}
          {campaignsList.length > 0 && (
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-purple-600" />
                <span>Recent Campaigns ({campaignsList.length})</span>
              </h4>
              <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                {campaignsList.map((c, i) => (
                  <div
                    key={c.id || i}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 truncate max-w-[200px]">
                        {c.name || c.subject}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-blue-100 text-blue-700">
                        {c.status || 'Sent'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-2">
                      <span>ID: #{c.id}</span>
                      {c.createdAt && <span>• {new Date(c.createdAt).toLocaleDateString()}</span>}
                      {c.simulated && <span className="text-amber-600 font-bold">• Simulated Log</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
