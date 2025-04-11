import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiMail, FiCode, FiEye } from 'react-icons/fi';

const EmailPreviewModal = ({ previewData, messageType, setShowPreview }) => {
  const { subject, message, recipient, from, replyTo } = previewData;
  const [showSource, setShowSource] = useState(false);
  
  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setShowPreview(false)}
    >
      <motion.div 
        className="bg-white rounded-xl overflow-hidden max-w-2xl w-full"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: "spring", duration: 0.4 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white">
          <h3 className="text-lg font-semibold flex items-center">
            <FiMail className="mr-2" />
            Email Preview
          </h3>
          <button
            onClick={() => setShowPreview(false)}
            className="text-white hover:text-red-200 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="p-5 bg-gray-50 border-b">
          <div className="flex items-start mb-3">
            <div className="text-gray-500 font-medium w-20">From:</div>
            <div className="flex-1">{from}</div>
          </div>
          <div className="flex items-start mb-3">
            <div className="text-gray-500 font-medium w-20">To:</div>
            <div className="flex-1">{recipient}</div>
          </div>
          {replyTo && (
            <div className="flex items-start mb-3">
              <div className="text-gray-500 font-medium w-20">Reply To:</div>
              <div className="flex-1">{replyTo}</div>
            </div>
          )}
          <div className="flex items-start">
            <div className="text-gray-500 font-medium w-20">Subject:</div>
            <div className="flex-1 font-medium">{subject}</div>
          </div>
        </div>
        
        {(messageType === 'html' || messageType === 'html-code') && (
          <div className="border-b border-gray-200 bg-gray-100 px-5 py-2 flex justify-end">
            <button
              className={`text-sm px-3 py-1 rounded flex items-center gap-1 ${
                showSource 
                  ? "bg-indigo-100 text-indigo-700" 
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => setShowSource(!showSource)}
            >
              {showSource ? (
                <>
                  <FiEye size={14} />
                  View Rendered
                </>
              ) : (
                <>
                  <FiCode size={14} />
                  View Source
                </>
              )}
            </button>
          </div>
        )}
        
        <div className="p-5 max-h-[calc(100vh-350px)] overflow-y-auto">
          {(messageType === 'html' || messageType === 'html-code') ? (
            showSource ? (
              <pre className="bg-gray-50 p-4 rounded border border-gray-200 overflow-x-auto font-mono text-sm whitespace-pre-wrap">
                {message}
              </pre>
            ) : (
              <div className="email-preview-content" dangerouslySetInnerHTML={{ __html: message }} />
            )
          ) : (
            <div className="whitespace-pre-wrap">{message}</div>
          )}
        </div>
        
        <div className="p-4 bg-gray-100 flex justify-end">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
            onClick={() => setShowPreview(false)}
          >
            Close Preview
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EmailPreviewModal;