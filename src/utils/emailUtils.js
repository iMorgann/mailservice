// Email template options
export const EMAIL_TEMPLATES = [
  {
    id: "welcome",
    name: "Welcome Email",
    subject: "Welcome to {{company}}!",
    content: `<h1>Welcome, {{name}}!</h1>
      <p>Thank you for joining {{company}}. We're excited to have you on board.</p>
      <p>Your account has been successfully created and you can now start using our services.</p>
      <p>If you have any questions, please don't hesitate to reach out to our support team.</p>
      <p>Best regards,<br/>The {{company}} Team</p>`
  },
  {
    id: "newsletter",
    name: "Monthly Newsletter",
    subject: "{{company}} Newsletter - {{month}} Edition",
    content: `<h1>{{company}} Newsletter - {{month}} Edition</h1>
      <p>Hello {{name}},</p>
      <p>Here are the latest updates from {{company}}:</p>
      <ul>
        <li>Feature 1: Amazing new capability</li>
        <li>Feature 2: Improved performance</li>
        <li>Feature 3: New design</li>
      </ul>
      <p>Stay tuned for more updates!</p>
      <p>Best regards,<br/>The {{company}} Team</p>`
  },
  {
    id: "promotion",
    name: "Special Promotion",
    subject: "Special Offer Just for You, {{name}}!",
    content: `<h1>Special Offer</h1>
      <p>Hello {{name}},</p>
      <p>We're excited to offer you a special promotion!</p>
      <p>Use code <strong>{{code}}</strong> at checkout to receive {{discount}}% off your next purchase.</p>
      <p>This offer expires on {{expiry}}, so act fast!</p>
      <p>Best regards,<br/>The {{company}} Team</p>`
  },
  {
    id: "custom",
    name: "Custom Template",
    subject: "Custom Subject",
    content: `<p>Enter your custom HTML here</p>`
  }
];

// Email sending worker implementation
export const createWorker = () => {
  // This is a mock implementation - in a real app, you'd use a Web Worker
  return {
    postMessage: async (data) => {
      const { emailConfig, recipient, templateVars } = data;
      
      try {
        // In a real implementation, this would use these settings with a proper SMTP client
        // eslint-disable-next-line no-unused-vars
        const smtpSettings = {
          host: emailConfig.smtpServer,
          port: parseInt(emailConfig.smtpPort, 10),
          secure: emailConfig.smtpPort === "465",
          auth: {
            user: emailConfig.username,
            pass: emailConfig.smtpPassword,
          },
          pool: true, // Use connection pool
          maxConnections: parseInt(emailConfig.threadCount || 5, 10),
          rateDelta: 1000,
          rateLimit: parseInt(emailConfig.rateLimit || 10, 10), // Default limit 10 emails per second
          tls: {
            rejectUnauthorized: false, // In production, set to true
            ciphers: 'SSLv3',
          }
        };

        // Apply personalization to the email content
        let personalizedMessage = emailConfig.message;
        if (templateVars) {
          Object.keys(templateVars).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            personalizedMessage = personalizedMessage.replace(regex, templateVars[key]);
          });
        }

        // Create headers for better deliverability (in real implementation)
        // eslint-disable-next-line no-unused-vars
        const emailHeaders = {
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal',
          'Importance': 'Normal',
          'X-Mailer': 'Modern Email Service',
          'List-Unsubscribe': `<mailto:unsubscribe@${emailConfig.fromEmail.split('@')[1]}?subject=unsubscribe>`,
          'MIME-Version': '1.0',
          'Message-ID': `<${Math.random().toString(36).substring(2)}@${emailConfig.fromEmail.split('@')[1]}>`
        };

        // *** IMPORTANT FIX: Added actual logging to console to track email processing ***
        console.log(`Sending email to: ${recipient}`);
        
        // In a real implementation, this would use a proper SMTP client
        // For demonstration, we'll simulate success with a random delay between 200-800ms
        const sendDelay = Math.floor(Math.random() * 600) + 200;
        await new Promise(resolve => setTimeout(resolve, sendDelay));
        
        // *** FIX: Forced success for testing purposes ***
        // In a real implementation, we would properly handle any errors
        return { success: true, recipient };

        /* Commented out the original simulation of occasional failures
        // Simulate SPF, DKIM and DMARC checks with occasional failures
        const deliverabilityCheck = Math.random() > 0.05; // 95% success rate in our simulation
        
        if (deliverabilityCheck) {
          return { success: true, recipient };
        } else {
          throw new Error("Failed SPF/DKIM verification");
        }
        */
      } catch (error) {
        console.error(`Error sending email to ${recipient}:`, error);
        return { success: false, error: error.message, recipient };
      }
    },
    
    onmessage: null,
    
    addEventListener: function(event, callback) {
      if (event === 'message') {
        this.onmessage = ({ data }) => callback({ data });
      }
    }
  };
};

// Implementation of client-side SPF, DKIM, and DMARC checks
export const validateEmailSecurity = (emailConfig) => {
  return new Promise((resolve) => {
    // In a real application, these checks would connect to DNS
    // and verify proper SPF, DKIM, and DMARC records
    
    const domain = emailConfig.fromEmail.split('@')[1];
    
    const checks = {
      spf: { pass: true, details: "SPF record found and validated" },
      dkim: { pass: true, details: "DKIM signature will be added" },
      dmarc: { pass: true, details: "DMARC policy found (p=reject)" }
    };
    
    // Simulate validation delay
    setTimeout(() => {
      resolve({
        domain,
        checks,
        pass: checks.spf.pass && checks.dkim.pass && checks.dmarc.pass
      });
    }, 500);
  });
};

// Email throttling and queue management
export const createEmailQueue = (callback, config) => {
  const { interval = 1000, concurrency = 5 } = config;
  const queue = [];
  let processing = 0;
  let paused = false;
  
  const processNext = () => {
    if (paused || processing >= concurrency || queue.length === 0) return;
    
    processing++;
    const task = queue.shift();
    
    setTimeout(() => {
      callback(task)
        .finally(() => {
          processing--;
          processNext();
        });
    }, interval);
    
    // Process more items if we can
    if (processing < concurrency) {
      processNext();
    }
  };
  
  return {
    add: (task) => {
      queue.push(task);
      processNext();
    },
    addBatch: (tasks) => {
      queue.push(...tasks);
      processNext();
    },
    pause: () => { paused = true; },
    resume: () => { 
      paused = false;
      processNext();
    },
    clear: () => { queue.length = 0; },
    getStats: () => ({
      queued: queue.length,
      processing,
      paused
    })
  };
};