
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// ✅ Import routes
const gcpRoutes = require('./gcp/routes/gcp');          // for VM scanning
const bucketRoutes = require('./gcp/routes/bucket');    // for bucket scanning
const firewallRoutes = require('./gcp/routes/firewall');
const sqlRoutes = require('./gcp/routes/sql'); 
const gkeRoutes = require("./gcp/routes/gke");
const ownerRoutes = require("./gcp/routes/owner");
const lbRoutes = require("./gcp/routes/lbRoutes");
const cloudrunRoutes = require("./gcp/routes/cloudrun");
const fullAuditRoutes = require('./gcp/routes/fullAudit');
const bigquery = require('./gcp/routes/bigquery');
const network = require('./gcp/routes/network');
const logging = require('./gcp/routes/logging');

// -------------------------AWS--------------------------------------

const ec2Route = require('./aws/routes/ec2Route');
const s3Route = require('./aws/routes/s3Route');
const eksRoute = require('./aws/routes/eksRoute');
const iamRoute = require('./aws/routes/iamRoute');
const appRunnerRoute = require('./aws/routes/appRunnerRoute');
const rdsRoute = require('./aws/routes/rdsRoute');
const awsfirewallRoute = require('./aws/routes/securityGroupRoute');
const awslbRoute = require('./aws/routes/lbRoute');
const awsfullAuditRoutes = require('./aws/routes/awsFullAuditRoute');

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
app.use('/api', firewallRoutes);
app.use('/api', sqlRoutes); 
app.use("/api", gkeRoutes);
app.use("/api", ownerRoutes);
app.use("/api", lbRoutes);
app.use("/api", cloudrunRoutes);
app.use('/api', fullAuditRoutes);
app.use('/api', bigquery);
app.use('/api', network);
app.use('/api', logging);

// -------------------------AWS--------------------------------------

app.use('/api', ec2Route);
app.use('/api', s3Route);
app.use('/api', eksRoute);
app.use('/api', iamRoute);
app.use('/api', appRunnerRoute);
app.use('/api', rdsRoute);
app.use('/api', awsfirewallRoute);
app.use('/api', awslbRoute);
app.use('/api', awsfullAuditRoutes);

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
