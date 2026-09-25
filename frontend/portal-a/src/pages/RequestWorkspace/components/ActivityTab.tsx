// src/pages/RequestWorkspace/components/ActivityTab.tsx
import React from 'react';
import { FaClock } from 'react-icons/fa';
import type { Request } from '../types';
import { ACTION_TEXT, USER_ROLE_TEXT } from '../utils/constants';
import { formatDateTime, getUserName } from '../utils/formatters';

interface ActivityTabProps {
  request: Request;
}

export const ActivityTab: React.FC<ActivityTabProps> = ({ request }) => {
  const activityLog = request.activityLog || [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <FaClock className="text-purple-600" />
        📋 سجل النشاط
      </h3>

      {activityLog.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activityLog
            .slice()
            .reverse()
            .map((log, index) => (
              <ActivityItem key={index} log={log} />
            ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <FaClock className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>لا يوجد سجل نشاط</p>
        </div>
      )}
    </div>
  );
};

// ============================================================
// ✅ Activity Item
// ============================================================
const ActivityItem: React.FC<{ log: any }> = ({ log }) => {
  const actor = log.actorId;

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
        📌
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap justify-between gap-2">
          <div className="min-w-0">
            <span className="font-semibold text-gray-900 dark:text-white">
              {getUserName(actor)}
            </span>
            <span className="text-gray-600 dark:text-gray-400 mr-2">
              {ACTION_TEXT[log.action] || log.action}
            </span>
            {log.actorRole && (
              <span className="text-xs text-gray-400">
                ({USER_ROLE_TEXT[log.actorRole] || log.actorRole})
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0">
            {formatDateTime(log.timestamp)}
          </span>
        </div>

        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {Object.entries(log.metadata).map(([key, value]) => (
              <span
                key={key}
                className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded"
              >
                {key}: {String(value).slice(0, 50)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};