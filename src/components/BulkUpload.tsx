import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Download, Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import { inventoryApi } from "@/lib/api";

const BulkUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const csv = "medicine_name,price,in_stock,quantity_available\nParacetamol 500mg,1.50,true,In Stock\nAmoxicillin 250mg,5.00,false,0";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setProgress(20);
    setResult(null);
    try {
      setProgress(50);
      const res = await inventoryApi.bulkUpload(file);
      setProgress(100);
      setResult({ success: res.success.length, failed: res.errors.length });
    } catch {
      setResult({ success: 0, failed: 1 });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

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
          <p className="text-xs text-muted-foreground">or drag and drop here · CSV only, max 5MB</p>
        </button>

        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Uploading...</span>
              <span className="font-medium text-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

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
            <li>• Required: medicine_name, price, in_stock</li>
            <li>• Optional: quantity_available</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkUpload;
