// src/services/emailApi.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/email';

export const emailApi = {
  // Send a single email
  sendEmail: async (emailConfig, recipient, templateVars) => {
    const response = await fetch(`${API_BASE_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailConfig, recipient, templateVars }),
    });
    return response.json();
  },

  // Send bulk emails
  sendBulkEmails: async (emailConfig, recipients, templateVarsArray) => {
    const response = await fetch(`${API_BASE_URL}/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailConfig, recipients, templateVarsArray }),
    });
    return response.json();
  },

  // Validate SMTP configuration
  validateConfig: async (emailConfig) => {
    const response = await fetch(`${API_BASE_URL}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailConfig }),
    });
    return response.json();
  }
};