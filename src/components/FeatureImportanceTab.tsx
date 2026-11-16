import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';
import {
  SlidersHorizontal,
  AlertCircle,
  Sparkles,
  Info,
  CheckCircle2,
  Sprout,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { ActiveDatasetState } from '../types/dataset';

interface FeatureImportanceTabProps {
  dataset: ActiveDatasetState | null;
  onLoadYieldDataset: () => void;
}

export const FeatureImportanceTab: React.FC<FeatureImportanceTabProps> = ({
  dataset,
  onLoadYieldDataset
}) => {
  const model = dataset?.modelResult;
  const isTrained = model && model.isTrained;

  if (!dataset) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <SlidersHorizontal className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">No Dataset Loaded</h2>
        <p className="text-xs text-slate-500">
          Upload an agricultural dataset with a target yield to view XGBoost feature gain importance.
        </p>
      </div>
    );
  }

  if (!isTrained || !model) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">
              Feature Importance Requires a Trained Model
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed max-w-lg mx-auto">
              Feature importance is derived strictly from empirical split gain during tree boosting. Because <span className="font-semibold text-slate-900">{dataset.filename}</span> does not have a crop yield target, feature importance is inactive to prevent fabricating values.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-left text-xs text-slate-700 space-y-2 max-w-md mx-auto">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-600" />
              <span>How XGBoost Calculates Feature Importance</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Each time a feature is used to partition samples at a tree branch, the improvement in accuracy (Gain) is accumulated for that feature across all {model?.isTrained ? model.hyperparameters.nEstimators : 45} boosting iterations.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onLoadYieldDataset}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs inline-flex items-center gap-2"
            >
              <Sprout className="w-4 h-4" />
              <span>Load Crop Yield Dataset</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const importanceData = model.featureImportance;
  const topFeature = importanceData[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            XGBoost Feature Importance Ranking
          </h1>
          <p className="text-xs text-slate-500">
            Normalized relative structural gain computed across all {model.trees.length} boosted decision trees for target <span className="font-semibold text-slate-800">{model.targetColumn}</span>.
          </p>
        </div>

        <div className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
          Dominant Driver: {topFeature?.feature} ({topFeature?.importance}%)
        </div>
      </div>

      {/* Main Horizontal Bar Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Feature Gain Contribution (%)
            </h2>
            <p className="text-xs text-slate-500">
              Percentage of total loss reduction attributable to each agricultural parameter
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Sum of weights = 100%
          </span>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={importanceData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" unit="%" tick={{ fontSize: 11 }} domain={[0, 'dataMax + 5']} />
              <YAxis
                type="category"
                dataKey="feature"
                tick={{ fontSize: 11 }}
                width={110}
              />
              <Tooltip
                formatter={(val: any, name: any, item: any) => [
                  `${val}% gain (${item.payload.splitCount} tree splits)`,
                  'Importance'
                ]}
                contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
              />
              <Bar dataKey="importance" fill="#10b981" radius={[0, 4, 4, 0]}>
                {importanceData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? '#10b981' : index === 1 ? '#0284c7' : index === 2 ? '#8b5cf6' : '#64748b'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature Breakdown Table & Agronomic Interpretation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900">
            Detailed Structural Gain Metrics
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="py-2 px-3 font-semibold">Rank</th>
                  <th className="py-2 px-3 font-semibold">Feature Name</th>
                  <th className="py-2 px-3 font-semibold text-right">Relative Gain</th>
                  <th className="py-2 px-3 font-semibold text-right">Tree Splits Count</th>
                  <th className="py-2 px-3 font-semibold text-right">Cumulative Gain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {importanceData.map((item, idx) => (
                  <tr key={item.feature} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 font-mono text-slate-400 font-semibold">{idx + 1}</td>
                    <td className="py-2 px-3 font-bold text-slate-800">{item.feature}</td>
                    <td className="py-2 px-3 font-mono tabular-nums text-right font-bold text-emerald-600">
                      {item.importance}%
                    </td>
                    <td className="py-2 px-3 font-mono tabular-nums text-right text-slate-600">
                      {item.splitCount}
                    </td>
                    <td className="py-2 px-3 font-mono tabular-nums text-right text-slate-500">
                      {item.totalGain}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Agronomic Context Card */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Agronomic Interpretation
            </h2>
          </div>

          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <p>
              In agricultural biophysics, <span className="font-semibold text-slate-900">{topFeature?.feature}</span> exhibits the highest predictive influence ({topFeature?.importance}% gain) in determining harvested yield outcomes.
            </p>
            <p>
              XGBoost prioritizes features that rapidly segregate high-yield parcels from low-yield clusters at early tree branch depths. This reflects real agronomic non-linear thresholds:
            </p>
            <ul className="space-y-1.5 list-disc list-inside text-slate-700">
              <li>
                <span className="font-medium text-slate-900">Rainfall &amp; Moisture:</span> Controls evapotranspiration and cell turgor pressure during critical flowering and grain-filling stages.
              </li>
              <li>
                <span className="font-medium text-slate-900">Soil Nutrients (N-P-K):</span> Nitrogen governs photosynthetic biomass, Phosphorus accelerates root architecture, and Potassium regulates stomatal conductivity.
              </li>
              <li>
                <span className="font-medium text-slate-900">Soil pH:</span> Controls cation-exchange capacity and microbial bioavailability of macronutrients.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
