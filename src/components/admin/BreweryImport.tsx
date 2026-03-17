import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Upload, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportResult {
  inserted: number;
  updated: number;
  deleted: number;
  unchanged: number;
  total_incoming: number;
  total_existing: number;
}

interface BreweryImportProps {
  onComplete?: () => void;
}

export default function BreweryImport({ onComplete }: BreweryImportProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [sheetInfo, setSheetInfo] = useState<{ name: string; rows: number }[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    
    // Combine all sheets into one array, track per-sheet counts
    const allRows: any[] = [];
    const info: { name: string; rows: number }[] = [];
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const sheetRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
      // Filter out completely empty rows before counting
      const validRows = sheetRows.filter(r => {
        const naam = (r['naam'] || r['Naam'] || r['name'] || '').toString().trim();
        return naam.length > 0;
      });
      info.push({ name: sheetName, rows: validRows.length });
      allRows.push(...validRows);
    }
    setSheetInfo(info);

    // Map spreadsheet columns to our format
    const mapped = allRows
      .filter(r => r['naam'] || r['Naam'] || r['name'])
      .map(r => ({
        name: (r['naam'] || r['Naam'] || r['name'] || '').trim(),
        code: (r['code'] || r['Code'] || '').trim(),
        province: (r['provincie'] || r['Provincie'] || '').trim(),
        postal_code: (r['post-code'] || r['postcode'] || r['Postcode'] || '').toString().trim(),
        address: [
          (r['straat'] || r['Straat'] || '').trim(),
          (r['nr'] || r['Nr'] || '').toString().trim(),
          (r['post-code'] || '').toString().trim(),
          (r['gemeente'] || r['Gemeente'] || '').trim(),
        ].filter(Boolean).join(' '),
        phone: (r['tel 1'] || r['Tel'] || '').toString().trim(),
        email: (r['e-mail'] || r['E-mail'] || r['email'] || '').trim(),
        website: (r['website'] || r['Website'] || '').trim(),
      }))
      .filter(r => r.name);

    setPreview(mapped);
    setResult(null);
  };

  const handleSync = async () => {
    if (!preview) return;

    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        toast({ title: 'Niet ingelogd', variant: 'destructive' });
        return;
      }

      const res = await supabase.functions.invoke('import-breweries', {
        body: { breweries: preview, mode: 'sync' },
      });

      if (res.error) {
        toast({ title: 'Import fout', description: res.error.message, variant: 'destructive' });
        return;
      }

      setResult(res.data as ImportResult);
      toast({ title: 'Sync voltooid!' });
      onComplete?.();
    } catch (err: any) {
      toast({ title: 'Fout', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const uCodeCount = preview?.filter(b => b.code.startsWith('U')).length ?? 0;
  const mainCount = preview ? preview.length - uCodeCount : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFile}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => fileRef.current?.click()}
          className="gap-2"
        >
          <Upload size={14} />
          Selecteer Excel-bestand
        </Button>
        {preview && (
          <div className="text-sm text-muted-foreground space-y-1">
            <p>{preview.length} rijen geladen ({mainCount} brouwerijen/sub-sites{uCodeCount > 0 ? `, ${uCodeCount} U-codes` : ''})</p>
            {sheetInfo.length > 1 && (
              <p className="text-xs">
                Per tabblad: {sheetInfo.map(s => `${s.name} (${s.rows})`).join(' · ')}
              </p>
            )}
          </div>
        )}
      </div>

      {preview && !result && (
        <div className="space-y-4">
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-warning">Let op: volledige sync</p>
              <p className="text-muted-foreground mt-1">
                Dit zal brouwerijen die niet meer in de lijst staan <strong>verwijderen</strong>,
                nieuwe toevoegen, en bestaande gegevens bijwerken. Sub-sites (S-codes) worden overgeslagen.
              </p>
            </div>
          </div>

          {/* Preview table */}
          <div className="max-h-64 overflow-auto border rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Code</th>
                  <th className="px-3 py-2 text-left">Naam</th>
                  <th className="px-3 py-2 text-left">Provincie</th>
                  <th className="px-3 py-2 text-left">Postcode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {preview.slice(0, 50).map((b, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5 font-mono">{b.code}</td>
                    <td className="px-3 py-1.5">{b.name}</td>
                    <td className="px-3 py-1.5">{b.province}</td>
                    <td className="px-3 py-1.5">{b.postal_code}</td>
                  </tr>
                ))}
                {preview.length > 50 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-center text-muted-foreground">
                      ... en {preview.length - 50} meer
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Button onClick={handleSync} disabled={loading} className="gap-2">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            Sync starten
          </Button>
        </div>
      )}

      {result && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-5 space-y-2">
          <h3 className="font-semibold text-success flex items-center gap-2">
            <CheckCircle size={16} /> Sync voltooid
          </h3>
          <div className="grid grid-cols-3 gap-4 mt-3">
            <div className="text-center">
              <p className="font-display text-2xl text-success">{result.inserted}</p>
              <p className="text-xs text-muted-foreground">Toegevoegd</p>
            </div>
            <div className="text-center">
              <p className="font-display text-2xl text-accent">{result.updated}</p>
              <p className="text-xs text-muted-foreground">Bijgewerkt</p>
            </div>
            <div className="text-center">
              <p className="font-display text-2xl text-destructive">{result.deleted}</p>
              <p className="text-xs text-muted-foreground">Verwijderd</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {result.unchanged} ongewijzigd · {result.total_incoming} in lijst · {result.total_existing} in database
          </p>
        </div>
      )}
    </div>
  );
}
