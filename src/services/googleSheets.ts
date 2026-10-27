import { UniversityAdmissionData, AdmissionUnit } from '../types/admission';

export interface SpreadsheetSyncResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  rowsAdded: number;
  rowsUpdated?: number;
  duplicatesSkipped?: number;
  message?: string;
}

export interface ExistingSpreadsheet {
  id: string;
  name: string;
  webViewLink?: string;
  modifiedTime?: string;
}

const HEADERS = [
  'University',
  'Unit / Stream',
  'Faculty / Department',
  'Application Start Date',
  'Application End Date',
  'Admission Exam Date',
  'Application Fee (BDT)',
  'Eligibility / Notes',
  'Source / Notice URL',
  'Extracted Date',
];

/**
 * Normalizes text strings for duplicate detection (removes whitespace, punctuation, case)
 */
export function normalizeKey(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[\(\)\[\]\{\}\-_/\\,.:;]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Deduplicate units array within a single dataset
 */
export function deduplicateUnits(units: AdmissionUnit[]): AdmissionUnit[] {
  const seen = new Set<string>();
  return units.filter((unit) => {
    const key = normalizeKey(unit.unitName);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Creates a brand-new formatted Google Sheet in the user's Google Drive
 * and populates it with deduplicated admission units.
 */
export async function createAdmissionSpreadsheet(
  accessToken: string,
  data: UniversityAdmissionData
): Promise<SpreadsheetSyncResult> {
  const title = `${data.universityName || 'University'} Admission Tracker ${data.academicSession || '2024-25'}`;
  const sheetTitle = 'Admission Details';

  // Deduplicate units before initial creation
  const uniqueUnits = deduplicateUnits(data.units);

  // 1. Create Spreadsheet with basic structure and styling
  const createPayload = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: sheetTitle,
          gridProperties: {
            frozenRowCount: 1,
            rowCount: Math.max(uniqueUnits.length + 15, 25),
            columnCount: 10,
          },
        },
      },
    ],
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    const errorData = await createRes.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to create Google Spreadsheet.');
  }

  const createdSheet = await createRes.json();
  const spreadsheetId = createdSheet.spreadsheetId;
  const sheetId = createdSheet.sheets?.[0]?.properties?.sheetId ?? 0;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Prepare Rows
  const extractedDateStr = new Date(data.extractedAt || Date.now()).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const rows = [
    HEADERS,
    ...uniqueUnits.map((unit) => [
      data.universityName,
      unit.unitName,
      unit.facultyOrGroup || 'General',
      unit.applicationStartDate || 'Not specified',
      unit.applicationEndDate || 'Not specified',
      unit.examDate || 'Not specified',
      unit.feeAmount ? Number(unit.feeAmount) : 0,
      unit.eligibilitySummary || '-',
      data.officialWebsite || 'Official Circular',
      extractedDateStr,
    ]),
  ];

  // 3. Write rows to the sheet
  const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A1:J${rows.length}?valueInputOption=USER_ENTERED`;
  const appendRes = await fetch(valuesUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: `${sheetTitle}!A1:J${rows.length}`,
      majorDimension: 'ROWS',
      values: rows,
    }),
  });

  if (!appendRes.ok) {
    const appendErr = await appendRes.json().catch(() => ({}));
    throw new Error(appendErr.error?.message || 'Failed to write admission rows into Google Sheet.');
  }

  // 4. Polish format (Header colors, bold text, column sizing)
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          // Header formatting: Dark emerald background, white bold text
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 10,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.02, green: 0.38, blue: 0.28 }, // #065F46
                  textFormat: {
                    foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                    bold: true,
                    fontSize: 10,
                  },
                  horizontalAlignment: 'CENTER',
                  verticalAlignment: 'MIDDLE',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
            },
          },
          // Currency formatting for Column G (Fee)
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: 1,
                endRowIndex: rows.length,
                startColumnIndex: 6,
                endColumnIndex: 7,
              },
              cell: {
                userEnteredFormat: {
                  numberFormat: {
                    type: 'CURRENCY',
                    pattern: '৳ #,##0',
                  },
                  horizontalAlignment: 'RIGHT',
                },
              },
              fields: 'userEnteredFormat(numberFormat,horizontalAlignment)',
            },
          },
          // Auto-fit column widths
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: sheetId,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 10,
              },
            },
          },
        ],
      }),
    });
  } catch (formatErr) {
    console.warn('Formatting batch update non-critical warning:', formatErr);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    title,
    rowsAdded: uniqueUnits.length,
    rowsUpdated: 0,
    duplicatesSkipped: data.units.length - uniqueUnits.length,
    message: `নতুন শিট তৈরি করা হয়েছে এবং ${uniqueUnits.length}টি ইউনিট যোগ করা হয়েছে।`,
  };
}

/**
 * Intelligent Smart Sync: Reads existing spreadsheet rows, updates changed data in place,
 * appends ONLY newly added units, and completely prevents duplicates!
 */
export async function appendToExistingSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  data: UniversityAdmissionData
): Promise<{
  updatedRows: number;
  newRowsAdded: number;
  duplicatesSkipped: number;
  spreadsheetUrl: string;
  summaryMessage: string;
}> {
  // 1. Fetch metadata to get the actual first sheet name
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!metaRes.ok) {
    throw new Error('Could not access the existing spreadsheet. Please check permissions.');
  }

  const meta = await metaRes.json();
  const firstSheetName = meta.sheets?.[0]?.properties?.title || 'Sheet1';

  // 2. Read existing spreadsheet rows to detect duplicates
  const readRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(firstSheetName)}!A:J`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  let existingValues: any[][] = [];
  if (readRes.ok) {
    const readJson = await readRes.json();
    existingValues = readJson.values || [];
  }

  const extractedDateStr = new Date(data.extractedAt || Date.now()).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // If sheet is completely empty, insert headers first
  if (existingValues.length === 0) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(firstSheetName)}!A1:J1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: `${firstSheetName}!A1:J1`,
          majorDimension: 'ROWS',
          values: [HEADERS],
        }),
      }
    );
    existingValues = [HEADERS];
  }

  // 3. Map existing rows by (University + UnitName) key
  // Maps composite key -> { rowIndex: number (1-based sheet row index), rowData: string[] }
  const existingMap = new Map<string, { rowIndex: number; rowData: any[] }>();

  for (let i = 1; i < existingValues.length; i++) {
    const row = existingValues[i];
    const uniKey = normalizeKey(row[0] || '');
    const unitKey = normalizeKey(row[1] || '');
    if (uniKey || unitKey) {
      existingMap.set(`${uniKey}:::${unitKey}`, {
        rowIndex: i + 1, // 1-indexed row number in Google Sheets
        rowData: row,
      });
    }
  }

  const uniqueUnits = deduplicateUnits(data.units);
  const rowsToUpdate: { range: string; values: any[][] }[] = [];
  const newRowsToAppend: any[][] = [];
  let duplicatesSkipped = 0;

  const currentUniKey = normalizeKey(data.universityName);

  for (const unit of uniqueUnits) {
    const unitKey = normalizeKey(unit.unitName);
    const compositeKey = `${currentUniKey}:::${unitKey}`;

    const existingEntry = existingMap.get(compositeKey);

    if (existingEntry) {
      // Row already exists! Check if application dates, exam date, or fee have updated
      const existingRow = existingEntry.rowData;
      const exStart = (existingRow[3] || '').trim();
      const exEnd = (existingRow[4] || '').trim();
      const exExam = (existingRow[5] || '').trim();
      const exFee = String(existingRow[6] || '').replace(/[^0-9]/g, '');
      const newFee = String(unit.feeAmount || 0);

      const hasChanged =
        exStart !== (unit.applicationStartDate || '').trim() ||
        exEnd !== (unit.applicationEndDate || '').trim() ||
        exExam !== (unit.examDate || '').trim() ||
        exFee !== newFee;

      if (hasChanged) {
        // Update the existing row in place without duplicating!
        rowsToUpdate.push({
          range: `${firstSheetName}!A${existingEntry.rowIndex}:J${existingEntry.rowIndex}`,
          values: [
            [
              data.universityName,
              unit.unitName,
              unit.facultyOrGroup || existingRow[2] || 'General',
              unit.applicationStartDate || exStart,
              unit.applicationEndDate || exEnd,
              unit.examDate || exExam,
              unit.feeAmount ? Number(unit.feeAmount) : Number(exFee) || 0,
              unit.eligibilitySummary || existingRow[7] || '-',
              data.officialWebsite || existingRow[8] || 'Official Circular',
              extractedDateStr,
            ],
          ],
        });
      } else {
        // Exactly identical data: SKIP to prevent duplicate row creation!
        duplicatesSkipped++;
      }
    } else {
      // Brand new unit not currently in the spreadsheet: Collect to append
      newRowsToAppend.push([
        data.universityName,
        unit.unitName,
        unit.facultyOrGroup || 'General',
        unit.applicationStartDate || 'Not specified',
        unit.applicationEndDate || 'Not specified',
        unit.examDate || 'Not specified',
        unit.feeAmount ? Number(unit.feeAmount) : 0,
        unit.eligibilitySummary || '-',
        data.officialWebsite || 'Official Circular',
        extractedDateStr,
      ]);

      // Add to map so subsequent duplicate units in same request won't double
      existingMap.set(compositeKey, {
        rowIndex: existingValues.length + newRowsToAppend.length,
        rowData: [],
      });
    }
  }

  // 4. Execute In-Place Updates for changed rows
  if (rowsToUpdate.length > 0) {
    const batchUpdateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: rowsToUpdate,
        }),
      }
    );

    if (!batchUpdateRes.ok) {
      console.warn('Batch update of existing rows encountered an issue:', await batchUpdateRes.text());
    }
  }

  // 5. Append ONLY genuinely new rows
  if (newRowsToAppend.length > 0) {
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(firstSheetName)}!A:J:append?valueInputOption=USER_ENTERED`;
    const appendRes = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `${firstSheetName}!A:J`,
        majorDimension: 'ROWS',
        values: newRowsToAppend,
      }),
    });

    if (!appendRes.ok) {
      const err = await appendRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to append new rows to existing Google Sheet.');
    }
  }

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  let summaryMessage = '';
  if (newRowsToAppend.length > 0 && rowsToUpdate.length > 0) {
    summaryMessage = `${newRowsToAppend.length}টি নতুন ইউনিট যোগ করা হয়েছে এবং ${rowsToUpdate.length}টি বিদ্যমান ইউনিটের তথ্য আপডেট করা হয়েছে। ${duplicatesSkipped}টি অপরিবর্তিত তথ্য ডুপ্লিকেট হিসেবে বাদ দেওয়া হয়েছে।`;
  } else if (newRowsToAppend.length > 0) {
    summaryMessage = `${newRowsToAppend.length}টি নতুন ইউনিট সফলভাবে যোগ করা হয়েছে। ${duplicatesSkipped}টি পূর্ববর্তী ইউনিট ডুপ্লিকেট হিসেবে বাদ দেওয়া হয়েছে।`;
  } else if (rowsToUpdate.length > 0) {
    summaryMessage = `${rowsToUpdate.length}টি বিদ্যমান ইউনিটের তথ্য আপডেট করা হয়েছে। কোনো ডুপ্লিকেট রো তৈরি করা হয়নি।`;
  } else {
    summaryMessage = `সকল তথ্য ইতিমধ্যেই এই শিটে আপ-টু-ডেট রয়েছে। ${duplicatesSkipped}টি রো যাচাই করা হয়েছে এবং কোনো ডুপ্লিকেট রো যোগ করা হয়নি।`;
  }

  return {
    updatedRows: rowsToUpdate.length,
    newRowsAdded: newRowsToAppend.length,
    duplicatesSkipped,
    spreadsheetUrl,
    summaryMessage,
  };
}

/**
 * Fetches the user's most recent Google Sheets from Google Drive
 */
export async function fetchRecentSheets(accessToken: string): Promise<ExistingSpreadsheet[]> {
  try {
    const q = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
    const fields = encodeURIComponent('files(id,name,webViewLink,modifiedTime)');
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=10&orderBy=modifiedTime%20desc`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      return [];
    }

    const json = await res.json();
    return json.files || [];
  } catch (e) {
    console.error('Error fetching user sheets:', e);
    return [];
  }
}
