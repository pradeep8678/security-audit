// const fs = require("fs");
// const { google } = require("googleapis");

// exports.listVMs = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "No key file uploaded" });
//     }

//     const keyPath = req.file.path;
//     const keyFile = JSON.parse(fs.readFileSync(keyPath, "utf8"));

//     const auth = new google.auth.GoogleAuth({
//       credentials: keyFile,
//       scopes: ["https://www.googleapis.com/auth/cloud-platform"],
//     });

//     const compute = google.compute({
//       version: "v1",
//       auth: await auth.getClient(),
//     });

//     const projectId = keyFile.project_id;

//     // ✅ GET ALL AVAILABLE ZONES FOR THIS PROJECT
//     const zoneData = await compute.zones.list({ project: projectId });

//     // ✅ FILTER ONLY “UP” zones (Google’s real list for this project)
//     const allowedZones = (zoneData.data.items || [])
//       .filter(z => z.status === "UP")
//       .map(z => z.name);

//     console.log("✅ Dynamic zones:", allowedZones);

//     const publicVMs = [];

//     for (const zone of allowedZones) {
//       try {
//         console.log("🌍 Checking:", zone);

//         const vmList = await compute.instances.list({
//           project: projectId,
//           zone,
//         });

//         const instances = vmList.data.items || [];

//         instances.forEach(vm => {
//           const nic = vm.networkInterfaces?.[0];
//           const publicIP = nic?.accessConfigs?.[0]?.natIP;

//           if (publicIP) {
//             publicVMs.push({
//               name: vm.name,
//               zone,
//               status: vm.status,
//               machineType: vm.machineType?.split("/").pop(),
//               internalIP: nic.networkIP,
//               externalIP: publicIP,
//             });
//           }
//         });
//       } catch (err) {
//         console.log(`⚠️ Zone skipped (${zone}):`, err.message);
//       }
//     }

//     fs.unlinkSync(keyPath);

//     res.json({
//       message: "Public VMs listed successfully",
//       projectId,
//       totalPublicVMs: publicVMs.length,
//       instances: publicVMs,
//     });

//   } catch (err) {
//     console.error("❌ Error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };



const { google } = require("googleapis");

exports.listVMs = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No key file uploaded" });
    }

    // ✅ Read key JSON directly from memory (no disk)
    const keyFile = JSON.parse(req.file.buffer.toString("utf8"));

    // ✅ Authenticate with Google
    const auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const compute = google.compute({
      version: "v1",
      auth: await auth.getClient(),
    });

    const projectId = keyFile.project_id;

    // ✅ Get all available zones dynamically (status: UP)
    const zoneData = await compute.zones.list({ project: projectId });
    const allowedZones = (zoneData.data.items || [])
      .filter((z) => z.status === "UP")
      .map((z) => z.name);

    console.log("✅ Dynamic zones:", allowedZones);

    const publicVMs = [];

    // ✅ Iterate zones & list instances
    for (const zone of allowedZones) {
      try {
        console.log("🌍 Checking zone:", zone);

        const vmList = await compute.instances.list({
          project: projectId,
          zone,
        });

        const instances = vmList.data.items || [];

        // ✅ Keep only VMs with public IPs
        instances.forEach((vm) => {
          const nic = vm.networkInterfaces?.[0];
          const publicIP = nic?.accessConfigs?.[0]?.natIP;

          if (publicIP) {
            publicVMs.push({
              name: vm.name,
              zone,
              status: vm.status,
              machineType: vm.machineType?.split("/").pop(),
              internalIP: nic?.networkIP,
              externalIP: publicIP,
            });
          }
        });
      } catch (err) {
        console.log(`⚠️ Zone skipped (${zone}):`, err.message);
      }
    }

    // ✅ Send results
    res.json({
      message: "Public VMs listed successfully",
      projectId,
      totalPublicVMs: publicVMs.length,
      instances: publicVMs,
    });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message });
  }
};
