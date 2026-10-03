import React, { useState, useMemo } from 'react';
import {
  Search, ChevronRight, ChevronDown, Layers, Box, EyeOff, Eye,
  Maximize2, RotateCcw, PanelLeftClose, PanelLeftOpen, Wrench
} from 'lucide-react';
import { useSimulationStore } from '../../stores/simulationStore';

export const LeftHierarchyPanel: React.FC = () => {
  const {
    activeModel,
    selectedComponentId,
    removedComponentIds,
    hiddenComponentIds,
    isolatedComponentId,
    selectComponent,
    removeComponent,
    restoreComponent,
    hideComponent,
    unhideComponent,
    isolateComponent,
    cinematicMode,
    isLeftPanelOpen,
    toggleLeftPanel,
    handTrackingActive
  } = useSimulationStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedAssemblies, setCollapsedAssemblies] = useState<Record<string, boolean>>({});

  const filteredAssemblies = useMemo(() => {
    if (!activeModel) return [];
    if (!searchQuery.trim()) return activeModel.assemblies;
    const q = searchQuery.toLowerCase();
    return activeModel.assemblies.filter(asm => {
      const nameMatch = asm.name.toLowerCase().includes(q);
      const childMatch = activeModel.components.some(c =>
        c.parentAssemblyId === asm.id && (c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
      );
      return nameMatch || childMatch;
    });
  }, [activeModel, searchQuery]);

  const toggleAssembly = (asmId: string) => {
    setCollapsedAssemblies(prev => ({ ...prev, [asmId]: !prev[asmId] }));
  };

  if (cinematicMode || !activeModel || handTrackingActive) return null;

  return (
    <aside
      className={`absolute top-16 left-4 bottom-24 z-10 transition-all duration-300 flex flex-col pointer-events-auto ${
        isLeftPanelOpen ? 'w-72 sm:w-80' : 'w-10'
      }`}
    >
      <div className="relative flex flex-col h-full bg-dark-950/95 backdrop-blur-xl rounded-2xl border border-red-500/25 shadow-premium-dark overflow-hidden font-mono text-xs text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-dark-800 bg-dark-900/90">
          {isLeftPanelOpen ? (
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-500" />
              <span className="font-bold text-xs uppercase tracking-wider text-white truncate max-w-[190px]">
                {activeModel.shortName} Assembly
              </span>
            </div>
          ) : (
            <div />
          )}

          <button
            onClick={toggleLeftPanel}
            className="p-1 rounded-md text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
            title={isLeftPanelOpen ? 'Collapse Items List' : 'Expand Items List'}
          >
            {isLeftPanelOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        </div>

        {isLeftPanelOpen && (
          <>
            {/* Search Input */}
            <div className="px-3 py-2 border-b border-dark-800 bg-dark-900/40">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-dark-400" />
                <input
                  type="text"
                  placeholder="Filter subsystems & parts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-dark-900 border border-dark-800 text-white placeholder:text-dark-400 focus:outline-none focus:border-red-500 font-sans transition-all"
                />
              </div>
            </div>

            {/* Tree Scroll Area */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5 text-xs scrollbar-thin">
              {filteredAssemblies.length === 0 ? (
                <div className="p-4 text-center text-dark-400 text-xs">
                  No subsystems found
                </div>
              ) : (
                filteredAssemblies.map((asm) => {
                  const isCollapsed = collapsedAssemblies[asm.id];
                  const componentsInAsm = activeModel.components.filter(c => c.parentAssemblyId === asm.id);

                  return (
                    <div key={asm.id} className="rounded-xl bg-dark-900/60 border border-dark-800/80 overflow-hidden">
                      {/* Assembly Group Row */}
                      <div
                        onClick={() => toggleAssembly(asm.id)}
                        className="flex items-center justify-between px-2.5 py-1.5 cursor-pointer hover:bg-dark-850 transition-colors select-none"
                      >
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          {isCollapsed ? (
                            <ChevronRight className="w-3.5 h-3.5 text-dark-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          )}
                          <span
                            className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: asm.colorHex || '#EF4444' }}
                          />
                          <span className="font-semibold text-xs text-white truncate">
                            {asm.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-dark-400 px-1.5 py-0.5 rounded bg-dark-950">
                          {componentsInAsm.length}
                        </span>
                      </div>

                      {/* Component Items */}
                      {!isCollapsed && (
                        <div className="px-1.5 pb-1 space-y-0.5">
                          {componentsInAsm.map((comp) => {
                            const isSelected = selectedComponentId === comp.id || selectedComponentId === comp.nodeName;
                            const isRemoved = removedComponentIds.includes(comp.id) || removedComponentIds.includes(comp.nodeName);
                            const isHidden = hiddenComponentIds.includes(comp.id) || hiddenComponentIds.includes(comp.nodeName);
                            const isIsolated = isolatedComponentId === comp.id || isolatedComponentId === comp.nodeName;

                            return (
                              <div
                                key={comp.id}
                                onClick={() => selectComponent(isSelected ? null : comp.id)}
                                className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-red-600 text-white font-medium shadow-glow-red'
                                    : 'hover:bg-dark-800 text-dark-200 hover:text-white'
                                } ${isRemoved || isHidden ? 'opacity-40 line-through' : ''}`}
                              >
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                  <Box className={`w-3 h-3 shrink-0 ${isSelected ? 'text-white' : 'text-red-500'}`} />
                                  <span className="truncate text-[11px]">
                                    {comp.name}
                                  </span>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-1 shrink-0 ml-1.5" onClick={(e) => e.stopPropagation()}>
                                  {/* Hide/Unhide */}
                                  <button
                                    onClick={() => isHidden ? unhideComponent(comp.id) : hideComponent(comp.id)}
                                    title={isHidden ? 'Unhide Component' : 'Hide Component'}
                                    className={`p-1 rounded hover:bg-dark-700 transition-colors ${
                                      isHidden ? 'text-amber-400' : 'text-dark-400 hover:text-white'
                                    }`}
                                  >
                                    {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  </button>

                                  {/* Remove/Restore */}
                                  {isRemoved ? (
                                    <button
                                      onClick={() => restoreComponent(comp.id)}
                                      title="Restore Component to Assembly"
                                      className="p-1 rounded hover:bg-dark-700 text-emerald-400 transition-colors"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => removeComponent(comp.id)}
                                      title="Remove Component"
                                      className="p-1 rounded hover:bg-dark-700 text-dark-400 hover:text-red-400 transition-colors"
                                    >
                                      <Wrench className="w-3 h-3" />
                                    </button>
                                  )}

                                  <button
                                    onClick={() => isolateComponent(isIsolated ? null : comp.id)}
                                    title={isIsolated ? 'Show All Components' : 'Isolate Component'}
                                    className={`p-1 rounded hover:bg-dark-700 transition-colors ${
                                      isIsolated ? 'text-red-400' : 'text-dark-400 hover:text-white'
                                    }`}
                                  >
                                    <Maximize2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
