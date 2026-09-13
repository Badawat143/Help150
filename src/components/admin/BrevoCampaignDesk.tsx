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
  Key,
  Server,
  AtSign,
} from 'lucide-react';
import { db } from '../../services/db';

interface BrevoCampaignDeskProps {
  onClose?: () => void;
  onToast: (text: string, type?: 'success' | 'error') => void;
}

/**
 * Robust JSON parser that handles non-JSON HTML error responses (e.g. 502/504 Bad Gateway,
 * proxy restart pages, or 404s) cleanly without throwing "Unexpected token 'T'".
 */
async function parseJsonResponse(resp: Response): Promise<any> {
  const text = await resp.text();
  try {
    return JSON.parse(text);
  } catch {
    if (!resp.ok) {
      const cleaned = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const snippet = cleaned.length > 120 ? cleaned.slice(0, 120) + '...' : cleaned;
      throw new Error(`Server returned HTTP ${resp.status} (${resp.statusText || 'Error'}): ${snippet || 'Server was busy or restarting. Please retry.'}`);
    }
    throw new Error('Received unexpected non-JSON response from server.');
  }
}

export const BrevoCampaignDesk: React.FC<BrevoCampaignDeskProps> = ({ onClose, onToast }) => {
  const state = db.getState();
  const registeredUsers = state.users.filter((u) => u.email && u.email.includes('@'));

  // Active Main Desk Tab
  const [activeTab, setActiveTab] = useState<'direct_mail' | 'campaign' | 'smtp_config'>('direct_mail');

  // Connection & Account state
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Stored Brevo API Key & SMTP Settings (Saved in localStorage for easy testing)
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem('help150_brevo_api_key') || '';
  });

  const [smtpHost, setSmtpHost] = useState<string>(() => {
    return localStorage.getItem('help150_smtp_host') || 'smtp-relay.brevo.com';
  });
  const [smtpPort, setSmtpPort] = useState<number>(() => {
    return Number(localStorage.getItem('help150_smtp_port')) || 587;
  });
  const [smtpUser, setSmtpUser] = useState<string>(() => {
    return localStorage.getItem('help150_smtp_user') || 'b65b27001@smtp-brevo.com';
  });
  const [smtpPass, setSmtpPass] = useState<string>(() => {
    const saved = localStorage.getItem('help150_smtp_pass');
    // If the saved value is the truncated test snippet 'CUtThC', ignore it so user isn't stuck with invalid creds
    return saved && saved !== 'CUtThC' ? saved : '';
  });
  const [smtpSender, setSmtpSender] = useState<string>(() => {
    return localStorage.getItem('help150_smtp_from') || 'HELP150 Community <admin@help150.org>';
  });

  // SMTP Verification state
  const [isTestingSmtp, setIsTestingSmtp] = useState<boolean>(false);
  const [smtpVerifyResult, setSmtpVerifyResult] = useState<{ success: boolean; message: string } | null>(null);

  // Direct Mail State (Requested: Send mail help150@outlook.com)
  const [directTo, setDirectTo] = useState<string>('help150@outlook.com');
  const [directSubject, setDirectSubject] = useState<string>('HELP150 Community: Important Member Notice');
  const [directSenderName, setDirectSenderName] = useState<string>('HELP150 Community');
  const [directSenderEmail, setDirectSenderEmail] = useState<string>('admin@help150.org');
  const [directMethod, setDirectMethod] = useState<'brevo_api' | 'smtp_relay'>('smtp_relay');
  const [directHtml, setDirectHtml] = useState<string>(
    `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h1 style="color: #1e3a8a; margin: 0; font-size: 24px;">HELP150 Community</h1>
    <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Together We Grow • Peer-to-Peer Assistance</p>
  </div>
  <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
  <h2 style="color: #0f172a; font-size: 18px;">Hello help150@outlook.com,</h2>
  <p style="color: #334155; line-height: 1.6; font-size: 14px;">
    This is an official communication from the HELP150 Community platform.
  </p>
  <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #3b82f6;">
    <p style="margin: 0; color: #1e293b; font-weight: bold; font-size: 14px;">📩 Message Notification:</p>
    <p style="margin: 6px 0 0 0; color: #475569; font-size: 13px;">Your email dispatch test to help150@outlook.com was triggered successfully from the HELP150 Admin Control Desk.</p>
  </div>
  <p style="color: #334155; line-height: 1.6; font-size: 14px;">
    For support or inquiries, please contact our community desk at support@help150.org.
  </p>
  <div style="text-align: center; margin-top: 28px;">
    <a href="https://help150.org" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Visit Member Portal</a>
  </div>
  <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
  <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
    HELP150 Community System • Email: support@help150.org
  </p>
</div>`
  );

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

  const [previewTab, setPreviewTab] = useState<'preview' | 'curl'>('preview');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [lastSentResult, setLastSentResult] = useState<any>(null);

  // Campaign & Delivery History
  const [campaignsList, setCampaignsList] = useState<any[]>([]);

  // Fetch Brevo API status
  const checkStatus = async (overrideKey?: string) => {
    setLoadingStatus(true);
    setErrorMessage(null);
    try {
      const keyToUse = overrideKey !== undefined ? overrideKey : customApiKey;
      const headers: Record<string, string> = {};
      if (keyToUse) {
        headers['x-brevo-api-key'] = keyToUse;
      }

      const resp = await fetch('/api/brevo/status', { headers });
      const data = await parseJsonResponse(resp);
      setIsConfigured(Boolean(data.configured && data.valid));
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

  // Fetch Existing Campaigns / Sent Logs
  const loadCampaigns = async () => {
    try {
      const headers: Record<string, string> = {};
      if (customApiKey) {
        headers['x-brevo-api-key'] = customApiKey;
      }
      const resp = await fetch('/api/brevo/campaigns', { headers });
      const data = await parseJsonResponse(resp);
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

  // Save Custom Brevo Key
  const handleSaveApiKey = () => {
    localStorage.setItem('help150_brevo_api_key', customApiKey.trim());
    onToast('Brevo API key saved locally!');
    checkStatus(customApiKey.trim());
  };

  // Save SMTP Settings
  const handleSaveSmtpSettings = () => {
    localStorage.setItem('help150_smtp_host', smtpHost.trim());
    localStorage.setItem('help150_smtp_port', String(smtpPort));
    localStorage.setItem('help150_smtp_user', smtpUser.trim());
    localStorage.setItem('help150_smtp_pass', smtpPass.trim());
    localStorage.setItem('help150_smtp_from', smtpSender.trim());
    onToast('SMTP configuration saved locally!');
  };

  // Preset Presets
  const applySmtpPreset = (preset: 'brevo' | 'outlook' | 'gmail') => {
    if (preset === 'brevo') {
      setSmtpHost('smtp-relay.brevo.com');
      setSmtpPort(587);
      setSmtpUser('b65b27001@smtp-brevo.com');
      setSmtpSender('HELP150 Community <admin@help150.org>');
    } else if (preset === 'outlook') {
      setSmtpHost('smtp-mail.outlook.com');
      setSmtpPort(587);
      setSmtpUser('help150@outlook.com');
      setSmtpSender('help150@outlook.com');
    } else if (preset === 'gmail') {
      setSmtpHost('smtp.gmail.com');
      setSmtpPort(465);
      setSmtpSender('admin@help150.org');
    }
    onToast(`Preset loaded for ${preset.toUpperCase()}`);
  };

  // Test SMTP Connection with Brevo / Provider
  const handleVerifySmtp = async () => {
    setIsTestingSmtp(true);
    setSmtpVerifyResult(null);

    const hostClean = smtpHost.trim();
    const userClean = smtpUser.trim();
    const passClean = smtpPass.trim();

    if (!userClean || !passClean) {
      const msg = 'कृपया SMTP User और Password/Master Key दोनों भरें।';
      setSmtpVerifyResult({ success: false, message: msg });
      onToast(msg, 'error');
      setIsTestingSmtp(false);
      return;
    }

    if (hostClean.includes('brevo') && passClean.length < 15) {
      const msg = '⚠️ अधूरा Brevo SMTP Key (' + passClean.length + ' अक्षरों का दर्ज है): Brevo SMTP Relay के लिए Brevo Dashboard > Settings > "SMTP & API" > "SMTP Keys" से जनरेट किया गया Master SMTP Key (जो 60+ अक्षरों का xsmtpsib-... से शुरू होता है) आवश्यक है। अधूरा पासवर्ड काम नहीं करेगा।';
      setSmtpVerifyResult({ success: false, message: msg });
      onToast('Brevo SMTP Key अधूरा है। कृपया पूरा Key दर्ज करें।', 'error');
      setIsTestingSmtp(false);
      return;
    }

    try {
      const resp = await fetch('/api/smtp/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          host: hostClean,
          port: smtpPort,
          user: userClean,
          pass: passClean,
        }),
      });
      const data = await parseJsonResponse(resp);
      if (data.success) {
        setSmtpVerifyResult({ success: true, message: data.message });
        onToast(data.message);
      } else {
        const errorDesc = data.error + (data.details ? ` (${data.details})` : '');
        setSmtpVerifyResult({
          success: false,
          message: errorDesc,
        });
        onToast(data.error || 'SMTP verification failed', 'error');
      }
    } catch (err: any) {
      setSmtpVerifyResult({
        success: false,
        message: err.message || 'Failed to connect to SMTP server',
      });
      onToast(err.message || 'SMTP Connection Error', 'error');
    } finally {
      setIsTestingSmtp(false);
    }
  };

  // Direct Mail Send Handler (For help150@outlook.com)
  const handleSendDirectMail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directTo.trim() || !directSubject.trim() || !directHtml.trim()) {
      onToast('Please provide recipient email, subject, and message content', 'error');
      return;
    }

    setIsSubmitting(true);
    setLastSentResult(null);

    try {
      if (directMethod === 'brevo_api') {
        // Send via Brevo API /v3/smtp/email
        const headers: Record<string, string> = { 'content-type': 'application/json' };
        if (customApiKey) {
          headers['x-brevo-api-key'] = customApiKey.trim();
        }

        const resp = await fetch('/api/brevo/send-broadcast', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            subject: directSubject,
            htmlContent: directHtml,
            sender: { name: directSenderName, email: directSenderEmail },
            recipientEmails: [directTo.trim()],
            apiKey: customApiKey.trim() || undefined,
          }),
        });

        const data = await parseJsonResponse(resp);
        setLastSentResult(data);

        if (resp.ok && data.success) {
          onToast(data.message || `Mail dispatched to ${directTo}!`);
          loadCampaigns();
        } else {
          onToast(data.error || 'Failed to dispatch email via Brevo', 'error');
        }
      } else {
        // Send via Standard SMTP Relay (Nodemailer)
        const resp = await fetch('/api/smtp/send', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            host: smtpHost,
            port: smtpPort,
            user: smtpUser || undefined,
            pass: smtpPass || undefined,
            from: smtpSender || `"${directSenderName}" <${directSenderEmail}>`,
            to: directTo.trim(),
            subject: directSubject,
            html: directHtml,
          }),
        });

        const data = await parseJsonResponse(resp);
        setLastSentResult(data);

        if (resp.ok && data.success) {
          onToast(data.message || `Mail dispatched to ${directTo} via SMTP!`);
          loadCampaigns();
        } else {
          onToast(data.error || 'SMTP dispatch failed', 'error');
        }
      }
    } catch (err: any) {
      onToast(err.message || 'Error executing email send', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Full Campaign Send Handler
  const handleDispatchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim() || !subject.trim() || !directHtml.trim()) {
      onToast('Please provide campaign name, subject, and content', 'error');
      return;
    }

    setIsSubmitting(true);
    setLastSentResult(null);

    const parsedListIds = listIdsInput
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));

    try {
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (customApiKey) {
        headers['x-brevo-api-key'] = customApiKey.trim();
      }

      if (recipientMode === 'all_members') {
        const resp = await fetch('/api/brevo/send-broadcast', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            subject,
            htmlContent: directHtml,
            sender: { name: senderName, email: senderEmail },
            recipientEmails: registeredUsers.map((u) => u.email),
            apiKey: customApiKey.trim() || undefined,
          }),
        });
        const data = await parseJsonResponse(resp);
        setLastSentResult(data);

        if (resp.ok && data.success) {
          onToast(data.message || `Campaign broadcasted to ${data.recipientCount} members!`);
          loadCampaigns();
        } else {
          onToast(data.error || 'Failed to dispatch broadcast', 'error');
        }
      } else {
        const payload: any = {
          name: campaignName,
          subject,
          sender: { name: senderName, email: senderEmail },
          type: campaignType,
          htmlContent: directHtml,
          recipients: { listIds: parsedListIds.length > 0 ? parsedListIds : [2] },
          sendNow: dispatchTiming === 'immediate',
          apiKey: customApiKey.trim() || undefined,
        };

        if (dispatchTiming === 'scheduled') {
          payload.scheduledAt = new Date(scheduledAt).toISOString();
        }

        const resp = await fetch('/api/brevo/campaign', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
        const data = await parseJsonResponse(resp);
        setLastSentResult(data);

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

  const generatedCurl = `curl -X POST 'https://api.brevo.com/v3/smtp/email' \\
  -H 'accept: application/json' \\
  -H 'api-key: ${customApiKey || 'YOUR_BREVO_API_KEY'}' \\
  -H 'content-type: application/json' \\
  -d '{
    "sender": {
      "name": "${directSenderName.replace(/"/g, '\\"')}",
      "email": "${directSenderEmail}"
    },
    "to": [
      {
        "email": "${directTo.trim()}"
      }
    ],
    "subject": "${directSubject.replace(/"/g, '\\"')}",
    "htmlContent": "${directHtml.replace(/\n/g, '').replace(/"/g, '\\"')}"
  }'`;

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
                  Email & SMTP Dispatch Desk
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold">
                  Brevo & SMTP Relay
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Send single test emails (e.g. to <strong>help150@outlook.com</strong>), manage Brevo v3 campaigns, and configure SMTP Relay.
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
              <span>Status Check</span>
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

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('direct_mail')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'direct_mail'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send Direct Mail (help150@outlook.com)</span>
          </button>

          <button
            onClick={() => setActiveTab('campaign')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'campaign'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Brevo Email Campaign (Multi-Member)</span>
          </button>

          <button
            onClick={() => setActiveTab('smtp_config')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'smtp_config'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            <span>Brevo Key & SMTP Settings</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SEND DIRECT MAIL (SPECIFICALLY FOR help150@outlook.com) */}
      {activeTab === 'direct_mail' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Dispatch Form (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 font-heading flex items-center gap-2">
                  <span>Send Mail Directly</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    1-Click Dispatch
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Send immediate notifications, OTPs, or test emails to any recipient address.
                </p>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDirectTo('help150@outlook.com')}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-mono font-bold transition cursor-pointer"
                >
                  help150@outlook.com
                </button>
                <button
                  type="button"
                  onClick={() => setDirectTo('ashuk2968@gmail.com')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono font-bold transition cursor-pointer"
                >
                  Admin Email
                </button>
              </div>
            </div>

            <form onSubmit={handleSendDirectMail} className="space-y-4 text-xs font-semibold text-slate-700">
              {/* Recipient Address */}
              <div>
                <label className="block text-slate-800 font-bold mb-1">
                  Recipient Email (प्राप्तकर्ता ईमेल) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={directTo}
                    onChange={(e) => setDirectTo(e.target.value)}
                    placeholder="help150@outlook.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Dispatch Method Selection */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-slate-800 font-bold text-[11px]">
                  Sending Protocol (भेजने का माध्यम)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDirectMethod('brevo_api')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                      directMethod === 'brevo_api'
                        ? 'bg-blue-50 border-blue-500 text-blue-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="font-bold">Brevo REST API (v3)</div>
                      <div className="text-[10px] text-slate-500">Fast HTTPS /v3/smtp/email</div>
                    </div>
                    {directMethod === 'brevo_api' && <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDirectMethod('smtp_relay')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                      directMethod === 'smtp_relay'
                        ? 'bg-blue-50 border-blue-500 text-blue-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="font-bold">Standard SMTP Relay</div>
                      <div className="text-[10px] text-slate-500">Port 587 (Nodemailer)</div>
                    </div>
                    {directMethod === 'smtp_relay' && <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />}
                  </button>
                </div>

                {directMethod === 'smtp_relay' && (
                  <div className="mt-2 p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 truncate">
                      <Server className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                      <span className="text-slate-600">Relay:</span>
                      <code className="font-mono text-indigo-900 font-bold">{smtpHost}:{smtpPort}</code>
                      <span className="text-slate-400">|</span>
                      <span className="text-slate-600">Login:</span>
                      <code className="font-mono text-indigo-900 font-bold truncate">{smtpUser || 'b65b27001@smtp-brevo.com'}</code>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('smtp_config')}
                      className="text-indigo-600 hover:text-indigo-800 font-bold text-[10px] underline ml-2 shrink-0"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-slate-800 font-bold mb-1">
                  Subject Line (ईमेल विषय) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={directSubject}
                  onChange={(e) => setDirectSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sender Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Sender Name</label>
                  <input
                    type="text"
                    required
                    value={directSenderName}
                    onChange={(e) => setDirectSenderName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Sender Email</label>
                  <input
                    type="email"
                    required
                    value={directSenderEmail}
                    onChange={(e) => setDirectSenderEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* HTML Content */}
              <div>
                <label className="block text-slate-800 font-bold mb-1">
                  HTML Body (संदेश सामग्री)
                </label>
                <textarea
                  rows={6}
                  required
                  value={directHtml}
                  onChange={(e) => setDirectHtml(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>

              {/* Send Button */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Sending to {directTo}...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>🚀 Send Mail to {directTo}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCopyCurl}
                  className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedCurl ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-600" />}
                  <span>Copy cURL</span>
                </button>
              </div>
            </form>

            {/* Last Sent Result Feedback Box */}
            {lastSentResult && (
              <div
                className={`p-4 rounded-2xl border text-xs space-y-1 ${
                  lastSentResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  {lastSentResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  )}
                  <span>{lastSentResult.message || (lastSentResult.success ? 'Email processed successfully!' : lastSentResult.error)}</span>
                </div>
                {lastSentResult.messageId && (
                  <div className="text-[11px] font-mono text-emerald-700">
                    Message ID: {lastSentResult.messageId}
                  </div>
                )}
                {lastSentResult.simulated && (
                  <div className="text-[11px] text-amber-700">
                    ℹ️ Note: Recorded in system delivery log. To deliver live into the recipient's inbox, provide valid Brevo API key or SMTP password.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Live Preview & Details (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* HTML Preview Card */}
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
                    <span>Live Preview</span>
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

                <span className="text-[10px] text-slate-400 font-mono">
                  {directTo}
                </span>
              </div>

              {previewTab === 'preview' ? (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs space-y-1">
                    <div className="text-slate-500 text-[11px]">
                      <strong>To:</strong> {directTo}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      <strong>From:</strong> {directSenderName} &lt;{directSenderEmail}&gt;
                    </div>
                    <div className="text-slate-900 font-bold">
                      <strong>Subject:</strong> {directSubject}
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-2xl p-3 bg-slate-100/50 max-h-[340px] overflow-y-auto custom-scrollbar">
                    <div
                      dangerouslySetInnerHTML={{ __html: directHtml }}
                      className="prose max-w-none text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <pre className="p-3.5 bg-slate-950 text-slate-200 rounded-2xl text-[11px] font-mono leading-relaxed overflow-x-auto max-h-[340px] custom-scrollbar border border-slate-800">
                      {generatedCurl}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Delivery Log */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
                <span>Recent Dispatch Activity</span>
              </h4>
              <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                {campaignsList.length > 0 ? (
                  campaignsList.map((c, i) => (
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
                        {c.recipient && <span>To: {c.recipient}</span>}
                        {c.createdAt && <span>• {new Date(c.createdAt).toLocaleTimeString()}</span>}
                        {c.simulated && <span className="text-amber-600 font-bold">• System Log</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 text-center py-4">
                    No dispatch history recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BREVO CAMPAIGN BUILDER (MULTI-MEMBER) */}
      {activeTab === 'campaign' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-5">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 font-heading">
                Compose Brevo Email Campaign
              </h3>
              <p className="text-xs text-slate-500">
                Define campaign payload adhering to Brevo v3 API (/v3/emailCampaigns).
              </p>
            </div>

            <form onSubmit={handleDispatchCampaign} className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-slate-800 font-bold mb-1">
                  Campaign Name (अभियान का नाम) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">
                  Subject Line <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Sender Name</label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Sender Email</label>
                  <input
                    type="email"
                    required
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Recipients Selection */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="block text-slate-800 font-bold">Target Recipients</label>
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

              {/* Timing */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-slate-800 font-bold">Dispatch Schedule</label>
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
                    <span>Schedule in Advance</span>
                  </label>
                </div>
                {dispatchTiming === 'scheduled' && (
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono text-slate-900 bg-white"
                  />
                )}
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Email HTML Body</label>
                <textarea
                  rows={6}
                  required
                  value={directHtml}
                  onChange={(e) => setDirectHtml(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 bg-slate-50/50"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
            </form>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-blue-600" />
                <span>Active Member Email Directory ({registeredUsers.length})</span>
              </h4>
              <div className="space-y-1.5 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
                {registeredUsers.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      setDirectTo(u.email);
                      setActiveTab('direct_mail');
                      onToast(`Selected ${u.email}`);
                    }}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 text-xs cursor-pointer transition"
                  >
                    <div className="truncate mr-2">
                      <div className="font-bold text-slate-900 truncate">{u.fullName}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">{u.email}</div>
                    </div>
                    <span className="text-[9px] font-bold text-blue-600 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                      Select
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BREVO API KEY & SMTP CONFIGURATION */}
      {activeTab === 'smtp_config' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Brevo API Key Setup */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900 font-heading">
                  Brevo v3 API Key Setup
                </h3>
              </div>
              <a
                href="https://app.brevo.com/settings/keys/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-bold"
              >
                <span>Get API Key</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <p className="text-xs text-slate-500">
              Paste your official Brevo v3 API key (starts with <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">xkeysib-</code>). It will be saved in your session for live dispatches.
            </p>

            <div className="space-y-3 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-slate-800 font-bold mb-1">
                  Brevo API v3 Key
                </label>
                <input
                  type="password"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="xkeysib-..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveApiKey}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>Save & Test Brevo Connection</span>
              </button>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800">Connection Status:</div>
                <div className="flex items-center gap-2">
                  {isConfigured ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Verified Active Brevo Account
                    </span>
                  ) : (
                    <span className="text-amber-700 font-bold flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" /> {errorMessage || 'Waiting for valid key verification'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Standard SMTP Relay Setup (Nodemailer) */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900 font-heading">
                  Standard SMTP Relay Setup
                </h3>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => applySmtpPreset('brevo')}
                  className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold"
                >
                  Brevo
                </button>
                <button
                  type="button"
                  onClick={() => applySmtpPreset('outlook')}
                  className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold"
                >
                  Outlook
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Configure SMTP Host, Port, and Login for direct server-to-server mail transmission.
            </p>

            <div className="space-y-3 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-slate-800 font-bold mb-1">SMTP Host</label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp-relay.brevo.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold mb-1">Port</label>
                  <input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    placeholder="587"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">SMTP User / Username</label>
                <input
                  type="text"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="e.g. ashuk2968@gmail.com or help150@outlook.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-800 font-bold">SMTP Password / Master Key</label>
                  {smtpHost.includes('brevo') && (
                    <a
                      href="https://app.brevo.com/settings/keys/smtp"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-bold"
                    >
                      <span>Generate Brevo Key</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder={smtpHost.includes('brevo') ? 'xsmtpsib-...' : 'SMTP Password or App Password'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {smtpHost.includes('brevo') && smtpPass.length > 0 && (
                  <div className="mt-1">
                    {smtpPass.length < 20 ? (
                      <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0 text-amber-600" />
                        <span>अधूरा Brevo Key ({smtpPass.length} अक्षर)। Brevo SMTP Key सामान्यतः 60+ अक्षरों का होता है (starts with xsmtpsib-)।</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
                        <span>Valid key length ({smtpPass.length} characters)</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Brevo SMTP Key Helper Box */}
              {smtpHost.includes('brevo') && (
                <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-xs space-y-1.5 text-blue-950">
                  <div className="font-bold flex items-center gap-1.5 text-blue-900">
                    <Key className="h-3.5 w-3.5 text-blue-600" />
                    <span>Brevo Master SMTP Key कैसे प्राप्त करें:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-blue-800 leading-relaxed pl-1">
                    <li>
                      <strong>app.brevo.com</strong> में लॉगिन करें।
                    </li>
                    <li>
                      ऊपर दाएँ मेन्यू में <strong>Settings</strong> &gt; <strong>SMTP &amp; API</strong> खोलें।
                    </li>
                    <li>
                      <strong>SMTP</strong> टैब में <strong>"Generate a new SMTP key"</strong> पर क्लिक करें।
                    </li>
                    <li>
                      जो 60+ अक्षरों की Key (उदा. <code className="font-mono bg-blue-100 px-1 py-0.5 rounded">xsmtpsib-...</code>) मिले, उसे कॉपी करके यहाँ पेस्ट करें।
                    </li>
                  </ol>
                  <div className="text-[10px] text-blue-600 pt-0.5">
                    💡 <em>नोट: 'CUtThC' जैसा 6-अक्षरों का पासवर्ड काम नहीं करेगा, पूरा जनरेटेड Key आवश्यक है।</em>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-800 font-bold mb-1">From Header</label>
                <input
                  type="text"
                  value={smtpSender}
                  onChange={(e) => setSmtpSender(e.target.value)}
                  placeholder='HELP150 Community <admin@help150.org>'
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  disabled={isTestingSmtp}
                  onClick={handleVerifySmtp}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isTestingSmtp ? 'animate-spin' : ''}`} />
                  <span>{isTestingSmtp ? 'Verifying...' : 'Test Connection'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveSmtpSettings}
                  className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>Save Settings</span>
                </button>
              </div>

              {smtpVerifyResult && (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    smtpVerifyResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {smtpVerifyResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                    )}
                    <span>{smtpVerifyResult.success ? 'SMTP Connection Verified!' : 'SMTP Authentication Failed'}</span>
                  </div>
                  <div className="text-[11px] leading-relaxed">
                    {smtpVerifyResult.message}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
