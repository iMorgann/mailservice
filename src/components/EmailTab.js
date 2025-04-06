import React, { useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMail, FiUpload, FiSend, FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import ReactQuill styles
import { Controller } from "react-hook-form";
import * as Papa from "papaparse";
import { EMAIL_TEMPLATES } from "../utils/emailUtils";
import Placeholders from "./Placeholders"; // Import the new Placeholders component

const EmailTab = ({
  register,
  control,
  setValue,
  watch,
  validationErrors,
  setValidationErrors,
  csvColumns,
  setCsvColumns,
  recipientData,
  setRecipientData,
  placeholders,
  setPlaceholders,
  addLog,
  isLoading,
  previewEmail
}) => {
  const quillRef = useRef(null);
  const messageType = watch("messageType");
  const templateId = watch("templateId");
  
  // ReactQuill editor modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'align',
    'link', 'image'
  ];
  
  const handleFileInput = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      
      // Try to detect if it's a CSV file
      if (file.name.endsWith('.csv')) {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              // Extract email column
              let emailColumn = '';
              const firstRow = results.data[0];
              const columns = Object.keys(firstRow);
              
              // Try to find email column
              for (const col of columns) {
                if (col.toLowerCase().includes('email')) {
                  emailColumn = col;
                  break;
                }
              }
              
              if (!emailColumn && columns.length > 0) {
                emailColumn = columns[0]; // Default to first column
              }
              
              if (emailColumn) {
                // Extract emails
                const emails = results.data
                  .map(row => row[emailColumn])
                  .filter(email => email && typeof email === 'string' && email.includes('@'));
                
                setValue("recipients", emails.join(',\n'));
                
                // Save all data for personalization
                setRecipientData(results.data);
                setCsvColumns(columns);
                
                // Add CSV columns as available placeholders
                const newPlaceholders = columns.map(col => ({
                  key: col,
                  description: `CSV column: ${col}`
                }));
                
                setPlaceholders(prev => {
                  const existingKeys = new Set(prev.map(p => p.key));
                  return [
                    ...prev,
                    ...newPlaceholders.filter(p => !existingKeys.has(p.key))
                  ];
                });
                
                addLog(`Imported ${emails.length} emails from CSV with ${columns.length} data columns`, "success");
              } else {
                addLog("Could not identify email column in CSV", "error");
              }
            }
          }
        });
      } else {
        // Plain text list
        const recipients = text
          .split(/\r?\n/)
          .filter((line) => line.trim() !== "" && line.includes('@'))
          .join(',\n');
        
        setValue("recipients", recipients);
        addLog(`Imported recipient list with ${recipients.split(',\n').length} emails`, "success");
      }
    } catch (error) {
      addLog(`Error importing file: ${error.message}`, "error");
    }
  };
  
  const applyTemplate = useCallback((templateId) => {
    const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setValue("subject", template.subject);
      setValue("message", template.content);
      
      addLog(`Applied template: ${template.name}`, "info");
    }
  }, [setValue, addLog]);
  
  // Function to insert placeholder at cursor position
  const insertPlaceholder = (placeholder) => {
    if (messageType === "html" && quillRef.current) {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection();
      if (range) {
        quill.insertText(range.index, placeholder);
      } else {
        // If no selection, insert at the end
        quill.insertText(quill.getLength() - 1, placeholder);
      }
      setValue("message", quill.root.innerHTML);
    } else {
      // For plain text
      const msgField = document.querySelector('textarea[name="message"]');
      if (msgField) {
        const cursorPos = msgField.selectionStart;
        const text = msgField.value;
        setValue("message", text.slice(0, cursorPos) + placeholder + text.slice(cursorPos));
      }
    }
    
    addLog(`Inserted placeholder: ${placeholder}`, "info");
  };
  
  // Apply template when templateId changes
  useEffect(() => {
    if (templateId) {
      applyTemplate(templateId);
    }
  }, [templateId, applyTemplate]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="bg-indigo-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold text-indigo-800 flex items-center gap-2">
          <FiMail />
          Email Content
        </h2>
        <p className="text-sm text-indigo-600 mt-1">
          Create your email and manage recipients
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block mb-2 text-gray-700 font-medium">
            Recipients
          </label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
            rows="4"
            placeholder="Enter recipients line-by-line or separated by commas"
            {...register("recipients", { required: true })}
          ></textarea>
          <div className="text-xs text-gray-500 mt-1">
            {watch("recipients") ? 
              `${watch("recipients").split(/[,;\s\n]+/).filter(e => e.trim() !== "").length} recipients` : 
              "No recipients added"}
          </div>
        </div>
        
        <div>
          <label className="block mb-2 text-gray-700 font-medium">
            Upload Recipients
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <div className="flex flex-col items-center">
              <FiUpload className="text-gray-400 mb-2" size={24} />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop CSV or TXT file or click to browse
              </p>
              <input
                type="file"
                className="hidden"
                id="file-upload"
                accept=".csv,.txt"
                onChange={handleFileInput}
              />
              <label 
                htmlFor="file-upload"
                className="bg-blue-50 text-blue-600 px-4 py-2 rounded cursor-pointer hover:bg-blue-100 transition-colors"
              >
                Select File
              </label>
            </div>
          </div>
          {csvColumns.length > 0 && (
            <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
              <p className="font-medium">CSV data loaded with columns:</p>
              <p className="truncate">{csvColumns.join(', ')}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Template and Email Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block mb-2 text-gray-700 font-medium">
            Email Template
          </label>
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
            {...register("templateId")}
          >
            <option value="">Select a template</option>
            {EMAIL_TEMPLATES.map(template => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block mb-2 text-gray-700 font-medium">
            Subject
          </label>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
            placeholder="Your email subject"
            {...register("subject", { required: true })}
          />
        </div>
      </div>
      
      <div>
        <label className="block mb-2 text-gray-700 font-medium">
          Message Type
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="html"
              {...register("messageType")}
              className="mr-2"
            />
            <span>HTML</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="text"
              {...register("messageType")}
              className="mr-2"
            />
            <span>Plain Text</span>
          </label>
        </div>
      </div>
      
      {/* Placeholders Section - Now using the separate component */}
      <Placeholders 
        placeholders={placeholders}
        setPlaceholders={setPlaceholders}
        insertPlaceholder={insertPlaceholder}
        editorRef={quillRef}
      />
      
      <div className="mt-6">
        <label className="block mb-2 text-gray-700 font-medium flex justify-between">
          <span>Message</span>
          {validationErrors.length > 0 && (
            <span 
              className="text-xs text-red-600 cursor-pointer hover:underline"
              onClick={() => setValidationErrors([])}
            >
              Clear {validationErrors.length} error(s)
            </span>
          )}
        </label>
        
        {messageType === "html" ? (
          <Controller
            name="message"
            control={control}
            render={({ field: { onChange, value } }) => (
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={value || ''}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder="Compose your email content here..."
                className="bg-white rounded-md"
                style={{ height: "300px", marginBottom: "40px" }} // Add margin to accommodate Quill's toolbar
              />
            )}
          />
        ) : (
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
            rows="8"
            placeholder="Your email message"
            {...register("message", { required: true })}
          ></textarea>
        )}
      </div>
      
      {/* Validation Errors */}
      <AnimatePresence>
        {validationErrors.length > 0 && (
          <motion.div 
            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h4 className="text-red-700 font-medium flex items-center gap-2">
              <FiAlertCircle />
              Validation Errors
            </h4>
            <ul className="text-sm text-red-600 mt-2 max-h-32 overflow-y-auto">
              {validationErrors.map((error, index) => (
                <li key={index} className="mt-1">• {error}</li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
        <motion.button
          type="button"
          className="bg-indigo-50 text-indigo-600 px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={previewEmail}
        >
          <FiMail />
          Preview Email
        </motion.button>
        
        <motion.button
          type="submit"
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isLoading}
        >
          {isLoading ? <FiRefreshCw className="animate-spin" /> : <FiSend />}
          {isLoading ? "Sending..." : "Send Emails"}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default EmailTab;