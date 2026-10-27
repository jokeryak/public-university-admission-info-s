import React, { useState } from 'react';
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
} from 'lucide-react';

interface AdmissionTableProps {
  data: UniversityAdmissionData;
  onUpdateData: (updated: UniversityAdmissionData) => void;
  lang: 'bn' | 'en';
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

  const handleStartEdit = (unit: AdmissionUnit) => {
    setEditingUnitId(unit.id);
    setEditForm({ ...unit });
  };

  const handleSaveEdit = () => {
    if (!editForm) return;
    const updatedUnits = data.units.map((u) => (u.id === editForm.id ? editForm : u));
    onUpdateData({ ...data, units: updatedUnits });
    setEditingUnitId(null);
    setEditForm(null);
  };

  const handleDeleteUnit = (id: string) => {
    const updatedUnits = data.units.filter((u) => u.id !== id);
    onUpdateData({ ...data, units: updatedUnits });
  };

  const handleAddUnit = () => {
    if (!newUnitForm.unitName) return;
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
  };

  const totalFees = data.units.reduce((acc, curr) => acc + (Number(curr.feeAmount) || 0), 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mb-8">
      {/* Table Header Details */}
      <div className="p-5 md:p-6 border-b border-slate-200 bg-slate-50/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-700 font-medium mb-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-800" />
              <span>{data.academicSession || '২০২৪-২০২৫'} শিক্ষাবর্ষ</span>
              <span aria-hidden="true">·</span>
              <span>{data.units.length} টি ইউনিট অন্তর্ভুক্ত</span>
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

          {/* Metric Summary (Tabular figures, unboxed) */}
          <div className="flex items-center gap-6 text-right">
            <div>
              <span className="text-xs text-slate-700 block">
                {lang === 'bn' ? 'মোট ইউনিট' : 'Total Units'}
              </span>
              <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                {data.units.length}
              </span>
            </div>
            <div className="border-l border-slate-200 pl-6">
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

      {/* High-Density Data Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4 w-44">{lang === 'bn' ? 'ইউনিট ও অনুষদ' : 'Unit & Faculty'}</th>
              <th className="py-3 px-4">{lang === 'bn' ? 'আবেদন শুরু' : 'Apply Start'}</th>
              <th className="py-3 px-4">{lang === 'bn' ? 'আবেদন শেষ (ডেডলাইন)' : 'Apply End'}</th>
              <th className="py-3 px-4">{lang === 'bn' ? 'ভর্তি পরীক্ষার তারিখ' : 'Exam Schedule'}</th>
              <th className="py-3 px-4 text-right">{lang === 'bn' ? 'আবেদন ফি (BDT)' : 'Fee (BDT)'}</th>
              <th className="py-3 px-4 min-w-[180px]">{lang === 'bn' ? 'যোগ্যতা / শর্তাবলি' : 'Eligibility'}</th>
              <th className="py-3 px-3 text-right w-20">{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {data.units.map((unit) => {
              const isEditing = editingUnitId === unit.id;

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
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={handleSaveEdit}
                          className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingUnitId(null)}
                          className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
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
                  className="hover:bg-slate-50 transition-colors"
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
                  <td className="py-3 px-4 font-mono tabular-nums text-amber-800 font-medium">
                    {unit.applicationEndDate || '-'}
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
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-80 hover:opacity-100">
                      <button
                        onClick={() => handleStartEdit(unit)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                        title={lang === 'bn' ? 'সম্পাদনা করুন' : 'Edit Unit'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUnit(unit.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete Unit'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Empty state */}
            {data.units.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
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
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded"
            >
              {lang === 'bn' ? 'যোগ করুন' : 'Add'}
            </button>
            <button
              onClick={() => setIsAddingUnit(false)}
              className="px-2 py-1 bg-slate-200 text-slate-700 text-xs rounded hover:bg-slate-300"
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
    </div>
  );
};
