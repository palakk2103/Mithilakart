import React, { useState } from 'react';
import { 
  getStoredHeaderTabs, 
  saveHeaderTabsConfig, 
  resetHeaderTabsConfig, 
  DEFAULT_USER_APP_TABS 
} from '../../../config/userAppTabs';
import { 
  Plus, Trash2, ArrowUp, ArrowDown, Save, RotateCcw, 
  Check, Eye, EyeOff, Layout, Sparkles, Clock, Plane, Zap, ShoppingBag, Tag
} from 'lucide-react';

const ICON_OPTIONS = [
  { value: 'none', label: 'No Icon (Text Only)' },
  { value: 'image', label: 'Mithilakart Logo Image' },
  { value: 'clock', label: 'Clock (Quick Delivery)' },
  { value: 'plane', label: 'Plane (Express / Air)' },
  { value: 'zap', label: 'Zap / Lightning' },
  { value: 'bag', label: 'Shopping Bag' },
  { value: 'tag', label: 'Offer Tag' },
  { value: 'sparkles', label: 'Sparkles / Featured' },
];

const ROUTE_SUGGESTIONS = [
  { label: 'Home Page', value: '/home', flow: 'mithilakart' },
  { label: 'Quick Shop', value: '/quick-shop', flow: 'quickshop' },
  { label: 'Mithilak Express', value: '/mithilak', flow: 'mithilak' },
  { label: 'Groceries & Fresh', value: '/fresh-grocery', flow: 'freshgrocery' },
  { label: 'Deals & Offers', value: '/deals', flow: 'mithilakart' },
  { label: 'All Categories', value: '/categories', flow: 'mithilakart' },
  { label: 'All Offers Page', value: '/all-offers', flow: 'mithilakart' },
  { label: 'Toys Store', value: '/toys', flow: 'mithilakart' },
  { label: 'Beauty Store', value: '/beauty', flow: 'mithilakart' },
];

const HeaderTabsManager = () => {
  const [tabs, setTabs] = useState(() => getStoredHeaderTabs());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newTab, setNewTab] = useState({
    id: '',
    label: '',
    route: '/home',
    flow: 'mithilakart',
    iconType: 'tag',
    enabled: true,
  });

  const handleToggleEnable = (index) => {
    const updated = [...tabs];
    updated[index].enabled = !updated[index].enabled;
    setTabs(updated);
  };

  const handleLabelChange = (index, value) => {
    const updated = [...tabs];
    updated[index].label = value;
    delete updated[index].i18nKey; // Override translation key if custom label set
    setTabs(updated);
  };

  const handleRouteSelect = (index, routeValue) => {
    const matched = ROUTE_SUGGESTIONS.find((r) => r.value === routeValue);
    const updated = [...tabs];
    updated[index].route = routeValue;
    if (matched?.flow) {
      updated[index].flow = matched.flow;
    }
    setTabs(updated);
  };

  const handleIconChange = (index, iconValue) => {
    const updated = [...tabs];
    updated[index].iconType = iconValue;
    if (iconValue === 'image') {
      updated[index].imageSrc = '/mthibg.png';
    }
    setTabs(updated);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const updated = [...tabs];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setTabs(updated);
  };

  const handleMoveDown = (index) => {
    if (index === tabs.length - 1) return;
    const updated = [...tabs];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setTabs(updated);
  };

  const handleDeleteTab = (index) => {
    if (tabs.length <= 1) {
      alert('At least one tab must remain enabled in the header.');
      return;
    }
    if (window.confirm(`Are you sure you want to remove the "${tabs[index].label}" tab?`)) {
      const updated = tabs.filter((_, i) => i !== index);
      setTabs(updated);
    }
  };

  const handleSave = () => {
    saveHeaderTabsConfig(tabs);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Reset all header tabs to default configuration?')) {
      resetHeaderTabsConfig();
      setTabs(DEFAULT_USER_APP_TABS);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handleCreateTabSubmit = (e) => {
    e.preventDefault();
    if (!newTab.label.trim()) {
      alert('Please enter a tab title');
      return;
    }
    const tabId = newTab.id.trim() || `tab_${Date.now()}`;
    const matched = ROUTE_SUGGESTIONS.find((r) => r.value === newTab.route);

    const created = {
      id: tabId,
      label: newTab.label.trim(),
      route: newTab.route,
      flow: matched?.flow || 'mithilakart',
      enabled: true,
      iconType: newTab.iconType,
      imageSrc: newTab.iconType === 'image' ? '/mthibg.png' : undefined,
      activeBgClass: 'bg-white text-slate-900 border-white',
      activeTextClass: 'text-slate-900',
    };

    const updated = [...tabs, created];
    setTabs(updated);
    setIsAddModalOpen(false);
    setNewTab({
      id: '',
      label: '',
      route: '/home',
      flow: 'mithilakart',
      iconType: 'tag',
      enabled: true,
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Layout className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Header Tabs Manager</h1>
          </div>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Configure User App navigation header tabs — Rename, reorder, add, or toggle tab visibility in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Defaults
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add New Tab
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-black hover:bg-emerald-700 transition-all text-sm shadow-md"
          >
            {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {savedSuccess ? 'Saved Live!' : 'Save & Publish'}
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-2 text-sm animate-fade-in">
          <Check className="w-5 h-5 text-emerald-600" />
          Header tabs configuration saved successfully! The User App navigation has been updated live.
        </div>
      )}

      {/* Tabs List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
            Configured Header Tabs ({tabs.length})
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            Order determines position in header (Top to Bottom = Left to Right)
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {tabs.map((tab, idx) => (
            <div
              key={tab.id || idx}
              className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                !tab.enabled ? 'bg-slate-50/80 opacity-75' : 'hover:bg-slate-50/40'
              }`}
            >
              {/* Left Column: Order & Status */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveUp(idx)}
                    className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-30 transition-all"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === tabs.length - 1}
                    onClick={() => handleMoveDown(idx)}
                    className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-30 transition-all"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center">
                  {idx + 1}
                </span>

                <button
                  type="button"
                  onClick={() => handleToggleEnable(idx)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    tab.enabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {tab.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {tab.enabled ? 'Active' : 'Disabled'}
                </button>
              </div>

              {/* Middle Inputs: Title, Route, Icon */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Title */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Tab Title / Label</label>
                  <input
                    type="text"
                    value={tab.label}
                    onChange={(e) => handleLabelChange(idx, e.target.value)}
                    className="w-full px-3 py-2 text-sm font-bold text-slate-800 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Tab Name"
                  />
                </div>

                {/* Route */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Target Page / Route</label>
                  <select
                    value={tab.route}
                    onChange={(e) => handleRouteSelect(idx, e.target.value)}
                    className="w-full px-3 py-2 text-sm font-semibold text-slate-800 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {ROUTE_SUGGESTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label} ({r.value})
                      </option>
                    ))}
                    {!ROUTE_SUGGESTIONS.some((r) => r.value === tab.route) && (
                      <option value={tab.route}>{tab.route}</option>
                    )}
                  </select>
                </div>

                {/* Icon */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Icon Style</label>
                  <select
                    value={tab.iconType || 'none'}
                    onChange={(e) => handleIconChange(idx, e.target.value)}
                    className="w-full px-3 py-2 text-sm font-semibold text-slate-800 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteTab(idx)}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-100 transition-all"
                  title="Remove Tab"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Tab Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">Add New Header Tab</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-black text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTabSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tab Display Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hot Deals, Fresh Milk, Electronics"
                  value={newTab.label}
                  onChange={(e) => setNewTab({ ...newTab, label: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Destination Page / Route *</label>
                <select
                  value={newTab.route}
                  onChange={(e) => setNewTab({ ...newTab, route: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {ROUTE_SUGGESTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label} ({r.value})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Icon Style</label>
                <select
                  value={newTab.iconType}
                  onChange={(e) => setNewTab({ ...newTab, iconType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add Tab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderTabsManager;
