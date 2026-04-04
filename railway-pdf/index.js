import express from "express";
import multer from "multer";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({ dest: path.join(os.tmpdir(), "excelcend-upload") });

async function safeUnlink(filePath) {
  try {
    await fs.unlink(filePath);
  } catch {}
}

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "excelcend-pdf" });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/convert", upload.single("file"), async (req, res) => {
  let inputPath = null;
  let outputDir = null;
  let pdfPath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "file is required" });
    }

    inputPath = req.file.path;
    outputDir = path.join(os.tmpdir(), `excelcend-out-${Date.now()}`);
    await fs.mkdir(outputDir, { recursive: true });

    const args = [
      "--headless",
      "--norestore",
      "--nofirststartwizard",
      "--convert-to",
      "pdf",
      "--outdir",
      outputDir,
      inputPath,
    ];

    const { stdout, stderr } = await execFileAsync("soffice", args, {
      timeout: 120000,
    });

    if (stdout) console.log("[soffice stdout]", stdout);
    if (stderr) console.log("[soffice stderr]", stderr);

    const originalName = req.file.originalname || "file.xlsx";
    const baseName = path.basename(originalName, path.extname(originalName));
    pdfPath = path.join(outputDir, `${baseName}.pdf`);

    const pdfBuffer = await fs.readFile(pdfPath);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${baseName}.pdf"`);
    return res.status(200).send(pdfBuffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[convert error]", message);
    return res.status(500).json({ error: message });
  } finally {
    if (inputPath) await safeUnlink(inputPath);
    if (pdfPath) await safeUnlink(pdfPath);
    if (outputDir) {
      try {
        await fs.rm(outputDir, { recursive: true, force: true });
      } catch {}
    }
  }
});

app.listen(PORT, () => {
  console.log(`excelcend-pdf listening on ${PORT}`);
});