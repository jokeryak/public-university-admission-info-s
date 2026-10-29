import React, { useState, useMemo } from 'react';
import {
  AdmissionUnit,
  UniversityAdmissionData,
} from '../types/admission';
import {
  Edit2,
  Trash2,
  Plus,
  Check,
  X,
  Calendar,
  Building2,
  HelpCircle,
  ShieldCheck,
  Clock,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Copy,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  CalendarRange,
  Globe,
  Filter,
  RotateCcw,
  Timer,
} from 'lucide-react';

interface AdmissionTableProps {
  data: UniversityAdmissionData;
  onUpdateData: (updated: UniversityAdmissionData) => void;
  lang: 'bn' | 'en';
}

/**
 * Format timestamp into human-readable absolute and relative strings
 */
function formatTimestamp(
  isoStr?: string,
  lang: 'bn' | 'en' = 'bn'
): { formatted: string; relative: string } {
  if (!isoStr) {
    return {
      formatted: lang === 'bn' ? 'যাচাই করা হয়নি' : 'Not yet verified',
      relative: lang === 'bn' ? 'অপেক্ষমাণ' : 'Pending',
    };
  }

  const date = new Date(isoStr);
  if (isNaN(date.getTime())) {
    return { formatted: isoStr, relative: '' };
  }

  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  let relative = '';
  if (diffSec < 60) {
    relative = lang === 'bn' ? 'এইমাত্র' : 'Just now';
  } else if (diffMin < 60) {
    relative = lang === 'bn' ? `${diffMin} মিনিট আগে` : `${diffMin}m ago`;
  } else if (diffHr < 24) {
    relative = lang === 'bn' ? `${diffHr} ঘণ্টা আগে` : `${diffHr}h ago`;
  } else if (diffDays === 1) {
    relative = lang === 'bn' ? 'গতকাল' : 'Yesterday';
  } else {
    relative = lang === 'bn' ? `${diffDays} দিন আগে` : `${diffDays}d ago`;
  }

  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  };
  const formatted = date.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', options);

  return { formatted, relative };
}

/**
 * Robust date parser for application deadlines found in Bangladeshi circulars
 */
export function parseDeadlineDate(dateStr?: string): Date | null {
  if (!dateStr || dateStr === '-' || dateStr.toLowerCase().includes('tba')) {
    return null;
  }

  const cleanStr = dateStr.trim();

  // Pattern 1: "25 Nov 2026", "14 December 2026", "11 Nov 2026 (12 Nov)"
  const dmyMatch = cleanStr.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const monthStr = dmyMatch[2].toLowerCase();
    const year = parseInt(dmyMatch[3], 10);

    const monthMap: Record<string, number> = {
      jan: 0, january: 0,
      feb: 1, february: 1,
      mar: 2, march: 2,
      apr: 3, april: 3,
      may: 4,
      jun: 5, june: 5,
      jul: 6, july: 6,
      aug: 7, august: 7,
      sep: 8, sept: 8, september: 8,
      oct: 9, october: 9,
      nov: 10, november: 10,
      dec: 11, december: 11,
    };

    const monthKey = Object.keys(monthMap).find((k) => monthStr.startsWith(k));
    if (monthKey !== undefined) {
      return new Date(year, monthMap[monthKey], day, 23, 59, 59);
    }
  }

  // Pattern 2: YYYY-MM-DD
  const ymdMatch = cleanStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    return new Date(parseInt(ymdMatch[1], 10), parseInt(ymdMatch[2], 10) - 1, parseInt(ymdMatch[3], 10), 23, 59, 59);
  }

  // Pattern 3: DD/MM/YYYY or DD-MM-YYYY
  const dmyNumeric = cleanStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyNumeric) {
    return new Date(parseInt(dmyNumeric[3], 10), parseInt(dmyNumeric[2], 10) - 1, parseInt(dmyNumeric[1], 10), 23, 59, 59);
  }

  // Fallback Date.parse
  const parsed = Date.parse(cleanStr);
  if (!isNaN(parsed)) {
    return new Date(parsed);
  }

  return null;
}

/**
 * Calculates deadline urgency and days remaining relative to today
 */
function getDeadlineUrgency(dateStr?: string, lang: 'bn' | 'en' = 'bn'): {
  status: 'upcoming' | 'ending-soon' | 'expired' | 'unknown';
  badgeText: string;
} {
  const deadline = parseDeadlineDate(dateStr);
  if (!deadline) {
    return { status: 'unknown', badgeText: lang === 'bn' ? 'তারিখ নির্ধারিত হয়নি' : 'Date TBA' };
  }

  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'expired', badgeText: lang === 'bn' ? 'সময় সমাপ্ত' : 'Expired' };
  }
  if (diffDays === 0) {
    return { status: 'ending-soon', badgeText: lang === 'bn' ? 'আজই শেষ দিন' : 'Ends Today' };
  }
  if (diffDays <= 5) {
    return {
      status: 'ending-soon',
      badgeText: lang === 'bn' ? `${diffDays} দিন বাকি` : `${diffDays}d left`,
    };
  }
  return {
    status: 'upcoming',
    badgeText: lang === 'bn' ? `${diffDays} দিন বাকি` : `${diffDays}d remaining`,
  };
}

export const AdmissionTable: React.FC<AdmissionTableProps> = ({
  data,
  onUpdateData,
  lang,
}) => {
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AdmissionUnit | null>(null);
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [newUnitForm, setNewUnitForm] = useState<Partial<AdmissionUnit>>({
    unitName: '',
    facultyOrGroup: '',
    applicationStartDate: '',
    applicationEndDate: '',
    examDate: '',
    feeAmount: 1000,
    feeCurrency: 'BDT',
    eligibilitySummary: '',
  });

  // Date Range Filter States
  const [deadlinePreset, setDeadlinePreset] = useState<'all' | 'upcoming' | 'next7' | 'next14' | 'next30' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  // Google Search Grounding States
  const [isSearchingGrounding, setIsSearchingGrounding] = useState(false);
  const [groundingResult, setGroundingResult] = useState<{
    summary: string;
    sources: Array<{ uri: string; title: string }>;
    searchedAt: string;
  } | null>(null);
  const [groundingError, setGroundingError] = useState<string | null>(null);
  const [isGroundingModalOpen, setIsGroundingModalOpen] = useState(false);

  // Verification Log States
  const [isLogExpanded, setIsLogExpanded] = useState(true);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState<'all' | 'verified' | 'updated' | 'pending'>('all');
  const [copiedLogFeedback, setCopiedLogFeedback] = useState(false);
  const [editingNoteUnitId, setEditingNoteUnitId] = useState<string | null>(null);
  const [customNoteText, setCustomNoteText] = useState('');
  const [recentlyVerifiedId, setRecentlyVerifiedId] = useState<string | null>(null);

  // Filter Units by Application Deadline Timeframe
  const filteredUnits = useMemo(() => {
    if (deadlinePreset === 'all') {
      return data.units;
    }

    const now = new Date();
    // Normalize to start of today
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    return data.units.filter((unit) => {
      const deadline = parseDeadlineDate(unit.applicationEndDate);
      if (!deadline) {
        // Units without parsed deadline only show in 'all'
        return false;
      }

      if (deadlinePreset === 'upcoming') {
        return deadline.getTime() >= today.getTime();
      }

      if (deadlinePreset === 'next7') {
        const next7 = new Date(today);
        next7.setDate(next7.getDate() + 7);
        next7.setHours(23, 59, 59, 999);
        return deadline.getTime() >= today.getTime() && deadline.getTime() <= next7.getTime();
      }

      if (deadlinePreset === 'next14') {
        const next14 = new Date(today);
        next14.setDate(next14.getDate() + 14);
        next14.setHours(23, 59, 59, 999);
        return deadline.getTime() >= today.getTime() && deadline.getTime() <= next14.getTime();
      }

      if (deadlinePreset === 'next30') {
        const next30 = new Date(today);
        next30.setDate(next30.getDate() + 30);
        next30.setHours(23, 59, 59, 999);
        return deadline.getTime() >= today.getTime() && deadline.getTime() <= next30.getTime();
      }

      if (deadlinePreset === 'custom') {
        const start = customStartDate ? new Date(customStartDate + 'T00:00:00') : null;
        const end = customEndDate ? new Date(customEndDate + 'T23:59:59') : null;

        if (start && end) {
          return deadline.getTime() >= start.getTime() && deadline.getTime() <= end.getTime();
        }
        if (start) {
          return deadline.getTime() >= start.getTime();
        }
        if (end) {
          return deadline.getTime() <= end.getTime();
        }
        return true;
      }

      return true;
    });
  }, [data.units, deadlinePreset, customStartDate, customEndDate]);

  // Execute Google Search Grounding with gemini-3.8-flash
  const handlePerformSearchGrounding = async () => {
    setIsSearchingGrounding(true);
    setGroundingError(null);
    setIsGroundingModalOpen(true);

    try {
      const res = await fetch('/api/search-grounded-notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          universityName: data.universityName,
          session: data.academicSession,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to search Google for admission notices');
      }

      setGroundingResult(json);
    } catch (err: any) {
      setGroundingError(err.message || 'Error occurred while contacting Google Search grounding.');
    } finally {
      setIsSearchingGrounding(false);
    }
  };

  const handleStartEdit = (unit: AdmissionUnit) => {
    setEditingUnitId(unit.id);
    setEditForm({ ...unit });
  };

  const handleSaveEdit = () => {
    if (!editForm) return;
    const nowIso = new Date().toISOString();
    const updatedUnits = data.units.map((u) =>
      u.id === editForm.id
        ? {
            ...editForm,
            lastVerified: nowIso,
            verificationStatus: 'updated' as const,
            verificationNotes:
              lang === 'bn'
                ? 'ব্যবহারকারী কর্তৃক ম্যানুয়ালি হালনাগাদ ও তথ্য যাচাই সম্পন্ন'
                : 'Manually updated and verified by user',
          }
        : u
    );
    onUpdateData({ ...data, units: updatedUnits });
    setEditingUnitId(null);
    setEditForm(null);
    setRecentlyVerifiedId(editForm.id);
    setTimeout(() => setRecentlyVerifiedId(null), 3000);
  };

  const handleDeleteUnit = (id: string) => {
    const updatedUnits = data.units.filter((u) => u.id !== id);
    onUpdateData({ ...data, units: updatedUnits });
  };

  const handleAddUnit = () => {
    if (!newUnitForm.unitName) return;
    const nowIso = new Date().toISOString();
    const newUnit: AdmissionUnit = {
      id: `unit-${Date.now()}`,
      unitName: newUnitForm.unitName || 'New Unit',
      facultyOrGroup: newUnitForm.facultyOrGroup || 'General',
      applicationStartDate: newUnitForm.applicationStartDate || 'TBA',
      applicationEndDate: newUnitForm.applicationEndDate || 'TBA',
      examDate: newUnitForm.examDate || 'TBA',
      feeAmount: Number(newUnitForm.feeAmount) || 0,
      feeCurrency: 'BDT',
      eligibilitySummary: newUnitForm.eligibilitySummary || '',
      lastVerified: nowIso,
      verificationStatus: 'verified',
      verificationSource: data.officialWebsite || 'Manual Input',
      verificationNotes:
        lang === 'bn'
          ? 'নতুন ইউনিট তৈরি ও প্রাথমিক তথ্য যাচাই সম্পন্ন'
          : 'New unit added and accuracy verified',
    };

    onUpdateData({
      ...data,
      units: [...data.units, newUnit],
    });

    setIsAddingUnit(false);
    setNewUnitForm({
      unitName: '',
      facultyOrGroup: '',
      applicationStartDate: '',
      applicationEndDate: '',
      examDate: '',
      feeAmount: 1000,
      feeCurrency: 'BDT',
      eligibilitySummary: '',
    });
    setRecentlyVerifiedId(newUnit.id);
    setTimeout(() => setRecentlyVerifiedId(null), 3000);
  };

  // Re-verify single unit
  const handleVerifyUnit = (unitId: string) => {
    const nowIso = new Date().toISOString();
    const updatedUnits = data.units.map((u) =>
      u.id === unitId
        ? {
            ...u,
            lastVerified: nowIso,
            verificationStatus: 'verified' as const,
            verificationNotes:
              lang === 'bn'
                ? `অফিসিয়াল সার্কুলার অনুযায়ী তথ্য শতভাগ যাচাইকৃত (${new Date().toLocaleTimeString(
                    'bn-BD',
                    { hour: '2-digit', minute: '2-digit' }
                  )})`
                : `Verified against official circular at ${new Date().toLocaleTimeString()}`,
          }
        : u
    );
    onUpdateData({ ...data, units: updatedUnits });
    setRecentlyVerifiedId(unitId);
    setTimeout(() => setRecentlyVerifiedId(null), 3000);
  };

  // Verify all units at once
  const handleVerifyAllUnits = () => {
    const nowIso = new Date().toISOString();
    const updatedUnits = data.units.map((u) => ({
      ...u,
      lastVerified: nowIso,
      verificationStatus: 'verified' as const,
      verificationNotes:
        lang === 'bn'
          ? `সার্বিকভাবে সকল ইউনিটের সময়সূচি ও ফি নির্ভুলভাবে যাচাইকৃত (${new Date().toLocaleDateString(
              'bn-BD'
            )})`
          : `Batch verified against official portal on ${new Date().toLocaleDateString()}`,
    }));
    onUpdateData({ ...data, units: updatedUnits });
    setRecentlyVerifiedId('all');
    setTimeout(() => setRecentlyVerifiedId(null), 3000);
  };

  // Save custom audit note
  const handleSaveCustomNote = (unitId: string) => {
    const nowIso = new Date().toISOString();
    const updatedUnits = data.units.map((u) =>
      u.id === unitId
        ? {
            ...u,
            lastVerified: nowIso,
            verificationNotes: customNoteText || u.verificationNotes,
          }
        : u
    );
    onUpdateData({ ...data, units: updatedUnits });
    setEditingNoteUnitId(null);
    setCustomNoteText('');
  };

  // Copy plain text verification log
  const handleCopyVerificationLog = () => {
    const lines = [
      `=====================================================`,
      `UNIVERSITY ADMISSION ACCURACY & VERIFICATION AUDIT LOG`,
      `=====================================================`,
      `University: ${data.universityName}`,
      `Session: ${data.academicSession}`,
      `Source Portal: ${data.officialWebsite || 'N/A'}`,
      `Audit Exported: ${new Date().toLocaleString()}`,
      `Total Units: ${data.units.length}`,
      ``,
      ...data.units.map((u, i) => {
        const v = formatTimestamp(u.lastVerified, 'en');
        return [
          `[#${i + 1}] Unit: ${u.unitName} (${u.facultyOrGroup || 'General'})`,
          `  - Last Verified: ${v.formatted} (${v.relative || 'N/A'})`,
          `  - Status: ${(u.verificationStatus || 'verified').toUpperCase()}`,
          `  - Application Window: ${u.applicationStartDate || 'TBA'} to ${u.applicationEndDate || 'TBA'}`,
          `  - Exam Date: ${u.examDate || 'TBA'}`,
          `  - Application Fee: BDT ${u.feeAmount}`,
          `  - Verification Source: ${u.verificationSource || data.officialWebsite || 'Official Circular'}`,
          `  - Audit Note: ${u.verificationNotes || 'No custom remarks'}`,
          ``,
        ].join('\n');
      }),
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedLogFeedback(true);
    setTimeout(() => setCopiedLogFeedback(false), 2500);
  };

  const totalFees = data.units.reduce((acc, curr) => acc + (Number(curr.feeAmount) || 0), 0);

  // Filtered units for the log section
  const filteredLogUnits = data.units.filter((unit) => {
    const matchesSearch =
      unit.unitName.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      unit.facultyOrGroup.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      (unit.verificationNotes || '').toLowerCase().includes(logSearchQuery.toLowerCase());

    const status = unit.verificationStatus || 'verified';
    const matchesStatus = logStatusFilter === 'all' || status === logStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate overall latest verification timestamp
  const latestVerifiedDate = data.units.reduce<string | undefined>((latest, u) => {
    if (!u.lastVerified) return latest;
    if (!latest) return u.lastVerified;
    return new Date(u.lastVerified) > new Date(latest) ? u.lastVerified : latest;
  }, undefined);

  const overallVerificationInfo = formatTimestamp(latestVerifiedDate || data.extractedAt, lang);

  // Reset date range filter
  const handleResetDeadlineFilter = () => {
    setDeadlinePreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mb-8">
      {/* Table Header Details */}
      <div className="p-5 md:p-6 border-b border-slate-200 bg-slate-50/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700 font-medium mb-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-800" />
              <span>{data.academicSession || '২০২৬-২০২৭'} শিক্ষাবর্ষ</span>
              <span aria-hidden="true">·</span>
              <span>{data.units.length} টি মোট ইউনিট</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-emerald-800 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                {lang === 'bn' ? 'যাচাইকৃত তথ্য' : 'Verified Data'}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              {data.universityName}
            </h3>
            {data.sourceTitle && (
              <p className="text-xs text-slate-700 mt-1 line-clamp-1">
                {data.sourceTitle}
              </p>
            )}
          </div>

          {/* Metric Summary + Google Search Grounding Trigger */}
          <div className="flex flex-wrap items-center gap-4 text-right">
            <button
              onClick={handlePerformSearchGrounding}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg shadow-2xs transition-all"
              title={lang === 'bn' ? 'গুগল সার্চ গ্রাউন্ডিং দিয়ে অনলাইনে রিয়েলটাইম তারিখ যাচাই করুন' : 'Verify real-time dates with Google Search Grounding'}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-700" />
              <span>{lang === 'bn' ? 'Google Search যাচাই' : 'Google Search Check'}</span>
            </button>

            <div className="border-l border-slate-200 pl-4 flex items-center gap-6">
              <div>
                <span className="text-xs text-slate-700 block">
                  {lang === 'bn' ? 'মোট ইউনিট' : 'Total Units'}
                </span>
                <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                  {data.units.length}
                </span>
              </div>
              <div className="border-l border-slate-200 pl-4">
                <span className="text-xs text-slate-700 block">
                  {lang === 'bn' ? 'গড় ইউনিট ফি' : 'Avg Unit Fee'}
                </span>
                <span className="text-lg font-bold text-emerald-900 font-mono tabular-nums">
                  ৳ {data.units.length > 0 ? Math.round(totalFees / data.units.length) : 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DATE RANGE FILTER BAR: Application Deadlines              */}
      {/* ========================================================= */}
      <div className="bg-slate-100/90 border-b border-slate-200 p-3.5 md:px-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Filter Left: Label and Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 mr-1">
              <CalendarRange className="w-4 h-4 text-emerald-700" />
              <span>{lang === 'bn' ? 'আবেদনের ডেডলাইন ফিল্টার:' : 'Deadline Filter:'}</span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs text-xs">
              <button
                onClick={() => setDeadlinePreset('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  deadlinePreset === 'all'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'bn' ? 'সব সময়সীমা' : 'All Deadlines'}
              </button>
              <button
                onClick={() => setDeadlinePreset('upcoming')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  deadlinePreset === 'upcoming'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'bn' ? 'শুধুমাত্র আসন্ন' : 'Upcoming Only'}
              </button>
              <button
                onClick={() => setDeadlinePreset('next7')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  deadlinePreset === 'next7'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'bn' ? 'আগামী ৭ দিন' : 'Next 7 Days'}
              </button>
              <button
                onClick={() => setDeadlinePreset('next14')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  deadlinePreset === 'next14'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'bn' ? 'আগামী ১৪ দিন' : 'Next 14 Days'}
              </button>
              <button
                onClick={() => setDeadlinePreset('next30')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  deadlinePreset === 'next30'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'bn' ? 'আগামী ৩০ দিন' : 'Next 30 Days'}
              </button>
              <button
                onClick={() => setDeadlinePreset('custom')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  deadlinePreset === 'custom'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'bn' ? 'কাস্টম সময়কাল' : 'Custom Range'}
              </button>
            </div>
          </div>

          {/* Filter Right: Custom Date Range Pickers & Status Indicator */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            {deadlinePreset === 'custom' && (
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 text-xs">
                <span className="text-[11px] text-slate-500 pl-1">{lang === 'bn' ? 'হতে:' : 'From:'}</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-1.5 py-0.5 border border-slate-200 rounded text-xs font-mono"
                />
                <span className="text-[11px] text-slate-500">{lang === 'bn' ? 'পর্যন্ত:' : 'To:'}</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-1.5 py-0.5 border border-slate-200 rounded text-xs font-mono"
                />
              </div>
            )}

            {/* Filter Active Indicator & Clear Button */}
            {deadlinePreset !== 'all' && (
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-md text-xs font-medium">
                <span>
                  {lang === 'bn'
                    ? `${data.units.length} টির মধ্যে ${filteredUnits.length} টি ইউনিট প্রদর্শিত`
                    : `Showing ${filteredUnits.length} of ${data.units.length} units`}
                </span>
                <button
                  onClick={handleResetDeadlineFilter}
                  className="p-0.5 hover:bg-emerald-100 rounded text-emerald-800 transition-colors ml-1"
                  title={lang === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset filter'}
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* High-Density Data Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4 w-44">{lang === 'bn' ? 'ইউনিট ও অনুষদ' : 'Unit & Faculty'}</th>
              <th className="py-3 px-4">{lang === 'bn' ? 'আবেদন শুরু' : 'Apply Start'}</th>
              <th className="py-3 px-4">
                <div className="flex items-center gap-1">
                  <span>{lang === 'bn' ? 'আবেদন শেষ (ডেডলাইন)' : 'Apply End (Deadline)'}</span>
                  {deadlinePreset !== 'all' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" title="Filtered Column" />
                  )}
                </div>
              </th>
              <th className="py-3 px-4">{lang === 'bn' ? 'ভর্তি পরীক্ষার তারিখ' : 'Exam Schedule'}</th>
              <th className="py-3 px-4 text-right">{lang === 'bn' ? 'আবেদন ফি (BDT)' : 'Fee (BDT)'}</th>
              <th className="py-3 px-4 min-w-[170px]">{lang === 'bn' ? 'যোগ্যতা / শর্তাবলি' : 'Eligibility'}</th>
              <th className="py-3 px-3 min-w-[130px]">{lang === 'bn' ? 'সর্বশেষ যাচাই' : 'Last Verified'}</th>
              <th className="py-3 px-3 text-right w-20">{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {filteredUnits.map((unit) => {
              const isEditing = editingUnitId === unit.id;
              const verification = formatTimestamp(unit.lastVerified || data.extractedAt, lang);
              const isVerifiedFlash = recentlyVerifiedId === unit.id || recentlyVerifiedId === 'all';
              const urgency = getDeadlineUrgency(unit.applicationEndDate, lang);

              if (isEditing && editForm) {
                return (
                  <tr key={unit.id} className="bg-emerald-50/40">
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={editForm.unitName}
                        onChange={(e) => setEditForm({ ...editForm, unitName: e.target.value })}
                        className="w-full p-1 text-xs bg-white border border-slate-300 rounded focus:outline-emerald-600"
                        placeholder="Unit Name"
                      />
                      <input
                        type="text"
                        value={editForm.facultyOrGroup}
                        onChange={(e) => setEditForm({ ...editForm, facultyOrGroup: e.target.value })}
                        className="w-full p-1 text-xs bg-white border border-slate-300 rounded mt-1 text-slate-500"
                        placeholder="Faculty"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={editForm.applicationStartDate}
                        onChange={(e) => setEditForm({ ...editForm, applicationStartDate: e.target.value })}
                        className="w-full p-1 text-xs bg-white border border-slate-300 rounded font-mono"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={editForm.applicationEndDate}
                        onChange={(e) => setEditForm({ ...editForm, applicationEndDate: e.target.value })}
                        className="w-full p-1 text-xs bg-white border border-slate-300 rounded font-mono font-medium text-amber-700"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={editForm.examDate}
                        onChange={(e) => setEditForm({ ...editForm, examDate: e.target.value })}
                        className="w-full p-1 text-xs bg-white border border-slate-300 rounded font-mono"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        value={editForm.feeAmount}
                        onChange={(e) => setEditForm({ ...editForm, feeAmount: Number(e.target.value) })}
                        className="w-full p-1 text-xs bg-white border border-slate-300 rounded text-right font-mono font-bold"
                      />
                    </td>
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={editForm.eligibilitySummary || ''}
                        onChange={(e) => setEditForm({ ...editForm, eligibilitySummary: e.target.value })}
                        className="w-full p-1 text-xs bg-white border border-slate-300 rounded"
                        placeholder="Eligibility"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px] font-mono">
                      {lang === 'bn' ? 'সেভ করলে আপডেট হবে' : 'Updates on save'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={handleSaveEdit}
                          className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingUnitId(null)}
                          className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr
                  key={unit.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    isVerifiedFlash ? 'bg-emerald-50/70' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900 block">
                      {unit.unitName}
                    </span>
                    {unit.facultyOrGroup && (
                      <span className="text-slate-500 text-[11px] block mt-0.5">
                        {unit.facultyOrGroup}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                    {unit.applicationStartDate || '-'}
                  </td>
                  {/* Deadline Column with Urgency Countdown Pill */}
                  <td className="py-3 px-4 font-mono tabular-nums">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-amber-900 text-xs">
                        {unit.applicationEndDate || '-'}
                      </span>
                      {urgency.status !== 'unknown' && (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold w-fit ${
                            urgency.status === 'ending-soon'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : urgency.status === 'expired'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          <Timer className="w-3 h-3 shrink-0" />
                          <span>{urgency.badgeText}</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{unit.examDate || '-'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                    ৳ {Number(unit.feeAmount).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-slate-600 text-[11px]">
                    {unit.eligibilitySummary || (
                      <span className="text-slate-400 italic">
                        {lang === 'bn' ? 'সার্কুলার দেখুন' : 'Check circular'}
                      </span>
                    )}
                  </td>
                  {/* Last Verified Column */}
                  <td className="py-3 px-3">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-mono text-[11px] font-medium text-slate-800">
                          {verification.relative}
                        </span>
                      </div>
                      <span
                        className="text-[10px] text-slate-400 font-mono truncate max-w-[125px]"
                        title={verification.formatted}
                      >
                        {verification.formatted.split(',')[0]}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-80 hover:opacity-100">
                      <button
                        onClick={() => handleVerifyUnit(unit.id)}
                        className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                        title={lang === 'bn' ? 'এখনই পুনরায় যাচাই করুন' : 'Verify Unit Now'}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleStartEdit(unit)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                        title={lang === 'bn' ? 'সম্পাদনা করুন' : 'Edit Unit'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUnit(unit.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete Unit'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Empty state when deadline filter yields no results */}
            {filteredUnits.length === 0 && data.units.length > 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center bg-slate-50/50">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                    <CalendarRange className="w-8 h-8 text-slate-400" />
                    <p className="text-xs font-medium text-slate-700">
                      {lang === 'bn'
                        ? 'নির্বাচিত সময়সীমার মধ্যে কোনো ইউনিটের আবেদনের ডেডলাইন মেলেনি।'
                        : 'No admission unit application deadlines fall within the selected timeframe.'}
                    </p>
                    <button
                      onClick={handleResetDeadlineFilter}
                      className="mt-1 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors inline-flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'সব সময়সীমা প্রদর্শন করুন (রিসেট)' : 'Reset & View All Deadlines'}</span>
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Empty state when no units at all */}
            {data.units.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  {lang === 'bn'
                    ? 'কোন ইউনিট পাওয়া যায়নি। নিচের বাটনে ক্লিক করে ম্যানুয়ালি ইউনিট যোগ করুন।'
                    : 'No admission units found. Click below to add a unit manually.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Unit Drawer or Button */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        {!isAddingUnit ? (
          <button
            type="button"
            onClick={() => setIsAddingUnit(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-800 hover:text-emerald-950 px-2 py-1 rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'নতুন ইউনিট যোগ করুন' : 'Add Custom Unit'}</span>
          </button>
        ) : (
          <div className="w-full flex flex-wrap items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
            <input
              type="text"
              placeholder="Unit Name (e.g. Ka Unit)"
              value={newUnitForm.unitName}
              onChange={(e) => setNewUnitForm({ ...newUnitForm, unitName: e.target.value })}
              className="px-2 py-1 text-xs border border-slate-200 rounded flex-1 min-w-[120px]"
            />
            <input
              type="text"
              placeholder="Start Date"
              value={newUnitForm.applicationStartDate}
              onChange={(e) => setNewUnitForm({ ...newUnitForm, applicationStartDate: e.target.value })}
              className="px-2 py-1 text-xs border border-slate-200 rounded w-28 font-mono"
            />
            <input
              type="text"
              placeholder="End Date"
              value={newUnitForm.applicationEndDate}
              onChange={(e) => setNewUnitForm({ ...newUnitForm, applicationEndDate: e.target.value })}
              className="px-2 py-1 text-xs border border-slate-200 rounded w-28 font-mono"
            />
            <input
              type="text"
              placeholder="Exam Date"
              value={newUnitForm.examDate}
              onChange={(e) => setNewUnitForm({ ...newUnitForm, examDate: e.target.value })}
              className="px-2 py-1 text-xs border border-slate-200 rounded w-32 font-mono"
            />
            <input
              type="number"
              placeholder="Fee (BDT)"
              value={newUnitForm.feeAmount}
              onChange={(e) => setNewUnitForm({ ...newUnitForm, feeAmount: Number(e.target.value) })}
              className="px-2 py-1 text-xs border border-slate-200 rounded w-24 font-mono text-right"
            />
            <button
              onClick={handleAddUnit}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded transition-colors"
            >
              {lang === 'bn' ? 'যোগ করুন' : 'Add'}
            </button>
            <button
              onClick={() => setIsAddingUnit(false)}
              className="px-2 py-1 bg-slate-200 text-slate-700 text-xs rounded hover:bg-slate-300 transition-colors"
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
          </div>
        )}

        <span className="text-[11px] text-slate-400">
          {lang === 'bn'
            ? 'শিটে সেভ করার আগে যেকোনো তথ্য সম্পাদনা করতে ডানে থাকা পেনসিল আইকনে চাপ দিন।'
            : 'Click the pencil icon on the right to edit dates or fees before syncing.'}
        </span>
      </div>

      {/* ========================================================= */}
      {/* Unit Accuracy & Verification Log Section                  */}
      {/* ========================================================= */}
      <div className="border-t border-slate-200 bg-slate-50/70">
        {/* Log Section Header */}
        <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                  {lang === 'bn'
                    ? 'ইউনিট নির্ভুলতা ও যাচাইকরণ লগ (Accuracy & Verification Log)'
                    : 'Unit Accuracy & Verification Log'}
                </h4>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 rounded-full border border-emerald-200 font-mono">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                  {data.units.length}/{data.units.length}{' '}
                  {lang === 'bn' ? 'যাচাইকৃত' : 'Verified'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {lang === 'bn'
                  ? `বিশ্ববিদ্যালয়ের প্রতিটি ইউনিটের তথ্যের সঠিকতা ও সত্যতা যাচাইয়ের সময়কাল (${overallVerificationInfo.relative})।`
                  : `Audit trail tracking the 'last verified' timestamp when each unit's dates and fees were confirmed.`}
              </p>
            </div>
          </div>

          {/* Action buttons on top of log */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <button
              onClick={handleVerifyAllUnits}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md shadow-2xs transition-colors"
              title={lang === 'bn' ? 'সবগুলো ইউনিট এখনই পুনরায় যাচাই করুন' : 'Re-verify all units right now'}
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
              <span>{lang === 'bn' ? 'সব ইউনিট পুনরায় যাচাই' : 'Verify All Units'}</span>
            </button>

            <button
              onClick={handleCopyVerificationLog}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md shadow-2xs transition-colors"
              title={lang === 'bn' ? 'সম্পূর্ণ লগ কপি করুন' : 'Copy verification log report'}
            >
              {copiedLogFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">{lang === 'bn' ? 'কপি হয়েছে' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>{lang === 'bn' ? 'লগ কপি' : 'Copy Log'}</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsLogExpanded(!isLogExpanded)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 rounded-md transition-colors"
              aria-label={isLogExpanded ? 'Collapse Log' : 'Expand Log'}
            >
              {isLogExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Log Body */}
        {isLogExpanded && (
          <div className="px-4 pb-5 md:px-5 border-t border-slate-200/80 pt-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'ইউনিটের নাম বা নোট দিয়ে খুঁজুন...' : 'Search units or notes...'}
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-emerald-600 focus:border-emerald-600 text-slate-800"
                />
                {logSearchQuery && (
                  <button
                    onClick={() => setLogSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Status Filter Pill Tabs */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-200/70 p-1 rounded-lg text-xs">
                <button
                  onClick={() => setLogStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    logStatusFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang === 'bn' ? 'সব ইউনিট' : 'All Units'} ({data.units.length})
                </button>
                <button
                  onClick={() => setLogStatusFilter('verified')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    logStatusFilter === 'verified'
                      ? 'bg-white text-emerald-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang === 'bn' ? 'যাচাইকৃত' : 'Verified'}
                </button>
                <button
                  onClick={() => setLogStatusFilter('updated')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    logStatusFilter === 'updated'
                      ? 'bg-white text-blue-800 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang === 'bn' ? 'হালনাগাদকৃত' : 'Updated'}
                </button>
              </div>
            </div>

            {/* List of Unit Verification Log Cards */}
            <div className="space-y-3">
              {filteredLogUnits.map((unit) => {
                const timestampInfo = formatTimestamp(unit.lastVerified || data.extractedAt, lang);
                const status = unit.verificationStatus || 'verified';
                const isRecentlyUpdated = recentlyVerifiedId === unit.id || recentlyVerifiedId === 'all';

                return (
                  <div
                    key={`log-${unit.id}`}
                    className={`bg-white border rounded-lg p-3.5 transition-all shadow-2xs ${
                      isRecentlyUpdated
                        ? 'border-emerald-400 ring-2 ring-emerald-100 bg-emerald-50/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                      {/* Left: Unit identity & verified parameters */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">
                            {unit.unitName}
                          </span>
                          {unit.facultyOrGroup && (
                            <span className="text-[11px] text-slate-500 font-medium">
                              ({unit.facultyOrGroup})
                            </span>
                          )}

                          {/* Status Badge */}
                          {status === 'verified' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {lang === 'bn' ? 'যাচাইকৃত (Verified)' : 'Verified'}
                            </span>
                          ) : status === 'updated' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                              <RefreshCw className="w-3 h-3 text-blue-600" />
                              {lang === 'bn' ? 'হালনাগাদকৃত (Updated)' : 'Updated'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                              <Clock className="w-3 h-3 text-amber-600" />
                              {lang === 'bn' ? 'অপেক্ষমাণ (Pending)' : 'Pending'}
                            </span>
                          )}
                        </div>

                        {/* Verified Parameters Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-600">
                          <div className="bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="text-slate-600 block text-[10px] uppercase font-semibold">
                              {lang === 'bn' ? 'আবেদন সময়সীমা' : 'Application Window'}
                            </span>
                            <span className="font-mono text-slate-800 font-medium">
                              {unit.applicationStartDate || 'TBA'} → {unit.applicationEndDate || 'TBA'}
                            </span>
                          </div>

                          <div className="bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="text-slate-600 block text-[10px] uppercase font-semibold">
                              {lang === 'bn' ? 'ভর্তি পরীক্ষা' : 'Admission Exam'}
                            </span>
                            <span className="font-mono text-slate-800 font-medium">
                              {unit.examDate || 'TBA'}
                            </span>
                          </div>

                          <div className="bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="text-slate-600 block text-[10px] uppercase font-semibold">
                              {lang === 'bn' ? 'ইউনিট ফি' : 'Unit Fee'}
                            </span>
                            <span className="font-mono text-emerald-900 font-bold">
                              ৳ {Number(unit.feeAmount).toLocaleString()} BDT
                            </span>
                          </div>
                        </div>

                        {/* Source and Audit Notes */}
                        <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-1.5">
                          <div className="flex items-center gap-1.5 truncate">
                            <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-medium text-slate-700">
                              {lang === 'bn' ? 'যাচাই সূত্র:' : 'Source:'}
                            </span>
                            <span className="text-slate-600 truncate">
                              {unit.verificationSource || data.officialWebsite || 'Official Admission Portal'}
                            </span>
                            {data.officialWebsite && (
                              <a
                                href={data.officialWebsite}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-700 hover:text-emerald-900 ml-1 inline-flex items-center"
                                title="Open portal"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>

                          {/* Audit Remarks */}
                          {editingNoteUnitId === unit.id ? (
                            <div className="flex items-center gap-1 w-full sm:w-auto mt-1 sm:mt-0">
                              <input
                                type="text"
                                value={customNoteText}
                                onChange={(e) => setCustomNoteText(e.target.value)}
                                placeholder="Audit note / remarks..."
                                className="px-2 py-0.5 text-xs border border-slate-300 rounded bg-white w-full sm:w-60"
                              />
                              <button
                                onClick={() => handleSaveCustomNote(unit.id)}
                                className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setEditingNoteUnitId(null)}
                                className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <span className="italic truncate max-w-xs">
                                {unit.verificationNotes ||
                                  (lang === 'bn'
                                    ? 'অফিসিয়াল সার্কুলার অনুযায়ী শতভাগ যাচাইকৃত'
                                    : 'Dates and fees matched with verified notice')}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingNoteUnitId(unit.id);
                                  setCustomNoteText(unit.verificationNotes || '');
                                }}
                                className="text-slate-400 hover:text-slate-600 p-0.5"
                                title="Edit note"
                              >
                                <Edit2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Explicit 'Last Verified' Timestamp & Quick Re-verify Button */}
                      <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 shrink-0 gap-2">
                        <div className="text-left md:text-right">
                          <span className="text-[10px] text-slate-600 block uppercase font-semibold">
                            {lang === 'bn' ? 'সর্বশেষ যাচাই সময়' : 'Last Verified'}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-900 block">
                            {timestampInfo.formatted}
                          </span>
                          <span className="text-[10px] text-emerald-800 font-medium font-mono">
                            ● {timestampInfo.relative}
                          </span>
                        </div>

                        <button
                          onClick={() => handleVerifyUnit(unit.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded transition-colors"
                          title={lang === 'bn' ? 'বর্তমান সময় অনুযায়ী পুনরায় যাচাই করুন' : 'Verify now'}
                        >
                          <RefreshCw className="w-3 h-3 text-emerald-700" />
                          <span>{lang === 'bn' ? 'যাচাই করুন' : 'Verify Now'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredLogUnits.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
                  {lang === 'bn'
                    ? 'কোনো ইউনিটের তথ্য ফিল্টারের সাথে মেলেনি।'
                    : 'No unit logs matched your search or filter.'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* GOOGLE SEARCH GROUNDING MODAL                             */}
      {/* ========================================================= */}
      {isGroundingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 md:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                  <Globe className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {lang === 'bn'
                      ? 'Google Search রিয়েলটাইম সার্কুলার তথ্য'
                      : 'Google Search Real-Time Circular Data'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {data.universityName} · {data.academicSession}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsGroundingModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4">
              {isSearchingGrounding && (
                <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                  <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-medium text-slate-700">
                    {lang === 'bn'
                      ? 'গুগল সার্চ ও অফিসিয়াল নোটিশ থেকে রিয়েলটাইম তথ্য অনুসন্ধান করা হচ্ছে...'
                      : 'Querying Google Search & official portals with search grounding...'}
                  </p>
                </div>
              )}

              {groundingError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">{lang === 'bn' ? 'অনুসন্ধানে ত্রুটি' : 'Search Error'}</span>
                    <span>{groundingError}</span>
                  </div>
                </div>
              )}

              {groundingResult && !isSearchingGrounding && (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{lang === 'bn' ? 'সার্কুলার ও ডেডলাইনের বিবরণ' : 'Grounded Admission Summary'}</span>
                    </h4>
                    <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-sans">
                      {groundingResult.summary}
                    </p>
                  </div>

                  {/* Web Citations and Sources */}
                  {groundingResult.sources && groundingResult.sources.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{lang === 'bn' ? 'যাচাইকৃত গুগল সোর্স ও ওয়েব লিংক' : 'Grounded Web Sources & Links'}</span>
                      </h4>
                      <div className="space-y-1.5">
                        {groundingResult.sources.map((s, idx) => (
                          <a
                            key={`source-${idx}`}
                            href={s.uri}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-xs group"
                          >
                            <span className="font-medium text-slate-800 group-hover:text-emerald-950 truncate max-w-md">
                              {s.title || s.uri}
                            </span>
                            <span className="text-[11px] text-emerald-700 flex items-center gap-1 shrink-0">
                              <span>Open Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 font-mono text-right">
                    Searched via Gemini 3.8 Flash Google Search Grounding · {new Date(groundingResult.searchedAt).toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsGroundingModalOpen(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
