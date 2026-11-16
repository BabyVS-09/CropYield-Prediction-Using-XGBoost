import React from 'react';
import { FileText, Database, Sparkles } from 'lucide-react';
import { ActiveDatasetState } from '../types/dataset';
import { getSampleDatasets, DatasetMeta } from '../data/sampleDatasets';

interface HeaderProps {
  dataset: ActiveDatasetState | null;
  onSelectSampleDataset: (meta: DatasetMeta) => void;
  onOpenReport: () => void;
}

export const Header: React.FC<HeaderProps> = ({ dataset, onSelectSampleDataset, onOpenReport }) => {
  const sampleDatasets = getSampleDatasets();

  return (
    <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between gap-6 shrink-0">
      {/* Zone 1: Breadcrumb & Title */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-sm font-semibold text-slate-900 truncate">
          CropYield AI
        </span>
        <span className="text-slate-300 font-light">/</span>
        <span className="text-xs text-slate-500 truncate hidden sm:inline">
          {dataset ? dataset.classification.category : 'Intelligent Crop Yield Prediction & Agricultural Analysis'}
        </span>
      </div>

      {/* Zone 2: Tagline / Status */}
      <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
        <span>Smarter Data · Better Predictions · Sustainable Agriculture</span>
      </div>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Sample Datasets Selector */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>Switch Benchmark Data</span>
          </button>
          <div className="absolute right-0 mt-1 w-72 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 hidden group-hover:block z-50">
            <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Benchmark Agricultural Datasets
            </div>
            {sampleDatasets.map(d => (
              <button
                key={d.id}
                onClick={() => onSelectSampleDataset(d)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex flex-col gap-0.5 transition-colors border-b border-slate-100 last:border-0"
              >
                <div className="font-semibold text-slate-800 flex items-center justify-between">
                  <span className="truncate">{d.name}</span>
                  {d.hasYieldTarget && (
                    <span className="text-[10px] text-emerald-600 font-bold ml-1 shrink-0">Yield Ready</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 line-clamp-1">{d.category} · {d.recordsCount} rows</div>
              </button>
            ))}
          </div>
        </div>

        {/* Report Button */}
        {dataset && (
          <button
            onClick={onOpenReport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Analysis Report</span>
          </button>
        )}
      </div>
    </header>
  );
};
