# University Admission Notice Extractor & Google Sheets Sync

An intelligent web application that extracts university admission schedules, unit fees, application deadlines, and exam dates from official websites, newspaper notices, or circular images, and syncs them directly into formatted Google Sheets.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions have been confirmed based on your preferences:
> - **Input Flexibility**: Multi-modal intake supporting live Website URLs (with server-side fetcher), raw Bengali/English circular text paste, and image uploads (newspaper clippings, circular notices).
> - **Google Sheets Sync**: Direct Google Account sign-in via Google Workspace OAuth (`spreadsheets` and `drive.file` scopes) with 1-click automatic creation of structured spreadsheets and instant append, plus CSV export fallback.
> - **Extracted Information Focus**: Streamlined focus on essential fields: **University Name**, **Unit / Faculty**, **Application Start Date**, **Application End Date**, **Exam Date & Time**, and **Unit Fee (BDT)**.

---

## 1. Overview & Core Concept

- **What It Does**: Automates the tedious manual task of reading lengthy university admission circulars and newspaper snippets. Users can drop a URL, paste notice text, or upload a photo of a newspaper circular. The application extracts unit-by-unit dates and fees using Gemini 3.8 Flash and writes them directly into a user's Google Sheet with a single click.
- **Target Audience**: Students, parents, admission coaching mentors, and educational journalists tracking Bangladesh and international university admission deadlines.
- **Key Value**: Eliminates missed deadlines and calculation errors by transforming unstructured notices into a live, synced Google Sheet tracker.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Intake Flow**:
   - The user selects an intake tab: **Website URL**, **Paste Circular Text**, or **Upload Circular Image**.
   - Includes quick-test sample circulars (e.g., Dhaka University 2024-25, BUET, GST Cluster, Medical College admission circulars) for instant 1-click testing.
   - User clicks **"Extract Admission Details"**.
2. **Review & Verification Grid**:
   - The system displays extracted units in a clean tabular grid:
     - University & Academic Session
     - Unit / Stream (A, B, C, IBA, etc.)
     - Application Window (Start Date → End Date)
     - Admission Exam Date
     - Application Fee in BDT (with currency formatting and tabular figures)
   - Inline editing capability if the user wants to adjust any date or fee before syncing.
3. **Google Sheets Sync**:
   - User clicks **"Sign in with Google"** (official GSI styled button).
   - User clicks **"Create & Sync to Google Sheet"** (or selects an existing Sheet ID).
   - The app creates a styled spreadsheet with frozen headers, green accent header styling, and formatted columns.
   - Provides an immediate "Open in Google Sheets" link and auto-saves the Sheet ID for subsequent appends.
   - Also offers **"Download CSV"** for offline use.

### Visual Identity & Theme
- **Aesthetic Direction**: Contemporary SaaS dashboard following the Universal Frontend Design Constitution (60-30-10 color balance, zero-pill metadata, single-elevation surfaces).
- **Color Palette**:
  - Canvas (60%): Clean off-white `#F8FAFC` / dark `#0F172A`
  - Structural Surfaces (30%): Pure white `#FFFFFF` / slate `#1E293B` with hairline borders (`#E2E8F0` / `#334155`)
  - Accent (10%): Academic Emerald (`#059669` / `#10B981`) representing university enrollment and active deadlines, with subtle amber (`#D97706`) for imminent deadlines.
- **Typography**:
  - Display & Headings: `Plus Jakarta Sans`
  - Body & Form Controls: `DM Sans`
  - Tabular Dates, Amounts & Deadlines: `JetBrains Mono` / `tabular-nums`
- **Bilingual Interface**: Seamless toggle between Bengali (বাংলা) and English (ইংরেজি) to accommodate native admission notices.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Server-Side Gemini 3.8 Flash for Structured Extraction**
  - *Chosen Approach*: Node/Express server route `/api/extract` calling `@google/genai` with `gemini-3.8-flash` and structured JSON schema (`responseMimeType: "application/json"`).
  - *Why*: Handles Bengali, English, and mixed Bengali-English script with high fidelity; processes image circulars natively via multimodal inlineData; server proxy keeps API keys secure.
  - *Alternatives Considered*: Client-side regex parsing (fails on diverse newspaper layouts and varying Bengali date formats like "১০ নভেম্বর হতে ২০ ডিসেম্বর").
- **Decision 2: Direct Client-Side Google Sheets API via Firebase Auth**
  - *Chosen Approach*: Official Firebase Google Auth with `https://www.googleapis.com/auth/spreadsheets` and `https://www.googleapis.com/auth/drive.file` scopes. Access token cached in memory and used for direct Google Sheets REST calls.
  - *Why*: Complies with AI Studio OAuth guidelines (no server-side redirect flows that trigger `redirect_uri_mismatch`). Gives the user immediate ownership of the spreadsheet in their personal Google Drive.
- **Decision 3: Server-Side URL Content Fetcher**
  - *Chosen Approach*: `/api/fetch-url` backend proxy to safely retrieve HTML and text from university domains, bypassing browser CORS restrictions.
- **Decision 4: Preset Circular Showcase**
  - *Chosen Approach*: Built-in verified sample circulars (Dhaka University, BUET, Chittagong University, GST) for instant zero-friction demonstration without requiring file uploads.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          React Frontend (Vite)                         │
│                                                                        │
│  ┌───────────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │ Intake Section        │  │ Data Review Grid│  │ Google Sync Bar  │  │
│  │ • URL Input           │  │ • Unit Breakdowns│  │ • GSI Auth Button│  │
│  │ • Raw Text Area       │  │ • Inline Edits  │  │ • Sync to Sheets │  │
│  │ • Image File Dropzone │  │ • Tabular Figures│  │ • CSV Download   │  │
│  └───────────┬───────────┘  └────────▲────────┘  └────────┬─────────┘  │
└──────────────┼───────────────────────┼────────────────────┼────────────┘
               │                       │                    │
               ▼                       │                    ▼
┌─────────────────────────────────┐    │    ┌────────────────────────────┐
│      Express Backend API        │    │    │   Google Sheets REST API   │
│                                 │    │    │                            │
│  ┌───────────────────────────┐  │    │    │  • spreadsheets.create     │
│  │ POST /api/extract         │  │    │    │  • spreadsheets.values     │
│  │ • Gemini 3.8 Flash Engine ├──┼────┘    │    .append                 │
│  │ • Multimodal (Text/Image) │  │         │                            │
│  └───────────────────────────┘  │         │ (Uses Firebase Auth Bearer │
│  ┌───────────────────────────┐  │         │  Token directly in browser)│
│  │ POST /api/fetch-url       │  │         └────────────────────────────┘
│  │ • Web scraper & cleaner   │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### Data Schema (Extracted Admission Record)

```typescript
export interface AdmissionUnit {
  id: string;
  unitName: string;          // e.g., "Ka Unit (Science)", "Unit A", "Faculty of Arts"
  facultyOrGroup: string;    // e.g., "Faculty of Science & Engineering"
  applicationStartDate: string; // e.g., "2025-11-04" or "04 Nov 2025"
  applicationEndDate: string;   // e.g., "2025-11-25" or "25 Nov 2025"
  examDate: string;             // e.g., "2025-12-20, 10:00 AM"
  feeAmount: number;            // e.g., 1050
  feeCurrency: string;          // "BDT"
  eligibilitySummary?: string;  // Brief GPA or criteria if mentioned
}

export interface UniversityAdmissionData {
  universityName: string;       // e.g., "University of Dhaka (ঢাকা বিশ্ববিদ্যালয়)"
  academicYear: string;         // e.g., "2024-2025"
  officialWebsiteUrl?: string;  // e.g., "https://admission.eis.du.ac.bd"
  sourceTitle: string;          // Notice title
  extractedAt: string;          // ISO timestamp
  units: AdmissionUnit[];
}
```

### Google Sheets Format Specification
- **Spreadsheet Title**: `[University Name] Admission Tracker [Academic Year]`
- **Header Row**:
  `["University", "Unit / Stream", "Application Start", "Application End", "Exam Date", "Fee (BDT)", "Eligibility / Notes", "Source URL", "Extracted Date"]`
- **Formatting**:
  - Dark emerald header background `#064E3B` with bold white text.
  - Frozen top row (`frozenRowCount: 1`).
  - Formatted currency columns and auto-resized column widths.

---

## 5. Execution Steps Once Approved

1. **OAuth Setup**: Execute `set_up_oauth` for Google Sheets (`https://www.googleapis.com/auth/spreadsheets` and `https://www.googleapis.com/auth/drive.file`).
2. **Backend Server (`server.ts`)**: Implement `/api/extract` with `@google/genai` (`gemini-3.8-flash`) and `/api/fetch-url` with safe scraping.
3. **Frontend Implementation**:
   - Google Auth provider & token manager.
   - Intake modules (URL scraper, text input, image upload dropzone with preview).
   - Sample circular library (DU, BUET, GST, Medical) for immediate testing.
   - High-density data grid with editable cells and status badges.
   - Google Sheets sync engine (auto-create sheet, append rows, direct link).
   - Export utilities (CSV download, clipboard copy).
4. **Build & Compilation Verification**: Run `compile_applet` and test end-to-end.
