import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  X, Loader2, Monitor,
  Upload, FileText, CheckCircle2, AlertCircle, Star, Save, ArrowLeft,
  ExternalLink, Trophy, DollarSign, Shield,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// ─── Types ────────────────────────────────────────────────────

interface ExtractedBeer {
  name: string;
  style: string;
  abv: number | null;
  description: string;
  source?: string;
  source_url?: string;
  untappd_rating?: number | null;
  quality_score?: number | null;
}

interface FactcheckResult {
  confidence_score: number;
  abv_verified: boolean;
  style_verified: boolean;
  style_note?: string;
  awards: { name: string; year?: number; medal?: string }[];
  price_range?: { min?: number; max?: number; currency?: string };
  external_ratings?: {
    untappd?: { score: number | null; url: string | null };
    ratebeer?: { score: number | null; url: string | null };
    beeradvocate?: { score: number | null; url: string | null };
  };
  external_links?: { label: string; url: string }[];
  issues?: string[];
  suggestions?: string[];
}

interface BeerWithFactcheck extends ExtractedBeer {
  _factcheck?: FactcheckResult | null;
  _factchecking?: boolean;
  _saved?: boolean;
  _saving?: boolean;
  _db_id?: string;
}

interface BreweryScreenCaptureProps {
  breweryId: string;
  breweryName: string;
  onBeersFound: (beers: any[]) => void;
}

// ─── HTML Parser ──────────────────────────────────────────────

function parseUntappdHtml(htmlString: string): ExtractedBeer[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const items = doc.querySelectorAll('.beer-item');
  const beers: ExtractedBeer[] = [];

  items.forEach((item) => {
    const nameEl = item.querySelector('.beer-details .name a, h5 a, .name a');
    const styleEl = item.querySelector('.beer-details .style, .style, p.style');
    const descEl = item.querySelector('.beer-details .desc, .desc');
    const abvEl = item.querySelector('.details-item.abv, .abv');

    const name = nameEl?.textContent?.trim() || '';
    if (!name) return;

    const style = styleEl?.textContent?.trim() || '';
    const desc = (descEl?.textContent?.trim() || '')
      .replace(/Read More/g, '').replace(/Read Less/g, '').trim().slice(0, 300);

    const abvRaw = abvEl?.textContent?.trim() || '';
    const abvMatch = abvRaw.match(/([\d.]+)%/);
    const abv = abvMatch ? parseFloat(abvMatch[1]) : null;

    let untappd_rating: number | null = null;
    const ratingAttr = item.querySelector('.caps[data-rating]')?.getAttribute('data-rating');
    if (ratingAttr) {
      untappd_rating = parseFloat(ratingAttr);
    } else {
      const numEl = item.querySelector('.num');
      const numText = numEl?.textContent?.trim();
      if (numText && /^\d+(\.\d+)?$/.test(numText)) {
        untappd_rating = parseFloat(numText);
      }
    }

    beers.push({ name, style, abv, description: desc, untappd_rating });
  });

  return beers;
}

// ─── Score Ring Component ─────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 90 ? 'hsl(var(--success))' : score >= 80 ? 'hsl(var(--warning))' : score >= 70 ? 'hsl(var(--accent))' : 'hsl(var(--destructive))';
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0">
      <circle cx="22" cy="22" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
      <circle
        cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 22 22)"
        className="transition-all duration-700"
      />
      <text x="22" y="22" textAnchor="middle" dominantBaseline="central"
        className="fill-foreground font-bold" style={{ fontSize: '11px' }}>
        {score}
      </text>
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function BreweryScreenCapture({
  breweryId,
  breweryName,
  onBeersFound,
}: BreweryScreenCaptureProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [htmlFileName, setHtmlFileName] = useState('');
  const htmlFileRef = useRef<HTMLInputElement>(null);

  const [extractedBeers, setExtractedBeers] = useState<BeerWithFactcheck[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [autoFactchecking, setAutoFactchecking] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [expandedBeer, setExpandedBeer] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setShowResults(false); setExtractedBeers([]); }
  }, [open]);

  // ─── Factcheck a single beer ─────────────────────────────────

  const factcheckBeer = useCallback(async (beer: BeerWithFactcheck, index: number) => {
    if (!beer._db_id) return;
    setExtractedBeers(prev => prev.map((b, i) => i === index ? { ...b, _factchecking: true } : b));
    try {
      const res = await supabase.functions.invoke('factcheck-beer', {
        body: { beer_id: beer._db_id },
      });
      if (res.error) throw new Error(res.error.message);
      const factcheck = res.data?.factcheck || res.data;
      setExtractedBeers(prev => prev.map((b, i) =>
        i === index ? { ...b, _factcheck: factcheck, _factchecking: false } : b
      ));
    } catch (err: any) {
      console.error('Factcheck failed:', err);
      setExtractedBeers(prev => prev.map((b, i) =>
        i === index ? { ...b, _factchecking: false } : b
      ));
    }
  }, []);

  // ─── Save all beers + auto-factcheck ──────────────────────────

  const saveAndFactcheckAll = useCallback(async (beers: BeerWithFactcheck[]) => {
    setSavingAll(true);
    setAutoFactchecking(true);
    const savedBeers: BeerWithFactcheck[] = [...beers];

    for (let i = 0; i < beers.length; i++) {
      const beer = beers[i];
      setExtractedBeers(prev => prev.map((b, idx) => idx === i ? { ...b, _saving: true } : b));
      try {
        const { data: existing } = await supabase
          .from('beers')
          .select('id')
          .eq('brewery_id', breweryId)
          .ilike('name', beer.name)
          .maybeSingle();

        let dbId: string;
        if (existing) {
          await supabase.from('beers').update({
            style: beer.style || undefined,
            abv: beer.abv ?? undefined,
            description: beer.description || undefined,
            source_url: beer.source_url || undefined,
          }).eq('id', existing.id);
          dbId = existing.id;
        } else {
          const { data: inserted, error } = await supabase.from('beers').insert({
            brewery_id: breweryId,
            name: beer.name,
            style: beer.style || 'Unknown',
            abv: beer.abv,
            description: beer.description || null,
            source_url: beer.source_url || null,
          }).select('id').single();
          if (error) throw error;
          dbId = inserted.id;
        }
        savedBeers[i] = { ...savedBeers[i], _db_id: dbId, _saved: true, _saving: false };
        setExtractedBeers([...savedBeers]);
      } catch (err: any) {
        console.error(`Save failed for ${beer.name}:`, err);
        savedBeers[i] = { ...savedBeers[i], _saving: false };
        setExtractedBeers([...savedBeers]);
      }
    }
    setSavingAll(false);

    for (let i = 0; i < savedBeers.length; i++) {
      if (!savedBeers[i]._db_id) continue;
      setExtractedBeers(prev => prev.map((b, idx) => idx === i ? { ...b, _factchecking: true } : b));
      try {
        const res = await supabase.functions.invoke('factcheck-beer', {
          body: { beer_id: savedBeers[i]._db_id },
        });
        if (res.error) throw new Error(res.error.message);
        const factcheck = res.data?.factcheck || res.data;
        savedBeers[i] = { ...savedBeers[i], _factcheck: factcheck, _factchecking: false };
        setExtractedBeers([...savedBeers]);
        if (factcheck.confidence_score && savedBeers[i]._db_id) {
          await supabase.from('beers').update({
            quality_score: factcheck.confidence_score,
          }).eq('id', savedBeers[i]._db_id!);
          savedBeers[i] = { ...savedBeers[i], quality_score: factcheck.confidence_score };
          setExtractedBeers([...savedBeers]);
        }
      } catch (err: any) {
        console.error(`Factcheck failed for ${savedBeers[i].name}:`, err);
        savedBeers[i] = { ...savedBeers[i], _factchecking: false };
        setExtractedBeers([...savedBeers]);
      }
      if (i < savedBeers.length - 1) await new Promise(r => setTimeout(r, 1500));
    }

    setAutoFactchecking(false);

    // Update last_scraped_at on the brewery
    await supabase.from('breweries').update({ last_scraped_at: new Date().toISOString() }).eq('id', breweryId);

    toast({
      title: `${savedBeers.filter(b => b._saved).length} bieren opgeslagen`,
      description: `${savedBeers.filter(b => b._factcheck).length} factchecks voltooid`,
    });
    onBeersFound(savedBeers.filter(b => b._saved));
  }, [breweryId, onBeersFound]);

  // ─── Process beers after extraction ───────────────────────────

  const processExtractedBeers = useCallback((beers: ExtractedBeer[]) => {
    if (beers.length === 0) {
      toast({ title: 'Geen bieren gevonden', variant: 'destructive' });
      return;
    }
    const withState: BeerWithFactcheck[] = beers.map(b => ({
      ...b, _factcheck: null, _factchecking: false, _saved: false, _saving: false,
    }));
    setExtractedBeers(withState);
    setShowResults(true);
    toast({ title: `${beers.length} bieren geëxtraheerd`, description: 'Bezig met opslaan en factchecken…' });
    saveAndFactcheckAll(withState);
  }, [saveAndFactcheckAll]);

  // ─── HTML Upload ──────────────────────────────────────────────

  const handleHtmlUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHtmlFileName(file.name);
    setLoading(true);
    try {
      const text = await file.text();
      const beers = parseUntappdHtml(text);
      processExtractedBeers(beers);
    } catch (err: any) {
      toast({ title: 'Fout bij lezen', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
      if (htmlFileRef.current) htmlFileRef.current.value = '';
    }
  }, [processExtractedBeers]);

  // ─── Stats ────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    total: extractedBeers.length,
    saved: extractedBeers.filter(b => b._saved).length,
    factchecked: extractedBeers.filter(b => b._factcheck).length,
    checking: extractedBeers.filter(b => b._factchecking).length,
  }), [extractedBeers]);

  // ─── Render ───────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Monitor size={12} />
          Capture
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg flex items-center gap-2">
            {showResults && (
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                onClick={() => setShowResults(false)}>
                <ArrowLeft size={14} />
              </Button>
            )}
            Beer Scan — {breweryName}
          </DialogTitle>
        </DialogHeader>

        {showResults ? (
          <div className="flex-1 overflow-y-auto space-y-3">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Save size={10} /> {stats.saved}/{stats.total} opgeslagen</span>
                <span className="flex items-center gap-1"><Shield size={10} /> {stats.factchecked}/{stats.total} gecheckt</span>
                {stats.checking > 0 && (
                  <span className="flex items-center gap-1 animate-pulse">
                    <Loader2 size={10} className="animate-spin" /> {stats.checking} bezig…
                  </span>
                )}
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${stats.total ? (stats.factchecked / stats.total) * 100 : 0}%` }} />
              </div>
            </div>

            {/* Beer results */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[44px_1fr_1fr_60px_70px_32px] gap-2 px-3 py-2 bg-muted/50 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                <span>Score</span><span>Bier</span><span>Stijl</span>
                <span className="text-right">ABV</span><span className="text-right">Untappd</span><span />
              </div>

              {extractedBeers.map((beer, i) => {
                const fc = beer._factcheck;
                const score = beer.quality_score || fc?.confidence_score || null;
                const untappdScore = fc?.external_ratings?.untappd?.score ?? beer.untappd_rating ?? null;
                const isExpanded = expandedBeer === beer.name;

                return (
                  <div key={`${beer.name}-${i}`}>
                    <div
                      className={`grid grid-cols-[44px_1fr_1fr_60px_70px_32px] gap-2 px-3 py-2 items-center border-b border-border/50 cursor-pointer hover:bg-muted/30 transition-colors ${isExpanded ? 'bg-muted/40' : ''}`}
                      onClick={() => setExpandedBeer(isExpanded ? null : beer.name)}
                    >
                      <div>
                        {beer._factchecking ? <Loader2 size={18} className="animate-spin text-muted-foreground" />
                          : score ? <ScoreRing score={score} />
                          : beer._saving ? <Loader2 size={18} className="animate-spin text-muted-foreground" />
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{beer.name}</p>
                        {beer.description && <p className="text-[10px] text-muted-foreground truncate">{beer.description}</p>}
                      </div>
                      <div className="min-w-0">
                        <Badge variant="outline" className="text-[10px] truncate max-w-full">{beer.style || '—'}</Badge>
                        {fc?.style_verified === false && fc.style_note && (
                          <p className="text-[9px] text-warning mt-0.5 truncate">⚠ {fc.style_note}</p>
                        )}
                      </div>
                      <p className="text-sm text-right font-mono">
                        {beer.abv ? `${beer.abv}%` : '—'}
                        {fc?.abv_verified === false && <span className="text-warning ml-0.5">⚠</span>}
                      </p>
                      <div className="text-right">
                        {untappdScore ? (
                          <span className="inline-flex items-center gap-0.5 text-sm">
                            <Star size={10} className="fill-accent text-accent" />{untappdScore.toFixed(2)}
                          </span>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                      <div className="flex justify-center">
                        {beer._factchecking ? <Loader2 size={12} className="animate-spin text-primary" />
                          : fc ? <CheckCircle2 size={14} className="text-success" />
                          : beer._saved ? <CheckCircle2 size={14} className="text-muted-foreground" />
                          : beer._saving ? <Loader2 size={12} className="animate-spin text-muted-foreground" />
                          : <AlertCircle size={14} className="text-muted-foreground/50" />}
                      </div>
                    </div>

                    {isExpanded && fc && (
                      <div className="px-4 py-3 bg-muted/20 border-b border-border space-y-3 text-xs">
                        {fc.awards && fc.awards.length > 0 && (
                          <div>
                            <p className="font-semibold flex items-center gap-1 mb-1"><Trophy size={12} className="text-accent" /> Awards</p>
                            <div className="flex flex-wrap gap-1">
                              {fc.awards.map((a, j) => (
                                <Badge key={j} variant="secondary" className="text-[10px]">
                                  {a.medal && `${a.medal === 'gold' ? '🥇' : a.medal === 'silver' ? '🥈' : '🥉'} `}
                                  {a.name} {a.year ? `(${a.year})` : ''}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {fc.price_range && (fc.price_range.min || fc.price_range.max) && (
                          <div className="flex items-center gap-1">
                            <DollarSign size={12} className="text-success" />
                            <span>€{fc.price_range.min || '?'} – €{fc.price_range.max || '?'}</span>
                          </div>
                        )}
                        {fc.external_ratings && (
                          <div className="flex gap-3">
                            {fc.external_ratings.untappd?.score && (
                              <a href={fc.external_ratings.untappd.url || '#'} target="_blank" rel="noopener"
                                className="flex items-center gap-1 text-primary hover:underline">
                                <ExternalLink size={10} /> Untappd: {fc.external_ratings.untappd.score}
                              </a>
                            )}
                            {fc.external_ratings.ratebeer?.score && (
                              <a href={fc.external_ratings.ratebeer.url || '#'} target="_blank" rel="noopener"
                                className="flex items-center gap-1 text-primary hover:underline">
                                <ExternalLink size={10} /> RateBeer: {fc.external_ratings.ratebeer.score}
                              </a>
                            )}
                            {fc.external_ratings.beeradvocate?.score && (
                              <a href={fc.external_ratings.beeradvocate.url || '#'} target="_blank" rel="noopener"
                                className="flex items-center gap-1 text-primary hover:underline">
                                <ExternalLink size={10} /> BA: {fc.external_ratings.beeradvocate.score}
                              </a>
                            )}
                          </div>
                        )}
                        {fc.issues && fc.issues.length > 0 && (
                          <div className="space-y-0.5">
                            <p className="font-semibold text-warning">⚠ Issues</p>
                            {fc.issues.map((issue, j) => <p key={j} className="text-muted-foreground pl-3">• {issue}</p>)}
                          </div>
                        )}
                        {fc.suggestions && fc.suggestions.length > 0 && (
                          <div className="space-y-0.5">
                            <p className="font-semibold text-primary">💡 Suggesties</p>
                            {fc.suggestions.map((s, j) => <p key={j} className="text-muted-foreground pl-3">• {s}</p>)}
                          </div>
                        )}
                        {fc.external_links && fc.external_links.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {fc.external_links.map((link, j) => (
                              <a key={j} href={link.url} target="_blank" rel="noopener"
                                className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                                <ExternalLink size={8} /> {link.label}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!autoFactchecking && !savingAll && stats.factchecked === stats.total && stats.total > 0 && (
              <div className="text-center py-2">
                <p className="text-xs text-success font-medium">✅ Alle {stats.total} bieren opgeslagen en gecheckt</p>
                <Button size="sm" variant="outline" className="mt-2" onClick={() => setOpen(false)}>Sluiten</Button>
              </div>
            )}
          </div>
        ) : (
          /* ─── HTML UPLOAD ──────────────────────────────── */
          <div className="flex-1 flex flex-col gap-3 mt-3">
            <p className="text-xs text-muted-foreground">
              Open de Untappd-pagina → <strong>Ctrl+S</strong> → "Webpagina, volledig" → upload het <code>.html</code> bestand.
            </p>
            <input ref={htmlFileRef} type="file" accept=".html,.htm" className="hidden" onChange={handleHtmlUpload} />
            <Button variant="outline" className="gap-2 w-full border-dashed border-2 h-16 flex-col"
              onClick={() => htmlFileRef.current?.click()} disabled={loading}>
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
              <span className="text-xs">{loading ? 'Parsing…' : htmlFileName || 'Kies een opgeslagen HTML-bestand'}</span>
            </Button>
            <div className="bg-muted/50 border border-border rounded-md p-3 text-[11px] text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">⚡ Snelste methode</p>
              <p>Parsed direct → slaat op → factcheckt automatisch elk bier.</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
