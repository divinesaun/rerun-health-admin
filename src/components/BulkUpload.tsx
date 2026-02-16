import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <Card className="border-2 border-secondary/20 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-5 w-5 text-secondary" />
          Bulk Upload Inventory
          <Badge variant="outline" className="ml-auto text-xs">Method 2</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Upload entire inventory via CSV</p>

        <Button variant="outline" className="w-full gap-2 border-secondary/30 text-secondary hover:bg-secondary/10" onClick={handleDownloadTemplate}>
          <Download className="h-4 w-4" />
          Download CSV Template
        </Button>

        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
        <button
          className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-8 transition-colors hover:border-secondary hover:bg-secondary/5"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Click to upload CSV file</p>
          <p className="text-xs text-muted-foreground">or drag and drop here</p>
          <p className="text-xs text-muted-foreground">CSV format only, max 5MB</p>
        </button>

        {uploading && (
          <div className="space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Uploading...</span>
              <span className="font-medium text-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {result && (
          <div className="space-y-2 animate-fade-in">
            <Alert className="border-primary/30 bg-accent">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription className="text-accent-foreground">✅ {result.success} medicines added successfully</AlertDescription>
            </Alert>
            {result.failed > 0 && (
              <Alert className="border-warning/30 bg-warning/10">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-foreground">⚠️ {result.failed} entries failed — check formatting</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs font-medium text-foreground mb-1">📝 CSV Format:</p>
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
