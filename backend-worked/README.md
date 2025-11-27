# Secure GCP VM API

This version adds AES-256-GCM encryption using Node.js crypto to protect sensitive GCP key files.

## 🧩 Setup

1. Install dependencies
   ```bash
   npm install
   ```

2. Create a `.env` file based on `.env.example`

3. Run the server
   ```bash
   npm start
   ```

4. API Endpoints:
   - POST `/api/test-connection`
   - POST `/api/list-vms`

Each expects a `multipart/form-data` upload with `keyFile`.
