// src/pages/RequestWorkspace/components/RequestTabs.tsx
import React from 'react';
import type { TabId, TabConfig } from '../types';

interface RequestTabsProps {
  tabs: TabConfig[];
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}

export const RequestTabs: React.FC<RequestTabsProps> = ({
  tabs,
  activeTab,
  onChange,
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6 bg-white dark:bg-gray-800 rounded-xl p-2 shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === tab.id
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
              : 'text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};