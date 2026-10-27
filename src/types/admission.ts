/**
 * Admission Data Types
 */

export interface AdmissionUnit {
  id: string;
  unitName: string;            // e.g. "Ka Unit (Science)", "Unit A", "General Unit"
  facultyOrGroup: string;      // e.g. "Faculty of Science & Engineering"
  applicationStartDate: string; // e.g. "04 Nov 2024"
  applicationEndDate: string;   // e.g. "25 Nov 2024"
  examDate: string;             // e.g. "20 Dec 2024, 10:00 AM"
  feeAmount: number;            // e.g. 1050
  feeCurrency: string;          // "BDT"
  eligibilitySummary?: string;  // e.g. "Minimum GPA 8.00 in SSC & HSC combined"
}

export interface UniversityAdmissionData {
  universityName: string;       // e.g. "University of Dhaka (ঢাকা বিশ্ববিদ্যালয়)"
  academicSession: string;      // e.g. "2024-2025"
  officialWebsite?: string;     // e.g. "https://admission.eis.du.ac.bd"
  sourceTitle: string;          // e.g. "Undergraduate Admission Circular 2024-25"
  extractedAt: string;          // ISO timestamp
  units: AdmissionUnit[];
  rawSummary?: string;          // 1-2 sentence overview in Bengali/English
}

export interface ExtractionRequest {
  type: 'url' | 'text' | 'image';
  content: string;              // URL, raw text, or base64 data URL
  mimeType?: string;            // e.g. "image/jpeg", "image/png" for images
}
