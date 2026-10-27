import React from 'react';
import { AlertCircle, FileSpreadsheet, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  actionType: 'create' | 'append';
  targetSpreadsheetName: string;
  itemCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  lang: 'bn' | 'en';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  actionType,
  targetSpreadsheetName,
  itemCount,
  onConfirm,
  onCancel,
  lang,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-slate-900">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 text-sm text-slate-600 space-y-3">
          <p>
            {actionType === 'create'
              ? lang === 'bn'
                ? `আপনার গুগল ড্রাইভে একটি নতুন স্প্রেডশিট তৈরি হবে এবং তাতে ${itemCount}টি ইউনিটের ভর্তি তথ্য লেখা হবে:`
                : `A new spreadsheet will be created in your Google Drive and populated with ${itemCount} admission unit(s):`
              : lang === 'bn'
                ? `বিদ্যমান গুগল স্প্রেডশিটে ${itemCount}টি নতুন ভর্তি রো (Row) যোগ করা হবে:`
                : `New ${itemCount} admission row(s) will be appended to the existing spreadsheet:`}
          </p>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-medium flex items-center gap-2 text-xs">
            <span className="font-semibold text-emerald-800">{targetSpreadsheetName}</span>
          </div>

          <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
            <span>
              {lang === 'bn'
                ? 'অনুমোদন নিশ্চিত করার পর সরাসরি আপনার নিজস্ব গুগল ড্রাইভে ফাইলটি সংরক্ষিত হবে।'
                : 'With your confirmation, this data will be written directly to your personal Google Drive.'}
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {lang === 'bn' ? 'বাতিল করুন' : 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors"
          >
            {lang === 'bn' ? 'হ্যাঁ, নিশ্চিত করুন' : 'Confirm & Sync'}
          </button>
        </div>
      </div>
    </div>
  );
};
