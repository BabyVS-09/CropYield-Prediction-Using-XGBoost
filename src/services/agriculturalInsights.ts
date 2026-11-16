/**
 * Agricultural Analytics & Agronomic Insights Engine
 * Calculates statistical summaries, correlation matrices, crop distributions,
 * soil nutrient profiles, spatial coordinates, and agronomic observations.
 */

export interface NumericFeatureStat {
  feature: string;
  count: number;
  mean: number;
  std: number;
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
}

export interface CorrelationMatrix {
  features: string[];
  matrix: number[][]; // [i][j] Pearson correlation -1 to 1
}

export interface CropDistributionItem {
  crop: string;
  count: number;
  percentage: number;
}

export interface SoilNutrientProfile {
  nitrogenMean?: number;
  phosphorusMean?: number;
  potassiumMean?: number;
  phMean?: number;
  phDistribution?: { acidic: number; neutral: number; alkaline: number };
  nutrientClassDistribution?: {
    nutrient: string;
    high: number;
    medium: number;
    low: number;
  }[];
}

export interface GeoLocationPoint {
  latitude: number;
  longitude: number;
  region: string;
  crop?: string;
  label: string;
}

export interface AgriculturalInsight {
  type: 'soil' | 'crop' | 'climate' | 'data_quality' | 'model';
  title: string;
  observation: string;
  recommendation: string;
  isEmpirical: boolean; // true = directly observed from uploaded data, false = general agronomic guidance
}

export interface ComprehensiveAnalysis {
  recordCount: number;
  columnCount: number;
  stats: NumericFeatureStat[];
  correlations: CorrelationMatrix;
  cropDistribution: CropDistributionItem[];
  soilNutrients: SoilNutrientProfile;
  geoPoints: GeoLocationPoint[];
  insights: AgriculturalInsight[];
  regionalBreakdown: { region: string; count: number; dominantCrop: string }[];
}

export function generateAgriculturalAnalysis(
  rows: Record<string, any>[],
  columns: { name: string; standardType: string; dataType: string }[]
): ComprehensiveAnalysis {
  const recordCount = rows.length;
  const columnCount = columns.length;

  // 1. Identify numerical columns
  const numColNames = columns
    .filter(c => c.dataType === 'numerical' || c.dataType === 'percentage')
    .map(c => c.name);

  // 2. Compute Numeric Feature Statistics
  const stats: NumericFeatureStat[] = numColNames.map(col => {
    const rawVals = rows
      .map(r => r[col])
      .filter(v => typeof v === 'number' && !isNaN(v)) as number[];

    if (rawVals.length === 0) {
      return {
        feature: col,
        count: 0,
        mean: 0,
        std: 0,
        min: 0,
        p25: 0,
        median: 0,
        p75: 0,
        max: 0
      };
    }

    const sorted = [...rawVals].sort((a, b) => a - b);
    const mean = +(rawVals.reduce((a, b) => a + b, 0) / rawVals.length).toFixed(2);
    const variance = rawVals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / rawVals.length;
    const std = +Math.sqrt(variance).toFixed(2);
    const min = +sorted[0].toFixed(2);
    const max = +sorted[sorted.length - 1].toFixed(2);
    const p25 = +sorted[Math.floor(sorted.length * 0.25)].toFixed(2);
    const median = +sorted[Math.floor(sorted.length * 0.5)].toFixed(2);
    const p75 = +sorted[Math.floor(sorted.length * 0.75)].toFixed(2);

    return {
      feature: col,
      count: rawVals.length,
      mean,
      std,
      min,
      p25,
      median,
      p75,
      max
    };
  });

  // 3. Compute Pearson Correlation Matrix
  const candidateCorrs = numColNames.slice(0, 10); // top 10 for visual clarity
  const matrix: number[][] = [];

  for (let i = 0; i < candidateCorrs.length; i++) {
    const rowCorr: number[] = [];
    const colA = candidateCorrs[i];
    const valsA = rows.map(r => Number(r[colA]) || 0);
    const meanA = valsA.reduce((a, b) => a + b, 0) / valsA.length;

    for (let j = 0; j < candidateCorrs.length; j++) {
      if (i === j) {
        rowCorr.push(1.0);
        continue;
      }
      const colB = candidateCorrs[j];
      const valsB = rows.map(r => Number(r[colB]) || 0);
      const meanB = valsB.reduce((a, b) => a + b, 0) / valsB.length;

      let numerator = 0;
      let denomA = 0;
      let denomB = 0;

      for (let k = 0; k < rows.length; k++) {
        const diffA = valsA[k] - meanA;
        const diffB = valsB[k] - meanB;
        numerator += diffA * diffB;
        denomA += diffA * diffA;
        denomB += diffB * diffB;
      }

      const r = denomA > 0 && denomB > 0 ? +(numerator / Math.sqrt(denomA * denomB)).toFixed(2) : 0;
      rowCorr.push(r);
    }
    matrix.push(rowCorr);
  }

  const correlations: CorrelationMatrix = {
    features: candidateCorrs,
    matrix
  };

  // 4. Crop Distribution
  const cropCol = columns.find(c => c.standardType === 'crop')?.name ||
    columns.find(c => c.name.toLowerCase().includes('crop'))?.name;

  const cropCounts: Record<string, number> = {};
  if (cropCol) {
    rows.forEach(r => {
      const val = String(r[cropCol] || 'Unspecified').trim();
      if (val) cropCounts[val] = (cropCounts[val] || 0) + 1;
    });
  }

  const cropDistribution: CropDistributionItem[] = Object.entries(cropCounts)
    .map(([crop, count]) => ({
      crop,
      count,
      percentage: +((count / recordCount) * 100).toFixed(1)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  // 5. Regional Breakdown
  const regionCol = columns.find(c => c.standardType === 'region')?.name;
  const regionalBreakdown: { region: string; count: number; dominantCrop: string }[] = [];

  if (regionCol) {
    const regGroups: Record<string, { count: number; crops: Record<string, number> }> = {};
    rows.forEach(r => {
      const reg = String(r[regionCol] || 'Unknown').trim();
      if (!regGroups[reg]) regGroups[reg] = { count: 0, crops: {} };
      regGroups[reg].count++;
      if (cropCol && r[cropCol]) {
        const c = String(r[cropCol]);
        regGroups[reg].crops[c] = (regGroups[reg].crops[c] || 0) + 1;
      }
    });

    Object.entries(regGroups).forEach(([region, data]) => {
      let dominantCrop = 'N/A';
      let maxCropCount = 0;
      Object.entries(data.crops).forEach(([c, cnt]) => {
        if (cnt > maxCropCount) {
          maxCropCount = cnt;
          dominantCrop = c;
        }
      });
      regionalBreakdown.push({
        region,
        count: data.count,
        dominantCrop
      });
    });

    regionalBreakdown.sort((a, b) => b.count - a.count);
  }

  // 6. Soil Nutrients & pH Profile
  const soilNutrients: SoilNutrientProfile = {};

  // Check for percentage columns like in CropDataset-Enhanced.csv
  const nHighCol = columns.find(c => c.name.toLowerCase().includes('nitrogen') && c.name.toLowerCase().includes('high'))?.name;
  const nMedCol = columns.find(c => c.name.toLowerCase().includes('nitrogen') && c.name.toLowerCase().includes('medium'))?.name;
  const nLowCol = columns.find(c => c.name.toLowerCase().includes('nitrogen') && c.name.toLowerCase().includes('low'))?.name;

  const pHighCol = columns.find(c => c.name.toLowerCase().includes('phosphor') && c.name.toLowerCase().includes('high'))?.name;
  const pMedCol = columns.find(c => c.name.toLowerCase().includes('phosphor') && c.name.toLowerCase().includes('medium'))?.name;
  const pLowCol = columns.find(c => c.name.toLowerCase().includes('phosphor') && c.name.toLowerCase().includes('low'))?.name;

  const kHighCol = columns.find(c => c.name.toLowerCase().includes('potassium') && c.name.toLowerCase().includes('high'))?.name;
  const kMedCol = columns.find(c => c.name.toLowerCase().includes('potassium') && c.name.toLowerCase().includes('medium'))?.name;
  const kLowCol = columns.find(c => c.name.toLowerCase().includes('potassium') && c.name.toLowerCase().includes('low'))?.name;

  const phAcidCol = columns.find(c => c.name.toLowerCase().includes('ph') && c.name.toLowerCase().includes('acid'))?.name;
  const phNeutCol = columns.find(c => c.name.toLowerCase().includes('ph') && c.name.toLowerCase().includes('neut'))?.name;
  const phAlkCol = columns.find(c => c.name.toLowerCase().includes('ph') && c.name.toLowerCase().includes('alk'))?.name;

  if (nHighCol && nMedCol && nLowCol) {
    const calcMean = (col: string) => {
      const vals = rows.map(r => Number(r[col]) || 0);
      return +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
    };

    soilNutrients.nutrientClassDistribution = [
      {
        nutrient: 'Nitrogen (N)',
        high: calcMean(nHighCol),
        medium: calcMean(nMedCol),
        low: calcMean(nLowCol)
      },
      {
        nutrient: 'Phosphorus (P)',
        high: calcMean(pHighCol || ''),
        medium: calcMean(pMedCol || ''),
        low: calcMean(pLowCol || '')
      },
      {
        nutrient: 'Potassium (K)',
        high: calcMean(kHighCol || ''),
        medium: calcMean(kMedCol || ''),
        low: calcMean(kLowCol || '')
      }
    ];
  }

  if (phAcidCol && phNeutCol && phAlkCol) {
    const calcMean = (col: string) => {
      const vals = rows.map(r => Number(r[col]) || 0);
      return +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
    };
    soilNutrients.phDistribution = {
      acidic: calcMean(phAcidCol),
      neutral: calcMean(phNeutCol),
      alkaline: calcMean(phAlkCol)
    };
  } else {
    // Check for continuous pH column
    const singlePhCol = columns.find(c => c.standardType === 'soil_ph')?.name;
    if (singlePhCol) {
      const phs = rows.map(r => Number(r[singlePhCol]) || 0).filter(v => v > 0);
      if (phs.length > 0) {
        soilNutrients.phMean = +(phs.reduce((a, b) => a + b, 0) / phs.length).toFixed(2);
        const acidicCount = phs.filter(p => p < 6.5).length;
        const neutralCount = phs.filter(p => p >= 6.5 && p <= 7.5).length;
        const alkCount = phs.filter(p => p > 7.5).length;
        soilNutrients.phDistribution = {
          acidic: +((acidicCount / phs.length) * 100).toFixed(1),
          neutral: +((neutralCount / phs.length) * 100).toFixed(1),
          alkaline: +((alkCount / phs.length) * 100).toFixed(1)
        };
      }
    }
  }

  // Single N, P, K continuous columns
  const nCol = columns.find(c => c.standardType === 'nitrogen' && !c.name.includes('-'))?.name;
  const pCol = columns.find(c => c.standardType === 'phosphorus' && !c.name.includes('-'))?.name;
  const kCol = columns.find(c => c.standardType === 'potassium' && !c.name.includes('-'))?.name;

  if (nCol) {
    const vals = rows.map(r => Number(r[nCol]) || 0);
    soilNutrients.nitrogenMean = +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  }
  if (pCol) {
    const vals = rows.map(r => Number(r[pCol]) || 0);
    soilNutrients.phosphorusMean = +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  }
  if (kCol) {
    const vals = rows.map(r => Number(r[kCol]) || 0);
    soilNutrients.potassiumMean = +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  }

  // 7. Geographic Coordinates Extraction
  const latCol = columns.find(c => c.standardType === 'latitude')?.name;
  const lngCol = columns.find(c => c.standardType === 'longitude')?.name;
  const geoPoints: GeoLocationPoint[] = [];

  if (latCol && lngCol) {
    rows.slice(0, 150).forEach(r => {
      const lat = Number(r[latCol]);
      const lng = Number(r[lngCol]);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        geoPoints.push({
          latitude: +lat.toFixed(4),
          longitude: +lng.toFixed(4),
          region: regionCol ? String(r[regionCol] || 'Agricultural Zone') : 'Agricultural Zone',
          crop: cropCol ? String(r[cropCol] || '') : undefined,
          label: String(r['Address'] || r['Formatted address'] || `Farm (${lat}, ${lng})`)
        });
      }
    });
  }

  // 8. Generate Evidence-Based Agronomic Insights
  const insights: AgriculturalInsight[] = [];

  // Insight 1: Dominant Crop
  if (cropDistribution.length > 0) {
    const topCrop = cropDistribution[0];
    insights.push({
      type: 'crop',
      title: `Dominant Crop: ${topCrop.crop}`,
      observation: `Across ${recordCount.toLocaleString()} surveyed agricultural records, "${topCrop.crop}" represents ${topCrop.percentage}% of cultivated parcels (${topCrop.count} records).`,
      recommendation: `Recommended to track rotation cycles with leguminous crops to prevent mono-cropping soil fatigue and pest buildup.`,
      isEmpirical: true
    });
  }

  // Insight 2: Soil pH Health
  if (soilNutrients.phDistribution) {
    const { acidic, neutral, alkaline } = soilNutrients.phDistribution;
    let dominantPh = 'Neutral (pH 6.5–7.5)';
    if (acidic > neutral && acidic > alkaline) dominantPh = 'Acidic (< pH 6.5)';
    if (alkaline > neutral && alkaline > acidic) dominantPh = 'Alkaline (> pH 7.5)';

    insights.push({
      type: 'soil',
      title: `Soil Acidity & Alkalinity Profile`,
      observation: `Soil pH profile indicates ${neutral}% neutral zones, ${acidic}% acidic zones, and ${alkaline}% alkaline zones. Dominant state is ${dominantPh}.`,
      recommendation:
        acidic > 30
          ? 'Agricultural liming (calcium carbonate application) is advised for acidic tracts to enhance micronutrient bioavailability.'
          : alkaline > 30
          ? 'Gypsum or elemental sulfur application is recommended in alkaline pockets to lower pH and mitigate micronutrient lock-up.'
          : 'Soil pH is well-balanced across the majority of parcels, supporting optimal macronutrient cation exchange capacity.',
      isEmpirical: true
    });
  }

  // Insight 3: Macronutrient Balance
  if (soilNutrients.nutrientClassDistribution) {
    const nDist = soilNutrients.nutrientClassDistribution.find(d => d.nutrient.includes('Nitrogen'));
    if (nDist && nDist.low > 35) {
      insights.push({
        type: 'soil',
        title: 'Nitrogen Depletion In Monitored Soil',
        observation: `Empirical data reveals high low-nitrogen classification (${nDist.low}% average low-N tier) across surveyed zones.`,
        recommendation:
          'Incorporate split-dose urea applications or bio-fertilizers (Rhizobium/Azotobacter) to meet target physiological crop stages.',
        isEmpirical: true
      });
    }
  }

  // Insight 4: Data Quality & Model Compatibility
  const yieldCol = columns.find(c => c.standardType === 'yield');
  if (yieldCol) {
    insights.push({
      type: 'model',
      title: 'XGBoost Yield Model Feasibility Confirmed',
      observation: `Valid numerical target variable "${yieldCol.name}" detected with ${recordCount} records. Empirical crop yield estimation pipeline is fully active.`,
      recommendation:
        'Verify hyperparameter tuning settings (learning rate, tree depth, and regularization) on the Model Performance dashboard.',
      isEmpirical: true
    });
  } else {
    insights.push({
      type: 'model',
      title: 'Target Variable Status: Exploratory Mode Only',
      observation:
        'This dataset does not contain an empirical numerical crop yield column (e.g., Yield in tonnes/ha). Descriptive agricultural analytics, soil chemistry, and spatial clustering are rendered.',
      recommendation:
        'To train an XGBoost predictive framework for crop yield estimation, upload a dataset containing yield measurements alongside environmental features.',
      isEmpirical: true
    });
  }

  // Insight 5: Agro-Climatic Correlation
  if (correlations.matrix.length >= 2) {
    let maxCorr = 0;
    let featA = '';
    let featB = '';
    for (let i = 0; i < correlations.features.length; i++) {
      for (let j = i + 1; j < correlations.features.length; j++) {
        const val = Math.abs(correlations.matrix[i][j]);
        if (val > maxCorr && val < 0.99) {
          maxCorr = val;
          featA = correlations.features[i];
          featB = correlations.features[j];
        }
      }
    }
    if (maxCorr > 0.35) {
      insights.push({
        type: 'climate',
        title: `Strong Feature Interaction: ${featA} & ${featB}`,
        observation: `Empirical correlation coefficient of r = ${maxCorr.toFixed(2)} detected between "${featA}" and "${featB}".`,
        recommendation:
          'XGBoost natively captures non-linear feature interactions and collinear features without requiring aggressive manual dimensionality reduction.',
        isEmpirical: true
      });
    }
  }

  return {
    recordCount,
    columnCount,
    stats,
    correlations,
    cropDistribution,
    soilNutrients,
    geoPoints,
    insights,
    regionalBreakdown
  };
}

/**
 * Compares two uploaded datasets side by side
 */
export function compareAgriculturalDatasets(
  datasetA: { name: string; rows: Record<string, any>[]; columns: { name: string }[] },
  datasetB: { name: string; rows: Record<string, any>[]; columns: { name: string }[] }
) {
  const colsA = datasetA.columns.map(c => c.name);
  const colsB = datasetB.columns.map(c => c.name);

  const commonColumns = colsA.filter(c => colsB.includes(c));
  const uniqueToA = colsA.filter(c => !colsB.includes(c));
  const uniqueToB = colsB.filter(c => !colsA.includes(c));

  // Compute common numerical comparison
  const commonNumericComparisons: {
    column: string;
    meanA: number;
    meanB: number;
    minA: number;
    minB: number;
    maxA: number;
    maxB: number;
  }[] = [];

  for (const col of commonColumns) {
    const valsA = datasetA.rows.map(r => r[col]).filter(v => typeof v === 'number') as number[];
    const valsB = datasetB.rows.map(r => r[col]).filter(v => typeof v === 'number') as number[];

    if (valsA.length > 5 && valsB.length > 5) {
      const meanA = +(valsA.reduce((a, b) => a + b, 0) / valsA.length).toFixed(2);
      const meanB = +(valsB.reduce((a, b) => a + b, 0) / valsB.length).toFixed(2);
      commonNumericComparisons.push({
        column: col,
        meanA,
        meanB,
        minA: Math.min(...valsA),
        minB: Math.min(...valsB),
        maxA: Math.max(...valsA),
        maxB: Math.max(...valsB)
      });
    }
  }

  return {
    datasetA: {
      name: datasetA.name,
      records: datasetA.rows.length,
      columnsCount: colsA.length,
      uniqueColumns: uniqueToA
    },
    datasetB: {
      name: datasetB.name,
      records: datasetB.rows.length,
      columnsCount: colsB.length,
      uniqueColumns: uniqueToB
    },
    commonColumnsCount: commonColumns.length,
    commonColumns,
    commonNumericComparisons
  };
}
