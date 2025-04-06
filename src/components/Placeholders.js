import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiTag, FiInfo, FiSearch, FiPlus } from 'react-icons/fi';

const Placeholders = ({ 
  placeholders, 
  setPlaceholders, 
  insertPlaceholder,
  editorRef
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlaceholder, setNewPlaceholder] = useState({ key: '', description: '' });

  // Filter placeholders based on search term
  const filteredPlaceholders = placeholders.filter(
    placeholder => 
      placeholder.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      placeholder.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle adding a new placeholder
  const handleAddPlaceholder = () => {
    if (!newPlaceholder.key || !newPlaceholder.description) return;
    
    // Check if key already exists
    const exists = placeholders.some(p => p.key === newPlaceholder.key);
    if (exists) {
      alert(`Placeholder {{${newPlaceholder.key}}} already exists!`);
      return;
    }
    
    setPlaceholders([...placeholders, newPlaceholder]);
    setNewPlaceholder({ key: '', description: '' });
    setShowAddModal(false);
  };

  // Function to insert placeholder at cursor in editor
  const handleInsertPlaceholder = (key) => {
    insertPlaceholder(`{{${key}}}`);
  };

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm mb-6">
      <h3 className="text-lg font-medium flex items-center mb-3 text-indigo-800">
        <FiTag className="mr-2" />
        Available Placeholders
      </h3>
      
      {/* Search and Add controls */}
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search placeholders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
          />
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
        <button
          type="button"
          className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg flex items-center justify-center hover:bg-indigo-100"
          onClick={() => setShowAddModal(true)}
        >
          <FiPlus className="mr-1" />
          Add Custom
        </button>
      </div>
      
      {filteredPlaceholders.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          <FiInfo className="mx-auto mb-2" size={24} />
          <p>No placeholders found matching "{searchTerm}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {filteredPlaceholders.map(({ key, description }) => (
            <motion.div
              key={key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gray-50 border rounded p-2 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
              onClick={() => handleInsertPlaceholder(key)}
              title={description}
            >
              <div className="text-indigo-600 font-medium truncate">{`{{${key}}}`}</div>
              <div className="text-xs text-gray-500 truncate">{description}</div>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Add new placeholder modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div 
            className="bg-white rounded-lg shadow-lg max-w-md w-full p-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <h3 className="text-lg font-medium mb-4">Add Custom Placeholder</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder Key</label>
                <input
                  type="text"
                  value={newPlaceholder.key}
                  onChange={(e) => setNewPlaceholder({...newPlaceholder, key: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                  placeholder="e.g. customerID"
                />
                <p className="text-xs text-gray-500 mt-1">This will be used as {`{{${newPlaceholder.key || 'key'}}}`} in your template</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newPlaceholder.description}
                  onChange={(e) => setNewPlaceholder({...newPlaceholder, description: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                  placeholder="e.g. Customer's unique identifier"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bg-indigo-600 text-white px-4 py-2 rounded"
                onClick={handleAddPlaceholder}
                disabled={!newPlaceholder.key || !newPlaceholder.description}
              >
                Add Placeholder
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Placeholders;