import React from 'react';
import {
  Home,
  UploadCloud,
  BarChart3,
  Sprout,
  Activity,
  SlidersHorizontal,
  GitCompare,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { ActiveTab, ActiveDatasetState } from '../types/dataset';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  dataset: ActiveDatasetState | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, dataset }) => {
  const navItems = [
    { id: 'home' as ActiveTab, label: 'Home', icon: Home },
    { id: 'upload' as ActiveTab, label: 'Upload Dataset', icon: UploadCloud },
    { id: 'analysis' as ActiveTab, label: 'Data Analysis', icon: BarChart3 },
    { id: 'prediction' as ActiveTab, label: 'Crop Yield Prediction', icon: Sprout },
    { id: 'performance' as ActiveTab, label: 'Model Performance', icon: Activity },
    { id: 'importance' as ActiveTab, label: 'Feature Importance', icon: SlidersHorizontal },
    { id: 'comparison' as ActiveTab, label: 'Dataset Comparison', icon: GitCompare },
    { id: 'about' as ActiveTab, label: 'About Project', icon: BookOpen }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white text-base tracking-tight leading-none">
              CropYield <span className="text-emerald-400">AI</span>
            </div>
            <div className="text-[11px] text-slate-400 font-normal mt-1 leading-none">
              Predictive Framework
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Menu
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Active Dataset Status Widget */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="px-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Active Dataset
        </div>
        {dataset ? (
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-200 font-medium truncate">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate" title={dataset.filename}>{dataset.filename}</span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>{dataset.rows.length.toLocaleString()} rows · {dataset.columns.length} cols</span>
            </div>
            <div className="pt-1 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px]">
              {dataset.modelResult.isTrained ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-emerald-300">XGBoost Active</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-amber-300">EDA Mode (No Yield)</span>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/70 text-xs text-slate-400">
            No dataset loaded. Click Upload Dataset to begin.
          </div>
        )}
      </div>
    </aside>
  );
};
