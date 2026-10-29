import React, { useState } from 'react';
import {
  Bot,
  RefreshCw,
  Clock,
  CheckCircle2,
  Globe,
  Plus,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Calendar,
  Search,
  Building2,
  Eye,
} from 'lucide-react';
import { MonitoredUniversity } from '../data/monitoredUniversities';
import { UniversityAdmissionData } from '../types/admission';

/**
 * Extracts and formats clean unit badges for a given university
 */
export const getUniversityUnitTags = (uni: MonitoredUniversity): string[] => {
  if (uni.notes && uni.notes.trim()) {
    const raw = uni.notes;
    // Extract phrases separated by comma, 'ও', or newline
    const tokens = raw
      .replace(/ভর্তি|পরীক্ষা|অনুষদসমূহ|অনুষদ|বিভাগসমূহ/gi, '')
      .split(/[,、।\n\r/]|(?:\s+ও\s+)/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !t.startsWith('http'));

    if (tokens.length > 0) {
      return tokens.slice(0, 5);
    }
  }

  // Sensible default unit distributions by public university type
  if (uni.category === 'Engineering') {
    return ['ক গ্রুপ (প্রকৌশল)', 'খ গ্রুপ (স্থাপত্য)'];
  }
  if (uni.category === 'Medical') {
    return ['MBBS (মেডিকেল)', 'BDS (ডেন্টাল)'];
  }
  if (uni.category === 'Agricultural') {
    return ['কৃষি গুচ্ছ (সমন্বিত)'];
  }
  if (uni.category === 'Cluster') {
    return ['A ইউনিট (বিজ্ঞান)', 'B ইউনিট (মানবিক)', 'C ইউনিট (বাণিজ্য)'];
  }
  return ['বিজ্ঞান শাখা', 'মানবিক / কলা', 'ব্যবসায় শিক্ষা'];
};

export interface CrawlerLog {
  id: string;
  runAt: string;
  triggerType: 'scheduled' | 'manual';
  universitiesChecked: number;
  newUpdatesFound: number;
  status: 'success' | 'warning' | 'error';
  details: string;
}

interface AutoCrawlerSectionProps {
  isAutoCrawling: boolean;
  onToggleAutoCrawling: (enabled: boolean) => void;
  lastRunAt: string | null;
  nextRunAt: string | null;
  universities: MonitoredUniversity[];
  logs: CrawlerLog[];
  discoveredCirculars: UniversityAdmissionData[];
  isScanningNow: boolean;
  onRunScanNow: () => void;
  onAddUniversity: (uni: { name: string; banglaName: string; portalUrl: string; category: any }) => void;
  onSyncDiscoveredToSheet: (circular: UniversityAdmissionData) => void;
  onSelectUniversity?: (uni: MonitoredUniversity) => void;
  onSelectDiscovered?: (circular: UniversityAdmissionData) => void;
  isSheetsConnected: boolean;
  lang: 'bn' | 'en';
}

export const AutoCrawlerSection: React.FC<AutoCrawlerSectionProps> = ({
  isAutoCrawling,
  onToggleAutoCrawling,
  lastRunAt,
  nextRunAt,
  universities,
  logs,
  discoveredCirculars,
  isScanningNow,
  onRunScanNow,
  onAddUniversity,
  onSyncDiscoveredToSheet,
  onSelectUniversity,
  onSelectDiscovered,
  isSheetsConnected,
  lang,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUniName, setNewUniName] = useState('');
  const [newUniBangla, setNewUniBangla] = useState('');
  const [newUniUrl, setNewUniUrl] = useState('');
  const [newUniCategory, setNewUniCategory] = useState<
    'General' | 'Engineering' | 'Cluster' | 'Science & Tech' | 'Agricultural' | 'Medical' | 'Specialized'
  >('General');
  const [showLogs, setShowLogs] = useState(false);

  // Search & Category Filtering
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredUniversities = universities.filter((u) => {
    const matchesCategory = selectedCategory === 'all' || u.category === selectedCategory;
    const matchesQuery =
      !searchQuery.trim() ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.banglaName.includes(searchQuery) ||
      u.portalUrl.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const categories = [
    { id: 'all', label: lang === 'bn' ? 'সকল (All)' : 'All' },
    { id: 'General', label: lang === 'bn' ? 'সাধারণ' : 'General' },
    { id: 'Engineering', label: lang === 'bn' ? 'প্রকৌশল' : 'Engineering' },
    { id: 'Cluster', label: lang === 'bn' ? 'গুচ্ছ' : 'Cluster' },
    { id: 'Science & Tech', label: lang === 'bn' ? 'বিজ্ঞান ও প্রযুক্তি' : 'Science & Tech' },
    { id: 'Agricultural', label: lang === 'bn' ? 'কৃষি' : 'Agricultural' },
    { id: 'Medical', label: lang === 'bn' ? 'মেডিকেল' : 'Medical' },
    { id: 'Specialized', label: lang === 'bn' ? 'বিশেষায়িত ও জাতীয়' : 'Specialized' },
  ];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUniName.trim() || !newUniUrl.trim()) return;
    onAddUniversity({
      name: newUniName.trim(),
      banglaName: newUniBangla.trim() || newUniName.trim(),
      portalUrl: newUniUrl.trim(),
      category: newUniCategory,
    });
    setNewUniName('');
    setNewUniBangla('');
    setNewUniUrl('');
    setShowAddModal(false);
  };

  const formatDateTime = (isoStr: string | null) => {
    if (!isoStr) return lang === 'bn' ? 'অপেক্ষমাণ' : 'Pending';
    try {
      return new Date(isoStr).toLocaleString('bn-BD', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6 mb-8">
      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-slate-200">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-xl font-bold text-slate-900">
                {lang === 'bn' ? 'দৈনিক স্বয়ংক্রিয় ওয়েব ট্র্যাকার ও ক্রলার' : 'Daily Automated Web Crawler & Tracker'}
              </h2>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isAutoCrawling ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isAutoCrawling ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`}></span>
                {isAutoCrawling ? (lang === 'bn' ? 'দৈনিক অটো-রান সক্রিয়' : 'Daily Auto-Scan Active') : (lang === 'bn' ? 'নিষ্ক্রিয়' : 'Paused')}
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              {lang === 'bn'
                ? `সারাদেশের ৫৮টি পাবলিক ও গুচ্ছ বিশ্ববিদ্যালয়ের অফিসিয়াল ভর্তি পোর্টাল প্রতিদিন স্বয়ংক্রিয়ভাবে স্ক্যান করে। নতুন সার্কুলার বা তারিখ প্রকাশ পেলেই সংগ্রহ করে আপনার গুগল শিটে যোগ করে দেবে।`
                : 'Scans official admission portals across all public universities in Bangladesh daily for new dates and fee updates.'}
            </p>
          </div>
        </div>

        {/* Schedule Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Toggle Switch */}
          <button
            type="button"
            onClick={() => onToggleAutoCrawling(!isAutoCrawling)}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors ${
              isAutoCrawling
                ? 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <span>{isAutoCrawling ? (lang === 'bn' ? 'অটো-রান বন্ধ করুন' : 'Pause Auto-Run') : (lang === 'bn' ? 'অটো-রান চালু করুন' : 'Enable Auto-Run')}</span>
          </button>

          {/* Run Now CTA Button */}
          <button
            type="button"
            onClick={onRunScanNow}
            disabled={isScanningNow}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg shadow-xs hover:shadow transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isScanningNow ? 'animate-spin' : ''}`} />
            <span>
              {isScanningNow
                ? lang === 'bn' ? 'ইন্টারনেট স্ক্যান চলছে...' : 'Scanning Websites...'
                : lang === 'bn' ? 'এখনই ইন্টারনেট স্ক্যান চালান' : 'Run Daily Scan Now'}
            </span>
          </button>
        </div>
      </div>

      {/* Scheduler Timing Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-5 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
          <div>
            <span className="text-slate-500 block">{lang === 'bn' ? 'সর্বশেষ অটো-স্ক্যান' : 'Last Automated Scan'}</span>
            <span className="font-semibold text-slate-800 font-mono">{formatDateTime(lastRunAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4">
          <Calendar className="w-4 h-4 text-slate-600 shrink-0" />
          <div>
            <span className="text-slate-500 block">{lang === 'bn' ? 'পরবর্তী নির্ধারিত স্ক্যান' : 'Next Scheduled Scan'}</span>
            <span className="font-semibold text-slate-800 font-mono">{formatDateTime(nextRunAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4">
          <Globe className="w-4 h-4 text-slate-600 shrink-0" />
          <div>
            <span className="text-slate-500 block">{lang === 'bn' ? 'মনিটরকৃত বিশ্ববিদ্যালয়' : 'Monitored Portals'}</span>
            <span className="font-semibold text-slate-800 font-mono">{universities.length} টি পাবলিক বিশ্ববিদ্যালয় তালিকাভুক্ত</span>
          </div>
        </div>
      </div>

      {/* Discovered Circulars Alert (If any newly found) */}
      {discoveredCirculars.length > 0 && (
        <div className="mb-6 p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold text-emerald-950">
                {lang === 'bn'
                  ? `ক্রলার কর্তৃক ইন্টারনেট থেকে সদ্য সংগৃহীত ভর্তি সার্কুলার (${discoveredCirculars.length}টি)`
                  : `Newly Discovered Circulars (${discoveredCirculars.length})`}
              </span>
            </div>
            <span className="text-[11px] text-emerald-800 font-medium">
              {lang === 'bn' ? 'গুগল শিটে অন্তর্ভুক্ত করতে পারেন' : 'Ready to sync to Google Sheets'}
            </span>
          </div>

          <div className="space-y-2">
            {discoveredCirculars.map((disc, idx) => (
              <div
                key={idx}
                className="p-3 bg-white rounded-lg border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="font-bold text-slate-900">{disc.universityName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                      {disc.academicSession}
                    </span>
                  </div>
                  {/* Alongside display: List of units in this circular */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-slate-500 text-[11px] font-medium mr-0.5">
                      {lang === 'bn' ? 'ইউনিটসমূহ:' : 'Units:'}
                    </span>
                    {disc.units.map((u, uIdx) => (
                      <span
                        key={uIdx}
                        className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded text-[10px] font-medium border border-slate-200"
                      >
                        {u.unitName}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onSelectDiscovered && (
                    <button
                      onClick={() => onSelectDiscovered(disc)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded font-medium text-xs shadow-2xs transition-colors"
                      title={lang === 'bn' ? 'এই বিশ্ববিদ্যালয়ের ইউনিটগুলো নিচের মূল টেবিলে দেখুন' : 'View in main table'}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'টেবিলে দেখুন' : 'View in Table'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => onSyncDiscoveredToSheet(disc)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-medium text-xs shadow-2xs transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'গুগল শিটে লিখুন' : 'Write to Sheet'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monitored Portals Directory */}
      <div className="mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>{lang === 'bn' ? 'মনিটরকৃত পাবলিক বিশ্ববিদ্যালয়ের তালিকা' : 'Monitored Public Universities Watchlist'}</span>
              <span className="text-xs text-slate-500 font-normal">
                ({filteredUniversities.length} / {universities.length})
              </span>
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 px-2.5 py-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'নতুন বিশ্ববিদ্যালয় যোগ করুন' : 'Add University'}</span>
          </button>
        </div>

        {/* Filter Controls: Search & Category Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-800 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'বিশ্ববিদ্যালয় বা লিংক খুঁজুন...' : 'Search university...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-[460px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100">
              <tr className="border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3.5">{lang === 'bn' ? 'বিশ্ববিদ্যালয়' : 'University'}</th>
                <th className="py-2.5 px-3">{lang === 'bn' ? 'ভর্তি ইউনিটসমূহ (Units)' : 'Admission Units'}</th>
                <th className="py-2.5 px-3">{lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}</th>
                <th className="py-2.5 px-3">{lang === 'bn' ? 'অফিশিয়াল পোর্টাল URL' : 'Official Portal URL'}</th>
                <th className="py-2.5 px-3">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="py-2.5 px-3 text-right">{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredUniversities.map((uni) => {
                const unitTags = getUniversityUnitTags(uni);
                return (
                  <tr key={uni.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3.5">
                      <span className="font-semibold text-slate-900 block">{uni.banglaName}</span>
                      <span className="text-[11px] text-slate-500 block">{uni.name}</span>
                    </td>
                    <td className="py-2.5 px-3 max-w-[220px]">
                      <div className="flex flex-wrap gap-1">
                        {unitTags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-900 border border-emerald-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-slate-600 font-medium text-[11px]">{uni.category}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 max-w-xs truncate">
                      {uni.portalUrl}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${uni.status === 'updated' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        <span className="text-[11px] text-slate-700">
                          {uni.status === 'updated'
                            ? lang === 'bn' ? 'আপডেট প্রাপ্ত' : 'Updated'
                            : lang === 'bn' ? 'নিয়মিত পর্যবেক্ষণে' : 'Monitored'}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onSelectUniversity && (
                          <button
                            type="button"
                            onClick={() => onSelectUniversity(uni)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-all"
                            title={lang === 'bn' ? 'এই বিশ্ববিদ্যালয়ের ইউনিটগুলো নিচের টেবিলে দেখুন' : 'View units in main table'}
                          >
                            <Building2 className="w-3 h-3 text-emerald-700" />
                            <span>{lang === 'bn' ? 'ইউনিট দেখুন' : 'View Units'}</span>
                          </button>
                        )}
                        <a
                          href={uni.portalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-slate-400 hover:text-emerald-700 inline-flex items-center justify-center rounded"
                          title="Visit official portal"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredUniversities.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    {lang === 'bn' ? 'কোনো বিশ্ববিদ্যালয় খুঁজে পাওয়া যায়নি।' : 'No universities matched your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Logs Accordion */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowLogs(!showLogs)}
          className="flex items-center justify-between w-full text-xs font-semibold text-slate-700 hover:text-slate-900"
        >
          <span>{lang === 'bn' ? 'দৈনিক ক্রলার এক্সিকিউশন হিস্ট্রি ও অডিট লগ' : 'Crawler Execution History & Audit Logs'} ({logs.length})</span>
          {showLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showLogs && (
          <div className="mt-3 space-y-2 text-xs">
            {logs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                  <span className="font-mono">{formatDateTime(log.runAt)}</span>
                  <span className="uppercase font-semibold tracking-wider">{log.triggerType === 'scheduled' ? 'Scheduled Auto-Run' : 'Manual Scan'}</span>
                </div>
                <p className="text-slate-800 text-xs">{log.details}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Custom University Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full shadow-lg border border-slate-200 p-5">
            <h3 className="font-bold text-base text-slate-900 mb-3">
              {lang === 'bn' ? 'নতুন বিশ্ববিদ্যালয় পর্যবেক্ষণ তালিকায় যোগ করুন' : 'Add University to Daily Watchlist'}
            </h3>
            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  {lang === 'bn' ? 'বিশ্ববিদ্যালয়ের নাম (English)' : 'University Name (English)'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Khulna University"
                  value={newUniName}
                  onChange={(e) => setNewUniName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  {lang === 'bn' ? 'বাংলায় নাম' : 'Bangla Name'}
                </label>
                <input
                  type="text"
                  placeholder="যেমন: খুলনা বিশ্ববিদ্যালয়"
                  value={newUniBangla}
                  onChange={(e) => setNewUniBangla(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  {lang === 'bn' ? 'অফিশিয়াল ভর্তি ওয়েবসাইটের লিংক (URL)' : 'Official Admission Website URL'}
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://ku.ac.bd/admission"
                  value={newUniUrl}
                  onChange={(e) => setNewUniUrl(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 font-mono"
                />
              </div>
              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  {lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                </label>
                <select
                  value={newUniCategory}
                  onChange={(e) => setNewUniCategory(e.target.value as any)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 bg-white"
                >
                  <option value="General">General (সাধারণ)</option>
                  <option value="Engineering">Engineering (প্রকৌশল)</option>
                  <option value="Cluster">Cluster (গুচ্ছ)</option>
                  <option value="Science & Tech">Science & Tech (বিজ্ঞান ও প্রযুক্তি)</option>
                  <option value="Agricultural">Agricultural (কৃষি)</option>
                  <option value="Medical">Medical (মেডিকেল)</option>
                  <option value="Specialized">Specialized (বিশেষায়িত ও জাতীয়)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-slate-600 bg-slate-100 rounded hover:bg-slate-200"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-medium shadow-2xs"
                >
                  {lang === 'bn' ? 'ওয়াচলিস্টে সেভ করুন' : 'Save to Watchlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
