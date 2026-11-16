import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  Filter,
  CheckSquare,
  Square,
  ArrowRight,
  Database,
  Sparkles,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import { ActiveDatasetState } from '../types/dataset';
import { getSampleDatasets, DatasetMeta } from '../data/sampleDatasets';
import { parseAndCleanCsv } from '../services/dataCleaner';
import { classifyDataset } from '../services/columnDetector';
import { generateAgriculturalAnalysis } from '../services/agriculturalInsights';
import { trainXGBoostPipeline } from '../services/xgboostEngine';

interface UploadTabProps {
  dataset: ActiveDatasetState | null;
  onDatasetLoaded: (newDataset: ActiveDatasetState) => void;
  onNavigateToAnalysis: () => void;
}

export const UploadTab: React.FC<UploadTabProps> = ({
  dataset,
  onDatasetLoaded,
  onNavigateToAnalysis
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleDatasets = getSampleDatasets();

  // Process raw CSV string into active dataset state
  const handleProcessCsvText = (csvText: string, filename: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Clean and parse
      const cleaned = parseAndCleanCsv(csvText);

      // 2. Classify schema
      const classification = classifyDataset(cleaned.columns);

      // 3. Generate initial agricultural analysis
      const analysis = generateAgriculturalAnalysis(cleaned.rows, cleaned.columns);

      // 4. Default target & features
      const targetColumn = classification.targetColumn;
      const initialFeatures = cleaned.headers.filter(h => h !== targetColumn);

      // 5. Train XGBoost if target detected
      const modelResult = trainXGBoostPipeline(cleaned.rows, targetColumn, initialFeatures);

      const newState: ActiveDatasetState = {
        id: `dataset-${Date.now()}`,
        filename,
        rawCsv: csvText,
        headers: cleaned.headers,
        columns: cleaned.columns,
        rows: cleaned.rows,
        summary: cleaned.summary,
        cleanedCsvString: cleaned.cleanedCsvString,
        classification,
        analysis,
        modelResult,
        selectedTargetColumn: targetColumn,
        selectedFeatures: initialFeatures
      };

      onDatasetLoaded(newState);
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Failed to parse CSV file. Please verify delimiter and structure.');
    }
  };

  // File drop handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      readLocalFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readLocalFile(file);
    }
  };

  const readLocalFile = (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setErrorMessage('Please upload a valid CSV file (.csv).');
      return;
    }
    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      handleProcessCsvText(text, file.name);
    };
    reader.onerror = () => {
      setErrorMessage('Error reading file from disk.');
    };
    reader.readAsText(file);
  };

  // Re-run pipeline when user manually changes target column or features
  const handleTargetChange = (newTarget: string) => {
    if (!dataset) return;
    const isNone = newTarget === 'none' || newTarget === '';
    const actualTarget = isNone ? null : newTarget;

    const updatedFeatures = dataset.headers.filter(h => h !== actualTarget);
    const modelResult = trainXGBoostPipeline(dataset.rows, actualTarget, updatedFeatures);

    const updatedState: ActiveDatasetState = {
      ...dataset,
      selectedTargetColumn: actualTarget,
      selectedFeatures: updatedFeatures,
      classification: {
        ...dataset.classification,
        hasYieldTarget: !!actualTarget,
        targetColumn: actualTarget,
        summaryExplanation: actualTarget
          ? `User selected target column "${actualTarget}". XGBoost regression model trained.`
          : 'Target cleared. Running exploratory analysis only.'
      },
      modelResult
    };

    onDatasetLoaded(updatedState);
  };

  const toggleFeature = (featureName: string) => {
    if (!dataset) return;
    const current = new Set(dataset.selectedFeatures);
    if (current.has(featureName)) {
      current.delete(featureName);
    } else {
      current.add(featureName);
    }
    const updatedFeatures = Array.from(current);
    const modelResult = trainXGBoostPipeline(
      dataset.rows,
      dataset.selectedTargetColumn,
      updatedFeatures
    );

    onDatasetLoaded({
      ...dataset,
      selectedFeatures: updatedFeatures,
      modelResult
    });
  };

  // Download cleaned CSV
  const handleDownloadCleanedCsv = () => {
    if (!dataset) return;
    const blob = new Blob([dataset.cleanedCsvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Cleaned_${dataset.filename}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          CSV Dataset Upload &amp; Schema Ingestion
        </h1>
        <p className="text-xs text-slate-500">
          Upload any agricultural CSV from Kaggle, UCI, government portals, or farm records. Intelligent taxonomy automatically maps columns and handles data quality.
        </p>
      </div>

      {/* Benchmark Datasets Quick Load Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Benchmark Agricultural Datasets (Instant Load)
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            Click any dataset to evaluate universal compatibility
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {sampleDatasets.map(d => {
            const isSelected = dataset?.filename === d.filename;
            return (
              <button
                key={d.id}
                onClick={() => handleProcessCsvText(d.csvData, d.filename)}
                className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-slate-900 truncate" title={d.name}>
                      {d.name}
                    </span>
                    {d.hasYieldTarget && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold shrink-0">
                        Yield
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 line-clamp-2 leading-tight mb-2">
                    {d.description}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-100 pt-1.5">
                  <span>{d.recordsCount} rows</span>
                  <span className="text-emerald-600 font-medium">Load →</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={e => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all bg-white ${
          isDragging ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            {isLoading ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              Drag &amp; drop your agricultural CSV here
            </h3>
            <p className="text-xs text-slate-500">
              Supports Kaggle, UCI, Soil test logs, Weather stations, and customized farm records.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              Browse Local Files
            </button>
          </div>
        </div>
      </div>

      {/* Error Message if any */}
      {errorMessage && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loaded Dataset Inspection & Controls */}
      {dataset && (
        <div className="space-y-6">
          {/* Top Inspection Banner */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>{dataset.filename}</span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {dataset.classification.category}
                    </span>
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {dataset.rows.length.toLocaleString()} records · {dataset.columns.length} columns · UTF-8 Parsed
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadCleanedCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Cleaned CSV</span>
                </button>
                <button
                  onClick={onNavigateToAnalysis}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>Proceed to Analysis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Preprocessing Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Original Records</div>
                <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                  {dataset.summary.originalRecords.toLocaleString()}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Missing Values Imputed</div>
                <div className="text-lg font-bold text-emerald-600 font-mono tabular-nums">
                  {dataset.summary.missingValuesCount}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Duplicates Removed</div>
                <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                  {dataset.summary.duplicateRecords}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Cleaned Records</div>
                <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                  {dataset.summary.cleanedRecords.toLocaleString()}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Empty Columns Pruned</div>
                <div className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                  {dataset.summary.emptyColumnsRemoved.length}
                </div>
                {dataset.summary.emptyColumnsRemoved.length > 0 && (
                  <div className="text-[10px] text-slate-400 truncate" title={dataset.summary.emptyColumnsRemoved.join(', ')}>
                    {dataset.summary.emptyColumnsRemoved.join(', ')}
                  </div>
                )}
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Percentages Converted</div>
                <div className="text-lg font-bold text-purple-600 font-mono tabular-nums">
                  {dataset.summary.convertedPercentageColumns.length}
                </div>
                {dataset.summary.convertedPercentageColumns.length > 0 && (
                  <div className="text-[10px] text-purple-500 truncate" title={dataset.summary.convertedPercentageColumns.join(', ')}>
                    Converted &quot;%&quot; to numbers
                  </div>
                )}
              </div>
            </div>

            {/* Target Column Mapping & Manual Confirmation */}
            <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-950">
                    Target Column (Yield Regression)
                  </span>
                </div>
                <p className="text-xs text-emerald-800 leading-normal">
                  {dataset.classification.summaryExplanation}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <label className="text-xs font-medium text-slate-700 whitespace-nowrap">
                  Selected Target:
                </label>
                <select
                  value={dataset.selectedTargetColumn || 'none'}
                  onChange={e => handleTargetChange(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                >
                  <option value="none">-- None (Exploratory Analysis Only) --</option>
                  {dataset.columns
                    .filter(c => c.dataType === 'numerical' || c.dataType === 'percentage')
                    .map(c => (
                      <option key={c.name} value={c.name}>
                        {c.name} {c.isPotentialTarget ? '★ (Detected Target)' : '(Numerical)'}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Input Features Selector */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Select Model Input Features ({dataset.selectedFeatures.length} of {dataset.headers.filter(h => h !== dataset.selectedTargetColumn).length} selected)
                </span>
                <span className="text-[11px] text-slate-400">
                  Toggle features to include in the XGBoost regression matrix
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {dataset.headers
                  .filter(h => h !== dataset.selectedTargetColumn)
                  .map(feat => {
                    const isChecked = dataset.selectedFeatures.includes(feat);
                    const colMeta = dataset.columns.find(c => c.name === feat);
                    return (
                      <button
                        key={feat}
                        onClick={() => toggleFeature(feat)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                          isChecked
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>{feat}</span>
                        {colMeta?.dataType && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({colMeta.dataType})
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* First 10 Records Data Preview Table */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900">
                  Dataset Preview (First 10 Records)
                </h3>
                <p className="text-xs text-slate-500">
                  Inspecting parsed headers, clean formats, and data values.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                10 of {dataset.rows.length.toLocaleString()} rows
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold w-12 text-center text-slate-400 font-mono">#</th>
                    {dataset.headers.map(h => {
                      const isTarget = h === dataset.selectedTargetColumn;
                      const colMeta = dataset.columns.find(c => c.name === h);
                      return (
                        <th key={h} className={`py-2.5 px-3 font-semibold whitespace-nowrap ${
                          isTarget ? 'bg-emerald-50 text-emerald-800' : ''
                        }`}>
                          <div className="flex items-center gap-1">
                            <span>{h}</span>
                            {isTarget && (
                              <span className="text-[10px] bg-emerald-600 text-white px-1 rounded">Target</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono font-normal">
                            {colMeta?.dataType || 'string'}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dataset.rows.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      {dataset.headers.map(h => {
                        const val = row[h];
                        const isTarget = h === dataset.selectedTargetColumn;
                        const isNum = typeof val === 'number';
                        return (
                          <td
                            key={h}
                            className={`py-2 px-3 whitespace-nowrap ${
                              isNum ? 'font-mono tabular-nums text-right' : 'text-left'
                            } ${isTarget ? 'bg-emerald-50/40 font-semibold text-emerald-950' : 'text-slate-800'}`}
                          >
                            {val !== null && val !== undefined ? String(val) : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
