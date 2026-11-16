/**
 * Column Taxonomy and Dataset Category Detector
 * Dynamically identifies agricultural attributes regardless of variations in column names.
 */

export interface DetectedColumn {
  name: string;
  originalName: string;
  standardType: StandardFeatureType;
  dataType: 'numerical' | 'categorical' | 'percentage' | 'coordinate' | 'empty' | 'text';
  missingCount: number;
  uniqueCount: number;
  sampleValues: (string | number)[];
  isPotentialTarget: boolean;
  confidence: number; // 0 to 1
}

export type StandardFeatureType =
  | 'crop'
  | 'yield'
  | 'rainfall'
  | 'temperature'
  | 'humidity'
  | 'soil_ph'
  | 'nitrogen'
  | 'phosphorus'
  | 'potassium'
  | 'soil_type'
  | 'region'
  | 'season'
  | 'area'
  | 'latitude'
  | 'longitude'
  | 'fertilizer'
  | 'unknown';

export type DatasetCategory =
  | 'Crop Yield Dataset'
  | 'Crop Recommendation Dataset'
  | 'Soil Nutrient Dataset'
  | 'Weather and Climate Dataset'
  | 'Rainfall Dataset'
  | 'Fertilizer Dataset'
  | 'Crop Production Dataset'
  | 'Agricultural Regional Dataset'
  | 'Mixed Agricultural Dataset';

const SYNONYMS: Record<StandardFeatureType, string[]> = {
  crop: ['crop', 'crop_name', 'crop_type', 'label', 'commodity', 'cropname', 'plant', 'cultivar'],
  yield: ['yield', 'crop_yield', 'yield_ton_ha', 'production_per_hectare', 'yield_kg_per_hectare', 'tonnes_per_hectare', 'production_tonnes', 'yield_t_ha', 'cropyield', 'yield_value'],
  rainfall: ['rainfall', 'rain', 'precipitation', 'rainfall_mm', 'annual_rainfall', 'precip', 'rain_fall'],
  temperature: ['temperature', 'temp', 'avg_temperature', 'temperature_c', 'mean_temp', 'max_temp', 'min_temp', 'temparature', 'air_temp'],
  humidity: ['humidity', 'relative_humidity', 'humidity_percent', 'rh', 'humidity_morning', 'humidity_evening', 'relativehumidity'],
  soil_ph: ['ph', 'soil_ph', 'ph_value', 'ph_acidic', 'ph_neutral', 'ph_alkaline', 'soilph', 'acidity'],
  nitrogen: ['nitrogen', 'n', 'n_value', 'nitrogen_kg_ha', 'nitrogen - high', 'nitrogen - medium', 'nitrogen - low', 'n_kg_ha'],
  phosphorus: ['phosphorus', 'phosphorous', 'p', 'p_value', 'phosphorus_kg_ha', 'phosphorous - high', 'phosphorous - medium', 'phosphorous - low', 'p_kg_ha'],
  potassium: ['potassium', 'k', 'k_value', 'potassium_kg_ha', 'potassium - high', 'potassium - medium', 'potassium - low', 'k_kg_ha'],
  soil_type: ['soil_type', 'soil', 'soil_category', 'soiltype', 'soil_name', 'land_type'],
  region: ['region', 'state', 'district', 'location', 'country', 'address', 'zone', 'place', 'county'],
  season: ['season', 'crop_season', 'growing_season', 'season_name', 'cropping_season'],
  area: ['area', 'area_hectares', 'hectares', 'acres', 'field_size', 'cultivated_area'],
  latitude: ['latitude', 'lat', 'y_coord', 'latitude_deg'],
  longitude: ['longitude', 'lng', 'long', 'x_coord', 'longitude_deg'],
  fertilizer: ['fertilizer', 'fertilizer_name', 'fertiliser', 'nutrient_applied'],
  unknown: []
};

export function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_');
}

export function detectColumnTaxonomy(
  header: string,
  sampleValues: any[]
): { standardType: StandardFeatureType; dataType: DetectedColumn['dataType']; confidence: number } {
  const norm = normalizeHeader(header);
  
  // 1. Check if column is completely empty
  const nonEmpty = sampleValues.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
  if (nonEmpty.length === 0) {
    return { standardType: 'unknown', dataType: 'empty', confidence: 1.0 };
  }

  // 2. Check if percentage column (e.g. "45%", "12.5%")
  const percentMatches = nonEmpty.filter(v => typeof v === 'string' && v.trim().endsWith('%'));
  const isPercentage = percentMatches.length / nonEmpty.length > 0.6;

  // 3. Check data type
  const numericCount = nonEmpty.filter(v => {
    if (typeof v === 'number') return true;
    const clean = String(v).replace('%', '').trim();
    return clean !== '' && !isNaN(Number(clean));
  }).length;
  const isNumerical = numericCount / nonEmpty.length > 0.75;

  // 4. Match against taxonomy synonyms
  let bestMatch: StandardFeatureType = 'unknown';
  let highestScore = 0;

  for (const [type, synonyms] of Object.entries(SYNONYMS) as [StandardFeatureType, string[]][]) {
    for (const syn of synonyms) {
      const synNorm = normalizeHeader(syn);
      if (norm === synNorm) {
        bestMatch = type;
        highestScore = 1.0;
        break;
      }
      if (norm.includes(synNorm) || synNorm.includes(norm)) {
        const score = 0.8;
        if (score > highestScore) {
          bestMatch = type;
          highestScore = score;
        }
      }
    }
    if (highestScore === 1.0) break;
  }

  // Specific heuristics for lat/lng
  if (bestMatch === 'latitude' || bestMatch === 'longitude') {
    return { standardType: bestMatch, dataType: 'coordinate', confidence: highestScore || 0.9 };
  }

  // Percentage takes precedence in data type
  if (isPercentage) {
    return { standardType: bestMatch, dataType: 'percentage', confidence: highestScore || 0.85 };
  }

  if (isNumerical) {
    return { standardType: bestMatch, dataType: 'numerical', confidence: highestScore || 0.7 };
  }

  return { standardType: bestMatch, dataType: 'categorical', confidence: highestScore || 0.6 };
}

export function classifyDataset(columns: DetectedColumn[]): {
  category: DatasetCategory;
  hasYieldTarget: boolean;
  targetColumn: string | null;
  summaryExplanation: string;
} {
  const yieldCol = columns.find(c => c.standardType === 'yield' && (c.dataType === 'numerical' || c.dataType === 'percentage'));
  const cropCol = columns.find(c => c.standardType === 'crop');
  const rainCol = columns.find(c => c.standardType === 'rainfall');
  const tempCol = columns.find(c => c.standardType === 'temperature');
  const soilCols = columns.filter(c => ['nitrogen', 'phosphorus', 'potassium', 'soil_ph', 'soil_type'].includes(c.standardType));
  const fertCol = columns.find(c => c.standardType === 'fertilizer');
  const regionCol = columns.find(c => c.standardType === 'region');

  if (yieldCol) {
    return {
      category: 'Crop Yield Dataset',
      hasYieldTarget: true,
      targetColumn: yieldCol.originalName,
      summaryExplanation: `Detected numerical target variable "${yieldCol.originalName}". This dataset is ready for XGBoost regression yield estimation.`
    };
  }

  if (cropCol && soilCols.length >= 2 && (rainCol || tempCol)) {
    return {
      category: 'Crop Recommendation Dataset',
      hasYieldTarget: false,
      targetColumn: null,
      summaryExplanation: `Detected environmental and soil features with crop classifications. Suitable for crop suitability analysis and classification, but lacks an empirical numerical crop yield column.`
    };
  }

  if (soilCols.length >= 3) {
    return {
      category: 'Soil Nutrient Dataset',
      hasYieldTarget: false,
      targetColumn: null,
      summaryExplanation: `Detected extensive soil chemical and nutrient distributions (N, P, K, pH). Does not contain a crop yield target column.`
    };
  }

  if (fertCol) {
    return {
      category: 'Fertilizer Dataset',
      hasYieldTarget: false,
      targetColumn: null,
      summaryExplanation: `Contains fertilizer recommendations, soil moisture, and crop nutrient requirements.`
    };
  }

  if (rainCol && tempCol) {
    return {
      category: 'Weather and Climate Dataset',
      hasYieldTarget: false,
      targetColumn: null,
      summaryExplanation: `Contains agro-meteorological parameters (rainfall, temperature, humidity).`
    };
  }

  if (regionCol && cropCol) {
    return {
      category: 'Agricultural Regional Dataset',
      hasYieldTarget: false,
      targetColumn: null,
      summaryExplanation: `Contains regional distribution of crops and agricultural spatial boundaries.`
    };
  }

  return {
    category: 'Mixed Agricultural Dataset',
    hasYieldTarget: false,
    targetColumn: null,
    summaryExplanation: `Dataset containing heterogeneous agricultural features. Full exploratory data analysis is available.`
  };
}
