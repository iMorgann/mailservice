import React from 'react';
import { FiInfo, FiCheckCircle, FiAlertTriangle, FiX, FiLoader } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';

const MonitorTab = ({ 
  totalRecipients, 
  progress, 
  successCount, 
  failureCount, 
  logs, 
  setLogs, 
  emailResults, 
  setEmailResults, 
  isLoading,
  bulkJobId,
  cancelOperation,
  addLog
}) => {
  // Calculate percentage for progress bar
  const progressPercentage = totalRecipients > 0 
    ? Math.min(100, Math.round((progress / totalRecipients) * 100)) 
    : 0;
  
  // Calculate counts for display
  const processingCount = totalRecipients - (successCount + failureCount);
  
  // Handle cancel operation
  const handleCancel = async () => {
    if (!bulkJobId) {
      addLog("No active job to cancel", "error");
      return;
    }
    
    try {
      // Show cancellation in progress
      addLog(`Attempting to cancel operation: ${bulkJobId}`, "info");
      
      // Call the cancelOperation function passed from parent component
      await cancelOperation(bulkJobId);
      
    } catch (error) {
      addLog(`Error canceling operation: ${error.message}`, "error");
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-4">Email Progress</h3>
        
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span>{progressPercentage}% Complete</span>
            <span>{progress} of {totalRecipients}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <motion.div 
              className="h-full bg-blue-500 rounded-full" 
              initial={{ width: '0%' }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-blue-100 p-3 rounded-lg">
            <div className="text-blue-500 text-xl font-bold">{processingCount}</div>
            <div className="text-sm text-gray-500">Processing</div>
          </div>
          <div className="bg-green-100 p-3 rounded-lg">
            <div className="text-green-500 text-xl font-bold">{successCount}</div>
            <div className="text-sm text-gray-500">Succeeded</div>
          </div>
          <div className="bg-red-100 p-3 rounded-lg">
            <div className="text-red-500 text-xl font-bold">{failureCount}</div>
            <div className="text-sm text-gray-500">Failed</div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-medium">Activity Log</h3>
            {logs.length > 0 && (
              <button 
                onClick={() => setLogs([])} 
                className="text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>
          
          <div className="bg-white border rounded-lg h-64 overflow-y-auto p-3">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FiInfo size={24} className="mb-2" />
                <p>No activity to display</p>
              </div>
            ) : (
              <AnimatePresence>
                {logs.map((log, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`mb-2 p-2 rounded text-sm flex items-start ${
                      log.type === 'success' ? 'bg-green-50' : 
                      log.type === 'error' ? 'bg-red-50' : 'bg-blue-50'
                    }`}
                  >
                    <span className="mr-2 mt-0.5">
                      {log.type === 'success' ? <FiCheckCircle className="text-green-500" /> : 
                       log.type === 'error' ? <FiAlertTriangle className="text-red-500" /> : 
                       <FiInfo className="text-blue-500" />}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className={`font-medium ${
                          log.type === 'success' ? 'text-green-700' : 
                          log.type === 'error' ? 'text-red-700' : 'text-blue-700'
                        }`}>
                          {log.type.charAt(0).toUpperCase() + log.type.slice(1)}
                        </span>
                        <span className="text-gray-500 text-xs">{log.timestamp}</span>
                      </div>
                      <p className="text-gray-700">{log.message}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-medium">Email Results</h3>
            {emailResults.length > 0 && (
              <button 
                onClick={() => setEmailResults([])} 
                className="text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>
          
          <div className="bg-white border rounded-lg h-64 overflow-y-auto">
            {emailResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FiInfo size={24} className="mb-2" />
                <p>No email results to display</p>
              </div>
            ) : (
              <div className="divide-y">
                {emailResults.map((result, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="p-3 flex items-start"
                  >
                    <span className={`mr-2 mt-0.5 ${
                      result.success ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {result.success ? <FiCheckCircle /> : <FiX />}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium">{result.recipient}</span>
                        <span className="text-gray-500 text-xs">{result.timestamp}</span>
                      </div>
                      <p className={`text-sm ${
                        result.success ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.success ? 'Sent successfully' : `Failed: ${result.error}`}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center">
          <motion.button
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-6 rounded-lg shadow-lg transition duration-200 flex items-center"
            onClick={handleCancel}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiX className="mr-2" />
            Cancel Operation
          </motion.button>
        </div>
      )}

      {/* Display bulk job ID for reference if available */}
      {bulkJobId && (
        <div className="text-center text-sm text-gray-500 mt-2">
          <span>Job ID: {bulkJobId}</span>
        </div>
      )}
    </div>
  );
};

export default MonitorTab;