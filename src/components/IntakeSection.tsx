import React, { useState, useRef } from 'react';
import {
  Link2,
  FileText,
  Image as ImageIcon,
  Sparkles,
  UploadCloud,
  X,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { SAMPLE_CIRCULARS, SampleCircular } from '../data/sampleCirculars';
import { ExtractionRequest } from '../types/admission';

interface IntakeSectionProps {
  onExtract: (request: ExtractionRequest) => void;
  isExtracting: boolean;
  lang: 'bn' | 'en';
}

export const IntakeSection: React.FC<IntakeSectionProps> = ({
  onExtract,
  isExtracting,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'text' | 'image'>('text');
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState(SAMPLE_CIRCULARS[0].sampleText);
  const [selectedImage, setSelectedImage] = useState<{
    dataUrl: string;
    fileName: string;
    fileSize: string;
    mimeType: string;
  } | null>(null);
  const [activeSampleId, setActiveSampleId] = useState<string>('du-2024-25');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectSample = (sample: SampleCircular) => {
    setActiveSampleId(sample.id);
    if (activeTab === 'url') {
      setUrlInput(sample.officialUrl);
    } else {
      setTextInput(sample.sampleText);
    }
  };

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে একটি ছবি ফাইল আপলোড করুন (JPG, PNG, WebP)' : 'Please select an image file (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      alert(lang === 'bn' ? 'ছবির সাইজ ১২ মেগাবাইট বা তার কম হতে হবে।' : 'Image size must be 12MB or less.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage({
        dataUrl: reader.result as string,
        fileName: file.name,
        fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'url') {
      if (!urlInput.trim()) return;
      onExtract({ type: 'url', content: urlInput.trim() });
    } else if (activeTab === 'text') {
      if (!textInput.trim()) return;
      onExtract({ type: 'text', content: textInput.trim() });
    } else if (activeTab === 'image') {
      if (!selectedImage) return;
      onExtract({
        type: 'image',
        content: selectedImage.dataUrl,
        mimeType: selectedImage.mimeType,
      });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6 mb-8">
      {/* Header and Quick Samples Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>{lang === 'bn' ? 'ভর্তি বিজ্ঞপ্তি ইনপুট ও এক্সট্রাকশন' : 'Admission Circular Intake'}</span>
          </h2>
          <p className="text-xs text-slate-700 mt-0.5">
            {lang === 'bn'
              ? 'পত্রিকার কাটিং, অফিশিয়াল ওয়েবসাইট বা সার্কুলার টেক্সট থেকে ইউনিটভিত্তিক ডেট ও ফিস বের করুন'
              : 'Extract unit application windows, exam dates, and fees from newspapers or official university websites'}
          </p>
        </div>

        {/* Quick Test Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-700 mr-1 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-800" />
            {lang === 'bn' ? 'নমুনা সার্কুলার:' : 'Presets:'}
          </span>
          {SAMPLE_CIRCULARS.map((s) => {
            const isSelected = activeSampleId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectSample(s)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  isSelected
                    ? 'bg-emerald-800 text-white shadow-xs font-semibold'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                {s.university.split('(')[0].trim().replace('University of ', '').replace('Bangladesh University of Engineering and Technology', 'BUET')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mt-5 mb-5 p-1 bg-slate-100 rounded-lg max-w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('text')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === 'text'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'সার্কুলার টেক্সট (Notice Text)' : 'Circular Text'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === 'url'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'ওয়েবসাইট লিংক (Website URL)' : 'Website URL'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('image')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === 'image'
              ? 'bg-white text-slate-900 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'পত্রিকার কাটিং / ছবি (Image)' : 'Circular Image'}</span>
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit}>
        {/* Tab 1: Notice Text */}
        {activeTab === 'text' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="circular-text" className="text-xs font-medium text-slate-700">
                {lang === 'bn'
                  ? 'ভর্তি বিজ্ঞপ্তির বিবরণ বা নোটিশ পেস্ট করুন:'
                  : 'Paste admission circular text or press release:'}
              </label>
              <button
                type="button"
                onClick={() => setTextInput('')}
                className="text-xs text-slate-400 hover:text-rose-600 transition-colors"
              >
                {lang === 'bn' ? 'মুছে ফেলুন' : 'Clear'}
              </button>
            </div>
            <textarea
              id="circular-text"
              rows={8}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'যেমন: ঢাকা বিশ্ববিদ্যালয় আন্ডারগ্র্যাজুয়েট ভর্তি বিজ্ঞপ্তি ২০২৪-২৫... আবেদন শুরু ০৪ নভেম্বর, শেষ ২৫ নভেম্বর, ফি ১,০৫০ টাকা...'
                  : 'Paste university admission circular details here...'
              }
              className="w-full p-3.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all font-mono leading-relaxed"
            />
          </div>
        )}

        {/* Tab 2: Website URL */}
        {activeTab === 'url' && (
          <div>
            <label htmlFor="circular-url" className="text-xs font-medium text-slate-700 block mb-2">
              {lang === 'bn'
                ? 'বিশ্ববিদ্যালয়ের ভর্তি পোর্টাল বা নোটিশের ওয়েব ঠিকানা (URL):'
                : 'University admission portal or notice URL:'}
            </label>
            <div className="relative">
              <input
                id="circular-url"
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://admission.eis.du.ac.bd"
                className="w-full pl-4 pr-10 py-3 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all"
              />
              {urlInput && (
                <a
                  href={urlInput.startsWith('http') ? urlInput : `https://${urlInput}`}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  title="Open link"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {lang === 'bn'
                ? 'টিপস: যে পৃষ্ঠায় আবেদনের সময়সূচি ও ফি দেওয়া আছে সেই পৃষ্ঠার সরাসরি লিংক দিন।'
                : 'Tip: Provide the direct link to the notice page with unit dates and fee schedules.'}
            </p>
          </div>
        )}

        {/* Tab 3: Circular Image */}
        {activeTab === 'image' && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/webp"
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              className="hidden"
            />

            {!selectedImage ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    handleImageUpload(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/20 rounded-xl p-8 text-center cursor-pointer transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  {lang === 'bn'
                    ? 'পত্রিকার ভর্তি বিজ্ঞপ্তি বা পেপার কাটিং আপলোড করুন'
                    : 'Click or drop newspaper circular / clipping here'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  JPG, PNG, WebP (সর্বোচ্চ ১২ মেগাবাইট)
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedImage.dataUrl}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-900 block truncate max-w-xs">
                      {selectedImage.fileName}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {selectedImage.fileSize}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200 transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {lang === 'bn'
              ? 'Gemini 3.8 Flash দিয়ে স্বয়ংক্রিয় তারিখ ও ফি এক্সট্রাক্ট করা হবে'
              : 'Extraction powered by Gemini 3.8 Flash model'}
          </span>

          <button
            type="submit"
            disabled={
              isExtracting ||
              (activeTab === 'url' && !urlInput.trim()) ||
              (activeTab === 'text' && !textInput.trim()) ||
              (activeTab === 'image' && !selectedImage)
            }
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
          >
            {isExtracting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>{lang === 'bn' ? 'তথ্য এক্সট্রাক্ট হচ্ছে...' : 'Extracting Data...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{lang === 'bn' ? 'তথ্য এক্সট্রাক্ট করুন' : 'Extract Admission Details'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
