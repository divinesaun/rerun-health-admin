import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Download, Upload, CheckCircle2, AlertTriangle } from "lucide-react";

const BulkUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const csv = "name,generic_name,price,stock,quantity\nParacetamol 500mg,Acetaminophen,1.50,in_stock,50\nAmoxicillin 250mg,Amoxicillin,5.00,out_of_stock,0";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const simulateUpload = () => {
    setUploading(true);
    setProgress(0);
    setResult(null);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setUploading(false);
          setResult({ success: 45, failed: 2 });
          return 100;
        }
        return p + 10;
      });
    }, 200);
  };

  const handleFileChange = () => {
    simulateUpload();
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
            <li>• Required: name, price, stock</li>
            <li>• Optional: generic_name, quantity</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkUpload;
