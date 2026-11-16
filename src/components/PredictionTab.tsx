import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Sparkles,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  Download,
  CheckCircle2,
  TrendingUp,
  Info,
  Sliders,
  Layers
} from 'lucide-react';
import { ActiveDatasetState } from '../types/dataset';
import { predictCropYield } from '../services/xgboostEngine';

interface PredictionTabProps {
  dataset: ActiveDatasetState | null;
  onLoadYieldDataset: () => void;
}

interface PredictionHistoryItem {
  id: string;
  timestamp: string;
  predictedYield: number;
  unit: string;
  grade: string;
  inputs: Record<string, any>;
}

export const PredictionTab: React.FC<PredictionTabProps> = ({ dataset, onLoadYieldDataset }) => {
  const model = dataset?.modelResult;
  const isTrained = model && model.isTrained;

  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [currentPrediction, setCurrentPrediction] = useState<any>(null);
  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);

  // Initialize input form defaults whenever model changes
  useEffect(() => {
    if (isTrained && model) {
      const initial: Record<string, any> = {};
      model.featureNames.forEach(feat => {
        if (model.categoricalEncodings[feat]) {
          const keys = Object.keys(model.categoricalEncodings[feat]);
          initial[feat] = keys[0] || 'Unknown';
        } else {
          initial[feat] = model.featureDefaults[feat] ?? 0;
        }
      });
      setInputValues(initial);
      setCurrentPrediction(null);
    }
  }, [isTrained, model]);

  const handleInputChange = (feature: string, value: any) => {
    setInputValues(prev => ({
      ...prev,
      [feature]: value
    }));
  };

  const handlePredict = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTrained || !model) return;

    const result = predictCropYield(model, inputValues);
    setCurrentPrediction(result);

    const historyEntry: PredictionHistoryItem = {
      id: `pred-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      predictedYield: result.predictedYield,
      unit: result.unit,
      grade: result.relativeYieldGrade,
      inputs: { ...inputValues }
    };
    setHistory(prev => [historyEntry, ...prev.slice(0, 19)]);
  };

  const handleExportHistory = () => {
    if (history.length === 0) return;
    const headers = ['Timestamp', 'Predicted_Yield', 'Unit', 'Yield_Grade', ...Object.keys(history[0].inputs)];
    const rows = history.map(h => [
      `"${h.timestamp}"`,
      h.predictedYield,
      `"${h.unit}"`,
      `"${h.grade}"`,
      ...Object.values(h.inputs).map(v => (typeof v === 'string' ? `"${v}"` : v))
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CropYield_Predictions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If model is NOT trained
  if (!isTrained || !model) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-amber-950">
              Crop Yield Prediction Model Inactive
            </h2>
            <p className="text-xs text-amber-900 leading-relaxed max-w-lg mx-auto">
              {model?.isTrained === false
                ? model.requiredColumnsExplanation
                : 'No dataset is currently loaded. Please upload a dataset with a numerical crop yield column.'}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-white/80 border border-amber-200/80 text-left text-xs text-slate-700 space-y-2 max-w-md mx-auto">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-600" />
              <span>Why is prediction unavailable?</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-normal">
              In accordance with project integrity standards, CropYield AI never displays simulated or fictitious predictions. The current dataset lacks an empirical ground-truth yield target.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onLoadYieldDataset}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors inline-flex items-center gap-2"
            >
              <Sprout className="w-4 h-4" />
              <span>Load Benchmark Crop Yield Dataset</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Interactive Crop Yield Estimation
          </h1>
          <p className="text-xs text-slate-500">
            Evaluating calibrated XGBoost regression trees on real agricultural parameters for <span className="font-semibold text-slate-800">{dataset.filename}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            Target: {model.targetColumn} ({model.targetUnit})
          </span>
          <span className="text-xs font-mono text-slate-500">
            R²: {model.metrics.r2Score}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Dynamic Parameter Input Form */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Model Input Parameters ({model.featureNames.length} features)
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                const initial: Record<string, any> = {};
                model.featureNames.forEach(feat => {
                  if (model.categoricalEncodings[feat]) {
                    const keys = Object.keys(model.categoricalEncodings[feat]);
                    initial[feat] = keys[0] || 'Unknown';
                  } else {
                    initial[feat] = model.featureDefaults[feat] ?? 0;
                  }
                });
                setInputValues(initial);
                setCurrentPrediction(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>

          <form onSubmit={handlePredict} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {model.featureNames.map(feat => {
                const isCategorical = !!model.categoricalEncodings[feat];
                const stats = model.featureMinMax[feat];

                if (isCategorical) {
                  const options = Object.keys(model.categoricalEncodings[feat]);
                  return (
                    <div key={feat} className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                        <span className="truncate">{feat}</span>
                        <span className="text-[10px] text-slate-400 font-mono">category</span>
                      </label>
                      <select
                        value={inputValues[feat] ?? options[0]}
                        onChange={e => handleInputChange(feat, e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  );
                }

                // Numerical input with slider & number input
                const min = stats ? stats.min : 0;
                const max = stats ? stats.max : 100;
                const step = max - min > 10 ? 1 : 0.1;
                const currentVal = inputValues[feat] ?? (stats ? stats.mean : 0);

                return (
                  <div key={feat} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate" title={feat}>
                        {feat}
                      </span>
                      <input
                        type="number"
                        step={step}
                        value={currentVal}
                        onChange={e => handleInputChange(feat, parseFloat(e.target.value) || 0)}
                        className="w-20 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-300 rounded bg-white text-slate-900"
                      />
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={currentVal}
                      onChange={e => handleInputChange(feat, parseFloat(e.target.value) || 0)}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>min: {min}</span>
                      <span>mean: {stats?.mean}</span>
                      <span>max: {max}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <Sprout className="w-4 h-4" />
                <span>Estimate Yield with XGBoost</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Prediction Results Card */}
        <div className="lg:col-span-5 space-y-6">
          {currentPrediction ? (
            <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>XGBoost Yield Estimate</span>
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  currentPrediction.relativeYieldGrade === 'Superior'
                    ? 'bg-purple-100 text-purple-800'
                    : currentPrediction.relativeYieldGrade === 'High'
                    ? 'bg-emerald-100 text-emerald-800'
                    : currentPrediction.relativeYieldGrade === 'Average'
                    ? 'bg-sky-100 text-sky-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {currentPrediction.relativeYieldGrade} Yield Grade
                </span>
              </div>

              {/* Main Number */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200/80 text-center space-y-1">
                <div className="text-4xl sm:text-5xl font-black text-slate-900 font-mono tracking-tight tabular-nums">
                  {currentPrediction.predictedYield}
                </div>
                <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                  {currentPrediction.unit}
                </div>
              </div>

              {/* Confidence Interval */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>80% Empirical Prediction Interval</span>
                  <span className="font-mono font-bold text-slate-800">
                    [{currentPrediction.confidenceMin} – {currentPrediction.confidenceMax}] {currentPrediction.unit}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 leading-normal">
                  Calculated based on XGBoost holdout standard error (RMSE: {model.metrics.rmse}).
                </div>
              </div>

              {/* Key Contributing Feature Influences */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800">
                  Parameter Influences (Relative to Dataset Norms)
                </div>
                <div className="space-y-1.5">
                  {currentPrediction.factors.map((f: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-slate-50 border border-slate-100">
                      <span className="text-slate-700 font-medium">{f.feature} = {String(f.value)}</span>
                      <span className={`text-[11px] font-semibold ${
                        f.impact === 'positive' ? 'text-emerald-600' : f.impact === 'negative' ? 'text-amber-600' : 'text-slate-400'
                      }`}>
                        {f.impact === 'positive' ? '▲ Favorable' : f.impact === 'negative' ? '▼ Limiting' : '● Baseline'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => setCurrentPrediction(null)}
                className="w-full py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Reset for Another Prediction
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Sprout className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">
                Ready to Generate Predictions
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Adjust input parameters on the left and click &quot;Estimate Yield with XGBoost&quot; to execute the tree ensemble.
              </p>
            </div>
          )}

          {/* Prediction History Table */}
          {history.length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  Recent Predictions Log ({history.length})
                </span>
                <button
                  onClick={handleExportHistory}
                  className="flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-medium"
                >
                  <Download className="w-3 h-3" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {history.map(item => (
                  <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 font-mono">
                        {item.predictedYield} {item.unit}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-2 font-mono">{item.timestamp}</span>
                    </div>
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                      {item.grade}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
