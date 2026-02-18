import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Loader2,
  Eye,
  X,
  FileUp,
} from "lucide-react";
import { inventoryApi } from "@/lib/api";

const REQUIRED_COLS = ["medicine_name", "price", "in_stock"];
const ALL_COLS = ["medicine_name", "price", "in_stock", "quantity_available"];

interface ParsedCsv {
  headers: string[];
  rows: string[][];
  rawText: string;
}

interface ValidationResult {
  valid: boolean;
  warnings: string[];
}

function parseCsvText(text: string): ParsedCsv {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [], rawText: text };
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) =>
    line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""))
  );
  return { headers, rows, rawText: text };
}

function validateCsv(parsed: ParsedCsv): ValidationResult {
  const warnings: string[] = [];
  const { headers, rows } = parsed;

  if (headers.length === 0) {
    return { valid: false, warnings: ["File appears to be empty."] };
  }

  const lowerHeaders = headers.map((h) => h.toLowerCase().replace(/\s+/g, "_"));

  const missingRequired = REQUIRED_COLS.filter((col) => !lowerHeaders.includes(col));
  if (missingRequired.length > 0) {
    warnings.push(`Missing required column(s): ${missingRequired.join(", ")}`);
  }

  const extraCols = headers.filter((_, i) => !ALL_COLS.includes(lowerHeaders[i]));
  if (extraCols.length > 0) {
    warnings.push(`Unrecognised column(s): ${extraCols.join(", ")}`);
  }

  if (rows.length === 0) {
    warnings.push("No data rows found — only headers detected.");
  }

  const priceIdx = lowerHeaders.indexOf("price");
  const stockIdx = lowerHeaders.indexOf("in_stock");

  rows.forEach((row, i) => {
    if (row.length !== headers.length) {
      warnings.push(`Row ${i + 1}: has ${row.length} columns, expected ${headers.length}`);
    }
    if (priceIdx >= 0 && row[priceIdx] !== undefined) {
      const p = parseFloat(row[priceIdx]);
      if (isNaN(p) || p < 0) {
        warnings.push(`Row ${i + 1}: invalid price "${row[priceIdx]}"`);
      }
    }
    if (stockIdx >= 0 && row[stockIdx] !== undefined) {
      const v = row[stockIdx].toLowerCase();
      if (!["true", "false", "yes", "no", "1", "0"].includes(v)) {
        warnings.push(`Row ${i + 1}: in_stock should be true/false, got "${row[stockIdx]}"`);
      }
    }
  });

  return { valid: warnings.length === 0, warnings };
}

const BulkUpload = () => {
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const csv = [
      "medicine_name,price,in_stock,quantity_available",
      "Paracetamol 500mg,2.99,true,150",
      "Ibuprofen 400mg,4.49,true,200",
      "Amoxicillin 250mg,8.99,true,75",
      "Omeprazole 20mg,6.50,false,",
      "Metformin 500mg,3.25,true,300",
      "Atorvastatin 10mg,12.99,true,90",
      "Cetirizine 10mg,5.75,true,120",
      "Lisinopril 5mg,7.20,false,",
      "Azithromycin 500mg,15.49,true,45",
      "Salbutamol Inhaler,18.99,true,60",
      "Diclofenac 50mg,4.99,false,",
      "Vitamin D3 1000IU,9.99,true,500",
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadCsvText = useCallback((text: string) => {
    const p = parseCsvText(text);
    const v = validateCsv(p);
    setParsed(p);
    setValidation(v);
    setResult(null);
  }, []);

  const handleFileChange = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) loadCsvText(text);
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!parsed) return;
    setUploading(true);
    setProgress(20);
    setResult(null);
    try {
      const blob = new Blob([parsed.rawText], { type: "text/csv" });
      const file = new File([blob], "inventory.csv", { type: "text/csv" });
      setProgress(50);
      const res = await inventoryApi.bulkUpload(file);
      setProgress(100);
      setResult({ success: res.success.length, failed: res.errors.length });
    } catch {
      setResult({ success: 0, failed: 1 });
    } finally {
      setUploading(false);
    }
  };

  const handleAiFix = async () => {
    if (!parsed) return;
    setFixing(true);
    try {
      const res = await inventoryApi.fixCsv(parsed.rawText);
      if (res.corrected_csv) {
        loadCsvText(res.corrected_csv);
      }
    } catch {
      setValidation((prev) =>
        prev
          ? { ...prev, warnings: [...prev.warnings, "AI fix failed — please correct the file manually."] }
          : { valid: false, warnings: ["AI fix failed — please correct the file manually."] }
      );
    } finally {
      setFixing(false);
    }
  };

  const handleClear = () => {
    setParsed(null);
    setValidation(null);
    setResult(null);
    setProgress(0);
  };

  const handleCellEdit = (rowIdx: number, colIdx: number, value: string) => {
    if (!parsed) return;
    const newRows = parsed.rows.map((r) => [...r]);
    newRows[rowIdx][colIdx] = value;
    const newRaw = [parsed.headers.join(","), ...newRows.map((r) => r.join(","))].join("\n");
    const updated: ParsedCsv = { headers: parsed.headers, rows: newRows, rawText: newRaw };
    const v = validateCsv(updated);
    setParsed(updated);
    setValidation(v);
  };

  const previewRows = parsed?.rows.slice(0, 10) ?? [];
  const hasMore = (parsed?.rows.length ?? 0) > 10;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Bulk Upload Inventory</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </div>
        <CardDescription>Upload entire inventory via CSV</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="outline" className="w-full gap-2" onClick={handleDownloadTemplate}>
          <Download className="h-4 w-4" />
          Download CSV Template
        </Button>

        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
        <button
          className="flex w-full flex-col items-center gap-2 rounded-md border-2 border-dashed border-border p-6 transition-colors hover:border-muted-foreground/50 hover:bg-accent"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Click to upload CSV file</p>
          <p className="text-xs text-muted-foreground">CSV only, max 5MB</p>
        </button>

        {/* ── Preview & Validation ── */}
        {parsed && validation && (
          <div className="space-y-3">
            {/* Validation status */}
            {validation.valid ? (
              <Alert className="border-emerald-500/30 bg-emerald-500/5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <AlertDescription className="text-sm">
                  Format looks good — {parsed.rows.length} row{parsed.rows.length !== 1 ? "s" : ""} ready to upload.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-destructive/30 bg-destructive/5">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <AlertDescription className="space-y-1">
                  <p className="text-sm font-medium">Format issues detected ({validation.warnings.length})</p>
                  <ul className="text-xs space-y-0.5 max-h-28 overflow-y-auto">
                    {validation.warnings.map((w, i) => (
                      <li key={i} className="text-destructive/80">— {w}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Preview table */}
            <div className="rounded-md border overflow-x-auto">
              <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" /> Preview
                </span>
                <button onClick={handleClear} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30">
                    {parsed.headers.map((h, i) => {
                      const isExpected = ALL_COLS.includes(h.toLowerCase().replace(/\s+/g, "_"));
                      return (
                        <th key={i} className={`px-3 py-1.5 text-left font-medium ${isExpected ? "text-foreground" : "text-destructive"}`}>
                          {h}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, ri) => (
                    <tr key={ri} className="border-b last:border-b-0">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-1 py-0.5">
                          <input
                            className="w-full min-w-[80px] bg-transparent text-xs text-foreground px-2 py-1 rounded border border-transparent hover:border-border focus:border-ring focus:outline-none transition-colors"
                            value={cell}
                            onChange={(e) => handleCellEdit(ri, ci, e.target.value)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {hasMore && (
                <p className="text-xs text-muted-foreground text-center py-1.5 border-t bg-muted/20">
                  … and {parsed.rows.length - 10} more row{parsed.rows.length - 10 !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {!validation.valid && (
                <Button
                  variant="outline"
                  className="flex-1 gap-1.5"
                  onClick={handleAiFix}
                  disabled={fixing}
                >
                  {fixing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {fixing ? "Fixing…" : "Auto-fix with AI"}
                </Button>
              )}
              <Button
                className="flex-1 gap-1.5"
                onClick={handleUpload}
                disabled={uploading || !validation.valid}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                {uploading ? "Uploading…" : "Upload to Inventory"}
              </Button>
            </div>
          </div>
        )}

        {/* Upload progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Uploading...</span>
              <span className="font-medium text-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Upload result */}
        {result && (
          <div className="space-y-2">
            <Alert className="border-primary/30 bg-primary/5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription>{result.success} medicines added successfully</AlertDescription>
            </Alert>
            {result.failed > 0 && (
              <Alert className="border-warning/30 bg-warning/5">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription>{result.failed} entries failed — check formatting</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="rounded-md bg-muted p-3">
          <p className="text-xs font-medium text-foreground mb-1">CSV Format:</p>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            <li>- Required: medicine_name, price, in_stock</li>
            <li>- Optional: quantity_available</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkUpload;
