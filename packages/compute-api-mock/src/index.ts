import express from "express";

const app = express();
app.use(express.json());

const PORT = 4000;

app.get("/workspaces/:id/config", (req, res) => {
  res.json({ name: `Workspace ${req.params.id}` });
});

app.get("/workspaces/:id/columns", (req, res) => {
  res.json([
    { name: "amount", label: "Amount", type: "metric", dataType: "float", groupable: false, aggregatable: true, description: "Total amount" },
    { name: "region", label: "Region", type: "dimension", dataType: "string", groupable: true, aggregatable: false, description: "Region name" },
    { name: "country", label: "Country", type: "dimension", dataType: "string", groupable: true, aggregatable: false, description: "Country code" }
  ]);
});

app.get("/workspaces/:id/valid-values", (req, res) => {
  res.json({
    period: ["ytd", "mtd", "qtd", "last_30d"],
    region: ["NA", "EMEA", "APAC"]
  });
});

app.get("/views/:id", (req, res) => {
  res.json({
    id: req.params.id,
    workspaceId: "ws-finance-2024",
    name: "Default View",
    compute: {
      workspaceId: "ws-finance-2024",
      metrics: ["amount"],
      dimensions: ["region"],
      period: "ytd"
    },
    updatedAt: new Date().toISOString()
  });
});

app.get("/workspaces/:id/views", (req, res) => {
  res.json([
    { id: "view-ytd-buckets", name: "YTD Buckets", description: "YTD Buckets view", updatedAt: new Date().toISOString() }
  ]);
});

app.post("/query", (req, res) => {
  console.log("Received query:", req.body);
  res.json({
    rows: [
      { region: "NA", amount: 1000 },
      { region: "EMEA", amount: 2000 }
    ],
    totalRows: 2,
    executionTimeMs: 42
  });
});

app.listen(PORT, () => {
  console.log(`Compute API Mock listening on port ${PORT}`);
});
