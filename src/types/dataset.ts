import { DetectedColumn, DatasetCategory } from '../services/columnDetector';
import { PreprocessSummary } from '../services/dataCleaner';
import { XGBoostModelResult, TrainedModelResult } from '../services/xgboostEngine';
import { ComprehensiveAnalysis } from '../services/agriculturalInsights';

export interface ActiveDatasetState {
  id: string;
  filename: string;
  rawCsv: string;
  headers: string[];
  columns: DetectedColumn[];
  rows: Record<string, any>[];
  summary: PreprocessSummary;
  cleanedCsvString: string;
  classification: {
    category: DatasetCategory;
    hasYieldTarget: boolean;
    targetColumn: string | null;
    summaryExplanation: string;
  };
  analysis: ComprehensiveAnalysis;
  modelResult: XGBoostModelResult;
  selectedTargetColumn: string | null;
  selectedFeatures: string[];
}

export type ActiveTab =
  | 'home'
  | 'upload'
  | 'analysis'
  | 'prediction'
  | 'performance'
  | 'importance'
  | 'comparison'
  | 'about';
