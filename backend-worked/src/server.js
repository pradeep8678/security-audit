require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const gcpRoutes = require('./routes/gcp');

// ✅ Confirm correct server loaded
console.log("✅ server.js loaded from:", __dirname);

// ✅ Initialize App
const app = express();

// ✅ Allow all origins (fixes CORS preflight issues)
app.use(cors({
  origin: "*",
  methods: "GET,POST,OPTIONS",
  allowedHeaders: "Content-Type,Authorization"
}));

// ✅ Debug logger — shows EVERY incoming request
app.use((req, res, next) => {
  console.log("🔥 Incoming:", req.method, req.url);
  next();
});

// ✅ Parse JSON bodies
app.use(bodyParser.json());

// ✅ Mount API routes
app.use('/api', gcpRoutes);

// ✅ Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
