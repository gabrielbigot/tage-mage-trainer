"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { storage } from "@/lib/storage";
import { Download, Upload, AlertCircle, CheckCircle2 } from "lucide-react";

interface ImportExportProps {
  onDataChanged?: () => void;
}

export function ImportExport({ onDataChanged }: ImportExportProps) {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const data = await storage.exportData();
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tage-mage-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({ type: "success", text: "Exportation réussie !" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: "error", text: "Erreur lors de l'exportation" });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const result = await storage.importData(content);

        if (result.success) {
          setMessage({ type: "success", text: result.message });
          onDataChanged?.();
        } else {
          setMessage({ type: "error", text: result.message });
        }

        setTimeout(() => setMessage(null), 5000);
      } catch (error) {
        setMessage({ type: "error", text: "Erreur lors de la lecture du fichier" });
        setTimeout(() => setMessage(null), 3000);
      }
    };

    reader.readAsText(file);
    // Reset input
    event.target.value = "";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import / Export</CardTitle>
        <CardDescription>
          Sauvegardez ou importez vos questions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <div
            className={`p-4 rounded-lg flex items-center gap-2 ${
              message.type === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <h4 className="font-medium mb-2">Exporter les données</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Téléchargez toutes vos questions et sessions en format JSON
            </p>
            <Button onClick={handleExport} className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>

          <div className="border-t pt-3">
            <h4 className="font-medium mb-2">Importer des données</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Importez des questions depuis un fichier JSON
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button onClick={handleImport} className="w-full" variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importer
            </Button>
          </div>
        </div>

        <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground">
          <p className="font-medium mb-1">💡 Conseil</p>
          <p>
            Exportez régulièrement vos données pour créer des sauvegardes. Vous pouvez aussi partager vos questions avec d&apos;autres utilisateurs !
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
