/**
 * Admission Data Types
 */

export interface AdmissionUnit {
  id: string;
  universityName?: string;     // University this unit belongs to (e.g. "ঢাকা বিশ্ববিদ্যালয়")
  unitName: string;            // e.g. "Ka Unit (Science)", "Unit A", "General Unit"
  facultyOrGroup: string;      // e.g. "Faculty of Science & Engineering"
  applicationStartDate: string; // e.g. "11 Nov 2026"
  applicationEndDate: string;   // e.g. "25 Nov 2026"
  examDate: string;             // e.g. "23 Jan 2027, 11:00 AM"
  feeAmount: number;            // e.g. 1050
  feeCurrency: string;          // "BDT"
  eligibilitySummary?: string;  // e.g. "Minimum GPA 8.00 in SSC & HSC combined"
  lastVerified?: string;        // ISO timestamp when this unit's accuracy was verified
  verificationStatus?: 'verified' | 'pending' | 'updated'; // Verification status
  verificationSource?: string;  // Source where verified (e.g. portal URL, circular)
  verificationNotes?: string;   // Notes or audit verification remarks
}

export interface UniversityAdmissionData {
  universityName: string;       // e.g. "University of Dhaka (ঢাকা বিশ্ববিদ্যালয়)"
  academicSession: string;      // e.g. "2026-2027"
  officialWebsite?: string;     // e.g. "https://admission.eis.du.ac.bd"
  sourceTitle: string;          // e.g. "Undergraduate Admission Circular 2026-27"
  extractedAt: string;          // ISO timestamp
  units: AdmissionUnit[];
  rawSummary?: string;          // 1-2 sentence overview in Bengali/English
}

export interface ExtractionRequest {
  type: 'url' | 'text' | 'image';
  content: string;              // URL, raw text, or base64 data URL
  mimeType?: string;            // e.g. "image/jpeg", "image/png" for images
}
