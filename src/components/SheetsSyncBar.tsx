import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Copy,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { UniversityAdmissionData } from '../types/admission';
import { ExistingSpreadsheet, SpreadsheetSyncResult } from '../services/googleSheets';

interface SheetsSyncBarProps {
  data: UniversityAdmissionData;
  isAuthenticated: boolean;
  onInitiateCreateSheet: () => void;
  onInitiateAppendSheet: (sheetId: string) => void;
  isSyncing: boolean;
  syncResult: SpreadsheetSyncResult | null;
  existingSheets: ExistingSpreadsheet[];
  onLogin: () => void;
  lang: 'bn' | 'en';
}

export const SheetsSyncBar: React.FC<SheetsSyncBarProps> = ({
  data,
  isAuthenticated,
  onInitiateCreateSheet,
  onInitiateAppendSheet,
  isSyncing,
  syncResult,
  existingSheets,
  onLogin,
  lang,
}) => {
  const [selectedExistingSheetId, setSelectedExistingSheetId] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // CSV Export utility
  const handleDownloadCsv = () => {
    const headers = [
      'University',
      'Unit',
      'Faculty',
      'Application Start',
      'Application End',
      'Exam Date',
      'Fee (BDT)',
      'Eligibility',
      'Source',
    ];

    const rows = data.units.map((u) => [
      `"${(data.universityName || '').replace(/"/g, '""')}"`,
      `"${(u.unitName || '').replace(/"/g, '""')}"`,
      `"${(u.facultyOrGroup || '').replace(/"/g, '""')}"`,
      `"${(u.applicationStartDate || '').replace(/"/g, '""')}"`,
      `"${(u.applicationEndDate || '').replace(/"/g, '""')}"`,
      `"${(u.examDate || '').replace(/"/g, '""')}"`,
      u.feeAmount || 0,
      `"${(u.eligibilitySummary || '').replace(/"/g, '""')}"`,
      `"${(data.officialWebsite || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filename = `${data.universityName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_admission_${Date.now()}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy table to clipboard
  const handleCopyClipboard = () => {
    const lines = [
      ['Unit', 'Application Start', 'Application End', 'Exam Date', 'Fee (BDT)'].join('\t'),
      ...data.units.map((u) =>
        [u.unitName, u.applicationStartDate, u.applicationEndDate, u.examDate, u.feeAmount].join('\t')
      ),
    ].join('\n');

    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6 mb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-800" />
            <span>{lang === 'bn' ? 'গুগল শিট এক্সপোর্ট ও সিঙ্ক' : 'Google Sheets Sync & Export'}</span>
          </h3>
          <p className="text-xs text-slate-700 mt-0.5">
            {lang === 'bn'
              ? 'নিচের বাটনে চাপ দিলে সরাসরি আপনার গুগল অ্যাকাউন্টে নতুন শিট তৈরি হয়ে তথ্য সেভ হবে'
              : 'Write admission data directly to your personal Google Drive or download a CSV'}
          </p>
        </div>

        {/* Local Exports */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyClipboard}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Copy Table"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied!') : (lang === 'bn' ? 'টেবিল কপি করুন' : 'Copy')}</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>{lang === 'bn' ? 'CSV ফাইল ডাউনলোড' : 'Download CSV'}</span>
          </button>
        </div>
      </div>

      {/* Sync State Display (If already synced) */}
      {syncResult && (
        <div className="mt-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-800 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-950 block">
                {lang === 'bn' ? 'গুগল শিট সিঙ্ক সম্পন্ন (ডুপ্লিকেট প্রতিরোধ সক্রিয়)!' : 'Synced to Google Sheets (Duplicate-Protected)!'}
              </span>
              <span className="text-xs text-emerald-900 block font-medium">
                {syncResult.message || `${syncResult.title} (${syncResult.rowsAdded} টি নতুন যোগ, ${syncResult.rowsUpdated || 0} টি আপডেট, ${syncResult.duplicatesSkipped || 0} টি ডুপ্লিকেট বাদ)`}
              </span>
            </div>
          </div>

          <a
            href={syncResult.spreadsheetUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-950 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
          >
            <span>{lang === 'bn' ? 'গুগল শিটে দেখুন' : 'Open in Google Sheets'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Primary Google Sheets Action Bar */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Action 1: Create New Sheet */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
              <Plus className="w-4 h-4 text-emerald-800" />
              <span>{lang === 'bn' ? 'অপশন ১: নতুন স্প্রেডশিট তৈরি করুন' : 'Option 1: Create New Spreadsheet'}</span>
            </div>
            <p className="text-xs text-slate-700 mb-4 leading-relaxed">
              {lang === 'bn'
                ? `"${data.universityName} Admission Tracker" নামে গুগল ড্রাইভে একটি সাজানো শিট স্বয়ংক্রিয় তৈরি হবে।`
                : `Creates a formatted spreadsheet titled "${data.universityName} Admission Tracker" with frozen headers.`}
            </p>
          </div>

          {isAuthenticated ? (
            <button
              onClick={onInitiateCreateSheet}
              disabled={isSyncing || data.units.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg shadow-xs transition-all"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{lang === 'bn' ? 'শিট তৈরি হচ্ছে...' : 'Creating Google Sheet...'}</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'নতুন গুগল শিট তৈরি ও সিঙ্ক করুন' : 'Create & Sync New Google Sheet'}</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onLogin}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-all"
            >
              <span>{lang === 'bn' ? 'গুগল সাইন ইন করে শিট তৈরি করুন' : 'Sign in to Google to Create Sheet'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action 2: Append to Existing Sheet */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              <span>{lang === 'bn' ? 'অপশন ২: বিদ্যমান শিটে যোগ করুন' : 'Option 2: Append to Existing Sheet'}</span>
            </div>
            <p className="text-xs text-slate-700 mb-3 leading-relaxed">
              {lang === 'bn'
                ? 'আপনার পূর্ববর্তী অ্যাডমিশন ট্র্যাকার বা যেকোনো গুগল শিটে নতুন তথ্য যোগ করুন।'
                : 'Append extracted rows to your existing admission tracker spreadsheet.'}
            </p>

            {isAuthenticated ? (
              <div className="mb-3">
                {existingSheets.length > 0 ? (
                  <select
                    value={selectedExistingSheetId}
                    onChange={(e) => setSelectedExistingSheetId(e.target.value)}
                    className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-emerald-600 mb-2"
                  >
                    <option value="">{lang === 'bn' ? '-- পূর্বের শিট নির্বাচন করুন --' : '-- Select from recent sheets --'}</option>
                    {existingSheets.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder={lang === 'bn' ? 'গুগল শিট আইডি বা লিংক পেস্ট করুন' : 'Paste Google Spreadsheet ID'}
                    value={selectedExistingSheetId}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val.includes('/d/')) {
                        val = val.split('/d/')[1].split('/')[0];
                      }
                      setSelectedExistingSheetId(val);
                    }}
                    className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-emerald-600 mb-2 font-mono"
                  />
                )}
              </div>
            ) : (
              <div className="p-2.5 bg-slate-100 rounded-lg text-xs text-slate-500 mb-3">
                {lang === 'bn' ? 'শিটের তালিকা পেতে প্রথমে গুগল সাইন ইন করুন।' : 'Sign in to access your Google Sheets.'}
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <button
              onClick={() => onInitiateAppendSheet(selectedExistingSheetId)}
              disabled={isSyncing || !selectedExistingSheetId || data.units.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg shadow-xs transition-all"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{lang === 'bn' ? 'যোগ হচ্ছে...' : 'Appending Rows...'}</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'নির্বাচিত শিটে যোগ করুন' : 'Append to Selected Sheet'}</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onLogin}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-all"
            >
              <span>{lang === 'bn' ? 'গুগল সাইন ইন' : 'Sign in with Google'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
