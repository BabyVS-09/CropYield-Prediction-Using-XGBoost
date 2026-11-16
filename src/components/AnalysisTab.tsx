import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import {
  BarChart3,
  Filter,
  Layers,
  MapPin,
  TestTube2,
  Sparkles,
  Info,
  CloudRain,
  Thermometer,
  Compass,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ActiveDatasetState } from '../types/dataset';

interface AnalysisTabProps {
  dataset: ActiveDatasetState | null;
}

const COLORS = ['#10b981', '#0284c7', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6', '#6366f1', '#84cc16'];

export const AnalysisTab: React.FC<AnalysisTabProps> = ({ dataset }) => {
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('all');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('all');

  if (!dataset) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <BarChart3 className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">No Dataset Loaded for Analysis</h2>
        <p className="text-xs text-slate-500">
          Upload an agricultural CSV or select a benchmark dataset on the Upload tab to generate dynamic exploratory visualizations.
        </p>
      </div>
    );
  }

  const { analysis, columns, headers } = dataset;

  // Filter rows dynamically based on selected filters
  const cropCol = columns.find(c => c.standardType === 'crop')?.name;
  const regionCol = columns.find(c => c.standardType === 'region')?.name;

  const availableCrops = useMemo(() => {
    if (!cropCol) return [];
    return Array.from(new Set(dataset.rows.map(r => String(r[cropCol] || '')).filter(Boolean))).slice(0, 30);
  }, [dataset, cropCol]);

  const availableRegions = useMemo(() => {
    if (!regionCol) return [];
    return Array.from(new Set(dataset.rows.map(r => String(r[regionCol] || '')).filter(Boolean))).slice(0, 30);
  }, [dataset, regionCol]);

  const filteredRows = useMemo(() => {
    return dataset.rows.filter(r => {
      if (selectedCropFilter !== 'all' && cropCol && String(r[cropCol]) !== selectedCropFilter) return false;
      if (selectedRegionFilter !== 'all' && regionCol && String(r[regionCol]) !== selectedRegionFilter) return false;
      return true;
    });
  }, [dataset, selectedCropFilter, selectedRegionFilter, cropCol, regionCol]);

  // Dynamic feature existence flags
  const hasCropData = analysis.cropDistribution.length > 0;
  const hasSoilNutrientProfile = !!analysis.soilNutrients.nutrientClassDistribution || (!!analysis.soilNutrients.nitrogenMean && !!analysis.soilNutrients.phosphorusMean);
  const hasPhData = !!analysis.soilNutrients.phDistribution;
  const hasRegionalData = analysis.regionalBreakdown.length > 0;
  const hasGeoCoordinates = analysis.geoPoints.length > 0;
  const hasCorrelations = analysis.correlations.matrix.length >= 2;

  // Weather columns check
  const rainCol = columns.find(c => c.standardType === 'rainfall')?.name;
  const tempCol = columns.find(c => c.standardType === 'temperature')?.name;
  const hasWeather = !!(rainCol || tempCol);

  // Weather distribution points
  const weatherChartData = useMemo(() => {
    if (!rainCol && !tempCol) return [];
    return filteredRows.slice(0, 40).map((r, i) => ({
      index: i + 1,
      rainfall: rainCol ? Number(r[rainCol]) || 0 : undefined,
      temperature: tempCol ? Number(r[tempCol]) || 0 : undefined,
      crop: cropCol ? String(r[cropCol] || '') : undefined
    }));
  }, [filteredRows, rainCol, tempCol, cropCol]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Tab Header & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Dynamic Exploratory Data Analysis
          </h1>
          <p className="text-xs text-slate-500">
            Automated visualization generated exclusively from available attributes in <span className="font-semibold text-slate-800">{dataset.filename}</span>.
          </p>
        </div>

        {/* Interactive Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {availableCrops.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-slate-500 font-medium">Crop:</span>
              <select
                value={selectedCropFilter}
                onChange={e => setSelectedCropFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none"
              >
                <option value="all">All Crops ({availableCrops.length})</option>
                {availableCrops.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {availableRegions.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-slate-500 font-medium">Region:</span>
              <select
                value={selectedRegionFilter}
                onChange={e => setSelectedRegionFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 focus:outline-none"
              >
                <option value="all">All Regions ({availableRegions.length})</option>
                {availableRegions.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          )}

          {(selectedCropFilter !== 'all' || selectedRegionFilter !== 'all') && (
            <button
              onClick={() => {
                setSelectedCropFilter('all');
                setSelectedRegionFilter('all');
              }}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-medium px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Row 1: Crop Distribution & Soil Acidity/pH */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Crop Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Crop Distribution Overview</h2>
              <p className="text-xs text-slate-500">Record frequencies per identified agricultural crop</p>
            </div>
            {hasCropData && (
              <span className="text-xs text-slate-400 font-mono">
                {analysis.cropDistribution.length} varieties
              </span>
            )}
          </div>

          {hasCropData ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.cropDistribution} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="crop" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip
                    formatter={(val: any, name: any, item: any) => [
                      `${val} records (${item.payload.percentage}%)`,
                      'Frequency'
                    ]}
                    contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 space-y-2">
              <Info className="w-6 h-6" />
              <div className="text-xs font-semibold text-slate-600">No Crop Column Detected</div>
              <p className="text-[11px] max-w-xs">
                This dataset does not contain an identified Crop or Label column. Crop distribution visualization is suppressed.
              </p>
            </div>
          )}
        </div>

        {/* Chart 2: Soil pH Health Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Soil pH Classification</h2>
              <p className="text-xs text-slate-500">Distribution across Acidic, Neutral, and Alkaline zones</p>
            </div>
            {hasPhData && analysis.soilNutrients.phMean && (
              <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Mean pH: {analysis.soilNutrients.phMean}
              </span>
            )}
          </div>

          {hasPhData ? (
            <div className="h-72 w-full flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="h-64 w-64 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Acidic (< pH 6.5)', value: analysis.soilNutrients.phDistribution?.acidic || 0, color: '#f59e0b' },
                        { name: 'Neutral (pH 6.5–7.5)', value: analysis.soilNutrients.phDistribution?.neutral || 0, color: '#10b981' },
                        { name: 'Alkaline (> pH 7.5)', value: analysis.soilNutrients.phDistribution?.alkaline || 0, color: '#8b5cf6' }
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      <Cell fill="#f59e0b" />
                      <Cell fill="#10b981" />
                      <Cell fill="#8b5cf6" />
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, 'Proportion']}
                      contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend with agronomic meaning */}
              <div className="space-y-3 text-xs w-full max-w-xs">
                <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-slate-700 font-medium">Acidic Soils</span>
                  </div>
                  <span className="font-mono font-bold text-amber-800">
                    {analysis.soilNutrients.phDistribution?.acidic}%
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-slate-700 font-medium">Neutral / Optimal</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-800">
                    {analysis.soilNutrients.phDistribution?.neutral}%
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-purple-50/70 border border-purple-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                    <span className="text-slate-700 font-medium">Alkaline Soils</span>
                  </div>
                  <span className="font-mono font-bold text-purple-800">
                    {analysis.soilNutrients.phDistribution?.alkaline}%
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 space-y-2">
              <Info className="w-6 h-6" />
              <div className="text-xs font-semibold text-slate-600">No Soil pH Parameters Detected</div>
              <p className="text-[11px] max-w-xs">
                Upload a dataset containing soil pH observations or percentage acidity classes to display this visualization.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Soil Macronutrients (N-P-K) & Weather Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Soil Macronutrients N-P-K */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Soil Macronutrient Distribution (N, P, K)</h2>
            <p className="text-xs text-slate-500">
              {analysis.soilNutrients.nutrientClassDistribution
                ? 'High, Medium, and Low nutrient status percentages'
                : 'Mean nutrient concentrations (kg/ha)'}
            </p>
          </div>

          {analysis.soilNutrients.nutrientClassDistribution ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.soilNutrients.nutrientClassDistribution} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="nutrient" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, '']}
                    contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                  />
                  <Bar dataKey="high" name="High Status (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="medium" name="Medium Status (%)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="low" name="Low Status (%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : analysis.soilNutrients.nitrogenMean !== undefined ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { nutrient: 'Nitrogen (N)', value: analysis.soilNutrients.nitrogenMean },
                    { nutrient: 'Phosphorus (P)', value: analysis.soilNutrients.phosphorusMean },
                    { nutrient: 'Potassium (K)', value: analysis.soilNutrients.potassiumMean }
                  ]}
                  margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="nutrient" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                  <Bar dataKey="value" name="Mean Level (kg/ha)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 space-y-2">
              <Info className="w-6 h-6" />
              <div className="text-xs font-semibold text-slate-600">No N-P-K Nutrients Detected</div>
              <p className="text-[11px] max-w-xs">
                Columns for Nitrogen, Phosphorus, and Potassium were not detected in the current dataset.
              </p>
            </div>
          )}
        </div>

        {/* Agro-Weather & Climate Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Agro-Climatic Parameters</h2>
              <p className="text-xs text-slate-500">
                {rainCol && tempCol
                  ? `Rainfall (${rainCol}) and Temperature (${tempCol}) samples`
                  : 'Precipitation and thermal records'}
              </p>
            </div>
          </div>

          {hasWeather ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weatherChartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="index" tick={{ fontSize: 10 }} label={{ value: 'Sample Parcel', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                  <YAxis yAxisId="left" orientation="left" stroke="#0284c7" tick={{ fontSize: 11 }} label={{ value: 'Rainfall (mm)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" tick={{ fontSize: 11 }} label={{ value: 'Temp (°C)', angle: 90, position: 'insideRight', fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                  {rainCol && <Bar yAxisId="left" dataKey="rainfall" name="Rainfall" fill="#0284c7" radius={[3, 3, 0, 0]} />}
                  {tempCol && <Bar yAxisId="right" dataKey="temperature" name="Temp" fill="#f59e0b" radius={[3, 3, 0, 0]} />}
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-400 space-y-2">
              <Info className="w-6 h-6" />
              <div className="text-xs font-semibold text-slate-600">No Climate Columns Detected</div>
              <p className="text-[11px] max-w-xs">
                Rainfall and temperature features are not present in this dataset. (e.g. In CropDataset-Enhanced.csv, soil nutrients and coordinates are provided instead).
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Pearson Correlation Heatmap */}
      {hasCorrelations && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Feature Correlation Matrix (Pearson r)</h2>
            <p className="text-xs text-slate-500">
              Pairwise linear relationships between numerical agricultural indicators (-1.0 to +1.0)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="p-2 text-left text-slate-400 font-normal">Feature</th>
                  {analysis.correlations.features.map(f => (
                    <th key={f} className="p-2 text-center font-semibold text-slate-700 truncate max-w-[100px]" title={f}>
                      {f}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analysis.correlations.features.map((rowFeat, i) => (
                  <tr key={rowFeat} className="border-t border-slate-100">
                    <td className="p-2 font-semibold text-slate-800 truncate max-w-[120px]" title={rowFeat}>
                      {rowFeat}
                    </td>
                    {analysis.correlations.features.map((colFeat, j) => {
                      const r = analysis.correlations.matrix[i]?.[j] ?? 0;
                      // Color based on correlation strength
                      let bg = 'bg-slate-50 text-slate-600';
                      if (r === 1) bg = 'bg-slate-200 text-slate-900 font-bold';
                      else if (r > 0.5) bg = 'bg-emerald-100 text-emerald-900 font-bold';
                      else if (r > 0.2) bg = 'bg-emerald-50 text-emerald-800';
                      else if (r < -0.5) bg = 'bg-rose-100 text-rose-900 font-bold';
                      else if (r < -0.2) bg = 'bg-rose-50 text-rose-800';

                      return (
                        <td
                          key={colFeat}
                          className={`p-2 text-center font-mono tabular-nums ${bg} border border-white`}
                        >
                          {r.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Row 4: Geographic Coordinates Analysis (CropDataset-Enhanced Special Support) */}
      {hasGeoCoordinates && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Geospatial Farm Parcel Distribution
                </h2>
                <p className="text-xs text-slate-500">
                  Geocoded coordinates detected in dataset (Latitude vs Longitude parcels)
                </p>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {analysis.geoPoints.length} mapped parcels
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  dataKey="longitude"
                  name="Longitude"
                  unit="°E"
                  tick={{ fontSize: 11 }}
                  domain={['auto', 'auto']}
                  label={{ value: 'Longitude (°E)', position: 'insideBottom', offset: -5, fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="latitude"
                  name="Latitude"
                  unit="°N"
                  tick={{ fontSize: 11 }}
                  domain={['auto', 'auto']}
                  label={{ value: 'Latitude (°N)', angle: -90, position: 'insideLeft', fontSize: 11 }}
                />
                <ZAxis range={[40, 40]} />
                <Tooltip
                  formatter={(val: any, name: any, item: any) => [
                    `${item.payload.label} (${item.payload.latitude}°N, ${item.payload.longitude}°E) · Crop: ${item.payload.crop || 'N/A'}`,
                    'Location'
                  ]}
                  contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                />
                <Scatter data={analysis.geoPoints} fill="#10b981" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Row 5: Agricultural Insights Section */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Evidence-Based Agricultural Insights
            </h2>
            <p className="text-xs text-slate-500">
              Synthesized agronomic findings directly derived from uploaded dataset distributions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.insights.map((ins, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{ins.title}</span>
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  {ins.isEmpirical ? 'Data-Driven' : 'Agronomic Guidance'}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                {ins.observation}
              </p>
              <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 leading-normal flex items-start gap-1.5">
                <span className="font-semibold text-emerald-800 shrink-0">Recommendation:</span>
                <span>{ins.recommendation}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
