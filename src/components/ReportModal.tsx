import React from 'react';
import { X, Printer, Download, FileText, CheckCircle2, Sprout } from 'lucide-react';
import { ActiveDatasetState } from '../types/dataset';

interface ReportModalProps {
  dataset: ActiveDatasetState;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ dataset, onClose }) => {
  const { filename, classification, summary, analysis, modelResult } = dataset;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReportText = () => {
    const reportLines = [
      `========================================================================`,
      `CROPYIELD AI - COMPREHENSIVE AGRICULTURAL INTELLIGENCE REPORT`,
      `Project: An XGBoost-Based Predictive Framework for Crop Yield Estimation`,
      `Generated: ${new Date().toLocaleString()}`,
      `Dataset: ${filename}`,
      `Category: ${classification.category}`,
      `========================================================================\n`,
      `1. DATASET SCHEMA & PREPROCESSING SUMMARY:`,
      `- Original Records: ${summary.originalRecords}`,
      `- Cleaned Records: ${summary.cleanedRecords}`,
      `- Missing Values Imputed: ${summary.missingValuesCount}`,
      `- Duplicate Records Deduplicated: ${summary.duplicateRecords}`,
      `- Empty Columns Pruned: ${summary.emptyColumnsRemoved.join(', ') || 'None'}`,
      `- Converted Percentage Columns: ${summary.convertedPercentageColumns.join(', ') || 'None'}`,
      `- Features Ingested: ${dataset.headers.join(', ')}\n`,
      `2. MODEL STATUS & PREDICTIVE METRICS:`,
      `- Model Architecture: XGBoost Regressor (Gradient Boosted Decision Trees)`,
      `- Training Status: ${modelResult.isTrained ? 'TRAINED & EVALUATED' : 'INACTIVE (EDA MODE)'}`,
      modelResult.isTrained
        ? [
            `- Target Variable: ${modelResult.targetColumn} (${modelResult.targetUnit})`,
            `- Holdout R² Score: ${modelResult.metrics.r2Score}`,
            `- Root Mean Squared Error (RMSE): ${modelResult.metrics.rmse} ${modelResult.targetUnit}`,
            `- Mean Absolute Error (MAE): ${modelResult.metrics.mae} ${modelResult.targetUnit}`,
            `- Top Predictive Driver: ${modelResult.featureImportance[0]?.feature || 'N/A'} (${modelResult.featureImportance[0]?.importance || 0}%)`
          ].join('\n')
        : `- Explanation: ${modelResult.requiredColumnsExplanation}\n`,
      `3. AGRICULTURAL INSIGHTS & EVIDENCE-BASED OBSERVATIONS:`,
      ...analysis.insights.map((ins, i) => `${i + 1}. [${ins.title.toUpperCase()}]\n   Observation: ${ins.observation}\n   Agronomic Recommendation: ${ins.recommendation}\n`),
      `4. CROP DISTRIBUTION SUMMARY:`,
      ...analysis.cropDistribution.map(c => `- ${c.crop}: ${c.count} records (${c.percentage}%)`),
      `\n========================================================================`,
      `Report End - CropYield AI Framework`
    ];

    const blob = new Blob([reportLines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CropYield_Report_${filename.replace(/\.[^/.]+$/, '')}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Modal Top Bar */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-none">
                Agricultural Intelligence Report
              </h2>
              <div className="text-[11px] text-slate-500 mt-1 leading-none">
                {filename} · Generated {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={handleDownloadReportText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export TXT</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 print:p-0">
          {/* Header Info */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Category</div>
              <div className="font-bold text-slate-900 mt-0.5">{classification.category}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Cleaned Records</div>
              <div className="font-bold text-slate-900 font-mono mt-0.5">{summary.cleanedRecords.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Features Ingested</div>
              <div className="font-bold text-slate-900 font-mono mt-0.5">{dataset.headers.length} attributes</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Model Status</div>
              <div className="font-bold text-emerald-700 mt-0.5">
                {modelResult.isTrained ? `XGBoost (R² ${modelResult.metrics.r2Score})` : 'EDA Mode'}
              </div>
            </div>
          </div>

          {/* Model Evaluation Summary */}
          {modelResult.isTrained ? (
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">
                1. XGBoost Model Diagnostics &amp; Performance
              </h3>
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-lg bg-emerald-50/40 border border-emerald-200">
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">R² Score (Variance Explained)</div>
                  <div className="text-xl font-bold text-slate-900 font-mono">{modelResult.metrics.r2Score}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">Root Mean Squared Error (RMSE)</div>
                  <div className="text-xl font-bold text-slate-900 font-mono">{modelResult.metrics.rmse} {modelResult.targetUnit}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-medium">Mean Absolute Error (MAE)</div>
                  <div className="text-xl font-bold text-slate-900 font-mono">{modelResult.metrics.mae} {modelResult.targetUnit}</div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Trained on {modelResult.trainRecordCount} samples and evaluated on {modelResult.testRecordCount} unseen holdout test samples using {modelResult.trees.length} sequential boosting rounds with learning rate η = {modelResult.hyperparameters.learningRate}.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 space-y-1">
              <div className="font-bold text-amber-950 text-xs">
                Predictive Model Training Notice
              </div>
              <p className="text-[11px] text-amber-900">
                {modelResult.requiredColumnsExplanation}
              </p>
            </div>
          )}

          {/* Agricultural Insights */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">
              2. Evidence-Based Agronomic Insights
            </h3>
            <div className="space-y-2">
              {analysis.insights.map((ins, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{ins.title}</span>
                    <span className="text-[10px] uppercase font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {ins.isEmpirical ? 'Data-Driven' : 'Agronomic Guidance'}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-normal">{ins.observation}</p>
                  <p className="text-slate-500 text-[11px]">
                    <strong className="text-slate-700">Recommendation:</strong> {ins.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Preprocessing Operations Log */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">
              3. Data Preprocessing &amp; Cleansing Operations
            </h3>
            <ul className="space-y-1 text-slate-600 list-disc list-inside">
              <li>
                Empty column pruning: {summary.emptyColumnsRemoved.length > 0 ? summary.emptyColumnsRemoved.join(', ') : 'None detected.'}
              </li>
              <li>
                Percentage strings converted to float values: {summary.convertedPercentageColumns.length > 0 ? summary.convertedPercentageColumns.join(', ') : 'None detected.'}
              </li>
              <li>
                Imputed missing observations: {summary.missingValuesCount} values handled via central tendency imputation.
              </li>
              <li>
                Deduplicated identical records: {summary.duplicateRecords} duplicate rows purged.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
