// src/pages/RequestWorkspace/components/MessagesTab.tsx
import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaSpinner, FaComments } from 'react-icons/fa';
import type { Request, RequestMessage } from '../types';
import { getUserName, formatTime } from '../utils/formatters';
import { USER_ROLE_TEXT } from '../utils/constants';

interface MessagesTabProps {
  request: Request;
  currentUserId: string | undefined;
  onSendMessage: (message: string) => Promise<boolean>;
}

export const MessagesTab: React.FC<MessagesTabProps> = ({
  request,
  currentUserId,
  onSendMessage,
}) => {
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [request.messages]);

  const handleSend = async () => {
    if (!messageText.trim() || sending) return;

    setSending(true);
    const success = await onSendMessage(messageText.trim());

    if (success) {
      setMessageText('');
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }

    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        💬 الرسائل
      </h3>

      {/* Messages List */}
      <div className="space-y-4 max-h-96 overflow-y-auto mb-4 p-2">
        {request.messages && request.messages.length > 0 ? (
          request.messages.map((msg, index) => {
            const isOwn =
              (typeof msg.senderId === 'object'
                ? msg.senderId._id
                : msg.senderId) === currentUserId;

            return (
              <MessageBubble
                key={msg._id || index}
                message={msg}
                isOwn={isOwn}
              />
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FaComments className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>لا توجد رسائل</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
          placeholder="اكتب رسالة..."
          disabled={sending}
        />
        <button
          onClick={handleSend}
          disabled={sending || !messageText.trim()}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
        >
          {sending ? (
            <FaSpinner className="animate-spin" />
          ) : (
            <FaPaperPlane />
          )}
          إرسال
        </button>
      </div>
    </div>
  );
};

// ============================================================
// ✅ Message Bubble
// ============================================================
const MessageBubble: React.FC<{
  message: RequestMessage;
  isOwn: boolean;
}> = ({ message, isOwn }) => (
  <div className={`flex ${isOwn ? 'flex-row-reverse' : ''}`}>
    <div
      className={`max-w-[75%] rounded-lg p-3 ${
        isOwn
          ? 'bg-purple-100 dark:bg-purple-900/30'
          : 'bg-gray-100 dark:bg-gray-700'
      }`}
    >
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className="font-semibold text-sm text-gray-900 dark:text-white">
          {getUserName(message.senderId)}
        </span>
        <span className="text-xs text-gray-400">
          {USER_ROLE_TEXT[message.senderRole] || message.senderRole}
        </span>
        <span className="text-xs text-gray-400">
          {formatTime(message.createdAt)}
        </span>
      </div>
      <p className="text-gray-700 dark:text-gray-300 break-words">
        {message.message}
      </p>
      {message.attachments && message.attachments.length > 0 && (
        <div className="mt-2 flex gap-2 flex-wrap">
          {message.attachments.map((att, i) => (
            <span
              key={i}
              className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded"
            >
              📎 {att.filename}
            </span>
          ))}
        </div>
      )}
    </div>
  </div>
);