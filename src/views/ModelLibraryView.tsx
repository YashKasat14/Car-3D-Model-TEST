import React, { useState } from 'react';
import {
  Layers, Upload, Search, ChevronLeft, ArrowRight, Wrench,
  CheckCircle2, Clock, Sliders, Wind, Play, Volume2, Trash2, Trophy
} from 'lucide-react';
import { useSimulationStore } from '../stores/simulationStore';
import { getAllModels, deleteUserModel } from '../data/modelsRegistry';
import { ModelManifest } from '../types/model';

import { getModelBlob } from '../services/modelStorage';

export const ModelLibraryView: React.FC = () => {
  const { setActiveView, setActiveModel } = useSimulationStore();
  const [filter, setFilter] = useState<'all' | 'formula1' | 'custom'>('all');
  const [search, setSearch] = useState('');
  const [models, setModels] = useState<ModelManifest[]>(getAllModels());

  const filteredModels = models.filter((m) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'custom' && m.category === 'custom') ||
      m.category === filter;
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleLaunch = async (model: ModelManifest) => {
    let manifestToLoad = model;
    try {
      const blob = await getModelBlob(model.id);
      if (blob) {
        manifestToLoad = {
          ...model,
          assetUrl: URL.createObjectURL(blob)
        };
      }
    } catch (e) {
      console.warn('Failed to retrieve model blob:', e);
    }
    setActiveModel(manifestToLoad);
    setActiveView('simulator');
  };

  const handleAuthor = (model: ModelManifest) => {
    setActiveModel(model);
    setActiveView('authoring');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteUserModel(id);
    setModels(getAllModels());
  };

  return (
    <div className="relative min-h-screen px-6 py-8 sm:px-12 z-10 flex flex-col max-w-7xl mx-auto space-y-8 text-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-red-500/20 pb-6">
        <div>
          <button
            onClick={() => setActiveView('home')}
            className="flex items-center gap-1.5 text-xs font-mono font-medium text-dark-300 hover:text-white mb-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-red-500" />
            <span>BACK TO HOME</span>
          </button>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-sans tracking-tight">
            ENGINEERING MODEL ARCHIVE
          </h2>
          <p className="text-xs sm:text-sm text-dark-400 font-sans mt-1">
            Universal archive of addressable mechanical assemblies and digital-twin assets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('importer')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold shadow-glow-red transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>IMPORT GLB / CAD</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-dark-900 border border-dark-700 font-mono text-xs">
          {[
            { id: 'all', label: 'ALL MODELS' },
            { id: 'formula1', label: 'FORMULA 1' },
            { id: 'custom', label: 'USER IMPORTS' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-all border ${
                filter === tab.id
                  ? 'bg-red-600 text-white font-bold border-red-500 shadow-glow-red'
                  : 'text-dark-300 hover:text-white border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="Search model assemblies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-dark-900 border border-dark-700 text-xs font-mono text-white placeholder-dark-500 focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* Model Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModels.map((model) => (
          <div
            key={model.id}
            className="group relative flex flex-col justify-between bg-dark-900/90 backdrop-blur-xl rounded-2xl border border-red-500/25 p-6 hover:border-red-500 transition-all hover:shadow-premium-dark shadow-sm"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-700/60 uppercase">
                  {model.category}
                </span>

                {model.category === 'custom' && (
                  <button
                    onClick={(e) => handleDelete(model.id, e)}
                    className="p-1 rounded text-dark-400 hover:text-red-400 transition-colors"
                    title="Delete User Model"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <h3 className="text-lg font-bold text-white font-mono group-hover:text-red-400 transition-colors">
                  {model.name}
                </h3>
                <p className="text-xs text-dark-300 mt-2 line-clamp-3 leading-relaxed">
                  {model.description}
                </p>
              </div>

              {/* Subsystems & Nodes Count */}
              <div className="flex items-center gap-4 text-xs font-mono text-dark-400 pt-2 border-t border-dark-800">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-red-500" />
                  <span>{model.assemblies.length} Assemblies</span>
                </div>
                <div>•</div>
                <div>{model.components.length} CAD Parts</div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <button
                onClick={() => handleLaunch(model)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold shadow-glow-red transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>OPEN SIMULATOR</span>
              </button>

              <button
                onClick={() => handleAuthor(model)}
                title="Author Manifest & Assemblies"
                className="p-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-dark-200 hover:text-white border border-dark-600 transition-colors"
              >
                <Wrench className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
