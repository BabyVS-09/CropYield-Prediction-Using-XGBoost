/**
 * Data Cleaning & Preprocessing Service
 * Converts percentage strings, removes empty columns, handles duplicates,
 * imputes missing values, and prepares feature matrices.
 */

import Papa from 'papaparse';
import { detectColumnTaxonomy, DetectedColumn } from './columnDetector';

export interface PreprocessSummary {
  originalRecords: number;
  duplicateRecords: number;
  missingValuesCount: number;
  cleanedRecords: number;
  emptyColumnsRemoved: string[];
  convertedPercentageColumns: string[];
  featuresSelected: string[];
  outliersDetected: number;
}

export interface CleanedDataset {
  headers: string[];
  columns: DetectedColumn[];
  rows: Record<string, any>[];
  summary: PreprocessSummary;
  cleanedCsvString: string;
}

export function parseAndCleanCsv(csvText: string): CleanedDataset {
  // 1. Parse CSV with PapaParse
  const parsed = Papa.parse(csvText.trim(), {
    header: true,
    dynamicTyping: false,
    skipEmptyLines: 'greedy'
  });

  const rawRows = parsed.data as Record<string, any>[];
  const originalHeaders = parsed.meta.fields || [];

  if (rawRows.length === 0 || originalHeaders.length === 0) {
    throw new Error('The uploaded CSV file is empty or formatted incorrectly.');
  }

  const originalRecords = rawRows.length;

  // 2. Identify completely empty columns
  const emptyColumnsRemoved: string[] = [];
  const validHeaders: string[] = [];

  for (const h of originalHeaders) {
    if (!h || h.trim() === '') {
      emptyColumnsRemoved.push('(unnamed blank column)');
      continue;
    }
    const hasAnyValue = rawRows.some(row => {
      const val = row[h];
      return val !== null && val !== undefined && String(val).trim() !== '';
    });
    if (!hasAnyValue) {
      emptyColumnsRemoved.push(h);
    } else {
      validHeaders.push(h);
    }
  }

  // 3. Percentage column identification & conversion
  const convertedPercentageColumns: string[] = [];
  for (const h of validHeaders) {
    const values = rawRows.map(r => r[h]);
    const nonEmpty = values.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
    const percentMatches = nonEmpty.filter(v => typeof v === 'string' && v.trim().endsWith('%'));
    if (nonEmpty.length > 0 && percentMatches.length / nonEmpty.length > 0.6) {
      convertedPercentageColumns.push(h);
    }
  }

  // 4. Transform rows: trim strings, parse numbers, convert percentages
  const processedRows: Record<string, any>[] = [];
  let missingValuesCount = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    const cleanRow: Record<string, any> = {};

    for (const h of validHeaders) {
      let val = raw[h];
      if (val === null || val === undefined || String(val).trim() === '') {
        val = null;
        missingValuesCount++;
      } else if (convertedPercentageColumns.includes(h)) {
        // Convert "42.5%" -> 42.5
        const numStr = String(val).replace('%', '').trim();
        val = isNaN(Number(numStr)) ? null : Number(numStr);
        if (val === null) missingValuesCount++;
      } else {
        const strVal = String(val).trim();
        // Check if plain number
        if (!isNaN(Number(strVal)) && strVal !== '') {
          val = Number(strVal);
        } else {
          val = strVal;
        }
      }
      cleanRow[h] = val;
    }
    processedRows.push(cleanRow);
  }

  // 5. Duplicate record detection & deduplication
  const seenFingerprints = new Set<string>();
  const deduplicatedRows: Record<string, any>[] = [];
  let duplicateRecords = 0;

  for (const row of processedRows) {
    const fingerprint = validHeaders.map(h => String(row[h])).join('|||');
    if (seenFingerprints.has(fingerprint)) {
      duplicateRecords++;
    } else {
      seenFingerprints.add(fingerprint);
      deduplicatedRows.push(row);
    }
  }

  // 6. Imputation of missing values
  // Calculate column stats for numerical and modal value for categorical
  const columnImputers: Record<string, any> = {};
  for (const h of validHeaders) {
    const vals = deduplicatedRows.map(r => r[h]).filter(v => v !== null && v !== undefined);
    if (vals.length === 0) continue;

    const numericVals = vals.filter(v => typeof v === 'number') as number[];
    if (numericVals.length / vals.length > 0.75 && numericVals.length > 0) {
      // Mean imputation
      const sum = numericVals.reduce((a, b) => a + b, 0);
      columnImputers[h] = +(sum / numericVals.length).toFixed(2);
    } else {
      // Mode imputation
      const counts: Record<string, number> = {};
      vals.forEach(v => {
        const k = String(v);
        counts[k] = (counts[k] || 0) + 1;
      });
      let maxCount = 0;
      let modeVal = String(vals[0]);
      for (const [k, c] of Object.entries(counts)) {
        if (c > maxCount) {
          maxCount = c;
          modeVal = k;
        }
      }
      columnImputers[h] = modeVal;
    }
  }

  // Apply imputation
  const finalRows = deduplicatedRows.map(r => {
    const filled: Record<string, any> = { ...r };
    for (const h of validHeaders) {
      if (filled[h] === null || filled[h] === undefined) {
        filled[h] = columnImputers[h] ?? '';
      }
    }
    return filled;
  });

  // 7. Outlier Detection using IQR on numerical columns
  let outliersDetected = 0;
  for (const h of validHeaders) {
    const nums = finalRows.map(r => r[h]).filter(v => typeof v === 'number') as number[];
    if (nums.length > 8) {
      const sorted = [...nums].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      const lower = q1 - 1.5 * iqr;
      const upper = q3 + 1.5 * iqr;
      const count = sorted.filter(v => v < lower || v > upper).length;
      outliersDetected += count;
    }
  }

  // 8. Generate DetectedColumn metadata
  const detectedColumns: DetectedColumn[] = validHeaders.map(h => {
    const sampleValues = finalRows.slice(0, 10).map(r => r[h]);
    const { standardType, dataType, confidence } = detectColumnTaxonomy(h, sampleValues);
    const uniqueValues = new Set(finalRows.map(r => r[h]));

    return {
      name: h,
      originalName: h,
      standardType,
      dataType,
      missingCount: 0, // already imputed
      uniqueCount: uniqueValues.size,
      sampleValues,
      isPotentialTarget: standardType === 'yield' || (h.toLowerCase().includes('yield') && dataType === 'numerical'),
      confidence
    };
  });

  // 9. Generate Cleaned CSV string
  const cleanedCsvString = Papa.unparse(finalRows, { quotes: true });

  const summary: PreprocessSummary = {
    originalRecords,
    duplicateRecords,
    missingValuesCount,
    cleanedRecords: finalRows.length,
    emptyColumnsRemoved,
    convertedPercentageColumns,
    featuresSelected: validHeaders,
    outliersDetected
  };

  return {
    headers: validHeaders,
    columns: detectedColumns,
    rows: finalRows,
    summary,
    cleanedCsvString
  };
}
