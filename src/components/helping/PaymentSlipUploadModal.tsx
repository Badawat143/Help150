import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  X,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Trash2,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { db } from '../../services/db';

interface PaymentSlipUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  recipientName: string;
  amount: number;
  initialUtr?: string;
  onSubmit: (params: {
    referenceNumber: string;
    notes?: string;
    slipDataUrl?: string;
    slipFileName?: string;
    slipFileType?: string;
    slipFileSize?: number;
  }) => Promise<void>;
}

export const PaymentSlipUploadModal: React.FC<PaymentSlipUploadModalProps> = ({
  isOpen,
  onClose,
  requestId,
  recipientName,
  amount,
  initialUtr = '',
  onSubmit,
}) => {
  const state = db.getState();
  const maxMb = state.settings.maxSlipFileSizeMb || 5;

  const [utrNumber, setUtrNumber] = useState(initialUtr);
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validateAndProcessFile = (selectedFile: File) => {
    setErrorMessage(null);

    // Allowed types: JPG, JPEG, PNG, PDF
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf',
    ];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];

    const fileExt = '.' + (selectedFile.name.split('.').pop() || '').toLowerCase();
    const isAllowedExt = allowedExtensions.includes(fileExt);
    const isAllowedMime = allowedMimeTypes.includes(selectedFile.type.toLowerCase()) || isAllowedExt;

    // Disallow executable files explicitly
    const executableExts = ['.exe', '.bat', '.sh', '.bin', '.cmd', '.js', '.vbs', '.php'];
    if (executableExts.includes(fileExt)) {
      setErrorMessage('Security Alert: Executable script/binary files are strictly forbidden.');
      return false;
    }

    if (!isAllowedMime) {
      setErrorMessage('Invalid file format. Only JPG, JPEG, PNG, and PDF files are allowed.');
      return false;
    }

    // Size check
    if (selectedFile.size > maxMb * 1024 * 1024) {
      setErrorMessage(`File size (${(selectedFile.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowed limit of ${maxMb}MB.`);
      return false;
    }

    setFile(selectedFile);

    // Generate preview if image
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      // PDF or non-image
      setFilePreview(null);
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFilePreview(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUtr = utrNumber.trim();
    if (!cleanUtr) {
      setErrorMessage('Please enter the 12-digit UTR / UPI Transaction Reference Number');
      return;
    }

    if (cleanUtr.length < 8) {
      setErrorMessage('Please enter a valid Transaction Reference / UTR Number (at least 8 characters)');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    try {
      let dataUrl: string | undefined = undefined;

      if (file) {
        setUploadProgress(50);
        dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      setUploadProgress(85);

      await onSubmit({
        referenceNumber: cleanUtr,
        notes: notes.trim(),
        slipDataUrl: dataUrl,
        slipFileName: file?.name,
        slipFileType: file?.type || (file ? 'image/png' : undefined),
        slipFileSize: file?.size,
      });

      setUploadProgress(100);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit payment slip');
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl border border-rose-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header with Red + Blue Gradient Accent */}
        <div className="p-5 bg-gradient-to-r from-rose-950/80 via-slate-900 to-blue-950/80 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Upload Payment Slip</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {requestId}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Help Amount: <span className="text-emerald-400 font-bold">₹{amount}</span> to <span className="text-white font-medium">{recipientName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="h-8 w-8 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 🚦 TRAFFIC SIGNAL PREVIEW FOR CURRENT LINK */}
          <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center gap-2">
              <span className="text-lg select-none">🚦</span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <span>₹{amount} स्लिप स्टेटस:</span>
                <span className={`text-[11px] font-semibold ${file ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {file ? 'हरी लाइट ✅' : 'संतरी लाइट 🟠'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 shrink-0">
              <div
                className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-black border transition-all duration-300 ${
                  file
                    ? 'bg-emerald-500 border-emerald-200 text-white shadow-[0_0_10px_rgba(16,185,129,0.9)]'
                    : 'bg-amber-500 border-amber-300 text-slate-950 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse'
                }`}
              >
                {file ? '✅' : '🟠'}
              </div>
              <span className={`text-[11px] font-mono font-bold ${file ? 'text-emerald-300' : 'text-amber-300'}`}>
                ₹{amount}
              </span>
            </div>
          </div>

          {/* UTR Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>12-Digit Transaction Reference (UTR / UPI Ref) *</span>
              <span className="text-[10px] text-slate-400">Required for verification</span>
            </label>
            <input
              type="text"
              required
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              placeholder="e.g. 423901928301 or UPI-482019"
              className="w-full px-4 py-3 rounded-2xl bg-slate-950/70 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-mono tracking-wider transition"
            />
          </div>

          {/* File Upload Drop Area */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Payment Slip Document (JPG / PNG / PDF)</span>
              <span className="text-[10px] text-slate-400">Max size: {maxMb}MB</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange}
              className="hidden"
              id="slip-file-input"
            />

            {!file ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 rounded-2xl border-2 border-dashed transition cursor-pointer flex flex-col items-center justify-center text-center gap-2.5 ${
                  isDragging
                    ? 'border-rose-500 bg-rose-500/10'
                    : 'border-slate-700/80 bg-slate-950/50 hover:border-slate-600 hover:bg-slate-950/80'
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-blue-500/20 border border-slate-700 text-rose-400">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">
                    Click to browse or Drag & Drop slip
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports camera photos, screenshots, and bank PDF e-receipts
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    JPG
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    PNG
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    PDF
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {file.type.startsWith('image/') ? (
                      <ImageIcon className="h-5 w-5 text-rose-400 shrink-0" />
                    ) : (
                      <FileText className="h-5 w-5 text-blue-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {(file.size / 1024).toFixed(1)} KB • {file.type || 'Document'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {filePreview && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 max-h-48 bg-slate-900 flex items-center justify-center">
                    <img
                      src={filePreview}
                      alt="Payment Slip Preview"
                      className="max-h-48 w-auto object-contain"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Optional Remarks / Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid via GPay at 4:15 PM"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                <span>Uploading & linking to transaction...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-blue-500 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="p-3 rounded-2xl bg-blue-950/30 border border-blue-500/20 flex items-center gap-2 text-[11px] text-blue-300">
            <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0" />
            <span>Encrypted transmission. Duplicate UTRs or slips are prevented by server validation.</span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-blue-600 hover:from-rose-500 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-rose-900/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <span>Submitting Slip...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Submit Payment Slip</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
