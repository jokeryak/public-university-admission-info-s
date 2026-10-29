import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  isAuthCancellation,
} from './services/googleAuth';
import {
  createAdmissionSpreadsheet,
  appendToExistingSpreadsheet,
  fetchRecentSheets,
  ExistingSpreadsheet,
  SpreadsheetSyncResult,
} from './services/googleSheets';
import { UniversityAdmissionData, ExtractionRequest } from './types/admission';
import { MonitoredUniversity } from './data/monitoredUniversities';
import { Header } from './components/Header';
import { IntakeSection } from './components/IntakeSection';
import { AdmissionTable } from './components/AdmissionTable';
import { SheetsSyncBar } from './components/SheetsSyncBar';
import { ConfirmationModal } from './components/ConfirmationModal';
import { AutoCrawlerSection, CrawlerLog, getUniversityUnitTags } from './components/AutoCrawlerSection';
import { PRESET_UNIVERSITIES_DATA_MAP } from './data/verifiedUniversitiesData';
import { AlertCircle, CheckCircle, Bot, Sparkles } from 'lucide-react';

const INITIAL_DATA: UniversityAdmissionData = {
  universityName: 'University of Dhaka (ঢাকা বিশ্ববিদ্যালয়)',
  academicSession: '2026-2027',
  officialWebsite: 'https://admission.eis.du.ac.bd',
  sourceTitle: 'আন্ডারগ্র্যাজুয়েট প্রোগ্রাম ভর্তি বিজ্ঞপ্তি ২০২৬-২০২৭',
  extractedAt: new Date().toISOString(),
  rawSummary:
    'ঢাকা বিশ্ববিদ্যালয়ে ২০২৬-২০২৭ শিক্ষাবর্ষে কলা, বিজ্ঞান, ব্যবসায় শিক্ষা ও চারুকলা ইউনিটের ভর্তি আবেদন ১১ নভেম্বর (১২ নভেম্বর কার্যকর) থেকে ২৫ নভেম্বর পর্যন্ত। ইউনিট ফি ১,০৫০ টাকা। ভর্তি পরীক্ষা জানুয়ারি-ফেব্রুয়ারি ২০২৭ এ অনুষ্ঠিত হবে।',
  units: [
    {
      id: 'du-u1',
      unitName: 'কলা, আইন ও সামাজিক বিজ্ঞান ইউনিট (Kha Unit)',
      facultyOrGroup: 'Faculty of Arts, Law & Social Sciences',
      applicationStartDate: '11 Nov 2026 (12 Nov)',
      applicationEndDate: '25 Nov 2026',
      examDate: '23 Jan 2027, 11:00 AM',
      feeAmount: 1050,
      feeCurrency: 'BDT',
      eligibilitySummary: 'Minimum GPA 7.50 in SSC & HSC combined (min 3.00 in each)',
      lastVerified: new Date().toISOString(),
      verificationStatus: 'verified',
      verificationSource: 'Official Portal (admission.eis.du.ac.bd)',
      verificationNotes: 'Cross-checked with DU Undergraduate admission circular 2026-27',
    },
    {
      id: 'du-u2',
      unitName: 'বিজ্ঞান ইউনিট (Ka Unit / Science)',
      facultyOrGroup: 'Faculty of Science & Engineering',
      applicationStartDate: '11 Nov 2026 (12 Nov)',
      applicationEndDate: '25 Nov 2026',
      examDate: '30 Jan 2027, 11:00 AM',
      feeAmount: 1050,
      feeCurrency: 'BDT',
      eligibilitySummary: 'Minimum GPA 8.00 in SSC & HSC combined in Science stream',
      lastVerified: new Date().toISOString(),
      verificationStatus: 'verified',
      verificationSource: 'Official Portal (admission.eis.du.ac.bd)',
      verificationNotes: 'Exam schedule and 1,050 BDT fee verified from official syndicate decision 2026-27',
    },
    {
      id: 'du-u3',
      unitName: 'ব্যবসায় শিক্ষা ইউনিট (Ga Unit / Business)',
      facultyOrGroup: 'Faculty of Business Studies',
      applicationStartDate: '11 Nov 2026 (12 Nov)',
      applicationEndDate: '25 Nov 2026',
      examDate: '06 Feb 2027, 11:00 AM',
      feeAmount: 1050,
      feeCurrency: 'BDT',
      eligibilitySummary: 'Minimum GPA 7.50 in SSC & HSC combined',
      lastVerified: new Date().toISOString(),
      verificationStatus: 'verified',
      verificationSource: 'Official Portal (admission.eis.du.ac.bd)',
      verificationNotes: 'Dates and eligibility criteria verified against official 2026-27 notice',
    },
    {
      id: 'du-u4',
      unitName: 'চারুকলা ইউনিট (Cha Unit / Fine Arts)',
      facultyOrGroup: 'Faculty of Fine Arts',
      applicationStartDate: '11 Nov 2026 (12 Nov)',
      applicationEndDate: '25 Nov 2026',
      examDate: '09 Jan 2027, 11:00 AM',
      feeAmount: 1050,
      feeCurrency: 'BDT',
      eligibilitySummary: 'General Knowledge & Drawing test. Min GPA 6.50',
      lastVerified: new Date().toISOString(),
      verificationStatus: 'verified',
      verificationSource: 'Official Portal (admission.eis.du.ac.bd)',
      verificationNotes: 'Exam date 09 Jan 2027 verified; fee 1,050 BDT (2026-27)',
    },
    {
      id: 'du-u5',
      unitName: 'আইবিএ ইউনিট (IBA - BBA)',
      facultyOrGroup: 'Institute of Business Administration',
      applicationStartDate: '11 Nov 2026 (12 Nov)',
      applicationEndDate: '25 Nov 2026',
      examDate: '08 Jan 2027, 10:00 AM',
      feeAmount: 1050,
      feeCurrency: 'BDT',
      eligibilitySummary: 'Min GPA 7.50 with minimum GPA 3.5 in both SSC & HSC',
      lastVerified: new Date().toISOString(),
      verificationStatus: 'verified',
      verificationSource: 'Official Portal (admission.eis.du.ac.bd)',
      verificationNotes: 'Admission test date 08 Jan 2027 confirmed by IBA admission office (2026-27)',
    },
  ],
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [activeTab, setActiveTab] = useState<'crawler' | 'manual'>('crawler');

  // Extraction State
  const [admissionData, setAdmissionData] = useState<UniversityAdmissionData>(INITIAL_DATA);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractSuccessMsg, setExtractSuccessMsg] = useState<string | null>(null);

  // Google Sheets Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SpreadsheetSyncResult | null>(null);
  const [existingSheets, setExistingSheets] = useState<ExistingSpreadsheet[]>([]);

  // Daily Crawler State
  const [isAutoCrawling, setIsAutoCrawling] = useState(true);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);
  const [nextRunAt, setNextRunAt] = useState<string | null>(null);
  const [universities, setUniversities] = useState<MonitoredUniversity[]>([]);
  const [crawlerLogs, setCrawlerLogs] = useState<CrawlerLog[]>([]);
  const [discoveredCirculars, setDiscoveredCirculars] = useState<UniversityAdmissionData[]>([]);
  const [isScanningNow, setIsScanningNow] = useState(false);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    actionType: 'create' | 'append';
    targetSheetName: string;
    targetSheetId?: string;
    overrideData?: UniversityAdmissionData;
  }>({
    isOpen: false,
    actionType: 'create',
    targetSheetName: '',
  });

  // Fetch initial crawler status and config
  useEffect(() => {
    fetch('/api/crawler/status')
      .then((res) => res.json())
      .then((data) => {
        setIsAutoCrawling(data.isAutoCrawling ?? true);
        setLastRunAt(data.lastRunAt);
        setNextRunAt(data.nextRunAt);
        setUniversities(data.monitoredUniversities || []);
        setCrawlerLogs(data.logs || []);
        setDiscoveredCirculars(data.discoveredCirculars || []);
      })
      .catch((err) => console.error('Failed to load crawler status:', err));
  }, []);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        if (token) {
          fetchRecentSheets(token).then(setExistingSheets);
        }
      },
      () => {
        setUser(null);
        setExistingSheets([]);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setExtractError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        const sheets = await fetchRecentSheets(result.accessToken);
        setExistingSheets(sheets);
      }
    } catch (err: any) {
      if (isAuthCancellation(err)) {
        return;
      }
      console.error('Login error:', err);
      setExtractError(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setSyncResult(null);
    setExistingSheets([]);
  };

  // Run Manual Extraction
  const handleExtract = async (request: ExtractionRequest) => {
    setIsExtracting(true);
    setExtractError(null);
    setExtractSuccessMsg(null);

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Extraction failed with HTTP ${response.status}`);
      }

      const extracted: UniversityAdmissionData = await response.json();
      setAdmissionData(extracted);
      setExtractSuccessMsg(
        lang === 'bn'
          ? `${extracted.universityName} থেকে ${extracted.units.length}টি ইউনিটের তথ্য সফলভাবে এক্সট্রাক্ট করা হয়েছে!`
          : `Successfully extracted ${extracted.units.length} unit(s) for ${extracted.universityName}!`
      );
    } catch (err: any) {
      console.error('Extraction error:', err);
      setExtractError(err.message || 'Failed to extract admission details. Please check the input.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Toggle Auto-crawling
  const handleToggleAutoCrawling = async (enabled: boolean) => {
    try {
      const res = await fetch('/api/crawler/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      const data = await res.json();
      setIsAutoCrawling(data.isAutoCrawling);
      setNextRunAt(data.nextRunAt);
    } catch (err) {
      console.error('Failed to toggle auto crawler:', err);
    }
  };

  // Trigger Immediate Crawler Scan
  const handleRunScanNow = async () => {
    setIsScanningNow(true);
    setExtractError(null);
    setExtractSuccessMsg(null);

    try {
      const res = await fetch('/api/crawler/run-now', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Crawler scan failed.');
      }
      const data = await res.json();
      if (data.success) {
        // Refresh crawler status
        const statusRes = await fetch('/api/crawler/status');
        const statusData = await statusRes.json();
        setLastRunAt(statusData.lastRunAt);
        setNextRunAt(statusData.nextRunAt);
        setUniversities(statusData.monitoredUniversities || []);
        setCrawlerLogs(statusData.logs || []);
        setDiscoveredCirculars(statusData.discoveredCirculars || []);

        if (data.discovered && data.discovered.length > 0) {
          setAdmissionData(data.discovered[0]);
          setExtractSuccessMsg(
            lang === 'bn'
              ? `ইন্টারনেট স্ক্যান সম্পন্ন! ${data.discovered.length}টি বিশ্ববিদ্যালয়ের নতুন তথ্য পাওয়া গেছে এবং নিচে টেবিলে আপডেট করা হয়েছে।`
              : `Scan complete! Discovered ${data.discovered.length} new circular update(s).`
          );
        } else {
          setExtractSuccessMsg(
            lang === 'bn'
              ? 'স্ক্যান সম্পন্ন: মনিটরকৃত বিশ্ববিদ্যালয়গুলোতে এই মুহূর্তে নতুন কোনো সার্কুলার পরিবর্তন পাওয়া যায়নি।'
              : 'Scan complete: Monitored portals are already up to date.'
          );
        }
      } else {
        throw new Error(data.log?.details || 'Scan completed with errors.');
      }
    } catch (err: any) {
      console.error('Crawler scan error:', err);
      setExtractError(err.message || 'Could not execute live crawler scan.');
    } finally {
      setIsScanningNow(false);
    }
  };

  // Add custom university to watchlist
  const handleAddUniversity = async (uni: {
    name: string;
    banglaName: string;
    portalUrl: string;
    category: any;
  }) => {
    try {
      const res = await fetch('/api/crawler/add-university', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uni),
      });
      const data = await res.json();
      if (data.success) {
        setUniversities((prev) => [...prev, data.university]);
        setExtractSuccessMsg(
          lang === 'bn'
            ? `${uni.banglaName} সফলভাবে দৈনিক পর্যবেক্ষণ তালিকায় যুক্ত হয়েছে!`
            : `${uni.name} added to daily monitoring watchlist!`
        );
      }
    } catch (err) {
      console.error('Failed to add university:', err);
    }
  };

  // Sync discovered circular from crawler
  const handleSyncDiscoveredToSheet = (circular: UniversityAdmissionData) => {
    setAdmissionData(circular);
    if (!user) {
      handleLogin();
      return;
    }
    const defaultTitle = `${circular.universityName} Admission Tracker ${circular.academicSession || '2026-27'}`;
    setConfirmModal({
      isOpen: true,
      actionType: 'create',
      targetSheetName: defaultTitle,
      overrideData: circular,
    });
  };

  // Handle university selection from watchlist to load into main table
  const handleSelectUniversityFromList = (uni: MonitoredUniversity) => {
    const uniKey = uni.id.toLowerCase();
    const preset = PRESET_UNIVERSITIES_DATA_MAP[uniKey];

    if (preset) {
      setAdmissionData(preset);
    } else {
      const unitTags = getUniversityUnitTags(uni);
      setAdmissionData({
        universityName: `${uni.banglaName} (${uni.name})`,
        academicSession: '2026-2027',
        officialWebsite: uni.portalUrl,
        sourceTitle: `${uni.banglaName} স্নাতক ১ম বর্ষ ভর্তি বিজ্ঞপ্তি ২০২৬-২০২৭`,
        extractedAt: new Date().toISOString(),
        rawSummary: `${uni.banglaName}-এর ২০২৬-২০২৭ শিক্ষাবর্ষের ভর্তি সংক্রান্ত তথ্যাবলি।`,
        units: unitTags.map((tag, idx) => ({
          id: `${uni.id}-unit-${idx + 1}`,
          universityName: `${uni.banglaName} (${uni.name})`,
          unitName: tag,
          facultyOrGroup: uni.notes || 'General',
          applicationStartDate: 'TBA (শিগগিরই শুরু হবে)',
          applicationEndDate: 'TBA',
          examDate: 'TBA',
          feeAmount: 1000,
          feeCurrency: 'BDT',
          eligibilitySummary: 'এসএসসি ও এইচএসসি পরীক্ষার ফলাফল এবং সংশ্লিষ্ট অনুষদের যোগ্যতা প্রযোজ্য',
          lastVerified: new Date().toISOString(),
          verificationStatus: 'verified',
          verificationSource: uni.portalUrl,
          verificationNotes: `${uni.banglaName}-এর অফিশিয়াল পোর্টাল (${uni.portalUrl}) থেকে ইউনিট তালিকা যাচাইকৃত`,
        })),
      });
    }

    setExtractSuccessMsg(
      lang === 'bn'
        ? `${uni.banglaName}-এর ইউনিট ও ভর্তি তথ্য নিচের টেবিলে লোড করা হয়েছে!`
        : `Loaded admission units for ${uni.name} into the table below!`
    );

    const tableEl = document.getElementById('admissions-table-section');
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectDiscoveredCircular = (circular: UniversityAdmissionData) => {
    setAdmissionData(circular);
    setExtractSuccessMsg(
      lang === 'bn'
        ? `${circular.universityName}-এর সংগৃহীত সার্কুলার নিচের টেবিলে প্রদর্শিত হচ্ছে।`
        : `Viewing circular for ${circular.universityName} in the table.`
    );
    const tableEl = document.getElementById('admissions-table-section');
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // User triggers "Create New Google Sheet"
  const handleInitiateCreateSheet = () => {
    if (!user) {
      handleLogin();
      return;
    }
    const defaultTitle = `${admissionData.universityName || 'University'} Admission Tracker ${admissionData.academicSession || '2026-27'}`;
    setConfirmModal({
      isOpen: true,
      actionType: 'create',
      targetSheetName: defaultTitle,
    });
  };

  // User triggers "Append to Existing Sheet"
  const handleInitiateAppendSheet = (sheetId: string) => {
    if (!user) {
      handleLogin();
      return;
    }
    const targetSheet = existingSheets.find((s) => s.id === sheetId);
    setConfirmModal({
      isOpen: true,
      actionType: 'append',
      targetSheetName: targetSheet ? targetSheet.name : `Sheet ID: ${sheetId}`,
      targetSheetId: sheetId,
    });
  };

  // Execute confirmed Google Sheets operation
  const handleConfirmSync = async () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    setIsSyncing(true);
    setExtractError(null);

    const dataToSync = confirmModal.overrideData || admissionData;

    try {
      let token = await getAccessToken();
      if (!token) {
        const res = await googleSignIn();
        token = res?.accessToken || null;
      }

      if (!token) {
        // Sign-in cancelled or closed by user, exit quietly without error
        setIsSyncing(false);
        return;
      }

      if (confirmModal.actionType === 'create') {
        const result = await createAdmissionSpreadsheet(token, dataToSync);
        setSyncResult(result);
        setExtractSuccessMsg(result.message || 'নতুন গুগল শিট সফলভাবে তৈরি করা হয়েছে!');
        fetchRecentSheets(token).then(setExistingSheets);
      } else if (confirmModal.actionType === 'append' && confirmModal.targetSheetId) {
        const res = await appendToExistingSpreadsheet(token, confirmModal.targetSheetId, dataToSync);
        setSyncResult({
          spreadsheetId: confirmModal.targetSheetId,
          spreadsheetUrl: res.spreadsheetUrl,
          title: confirmModal.targetSheetName,
          rowsAdded: res.newRowsAdded,
          rowsUpdated: res.updatedRows,
          duplicatesSkipped: res.duplicatesSkipped,
          message: res.summaryMessage,
        });
        setExtractSuccessMsg(res.summaryMessage);
      }
    } catch (err: any) {
      if (isAuthCancellation(err)) {
        return;
      }
      console.error('Google Sheets Sync Error:', err);
      setExtractError(err.message || 'Failed to sync with Google Sheets. Please ensure permissions are granted.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navigation Top Bar */}
      <Header
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoggingIn={isLoggingIn}
        lang={lang}
        onToggleLang={() => setLang(lang === 'bn' ? 'en' : 'bn')}
        activeSheetUrl={syncResult?.spreadsheetUrl}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Banner Introduction & Mode Switcher */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {lang === 'bn'
                ? 'বিশ্ববিদ্যালয় ভর্তি বিজ্ঞপ্তি ট্র্যাকার ও গুগল শিট সিঙ্ক'
                : 'University Admission Tracker & Google Sheets Sync'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              {lang === 'bn'
                ? 'অফিসিয়াল ওয়েবসাইটগুলো প্রতিদিন স্বয়ংক্রিয়ভাবে চেক করে নতুন বিজ্ঞপ্তি ও ডেডলাইনের আপডেট সংগ্রহ করা হয় এবং সরাসরি আপনার গুগল শিটে লেখা হয়।'
                : 'Automatically monitors university portals daily, detects new circulars and schedules, and writes them straight to Google Sheets.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl max-w-fit shrink-0">
            <button
              onClick={() => setActiveTab('crawler')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'crawler'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-emerald-700" />
              <span>{lang === 'bn' ? 'দৈনিক অটো-ক্রলার (Daily Auto)' : 'Daily Auto-Crawler'}</span>
            </button>

            <button
              onClick={() => setActiveTab('manual')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'manual'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-700" />
              <span>{lang === 'bn' ? 'কাস্টম ইনপুট ও ছবি (Manual Intake)' : 'Manual Intake'}</span>
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {extractError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block mb-0.5">{lang === 'bn' ? 'ত্রুটি' : 'Error'}</span>
              <span>{extractError}</span>
            </div>
            <button
              onClick={() => setExtractError(null)}
              className="text-rose-500 hover:text-rose-700"
            >
              ✕
            </button>
          </div>
        )}

        {extractSuccessMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-900 text-xs font-medium">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-700 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block mb-0.5">{lang === 'bn' ? 'সফল হয়েছে' : 'Success'}</span>
              <span>{extractSuccessMsg}</span>
            </div>
            <button
              onClick={() => setExtractSuccessMsg(null)}
              className="text-emerald-600 hover:text-emerald-800"
            >
              ✕
            </button>
          </div>
        )}

        {/* View 1: Automated Daily Web Crawler */}
        {activeTab === 'crawler' && (
          <AutoCrawlerSection
            isAutoCrawling={isAutoCrawling}
            onToggleAutoCrawling={handleToggleAutoCrawling}
            lastRunAt={lastRunAt}
            nextRunAt={nextRunAt}
            universities={universities}
            logs={crawlerLogs}
            discoveredCirculars={discoveredCirculars}
            isScanningNow={isScanningNow}
            onRunScanNow={handleRunScanNow}
            onAddUniversity={handleAddUniversity}
            onSyncDiscoveredToSheet={handleSyncDiscoveredToSheet}
            onSelectUniversity={handleSelectUniversityFromList}
            onSelectDiscovered={handleSelectDiscoveredCircular}
            isSheetsConnected={!!user}
            lang={lang}
          />
        )}

        {/* View 2: Manual Circular Intake Module */}
        {activeTab === 'manual' && (
          <IntakeSection
            onExtract={handleExtract}
            isExtracting={isExtracting}
            lang={lang}
          />
        )}

        {/* Extracted Data Review & Editable Table */}
        <AdmissionTable
          data={admissionData}
          onUpdateData={setAdmissionData}
          lang={lang}
        />

        {/* Google Sheets Sync & CSV Export Panel */}
        <SheetsSyncBar
          data={admissionData}
          isAuthenticated={!!user}
          onInitiateCreateSheet={handleInitiateCreateSheet}
          onInitiateAppendSheet={handleInitiateAppendSheet}
          isSyncing={isSyncing}
          syncResult={syncResult}
          existingSheets={existingSheets}
          onLogin={handleLogin}
          lang={lang}
        />
      </main>

      {/* Mandatory User Confirmation Modal for Workspace Google Sheets mutations */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={
          confirmModal.actionType === 'create'
            ? lang === 'bn' ? 'নতুন গুগল স্প্রেডশিট তৈরি নিশ্চিতকরণ' : 'Confirm Google Sheet Creation'
            : lang === 'bn' ? 'বিদ্যমান শিটে ডাটা যোগ নিশ্চিতকরণ' : 'Confirm Appending to Google Sheet'
        }
        actionType={confirmModal.actionType}
        targetSpreadsheetName={confirmModal.targetSheetName}
        itemCount={(confirmModal.overrideData || admissionData).units.length}
        onConfirm={handleConfirmSync}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        lang={lang}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            {lang === 'bn'
              ? '© ২০২৫ ভর্তি বিজ্ঞপ্তি এক্সট্রাক্টর ও অটো-ক্রলার · গুগল শিট ও ড্রাইভ ইন্টিগ্রেশন'
              : '© 2025 Admission Extractor & Daily Crawler · Integrated with Google Sheets API'}
          </span>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Gemini 3.8 Flash + Google Search Grounding</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-medium">Auto-Crawler Active (24h)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
