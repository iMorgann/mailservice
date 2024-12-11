# Root Web Email Service

Root Web Email Service is a modern, interactive, and user-friendly bulk email sending application. Designed with seamless functionality and beautiful animations, it empowers users to send personalized bulk emails effortlessly.

## Features

- **SMTP Configuration**: Input custom SMTP details (Server, Port, Username, Password).
- **Recipient Management**:
  - Add recipients manually (line-by-line or comma-separated).
  - Upload recipient lists via text files.
- **Progress Tracking**:
  - Real-time progress bar showing email sending status.
  - Detailed status messages for each recipient.
- **Attachments**: Include multiple attachments in emails.
- **Send Interval**: Customize the time interval between sending each email.
- **Responsive Design**: Works beautifully on any device.
- **Support**: Contact support via Telegram [@rootbck](https://t.me/rootbck).

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/iMorgann/mailservice.git
   cd mailservice
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Application**:
   ```bash
   npm start
   ```
   The application will be available at `http://localhost:3000`.

## Usage

1. **Input SMTP Details**:
   - Provide your SMTP Server, Port, Username, and Password.

2. **Manage Recipients**:
   - Enter recipients directly in the provided text box or upload a `.txt` file.

3. **Compose Email**:
   - Add a subject, message, and optional attachments.

4. **Send Emails**:
   - Click the `Send Emails` button to start the sending process.
   - Monitor progress via the interactive progress bar.

## Technologies Used

- **React.js**: Frontend library for building a dynamic UI.
- **Framer Motion**: For engaging animations.
- **React Hook Form**: Simplified form management.
- **Tailwind CSS**: For responsive and modern styling.
- **SMTP.js**: Direct communication with SMTP servers.

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a new branch.
3. Make your changes and commit them.
4. Submit a pull request.

## Support

For support, contact us on Telegram at [@rootbck](https://t.me/rootbck).

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

