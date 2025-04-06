import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMail, FiServer, FiActivity, FiMenu, FiX } from "react-icons/fi";

import EmailTab from "./components/EmailTab";
import ServerTab from "./components/ServerTab";
import MonitorTab from "./components/MonitorTab";
import EmailPreviewModal from "./components/EmailPreviewModal";
import { useForm } from "react-hook-form";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api/email";

// Form state persistence helper functions
const saveFormState = (formData) => {
  try {
    // Don't save sensitive data like passwords
    const safeFormData = { ...formData };
    delete safeFormData.smtpPassword;

    localStorage.setItem("emailFormState", JSON.stringify(safeFormData));
  } catch (error) {
    console.error("Error saving form state:", error);
  }
};

const loadFormState = () => {
  try {
    const savedState = localStorage.getItem("emailFormState");
    if (savedState) {
      return JSON.parse(savedState);
    }
  } catch (error) {
    console.error("Error loading form state:", error);
  }
  return null;
};

// Updated emailApi to properly format the request for bulk emails
const emailApi = {
  sendBulkEmails: async (emailConfig, recipients, templateVarsArray) => {
    console.log("Sending bulk email request with:", {
      emailConfig,
      recipients,
      templateVarsArray,
    });

    const response = await fetch(`${API_BASE_URL}/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emailConfig: {
          ...emailConfig,
          // Ensure subject and content are included in emailConfig
          subject: emailConfig.subject,
          content: emailConfig.message, // Note: backend expects 'content', frontend uses 'message'
        },
        recipients,
        templateVarsArray,
      }),
    });

    const result = await response.json();
    console.log("Bulk email response:", result);
    return result;
  },

  getJobStatus: async (jobId) => {
    const response = await fetch(`${API_BASE_URL}/status/${jobId}`);
    if (!response.ok) throw new Error("Job not found");
    return response.json();
  },

  validateConfig: async (emailConfig) => {
    const response = await fetch(`${API_BASE_URL}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailConfig }),
    });
    return response.json();
  },

  cancelOperation: async (jobId) => {
    const response = await fetch(`${API_BASE_URL}/cancel/${jobId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to cancel operation");
    }

    return response.json();
  },
};

const App = () => {
  // Load saved state from localStorage
  const savedState = loadFormState();

  const { register, handleSubmit, control, setValue, watch, formState } =
    useForm({
      defaultValues: savedState || {
        smtpServer: "",
        smtpPort: "587",
        username: "",
        smtpPassword: "",
        fromName: "",
        fromEmail: "",
        replyTo: "",
        recipients: "",
        subject: "",
        message: "",
        sendInterval: 1000,
        messageType: "html",
        templateId: "",
        threadCount: 5,
        rateLimit: 10,
        recipientLimit: 0,
      },
    });

  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [totalRecipients, setTotalRecipients] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("email");
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);
  const [csvColumns, setCsvColumns] = useState([]);
  const [recipientData, setRecipientData] = useState([]);
  const [placeholders, setPlaceholders] = useState([
    { key: "name", description: "Recipient's name" },
    { key: "email", description: "Recipient's full email" },
    { key: "domain", description: "Recipient's email domain" },
    { key: "company", description: "Your company name" },
    { key: "month", description: "Current month" },
    { key: "code", description: "Promotion code" },
    { key: "discount", description: "Discount percentage" },
    { key: "expiry", description: "Expiration date" },
  ]);
  const [successCount, setSuccessCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);
  const [emailResults, setEmailResults] = useState([]);
  const [bulkJobId, setBulkJobId] = useState(null);
  const [emailJobIds, setEmailJobIds] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const messageType = watch("messageType");
  const bulkPollingRef = useRef(null);
  const emailPollingRef = useRef(null);

  // Save form state when it changes
  useEffect(() => {
    const subscription = watch((formData) => {
      saveFormState(formData);
    });

    return () => subscription.unsubscribe();
  }, [watch]);

  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { message, timestamp, type }]);
    console.log(`Log added: ${message} (${type})`);
  };

  // Cancel operation function
  const cancelOperation = async (jobId) => {
    if (!jobId) {
      addLog("No active job to cancel", "error");
      return;
    }

    try {
      addLog(`Attempting to cancel operation: ${jobId}`, "info");

      const result = await emailApi.cancelOperation(jobId);

      if (result.success) {
        addLog(`Operation canceled: ${result.message}`, "success");

        // Clear any polling intervals
        if (bulkPollingRef.current) {
          clearInterval(bulkPollingRef.current);
          bulkPollingRef.current = null;
        }

        if (emailPollingRef.current) {
          clearInterval(emailPollingRef.current);
          emailPollingRef.current = null;
        }

        // Update UI state
        setIsLoading(false);

        return result;
      } else {
        addLog(
          `Failed to cancel: ${result.message || "Unknown error"}`,
          "error"
        );
        throw new Error(result.message || "Failed to cancel operation");
      }
    } catch (error) {
      addLog(`Error canceling operation: ${error.message}`, "error");
      throw error;
    }
  };

  // Modified email job polling functions
  const startBulkStatusPolling = useCallback((jobId) => {
    if (bulkPollingRef.current) clearInterval(bulkPollingRef.current);

    // Reset counters and state for new job
    setSuccessCount(0);
    setFailureCount(0);
    setProgress(0);
    setEmailResults([]);
    setEmailJobIds([]);

    addLog(`Starting monitoring for job ${jobId}`, "info");

    bulkPollingRef.current = setInterval(async () => {
      try {
        const statusResult = await emailApi.getJobStatus(jobId);
        console.log("Bulk job status:", statusResult);

        // If job is completed, get the spawned email jobs
        if (statusResult.state === "completed" && statusResult.result) {
          // Get spawnedJobIds from either result or directly from the status
          const spawnedIds =
            statusResult.result.spawnedJobIds ||
            statusResult.spawnedJobIds ||
            [];

          if (spawnedIds.length > 0) {
            addLog(
              `Bulk job ${jobId} completed. Processing ${spawnedIds.length} individual emails.`,
              "success"
            );

            // Convert job IDs to strings if they aren't already
            const normalizedIds = spawnedIds.map((id) => id.toString());

            // Set total recipients for progress calculation
            setTotalRecipients(normalizedIds.length);

            // Set the email job IDs to poll
            setEmailJobIds(normalizedIds);

            // Stop polling the bulk job
            clearInterval(bulkPollingRef.current);
          }
        } else if (statusResult.state === "failed") {
          addLog(
            `Bulk job ${jobId} failed: ${
              statusResult.error || "Unknown error"
            }`,
            "error"
          );
          setIsLoading(false);
          clearInterval(bulkPollingRef.current);
        } else {
          // Job is still processing
          if (statusResult.progress) {
            setProgress(statusResult.progress);
          }
        }
      } catch (error) {
        addLog(`Error checking job status: ${error.message}`, "error");
        setIsLoading(false);
        clearInterval(bulkPollingRef.current);
      }
    }, 2000);
  }, []);

  // 1. Fix the startEmailStatusPolling function
  const startEmailStatusPolling = useCallback(() => {
    // Don't start a new interval if one is already running
    if (emailPollingRef.current) {
      clearInterval(emailPollingRef.current);
      emailPollingRef.current = null;
    }

    if (!Array.isArray(emailJobIds) || emailJobIds.length === 0) {
      addLog("No email jobs to monitor", "info");
      setIsLoading(false);
      return;
    }

    // Only log once when starting polling
    console.log(
      `Starting monitoring of ${emailJobIds.length} emails: ${emailJobIds.join(
        ", "
      )}`
    );

    // Track which jobs we've already processed
    const processedJobIds = new Set();

    emailPollingRef.current = setInterval(async () => {
      let successCountInc = 0;
      let failureCountInc = 0;
      let newResults = [];
      let allJobsChecked = true;

      for (const jobId of emailJobIds) {
        // Skip jobs we've already processed
        if (processedJobIds.has(jobId)) {
          continue;
        }

        try {
          const status = await emailApi.getJobStatus(jobId);
          console.log(`Email job ${jobId} status:`, status);

          if (!status || !status.data) {
            allJobsChecked = false;
            continue;
          }

          const { state, data, finishedOn, error } = status;

          // Get the recipient email - handle different possible formats
          let recipient;
          if (data.recipient) {
            recipient = data.recipient;
          } else if (data.recipients && data.recipients.length > 0) {
            recipient = data.recipients[0];
          } else {
            recipient = "unknown";
          }

          if (state === "completed" || state === "failed") {
            // Mark this job as processed
            processedJobIds.add(jobId);

            // Track success or failure
            if (state === "completed") {
              successCountInc++;
            } else {
              failureCountInc++;
            }

            // Add to results for display
            newResults.push({
              jobId,
              recipient,
              success: state === "completed",
              timestamp: finishedOn
                ? new Date(finishedOn).toLocaleTimeString()
                : new Date().toLocaleTimeString(),
              error: state === "failed" ? error || "Unknown error" : null,
            });
          } else {
            // Job still processing
            allJobsChecked = false;
          }
        } catch (error) {
          console.error(`Error checking job ${jobId}:`, error.message);
          allJobsChecked = false;
        }
      }

      // Update state with new information
      if (successCountInc > 0) {
        setSuccessCount((prev) => prev + successCountInc);
      }

      if (failureCountInc > 0) {
        setFailureCount((prev) => prev + failureCountInc);
      }

      if (newResults.length > 0) {
        setEmailResults((prev) => [...prev, ...newResults]);
      }

      // Update overall progress
      const totalProcessed = processedJobIds.size;
      setProgress(totalProcessed);

      // Check if all jobs are now complete
      if (processedJobIds.size === emailJobIds.length || allJobsChecked) {
        addLog(
          `Email processing complete: ${successCountInc} succeeded, ${failureCountInc} failed in this batch`,
          "success"
        );
        setIsLoading(false);
        clearInterval(emailPollingRef.current);
        emailPollingRef.current = null;
      }
    }, 2000);
  }, [emailJobIds]);

  // 2. Update the useEffect that triggers polling
  useEffect(() => {
    console.log("useEffect triggered with emailJobIds:", emailJobIds);

    // Only start polling if we have job IDs and aren't already polling
    if (
      Array.isArray(emailJobIds) &&
      emailJobIds.length > 0 &&
      !emailPollingRef.current
    ) {
      // Add the log message here instead of in startEmailStatusPolling
      addLog(
        `Monitoring ${emailJobIds.length} individual emails: ${emailJobIds.join(
          ", "
        )}`,
        "info"
      );
      startEmailStatusPolling();
    }
  }, [emailJobIds, startEmailStatusPolling]);

  useEffect(() => {
    return () => {
      if (bulkPollingRef.current) clearInterval(bulkPollingRef.current);
      if (emailPollingRef.current) clearInterval(emailPollingRef.current);
    };
  }, []);

  const testSmtpConnection = async () => {
    try {
      setIsLoading(true);
      addLog("Testing SMTP connection...", "info");

      const emailConfig = {
        smtpServer: watch("smtpServer"),
        smtpPort: watch("smtpPort"),
        username: watch("username"),
        smtpPassword: watch("smtpPassword"),
        fromName: watch("fromName"),
        fromEmail: watch("fromEmail"),
      };

      const result = await emailApi.validateConfig(emailConfig);

      if (result.success) {
        addLog(`SMTP connection successful: ${result.message}`, "success");
      } else {
        addLog(
          `SMTP connection failed: ${result.message || result.error}`,
          "error"
        );
      }
    } catch (error) {
      addLog(`Error testing SMTP connection: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const validateEmails = (emails) => {
    const errors = [];
    const validEmails = [];
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    emails.forEach((email) => {
      if (!emailRegex.test(email.trim())) {
        errors.push(`Invalid email format: ${email}`);
      } else {
        validEmails.push(email.trim());
      }
    });

    return { errors, validEmails };
  };

  const preparePreviewData = (data) => {
    const recipientList = data.recipients
      .split(/[,;\s\n]+/)
      .filter((email) => email.trim() !== "");

    if (recipientList.length === 0) {
      addLog("Add recipients to preview the email", "error");
      return;
    }

    const sampleRecipient = recipientList[0];

    let templateVars = {};
    placeholders.forEach(({ key }) => {
      if (key === "name") {
        templateVars[key] = sampleRecipient.split("@")[0];
      } else if (key === "email") {
        templateVars[key] = sampleRecipient;
      } else if (key === "domain") {
        const parts = sampleRecipient.split("@");
        templateVars[key] = parts.length > 1 ? parts[1] : "";
      } else if (key === "company") {
        templateVars[key] = data.fromName;
      } else if (key === "month") {
        templateVars[key] = new Date().toLocaleString("default", {
          month: "long",
        });
      } else if (key === "code") {
        templateVars[key] = "SPECIAL20";
      } else if (key === "discount") {
        templateVars[key] = "20";
      } else if (key === "expiry") {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        templateVars[key] = date.toLocaleDateString();
      }
    });

    if (recipientData.length > 0) {
      csvColumns.forEach((col) => {
        if (recipientData[0][col]) {
          templateVars[col] = recipientData[0][col];
        }
      });
    }

    let message = data.message;
    Object.keys(templateVars).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      message = message.replace(regex, templateVars[key]);
    });

    setPreviewData({
      subject: data.subject.replace(
        /{{(\w+)}}/g,
        (_, key) => templateVars[key] || `{{${key}}}`
      ),
      message,
      recipient: sampleRecipient,
      from: `${data.fromName} <${data.fromEmail}>`,
      replyTo: data.replyTo,
    });

    setShowPreview(true);
  };

  const onSubmit = async (data) => {
    const recipientList = data.recipients
      .split(/[,;\s\n]+/)
      .filter((email) => email.trim() !== "");

    const { errors, validEmails } = validateEmails(recipientList);

    if (errors.length > 0) {
      setValidationErrors(errors);
      addLog(`Found ${errors.length} invalid email addresses`, "error");
      return;
    }

    let finalRecipients = validEmails;
    if (data.recipientLimit && parseInt(data.recipientLimit) > 0) {
      finalRecipients = validEmails.slice(0, parseInt(data.recipientLimit));
      if (finalRecipients.length < validEmails.length) {
        addLog(
          `Limiting to ${finalRecipients.length} recipients (${
            validEmails.length - finalRecipients.length
          } skipped)`,
          "info"
        );
      }
    }

    setValidationErrors([]);
    setTotalRecipients(finalRecipients.length);
    setIsLoading(true);
    setProgress(0);
    setSuccessCount(0);
    setFailureCount(0);
    setEmailResults([]);
    setLogs([]);

    addLog(`Preparing to send ${finalRecipients.length} emails`, "info");

    try {
      const emailConfig = {
        smtpServer: data.smtpServer,
        smtpPort: data.smtpPort,
        username: data.username,
        smtpPassword: data.smtpPassword,
        fromName: data.fromName,
        fromEmail: data.fromEmail,
        replyTo: data.replyTo,
        subject: data.subject,
        message: data.message,
        messageType: data.messageType,
        sendInterval: data.sendInterval,
        rateLimit: data.rateLimit,
      };

      const templateVarsArray = finalRecipients.map((recipient) => {
        const vars = {
          name: recipient.split("@")[0],
          email: recipient,
          domain: recipient.split("@")[1] || "",
          company: data.fromName,
          month: new Date().toLocaleString("default", { month: "long" }),
        };

        if (recipientData.length > 0) {
          const recipientRecord = recipientData.find((row) => {
            for (const col of csvColumns) {
              if (row[col] === recipient) return true;
            }
            return false;
          });

          if (recipientRecord) {
            Object.keys(recipientRecord).forEach((key) => {
              vars[key] = recipientRecord[key];
            });
          }
        }

        return vars;
      });

      addLog("Sending request to email service...", "info");

      const result = await emailApi.sendBulkEmails(
        emailConfig,
        finalRecipients,
        templateVarsArray
      );
      console.log("Bulk email response:", result);

      if (result.success) {
        setBulkJobId(result.jobId);
        addLog(`Email job created with ID: ${result.jobId}`, "success");
        startBulkStatusPolling(result.jobId);
      } else {
        setIsLoading(false);
        addLog(`Error: ${result.error || "Unknown error"}`, "error");
      }
    } catch (error) {
      setIsLoading(false);
      addLog(`Error: ${error.message}`, "error");
    }
  };

  // Function to handle tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false); // Close mobile menu when changing tabs
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4 md:p-6">
      <motion.div
        className="max-w-6xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.header
          className="mb-8 text-center"
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          <motion.h1
            className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600 bg-clip-text text-transparent pb-2"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            Modern Email Service
          </motion.h1>
          <p className="text-gray-600 text-lg mt-2">
            Secure, efficient, and powerful email delivery system
          </p>
        </motion.header>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Desktop navigation */}
          <div className="hidden md:flex border-b">
            <button
              className={`flex-1 py-4 px-6 font-medium flex items-center justify-center gap-2 ${
                activeTab === "email"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => handleTabChange("email")}
            >
              <FiMail />
              <span>Email Setup</span>
            </button>
            <button
              className={`flex-1 py-4 px-6 font-medium flex items-center justify-center gap-2 ${
                activeTab === "server"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => handleTabChange("server")}
            >
              <FiServer />
              <span>SMTP Settings</span>
            </button>
            <button
              className={`flex-1 py-4 px-6 font-medium flex items-center justify-center gap-2 ${
                activeTab === "monitor"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => handleTabChange("monitor")}
            >
              <FiActivity />
              <span>Monitor</span>
            </button>
          </div>

          {/* Mobile navigation */}
          <div className="md:hidden border-b">
            <div className="flex items-center justify-between p-4">
              <div className="text-lg font-medium text-indigo-700">
                {activeTab === "email" && "Email Setup"}
                {activeTab === "server" && "SMTP Settings"}
                {activeTab === "monitor" && "Monitor"}
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-indigo-600 focus:outline-none"
              >
                {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
            </div>

            {/* Mobile menu dropdown */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  className="bg-white border-t border-gray-100"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    className={`w-full py-3 px-4 text-left font-medium flex items-center gap-2 ${
                      activeTab === "email"
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-600"
                    }`}
                    onClick={() => handleTabChange("email")}
                  >
                    <FiMail />
                    Email Setup
                  </button>
                  <button
                    className={`w-full py-3 px-4 text-left font-medium flex items-center gap-2 ${
                      activeTab === "server"
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-600"
                    }`}
                    onClick={() => handleTabChange("server")}
                  >
                    <FiServer />
                    SMTP Settings
                  </button>
                  <button
                    className={`w-full py-3 px-4 text-left font-medium flex items-center gap-2 ${
                      activeTab === "monitor"
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-600"
                    }`}
                    onClick={() => handleTabChange("monitor")}
                  >
                    <FiActivity />
                    Monitor
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-6">
            {activeTab === "email" && (
              <EmailTab
                register={register}
                control={control}
                setValue={setValue}
                watch={watch}
                validationErrors={validationErrors}
                setValidationErrors={setValidationErrors}
                csvColumns={csvColumns}
                setCsvColumns={setCsvColumns}
                recipientData={recipientData}
                setRecipientData={setRecipientData}
                placeholders={placeholders}
                setPlaceholders={setPlaceholders}
                addLog={addLog}
                isLoading={isLoading}
                previewEmail={() => {
                  const currentValues = watch();
                  preparePreviewData(currentValues);
                }}
              />
            )}

            {activeTab === "server" && (
              <ServerTab
                register={register}
                addLog={addLog}
                testConnection={testSmtpConnection}
                isLoading={isLoading}
                watch={watch}
              />
            )}

            {activeTab === "monitor" && (
              <MonitorTab
                totalRecipients={totalRecipients}
                progress={progress}
                successCount={successCount}
                failureCount={failureCount}
                logs={logs}
                setLogs={setLogs}
                emailResults={emailResults}
                setEmailResults={setEmailResults}
                isLoading={isLoading}
                bulkJobId={bulkJobId}
                cancelOperation={cancelOperation}
                addLog={addLog}
              />
            )}
          </form>
        </div>

        <AnimatePresence>
          {showPreview && (
            <EmailPreviewModal
              previewData={previewData}
              messageType={messageType}
              setShowPreview={setShowPreview}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default App;
