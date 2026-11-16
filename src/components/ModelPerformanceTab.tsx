import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Line,
  ComposedChart
} from 'recharts';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Sliders,
  RefreshCw,
  Info,
  TrendingUp,
  Cpu,
  Layers,
  Sprout
} from 'lucide-react';
import { ActiveDatasetState } from '../types/dataset';
import { trainXGBoostPipeline } from '../services/xgboostEngine';

interface ModelPerformanceTabProps {
  dataset: ActiveDatasetState | null;
  onRetrainModel: (updatedDataset: ActiveDatasetState) => void;
  onLoadYieldDataset: () => void;
}

export const ModelPerformanceTab: React.FC<ModelPerformanceTabProps> = ({
  dataset,
  onRetrainModel,
  onLoadYieldDataset
}) => {
  const model = dataset?.modelResult;
  const isTrained = model && model.isTrained;

  // Hyperparameter state
  const [nEstimators, setNEstimators] = useState<number>(model?.isTrained ? model.hyperparameters.nEstimators : 45);
  const [maxDepth, setMaxDepth] = useState<number>(model?.isTrained ? model.hyperparameters.maxDepth : 4);
  const [learningRate, setLearningRate] = useState<number>(model?.isTrained ? model.hyperparameters.learningRate : 0.1);
  const [subsample, setSubsample] = useState<number>(model?.isTrained ? model.hyperparameters.subsample : 0.85);
  const [regLambda, setRegLambda] = useState<number>(model?.isTrained ? model.hyperparameters.regLambda : 1.0);
  const [isRetraining, setIsRetraining] = useState(false);

  if (!dataset) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <Activity className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">No Dataset Loaded</h2>
        <p className="text-xs text-slate-500">
          Upload an agricultural CSV with a numerical yield target to evaluate model performance metrics.
        </p>
      </div>
    );
  }

  if (!isTrained || !model) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
        <div className="bg-slate-900 text-white rounded-xl p-8 text-center space-y-5 border border-slate-800 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">
              Model Performance Metrics Inactive
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-lg mx-auto">
              Actual crop yield data is unavailable. Upload a dataset containing a numerical yield column (such as <span className="text-emerald-400 font-mono">Crop_Yield_Prediction.csv</span>) to train the XGBoost yield prediction model.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-800/80 border border-slate-700 text-left text-xs text-slate-300 space-y-2 max-w-md mx-auto">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-400" />
              <span>Scientific Evaluation Standard</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              To guarantee authentic scientific rigor, CropYield AI does not invent simulated MAE, RMSE, or R² scores when ground-truth yield is missing.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onLoadYieldDataset}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm inline-flex items-center gap-2"
            >
              <Sprout className="w-4 h-4" />
              <span>Load Crop Yield Dataset with Numerical Target</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { metrics, hyperparameters } = model;

  const handleRetrain = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRetraining(true);

    setTimeout(() => {
      const updatedResult = trainXGBoostPipeline(
        dataset.rows,
        dataset.selectedTargetColumn,
        dataset.selectedFeatures,
        {
          nEstimators,
          maxDepth,
          learningRate,
          subsample,
          regLambda
        }
      );

      onRetrainModel({
        ...dataset,
        modelResult: updatedResult
      });
      setIsRetraining(false);
    }, 100);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            XGBoost Model Evaluation &amp; Diagnostics
          </h1>
          <p className="text-xs text-slate-500">
            Holdout test set validation ({model.testRecordCount} unseen test samples, 20% holdout split) for target <span className="font-semibold text-slate-800">{model.targetColumn}</span>.
          </p>
        </div>

        <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
          <span>Train: {model.trainRecordCount} samples</span>
          <span>·</span>
          <span>Test: {model.testRecordCount} samples</span>
        </div>
      </div>

      {/* KPI Cards: MAE, RMSE, R² */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: R² Score */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Coefficient of Determination
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Goodness of Fit
            </span>
          </div>

          <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
            {metrics.r2Score}
          </div>

          <div className="space-y-1 pt-1 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-800">
              R² Score (Variance Explained)
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Measures how well environmental and soil features account for variation in actual crop yield. An R² of {metrics.r2Score} indicates {Math.round(metrics.r2Score * 100)}% of yield variability is captured by the trained trees.
            </p>
          </div>
        </div>

        {/* Card 2: RMSE */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Quadratic Loss Metric
            </span>
            <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              Penalizes Outliers
            </span>
          </div>

          <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums flex items-baseline gap-1.5">
            <span>{metrics.rmse}</span>
            <span className="text-xs font-normal text-slate-400 font-sans">{model.targetUnit}</span>
          </div>

          <div className="space-y-1 pt-1 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-800">
              RMSE (Root Mean Squared Error)
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Standard deviation of prediction residuals. Gives higher weight to large discrepancies, making it ideal for agricultural risk mitigation.
            </p>
          </div>
        </div>

        {/* Card 3: MAE */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Linear Discrepancy
            </span>
            <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Mean Absolute Error
            </span>
          </div>

          <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums flex items-baseline gap-1.5">
            <span>{metrics.mae}</span>
            <span className="text-xs font-normal text-slate-400 font-sans">{model.targetUnit}</span>
          </div>

          <div className="space-y-1 pt-1 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-800">
              MAE (Mean Absolute Error)
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Average magnitude of prediction errors in the original measurement units. On average, predictions deviate by ±{metrics.mae} {model.targetUnit} from actual harvests.
            </p>
          </div>
        </div>
      </div>

      {/* Row 2: Actual vs Predicted Scatter Chart & Residual Error Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actual vs Predicted Graph */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Actual vs. Predicted Crop Yield
              </h2>
              <p className="text-xs text-slate-500">
                Holdout test set points compared against ideal 45° parity line (y = x)
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {model.actualVsPredicted.length} test points
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  dataKey="actual"
                  name="Actual Yield"
                  unit={` ${model.targetUnit}`}
                  tick={{ fontSize: 11 }}
                  label={{ value: `Actual Harvested Yield (${model.targetUnit})`, position: 'insideBottom', offset: -5, fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="predicted"
                  name="Predicted Yield"
                  unit={` ${model.targetUnit}`}
                  tick={{ fontSize: 11 }}
                  label={{ value: `XGBoost Predicted (${model.targetUnit})`, angle: -90, position: 'insideLeft', fontSize: 11 }}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} ${model.targetUnit}`, name]}
                  contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                />
                <Scatter data={model.actualVsPredicted} fill="#10b981" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Prediction Error Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Residual Error Distribution
              </h2>
              <p className="text-xs text-slate-500">
                Histogram of prediction errors (Actual - Predicted)
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Zero-Centered Normal Curve
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={model.errorDistribution} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="range"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} occurrences`, 'Frequency']}
                  contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Hyperparameter Tuning & Model Specification Panel */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Hyperparameter Tuning &amp; Tree Calibration
              </h2>
              <p className="text-xs text-slate-500">
                Adjust tree depth, estimators count, and shrinkage to observe live changes in R² and RMSE.
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Trained in {model.trainingDurationMs}ms
          </div>
        </div>

        <form onSubmit={handleRetrain} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* n_estimators */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Trees (n_estimators)</span>
                <span className="font-mono font-bold text-slate-900">{nEstimators}</span>
              </div>
              <input
                type="range"
                min={15}
                max={100}
                step={5}
                value={nEstimators}
                onChange={e => setNEstimators(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="text-[10px] text-slate-400">Sequential boosting rounds</div>
            </div>

            {/* max_depth */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Max Depth</span>
                <span className="font-mono font-bold text-slate-900">{maxDepth}</span>
              </div>
              <input
                type="range"
                min={2}
                max={7}
                step={1}
                value={maxDepth}
                onChange={e => setMaxDepth(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="text-[10px] text-slate-400">Tree split depth complexity</div>
            </div>

            {/* learning_rate */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Learning Rate (η)</span>
                <span className="font-mono font-bold text-slate-900">{learningRate}</span>
              </div>
              <input
                type="range"
                min={0.02}
                max={0.3}
                step={0.02}
                value={learningRate}
                onChange={e => setLearningRate(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="text-[10px] text-slate-400">Step shrinkage multiplier</div>
            </div>

            {/* subsample */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Subsample Ratio</span>
                <span className="font-mono font-bold text-slate-900">{subsample}</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={1.0}
                step={0.05}
                value={subsample}
                onChange={e => setSubsample(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="text-[10px] text-slate-400">Stochastic row sampling</div>
            </div>

            {/* L2 regularization */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">L2 Reg (λ)</span>
                <span className="font-mono font-bold text-slate-900">{regLambda}</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={5.0}
                step={0.2}
                value={regLambda}
                onChange={e => setRegLambda(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="text-[10px] text-slate-400">Hessian leaf regularization</div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isRetraining}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs flex items-center gap-2"
            >
              {isRetraining ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Retraining Ensemble...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Apply &amp; Retrain XGBoost</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
