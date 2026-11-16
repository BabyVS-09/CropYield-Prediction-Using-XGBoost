import React from 'react';
import {
  UploadCloud,
  BarChart3,
  Sprout,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
  ArrowRight,
  TrendingUp,
  CloudRain,
  Thermometer,
  TestTube2,
  MapPin,
  Calendar,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { ActiveTab, ActiveDatasetState } from '../types/dataset';

interface HomeTabProps {
  dataset: ActiveDatasetState | null;
  onNavigate: (tab: ActiveTab) => void;
  onLoadEnhancedDataset: () => void;
  onLoadYieldDataset: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  dataset,
  onNavigate,
  onLoadEnhancedDataset,
  onLoadYieldDataset
}) => {
  const recordsCount = dataset ? dataset.rows.length : 0;
  const cropsCount = dataset ? dataset.analysis.cropDistribution.length : 0;
  const featuresCount = dataset ? dataset.columns.length : 0;
  const isYieldReady = dataset?.modelResult.isTrained;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Hero Banner with Generated Farming Image */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900 text-white min-h-[380px] flex items-center">
        {/* Background Image with Contrast Scrim */}
        <img
          src="/src/assets/images/agricultural_hero_farming_1794028824007.jpg"
          alt="Precision agricultural fields and automated farm systems"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />

        <div className="relative z-10 p-8 sm:p-12 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold tracking-wide uppercase">
            <Cpu className="w-3.5 h-3.5" />
            <span>AI-Driven Precision Agriculture</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Crop Yield Prediction <br />
            <span className="text-emerald-400">with XGBoost AI</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            An advanced predictive framework for crop yield estimation, universal agricultural dataset intelligence, soil nutrient profiling, and climate risk modeling.
          </p>

          {/* Quick Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('upload')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Dataset</span>
            </button>

            <button
              onClick={() => onNavigate('analysis')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-white font-medium text-sm border border-slate-700 transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Analyze Dataset</span>
            </button>

            <button
              onClick={() => onNavigate('prediction')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 font-medium text-sm border border-emerald-500/30 transition-colors"
            >
              <Sprout className="w-4 h-4 text-emerald-400" />
              <span>Predict Crop Yield</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Dataset Status Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Records Count */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Total Uploaded Records</div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {recordsCount > 0 ? recordsCount.toLocaleString() : '—'}
            </div>
            <div className="text-[11px] text-slate-400">
              {dataset ? dataset.filename : 'No dataset loaded'}
            </div>
          </div>
        </div>

        {/* Card 2: Crops Identified */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Crops Identified</div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {cropsCount > 0 ? cropsCount : '—'}
            </div>
            <div className="text-[11px] text-slate-400">
              {cropsCount > 0 ? 'Unique agricultural crop varieties' : 'Awaiting crop labels'}
            </div>
          </div>
        </div>

        {/* Card 3: Features Detected */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Features Detected</div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {featuresCount > 0 ? featuresCount : '—'}
            </div>
            <div className="text-[11px] text-slate-400">
              {dataset ? `${dataset.columns.filter(c => c.dataType === 'numerical').length} numerical features` : 'Taxonomy auto-detection'}
            </div>
          </div>
        </div>

        {/* Card 4: Dataset & Model Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
            isYieldReady ? 'bg-emerald-50 text-emerald-600' : dataset ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'
          }`}>
            {isYieldReady ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500">Framework Status</div>
            <div className="text-sm font-bold text-slate-900 truncate">
              {isYieldReady
                ? 'XGBoost Trained'
                : dataset
                ? 'Exploratory Mode'
                : 'Awaiting Upload'}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {isYieldReady
                ? `R² = ${dataset.modelResult.metrics.r2Score} (${dataset.modelResult.targetColumn})`
                : dataset
                ? 'Soil/Crop analysis active'
                : 'Upload or pick benchmark'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Test Prompt for Evaluation */}
      {!dataset && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-emerald-950 text-sm">
              Ready to test the universal framework?
            </h3>
            <p className="text-xs text-emerald-800">
              Select one of the pre-configured benchmark datasets to instantly explore analytics and model training:
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={onLoadEnhancedDataset}
              className="px-3 py-1.5 bg-white text-emerald-800 border border-emerald-300 rounded-lg text-xs font-medium hover:bg-emerald-100/50 transition-colors shadow-xs"
            >
              Load CropDataset-Enhanced.csv (730 records)
            </button>
            <button
              onClick={onLoadYieldDataset}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
            >
              Load Crop Yield Dataset (XGBoost Ready)
            </button>
          </div>
        </div>
      )}

      {/* Section 1: End-to-End Project Workflow */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">End-to-End Project Workflow</h2>
          <p className="text-xs text-slate-500">
            Predictive pipeline executing automated ingestion, preprocessing, decision tree gradient boosting, and agronomic reporting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {[
            { step: '01', title: 'Upload CSV', desc: 'Universal parser handles any agricultural structure, delimiter, and encoding.' },
            { step: '02', title: 'Inspect Schema', desc: 'Intelligent synonym matching maps Crop, Yield, Nutrients, pH, and Weather.' },
            { step: '03', title: 'Preprocess & Clean', desc: 'Handles missing values, drops empty columns, converts percentages, cleans duplicates.' },
            { step: '04', title: 'Train XGBoost', desc: 'Gradient boosted decision trees with shrinkage, L2 regularization, and 80/20 test split.' },
            { step: '05', title: 'Model Evaluation', desc: 'Empirical MAE, RMSE, R² scores, actual vs predicted scatter, and residual distributions.' },
            { step: '06', title: 'Predict & Insights', desc: 'Dynamic parameter sliders, live yield forecast, factor impact, and report download.' }
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-[11px] font-bold text-emerald-600 font-mono">{item.step}</span>
              <div className="font-semibold text-slate-900 text-xs">{item.title}</div>
              <p className="text-[11px] text-slate-500 leading-normal">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Key Agricultural Inputs Reference */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Key Agricultural Parameters</h2>
          <p className="text-xs text-slate-500">
            Critical biophysical and environmental variables captured and modeled across agricultural datasets.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { name: 'Rainfall', icon: CloudRain, unit: 'mm / season', color: 'text-sky-600 bg-sky-50' },
            { name: 'Temperature', icon: Thermometer, unit: '°C (mean/max)', color: 'text-amber-600 bg-amber-50' },
            { name: 'Soil pH', icon: TestTube2, unit: 'Acidity scale (0-14)', color: 'text-purple-600 bg-purple-50' },
            { name: 'NPK Nutrients', icon: Sprout, unit: 'N-P-K (kg/ha or %)', color: 'text-emerald-600 bg-emerald-50' },
            { name: 'Region & State', icon: MapPin, unit: 'Agro-climatic zone', color: 'text-rose-600 bg-rose-50' },
            { name: 'Seasonality', icon: Calendar, unit: 'Kharif / Rabi / Zaid', color: 'text-indigo-600 bg-indigo-50' }
          ].map((param, idx) => {
            const Icon = param.icon;
            return (
              <div key={idx} className="p-3.5 rounded-lg border border-slate-200 flex flex-col items-center text-center space-y-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${param.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-semibold text-slate-800 text-xs">{param.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">{param.unit}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: XGBoost Model Architecture & Mathematical Workflow */}
      <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
              Algorithm Specifications
            </div>
            <h2 className="text-xl font-bold text-white">XGBoost Regression Architecture</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Objective: Squared Error with L2 Regularization
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-800/80 border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <Zap className="w-4 h-4" />
              <span>Gradient & Hessian Objective</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Computes 1st order gradients <code className="text-emerald-300 font-mono">g_i = ŷ_i - y_i</code> and 2nd order hessians <code className="text-emerald-300 font-mono">h_i = 1.0</code> for quadratic Taylor expansion loss minimization.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-800/80 border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs">
              <TrendingUp className="w-4 h-4" />
              <span>Exact Greedy Split & Gain</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Calculates structural gain: <br />
              <code className="text-[11px] text-sky-300 font-mono">Gain = ½ [GL²/(HL+λ) + GR²/(HR+λ) - G²/(H+λ)]</code> to discover optimal tree splits and prevent overfitting.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-800/80 border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Shrinkage & Feature Importance</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Applies shrinkage learning rate <code className="text-purple-300 font-mono">η = 0.1</code> after each tree step. Relative feature importance is calculated directly from total split gain accumulation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
