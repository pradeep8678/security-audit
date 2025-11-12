require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// ✅ Import routes
const gcpRoutes = require('./routes/gcp');          // for VM scanning
const bucketRoutes = require('./routes/bucket');    // for bucket scanning

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
app.use('/api', gcpRoutes);     // → /api/list-vms
app.use('/api', bucketRoutes);  // → /api/list-buckets

// ✅ 404 handler (optional)
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ✅ Global error handler (optional)
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// ✅ Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
