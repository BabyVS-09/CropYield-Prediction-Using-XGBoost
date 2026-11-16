import React, { useState } from 'react';
import {
  GitCompare,
  ArrowRight,
  Database,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  Sparkles
} from 'lucide-react';
import { getSampleDatasets, DatasetMeta } from '../data/sampleDatasets';
import { parseAndCleanCsv } from '../services/dataCleaner';
import { compareAgriculturalDatasets } from '../services/agriculturalInsights';
import { ActiveDatasetState } from '../types/dataset';

interface DatasetComparisonTabProps {
  currentDataset: ActiveDatasetState | null;
}

export const DatasetComparisonTab: React.FC<DatasetComparisonTabProps> = ({ currentDataset }) => {
  const sampleDatasets = getSampleDatasets();

  const [selectedIdA, setSelectedIdA] = useState<string>(sampleDatasets[0].id);
  const [selectedIdB, setSelectedIdB] = useState<string>(sampleDatasets[1].id);

  const datasetAMeta = sampleDatasets.find(d => d.id === selectedIdA) || sampleDatasets[0];
  const datasetBMeta = sampleDatasets.find(d => d.id === selectedIdB) || sampleDatasets[1];

  // Parse both datasets
  const parsedA = React.useMemo(() => {
    return parseAndCleanCsv(datasetAMeta.csvData);
  }, [datasetAMeta]);

  const parsedB = React.useMemo(() => {
    return parseAndCleanCsv(datasetBMeta.csvData);
  }, [datasetBMeta]);

  const comparison = React.useMemo(() => {
    return compareAgriculturalDatasets(
      { name: datasetAMeta.name, rows: parsedA.rows, columns: parsedA.columns },
      { name: datasetBMeta.name, rows: parsedB.rows, columns: parsedB.columns }
    );
  }, [datasetAMeta, datasetBMeta, parsedA, parsedB]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Agricultural Dataset Comparison Matrix
        </h1>
        <p className="text-xs text-slate-500">
          Compare structural schemas, record volumes, overlapping biophysical attributes, and statistical shifts across datasets.
        </p>
      </div>

      {/* Dataset Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Selector A */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>Dataset A (Baseline)</span>
            </span>
            <span className="text-xs font-mono text-slate-400">
              {parsedA.rows.length.toLocaleString()} rows
            </span>
          </div>

          <select
            value={selectedIdA}
            onChange={e => setSelectedIdA(e.target.value)}
            className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          >
            {sampleDatasets.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.category})
              </option>
            ))}
          </select>

          <p className="text-[11px] text-slate-500 line-clamp-2">
            {datasetAMeta.description}
          </p>
        </div>

        {/* Selector B */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
              <span>Dataset B (Comparison)</span>
            </span>
            <span className="text-xs font-mono text-slate-400">
              {parsedB.rows.length.toLocaleString()} rows
            </span>
          </div>

          <select
            value={selectedIdB}
            onChange={e => setSelectedIdB(e.target.value)}
            className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
          >
            {sampleDatasets.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.category})
              </option>
            ))}
          </select>

          <p className="text-[11px] text-slate-500 line-clamp-2">
            {datasetBMeta.description}
          </p>
        </div>
      </div>

      {/* High-Level Comparison Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Record Difference</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {Math.abs(parsedA.rows.length - parsedB.rows.length).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {parsedA.rows.length > parsedB.rows.length ? 'Dataset A has more rows' : 'Dataset B has more rows'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Common Columns</div>
          <div className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1">
            {comparison.commonColumnsCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate" title={comparison.commonColumns.join(', ')}>
            {comparison.commonColumnsCount > 0 ? comparison.commonColumns.join(', ') : 'No shared columns'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Unique to Dataset A</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {comparison.datasetA.uniqueColumns.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate" title={comparison.datasetA.uniqueColumns.join(', ')}>
            {comparison.datasetA.uniqueColumns.slice(0, 3).join(', ')}...
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">Unique to Dataset B</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {comparison.datasetB.uniqueColumns.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate" title={comparison.datasetB.uniqueColumns.join(', ')}>
            {comparison.datasetB.uniqueColumns.slice(0, 3).join(', ')}...
          </div>
        </div>
      </div>

      {/* Schema Comparison Table */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Structural &amp; Data Quality Comparison
          </h2>
          <p className="text-xs text-slate-500">
            Side-by-side audit of missing values, duplicates, and column taxonomy
          </p>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Evaluation Dimension</th>
                <th className="py-2.5 px-3 font-semibold text-emerald-800 bg-emerald-50/50">
                  {datasetAMeta.name} (Dataset A)
                </th>
                <th className="py-2.5 px-3 font-semibold text-sky-800 bg-sky-50/50">
                  {datasetBMeta.name} (Dataset B)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-700">Category Classification</td>
                <td className="py-2.5 px-3 font-bold text-emerald-700">{datasetAMeta.category}</td>
                <td className="py-2.5 px-3 font-bold text-sky-700">{datasetBMeta.category}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-700">Total Records</td>
                <td className="py-2.5 px-3 font-mono tabular-nums">{parsedA.rows.length.toLocaleString()}</td>
                <td className="py-2.5 px-3 font-mono tabular-nums">{parsedB.rows.length.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-700">Total Features</td>
                <td className="py-2.5 px-3 font-mono tabular-nums">{parsedA.columns.length} columns</td>
                <td className="py-2.5 px-3 font-mono tabular-nums">{parsedB.columns.length} columns</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-700">Numerical Target Variable</td>
                <td className="py-2.5 px-3">
                  {datasetAMeta.hasYieldTarget ? (
                    <span className="text-emerald-700 font-bold">{datasetAMeta.targetColumn} (XGBoost Ready)</span>
                  ) : (
                    <span className="text-slate-400">None (Exploratory Analytics Only)</span>
                  )}
                </td>
                <td className="py-2.5 px-3">
                  {datasetBMeta.hasYieldTarget ? (
                    <span className="text-sky-700 font-bold">{datasetBMeta.targetColumn} (XGBoost Ready)</span>
                  ) : (
                    <span className="text-slate-400">None (Exploratory Analytics Only)</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-700">Percentages Converted</td>
                <td className="py-2.5 px-3 font-mono">{parsedA.summary.convertedPercentageColumns.length} columns</td>
                <td className="py-2.5 px-3 font-mono">{parsedB.summary.convertedPercentageColumns.length} columns</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-700">Empty Columns Handled</td>
                <td className="py-2.5 px-3 font-mono">{parsedA.summary.emptyColumnsRemoved.length} pruned</td>
                <td className="py-2.5 px-3 font-mono">{parsedB.summary.emptyColumnsRemoved.length} pruned</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Common Numerical Features Comparison */}
      {comparison.commonNumericComparisons.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Compatible Numerical Measurements Comparison
            </h2>
            <p className="text-xs text-slate-500">
              Comparing empirical means, minimums, and maximums across shared agricultural metrics
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="py-2 px-3 font-semibold">Shared Attribute</th>
                  <th className="py-2 px-3 font-semibold text-right text-emerald-800">Dataset A Mean</th>
                  <th className="py-2 px-3 font-semibold text-right text-sky-800">Dataset B Mean</th>
                  <th className="py-2 px-3 font-semibold text-right">Dataset A Range [Min–Max]</th>
                  <th className="py-2 px-3 font-semibold text-right">Dataset B Range [Min–Max]</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comparison.commonNumericComparisons.map(item => (
                  <tr key={item.column} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-slate-800">{item.column}</td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-emerald-700">
                      {item.meanA}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-sky-700">
                      {item.meanB}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-600">
                      [{item.minA} – {item.maxA}]
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-600">
                      [{item.minB} – {item.maxB}]
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
