import { useRef, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  bucket: 'beer-images' | 'brewery-images';
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}

export default function ImageUploader({ bucket, value, onChange, label = 'Afbeelding' }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '31536000',
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (e: any) {
      toast.error(e.message || 'Upload mislukt');
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = '';
    }
  }

  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative h-20 w-20 rounded-lg border border-border overflow-hidden bg-muted">
            <img src={value} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute top-0.5 right-0.5 bg-foreground/80 text-background rounded-full p-0.5 hover:bg-foreground"
              aria-label="Verwijderen"
            >
              <X size={11} />
            </button>
          </div>
        ) : (
          <div className="h-20 w-20 rounded-lg border border-dashed border-border bg-muted/40 flex items-center justify-center text-muted-foreground">
            <Upload size={18} />
          </div>
        )}
        <div className="flex-1">
          <input
            ref={ref}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <button
            type="button"
            onClick={() => ref.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium border border-border rounded-full hover:bg-[hsl(var(--primary-light))] hover:text-primary disabled:opacity-50"
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            {value ? 'Vervangen' : 'Uploaden'}
          </button>
          {value && (
            <p className="text-[10px] text-muted-foreground mt-1 truncate max-w-[260px]">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}
