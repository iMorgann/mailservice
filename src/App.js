import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { TailSpin } from "react-loader-spinner";

const App = () => {
  const { register, handleSubmit, reset } = useForm();
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [totalRecipients, setTotalRecipients] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const sendEmail = async (smtpClient, emailData) => {
    try {
      await smtpClient.sendAsync(emailData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleFileInput = async (e, setValue) => {
    const file = e.target.files[0];
    if (file) {
      const text = await file.text();
      const recipients = text.split(/\r?\n/).filter((line) => line.trim() !== "").join("; ");
      setValue("recipients", recipients);
    }
  };

  const onSubmit = async (data) => {
    const recipients = data.recipients.split(/[,;\s\n]+/).filter((line) => line.trim() !== "");
    setTotalRecipients(recipients.length);
    setIsLoading(true);
    setStatus("Sending...");

    const attachments = data.attachments
      ? Array.from(data.attachments).map((file) => ({
          name: file.name,
          content: file,
        }))
      : [];

    const smtpClient = new window.SMTPClient({
      host: data.smtpServer,
      port: data.smtpPort,
      secure: data.smtpPort === 465,
      auth: {
        user: data.username,
        pass: data.smtpPassword,
      },
    });

    for (let i = 0; i < recipients.length; i++) {
      const emailData = {
        from: `${data.fromName} <${data.fromEmail}>`,
        to: recipients[i],
        subject: data.subject,
        text: data.message,
        attachments,
      };

      const result = await sendEmail(smtpClient, emailData);

      if (result.success) {
        setStatus((prev) => `${prev}\nEmail sent to ${recipients[i]} - OK`);
      } else {
        setStatus((prev) => `${prev}\nEmail sent to ${recipients[i]} - FAILED: ${result.error}`);
      }

      setProgress(i + 1);

      if (data.sendInterval) {
        await new Promise((resolve) => setTimeout(resolve, data.sendInterval));
      }
    }

    setStatus((prev) => `${prev}\nAll emails processed.`);
    setIsLoading(false);
    reset();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gradient-to-br from-gray-100 to-blue-50 min-h-screen flex flex-col items-center">
      <motion.h1
        className="text-5xl font-extrabold text-center mb-6 bg-gradient-to-r from-purple-500 to-indigo-500 text-white  px-6 py-3 rounded-lg hover:scale-105 transition-transform"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Root Web Email Service
      </motion.h1>
      <p className="text-center text-gray-600 mb-4">Effortlessly send bulk emails with Root Web Email Service</p>
      <a
        href="https://t.me/rootbck"
        className="text-blue-500 underline mb-6 hover:text-blue-700 transition"
        target="_blank"
        rel="noopener noreferrer"
      >
        Contact Support: @rootbck
      </a>
      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white shadow-2xl rounded-xl p-8 space-y-6 w-full max-w-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="grid gap-4">
          <div>
            <label className="block mb-2 text-lg font-medium text-gray-700">SMTP Server</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              {...register("smtpServer", { required: true })}
            />
          </div>
          <div>
            <label className="block mb-2 text-lg font-medium text-gray-700">SMTP Port</label>
            <input
              type="number"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              {...register("smtpPort", { required: true })}
            />
          </div>
          <div>
            <label className="block mb-2 text-lg font-medium text-gray-700">SMTP Username</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              {...register("username", { required: true })}
            />
          </div>
          <div>
            <label className="block mb-2 text-lg font-medium text-gray-700">SMTP Password</label>
            <input
              type="password"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              {...register("smtpPassword", { required: true })}
            />
          </div>
        </div>
        <div>
          <label className="block mb-2 text-lg font-medium text-gray-700">Recipients</label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            rows="4"
            placeholder="Enter recipients line-by-line or separated by commas"
            {...register("recipients", { required: true })}
          ></textarea>
        </div>
        <div>
          <label className="block mb-2 text-lg font-medium text-gray-700">Upload Recipients File</label>
          <input
            type="file"
            className="w-full p-3 border border-gray-300 rounded-lg"
            onChange={(e) => handleFileInput(e, register("recipients").onChange)}
          />
        </div>
        <div>
          <label className="block mb-2 text-lg font-medium text-gray-700">Subject</label>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            {...register("subject", { required: true })}
          />
        </div>
        <div>
          <label className="block mb-2 text-lg font-medium text-gray-700">Message</label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            rows="6"
            {...register("message", { required: true })}
          ></textarea>
        </div>
        <div>
          <label className="block mb-2 text-lg font-medium text-gray-700">Attachments</label>
          <input
            type="file"
            className="w-full p-3 border border-gray-300 rounded-lg"
            multiple
            {...register("attachments")}
          />
        </div>
        <div>
          <label className="block mb-2 text-lg font-medium text-gray-700">Send Interval (ms)</label>
          <input
            type="number"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            {...register("sendInterval")}
          />
        </div>
        <button
          type="submit"
          className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold px-6 py-3 rounded-lg hover:scale-105 transition-transform"
        >
          Send Emails
        </button>
      </motion.form>
      <motion.div
        className="mt-6 w-full max-w-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {isLoading ? (
          <div className="flex flex-col items-center">
            <TailSpin color="#4A90E2" height={50} width={50} />
            <p className="text-lg font-semibold text-gray-700 mt-4">Sending Emails...</p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-semibold text-gray-700 mb-2">Progress:</p>
            <div className="w-full bg-gray-300 rounded-full h-4">
              <div
                className="bg-blue-500 h-4 rounded-full transition-all"
                style={{ width: `${(progress / totalRecipients) * 100 || 0}%` }}
              ></div>
            </div>
            <p className="text-center mt-2 text-sm text-gray-600">{progress}/{totalRecipients}</p>
          </div>
        )}
        {status && <pre className="mt-4 text-sm text-gray-600 whitespace-pre-wrap">{status}</pre>}
      </motion.div>
    </div>
  );
};

export default App;
