import React from "react";
import { motion } from "framer-motion";
import { FiServer, FiUser, FiLock, FiSliders, FiActivity, FiClock, FiList } from "react-icons/fi";

const ServerTab = ({ register, addLog }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
          <FiServer />
          SMTP Server Configuration
        </h2>
        <p className="text-sm text-blue-600 mt-1">
          Configure your SMTP server details for email delivery
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block mb-2 text-gray-700 font-medium">
            SMTP Server
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              <FiServer size={18} />
            </span>
            <input
              type="text"
              className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
              placeholder="smtp.example.com"
              {...register("smtpServer", { required: true })}
            />
          </div>
        </div>
        
        <div>
          <label className="block mb-2 text-gray-700 font-medium">
            SMTP Port
          </label>
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
            {...register("smtpPort", { required: true })}
          >
            <option value="25">25 (SMTP)</option>
            <option value="465">465 (SMTPS)</option>
            <option value="587">587 (SUBMISSION)</option>
            <option value="2525">2525 (Alternative)</option>
            <option value="2526">2526 (Alternative)</option>
          </select>
        </div>
        
        <div>
          <label className="block mb-2 text-gray-700 font-medium">
            SMTP Username
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              <FiUser size={18} />
            </span>
            <input
              type="text"
              className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
              placeholder="username@example.com"
              {...register("username", { required: true })}
            />
          </div>
        </div>
        
        <div>
          <label className="block mb-2 text-gray-700 font-medium">
            SMTP Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              <FiLock size={18} />
            </span>
            <input
              type="password"
              className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
              placeholder="••••••••"
              {...register("smtpPassword", { required: true })}
            />
          </div>
        </div>
      </div>
      
      <div className="pt-4">
        <h3 className="font-medium text-gray-700 mb-3">
          Sender Information
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              From Name
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
              placeholder="Your Company"
              {...register("fromName", { required: true })}
            />
          </div>
          
          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              From Email
            </label>
            <input
              type="email"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
              placeholder="noreply@example.com"
              {...register("fromEmail", { required: true })}
            />
          </div>
          
          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Reply-To
            </label>
            <input
              type="email"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
              placeholder="support@example.com"
              {...register("replyTo", { required: true })}
            />
          </div>
        </div>
      </div>
      
      <div className="pt-4">
        <h3 className="font-medium text-gray-700 mb-3">
          Delivery Settings
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Thread Count
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <FiSliders size={18} />
              </span>
              <input
                type="number"
                min="1"
                max="20"
                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                placeholder="5"
                {...register("threadCount")}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Number of parallel sending threads (1-20)
            </p>
          </div>
          
          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Rate Limit
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <FiActivity size={18} />
              </span>
              <input
                type="number"
                min="1"
                max="50"
                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                placeholder="10"
                {...register("rateLimit")}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Maximum emails per second per thread
            </p>
          </div>
          
          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Send Interval (ms)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <FiClock size={18} />
              </span>
              <input
                type="number"
                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                placeholder="1000"
                {...register("sendInterval")}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Delay between each email (milliseconds)
            </p>
          </div>
          
          <div>
            <label className="block mb-2 text-gray-700 font-medium">
              Recipient Limit
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <FiList size={18} />
              </span>
              <input
                type="number"
                min="0"
                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                placeholder="0 (no limit)"
                {...register("recipientLimit")}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Maximum number of recipients (0 = no limit)
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ServerTab;