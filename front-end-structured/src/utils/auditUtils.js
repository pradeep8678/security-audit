export const generateColumnDefs = (data = []) => {
    if (!data.length) return [];

    const allKeys = new Set();
    data.forEach((row) => Object.keys(row).forEach((key) => allKeys.add(key)));

    return [...allKeys].map((key) => ({
        headerName: key
            .replace(/([A-Z])/g, " $1")
            .replace(/_/g, " ")
            .toUpperCase(),
        field: key,
        minWidth: 180,
        sortable: true,
        filter: true,

        cellRenderer: (params) => {
            const val = params.value;

            if (typeof val === "boolean") return val ? "True" : "False";

            if (key === "alLowed" && Array.isArray(val)) {
                return val
                    .map((obj) => {
                        const proto = obj.IPProtocol?.toUpperCase() || "";
                        const ports = obj.ports ? `(${obj.ports.join(",")})` : "";
                        return `${proto} ${ports}`.trim();
                    })
                    .join(" | ");
            }

            if (Array.isArray(val)) return val.join(", ");

            if (typeof val === "object" && val !== null) {
                return JSON.stringify(val);
            }

            return val ?? "-";
        },

        cellStyle: { whiteSpace: "nowrap" },
        autoHeight: true,
    }));
};

export const getNested = (obj, path) => {
    return path.split(".").reduce((acc, key) => acc?.[key], obj);
};

export const prettifyScanKey = (key) => {
    return key
        .replace(/_/g, " ")
        .replace(/([A-Z])/g, " $1")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());
};

export const RESOURCE_LIST = [
    "Buckets",
    "Firewall Rules",
    "GKE Clusters",
    "SQL Instances",
    "Cloud Run / Functions",
    "Load Balancers",
    "Owner IAM Roles",
    "VM Scan",
    "Big Query Scan",
    "Network Scan",
    "Logging Scan",
];

export const RESOURCE_MAPPING = {
    Buckets: "uniformAccessFindings",
    "Firewall Rules": "publicRules",
    "GKE Clusters": "findings",
    "SQL Instances": "cloudSqlScan.requireSslScan",
    "Cloud Run / Functions": "functionsAndRuns",
    "Load Balancers": "loadBalancers",
    "Owner IAM Roles": "iamScan.ownerServiceAccountScan.ownerServiceAccounts",
    "VM Scan": "vmScan",
    "Big Query Scan": "bigQueryScan.defaultCmekScan",
    // Network Scan & Logging Scan are handled as special multi-table sections logic
};
