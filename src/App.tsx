/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { HomeTab } from './components/HomeTab';
import { UploadTab } from './components/UploadTab';
import { AnalysisTab } from './components/AnalysisTab';
import { PredictionTab } from './components/PredictionTab';
import { ModelPerformanceTab } from './components/ModelPerformanceTab';
import { FeatureImportanceTab } from './components/FeatureImportanceTab';
import { DatasetComparisonTab } from './components/DatasetComparisonTab';
import { AboutTab } from './components/AboutTab';
import { ReportModal } from './components/ReportModal';
import { ActiveTab, ActiveDatasetState } from './types/dataset';
import { getSampleDatasets, DatasetMeta } from './data/sampleDatasets';
import { parseAndCleanCsv } from './services/dataCleaner';
import { classifyDataset } from './services/columnDetector';
import { generateAgriculturalAnalysis } from './services/agriculturalInsights';
import { trainXGBoostPipeline } from './services/xgboostEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [dataset, setDataset] = useState<ActiveDatasetState | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Load a sample dataset by meta object
  const loadDatasetByMeta = (meta: DatasetMeta) => {
    try {
      const cleaned = parseAndCleanCsv(meta.csvData);
      const classification = classifyDataset(cleaned.columns);
      const analysis = generateAgriculturalAnalysis(cleaned.rows, cleaned.columns);

      const targetCol = meta.targetColumn || classification.targetColumn;
      const initialFeatures = cleaned.headers.filter(h => h !== targetCol);
      const modelResult = trainXGBoostPipeline(cleaned.rows, targetCol, initialFeatures);

      const state: ActiveDatasetState = {
        id: meta.id,
        filename: meta.filename,
        rawCsv: meta.csvData,
        headers: cleaned.headers,
        columns: cleaned.columns,
        rows: cleaned.rows,
        summary: cleaned.summary,
        cleanedCsvString: cleaned.cleanedCsvString,
        classification: {
          ...classification,
          hasYieldTarget: !!targetCol,
          targetColumn: targetCol,
          summaryExplanation: meta.description
        },
        analysis,
        modelResult,
        selectedTargetColumn: targetCol,
        selectedFeatures: initialFeatures
      };

      setDataset(state);
    } catch (err) {
      console.error('Error loading dataset:', err);
    }
  };

  // Load CropDataset-Enhanced.csv on initial startup
  useEffect(() => {
    const samples = getSampleDatasets();
    // Default to CropDataset-Enhanced.csv to immediately showcase user's requested dataset
    const enhanced = samples.find(d => d.id === 'crop-dataset-enhanced') || samples[0];
    loadDatasetByMeta(enhanced);
  }, []);

  const handleLoadYieldDataset = () => {
    const samples = getSampleDatasets();
    const yieldSample = samples.find(d => d.id === 'crop-yield-prediction') || samples[1];
    loadDatasetByMeta(yieldSample);
    setActiveTab('prediction');
  };

  const handleLoadEnhancedDataset = () => {
    const samples = getSampleDatasets();
    const enhanced = samples.find(d => d.id === 'crop-dataset-enhanced') || samples[0];
    loadDatasetByMeta(enhanced);
    setActiveTab('analysis');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        dataset={dataset}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar Header */}
        <Header
          dataset={dataset}
          onSelectSampleDataset={meta => loadDatasetByMeta(meta)}
          onOpenReport={() => setIsReportOpen(true)}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {activeTab === 'home' && (
            <HomeTab
              dataset={dataset}
              onNavigate={setActiveTab}
              onLoadEnhancedDataset={handleLoadEnhancedDataset}
              onLoadYieldDataset={handleLoadYieldDataset}
            />
          )}

          {activeTab === 'upload' && (
            <UploadTab
              dataset={dataset}
              onDatasetLoaded={setDataset}
              onNavigateToAnalysis={() => setActiveTab('analysis')}
            />
          )}

          {activeTab === 'analysis' && (
            <AnalysisTab dataset={dataset} />
          )}

          {activeTab === 'prediction' && (
            <PredictionTab
              dataset={dataset}
              onLoadYieldDataset={handleLoadYieldDataset}
            />
          )}

          {activeTab === 'performance' && (
            <ModelPerformanceTab
              dataset={dataset}
              onRetrainModel={setDataset}
              onLoadYieldDataset={handleLoadYieldDataset}
            />
          )}

          {activeTab === 'importance' && (
            <FeatureImportanceTab
              dataset={dataset}
              onLoadYieldDataset={handleLoadYieldDataset}
            />
          )}

          {activeTab === 'comparison' && (
            <DatasetComparisonTab
              currentDataset={dataset}
            />
          )}

          {activeTab === 'about' && (
            <AboutTab />
          )}
        </main>
      </div>

      {/* Analysis Report Modal */}
      {isReportOpen && dataset && (
        <ReportModal
          dataset={dataset}
          onClose={() => setIsReportOpen(false)}
        />
      )}
    </div>
  );
}
