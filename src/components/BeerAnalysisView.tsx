import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { FlaskConical, ShieldCheck, Download, Star, ExternalLink, AlertTriangle, CheckCircle2, Wine, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface BeerAnalysisProps {
  beerId: string;
  beerName: string;
  analysisJson: any | null;
  factcheckJson: any | null;
  qualityScore: number | null;
  summary: string | null;
  tasteNotes: string | null;
  radarBody: number | null;
  radarHops: number | null;
  radarMalt: number | null;
  radarFruit: number | null;
  radarSpice: number | null;
  primaryFlavors: string[] | null;
  secondaryFlavors: string[] | null;
  aromaProfile: string[] | null;
  pairingFood: string[] | null;
  pairingClassic: string[] | null;
  pairingCheese: string[] | null;
  serveStyle: string | null;
  productionMethod: string | null;
  isAdmin?: boolean;
  onRefresh?: () => void;
}

// ── Score Ring ──
function ScoreRing({ score, size = 80, label }: { score: number | null; size?: number; label?: string }) {
  const isNA = score == null || score < 70;
  const displayScore = isNA ? null : score;
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = isNA ? circumference : circumference - (score! / 100) * circumference;
  const color = isNA ? 'hsl(var(--muted-foreground))' : score! >= 80 ? 'hsl(var(--success))' : 'hsl(var(--accent))';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      <span className="absolute font-display text-lg font-bold" style={{ color }}>
        {displayScore != null ? displayScore : 'N/A'}
      </span>
      {label && <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>}
    </div>
  );
}

// ── Radar Chart (SVG) ──
function RadarChart({ data }: { data: { label: string; value: number }[] }) {
  const cx = 100, cy = 100, maxR = 70;
  const n = data.length;
  const angles = data.map((_, i) => (Math.PI * 2 * i) / n - Math.PI / 2);

  const gridLevels = [1, 2, 3, 4, 5];
  const points = data.map((d, i) => {
    const r = (d.value / 5) * maxR;
    return { x: cx + r * Math.cos(angles[i]), y: cy + r * Math.sin(angles[i]) };
  });
  const polygon = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[220px] mx-auto">
      {/* Grid */}
      {gridLevels.map(level => {
        const r = (level / 5) * maxR;
        const pts = angles.map(a => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`).join(' ');
        return <polygon key={level} points={pts} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity={0.5} />;
      })}
      {/* Axes */}
      {angles.map((a, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + maxR * Math.cos(a)} y2={cy + maxR * Math.sin(a)} stroke="hsl(var(--border))" strokeWidth="0.5" opacity={0.4} />
      ))}
      {/* Data polygon */}
      <polygon points={polygon} fill="hsl(var(--accent) / 0.2)" stroke="hsl(var(--accent))" strokeWidth="2" />
      {/* Dots + labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="hsl(var(--accent))" />
          <text
            x={cx + (maxR + 16) * Math.cos(angles[i])}
            y={cy + (maxR + 16) * Math.sin(angles[i])}
            textAnchor="middle" dominantBaseline="middle"
            className="fill-muted-foreground text-[8px] font-medium uppercase"
          >
            {data[i].label}
          </text>
          <text
            x={cx + (maxR + 8) * Math.cos(angles[i])}
            y={cy + (maxR + 8) * Math.sin(angles[i]) + 9}
            textAnchor="middle" dominantBaseline="middle"
            className="fill-foreground text-[9px] font-bold"
          >
            {data[i].value}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function BeerAnalysisView(props: BeerAnalysisProps) {
  const {
    beerId, beerName, analysisJson, factcheckJson, qualityScore,
    summary, tasteNotes, radarBody, radarHops, radarMalt, radarFruit, radarSpice,
    primaryFlavors, secondaryFlavors, aromaProfile,
    pairingFood, pairingClassic, pairingCheese,
    serveStyle, productionMethod, isAdmin, onRefresh,
  } = props;

  const [analyzing, setAnalyzing] = useState(false);
  const [factchecking, setFactchecking] = useState(false);
  const [editingScore, setEditingScore] = useState(false);
  const [scoreInput, setScoreInput] = useState('');

  const handleScoreSave = async () => {
    const val = scoreInput.trim() === '' ? null : parseInt(scoreInput, 10);
    if (val !== null && (isNaN(val) || val < 0 || val > 100)) {
      toast.error('Score moet tussen 0 en 100 liggen');
      return;
    }
    const { error } = await supabase.from('beers').update({ quality_score: val }).eq('id', beerId);
    if (error) { toast.error('Fout bij opslaan'); return; }
    toast.success('Score bijgewerkt');
    setEditingScore(false);
    onRefresh?.();
  };

  const hasAnalysis = qualityScore != null;
  const hasFactcheck = factcheckJson != null;

  const radarData = useMemo(() => {
    if (!radarBody && !radarHops && !radarMalt && !radarFruit && !radarSpice) return null;
    return [
      { label: 'Body', value: radarBody ?? 0 },
      { label: 'Hop', value: radarHops ?? 0 },
      { label: 'Mout', value: radarMalt ?? 0 },
      { label: 'Fruit', value: radarFruit ?? 0 },
      { label: 'Specerij', value: radarSpice ?? 0 },
    ];
  }, [radarBody, radarHops, radarMalt, radarFruit, radarSpice]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-beer', { body: { beer_id: beerId, mode: 'analyze' } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Analyse voltooid!');
      onRefresh?.();
    } catch (e: any) {
      toast.error(e.message || 'Analyse mislukt');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFactcheck = async () => {
    setFactchecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-beer', { body: { beer_id: beerId, mode: 'factcheck' } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Factcheck voltooid!');
      onRefresh?.();
    } catch (e: any) {
      toast.error(e.message || 'Factcheck mislukt');
    } finally {
      setFactchecking(false);
    }
  };

  const handleDownloadPdf = () => {
    // Generate a simple text report for download
    const lines = [
      `BIERANALYSE RAPPORT: ${beerName}`,
      `${'═'.repeat(50)}`,
      '',
      `Quality Score: ${qualityScore ?? 'N/A'}/100`,
      '',
      `SAMENVATTING`,
      summary ?? 'Geen samenvatting beschikbaar.',
      '',
      `PROEFNOTITIES`,
      tasteNotes ?? 'Geen proefnotities.',
      '',
      `SMAAKPROFIEL`,
      `  Body: ${radarBody ?? '-'}/5  |  Hop: ${radarHops ?? '-'}/5  |  Mout: ${radarMalt ?? '-'}/5`,
      `  Fruit: ${radarFruit ?? '-'}/5  |  Specerij: ${radarSpice ?? '-'}/5`,
      '',
      `Primaire smaken: ${primaryFlavors?.join(', ') ?? '-'}`,
      `Secundaire smaken: ${secondaryFlavors?.join(', ') ?? '-'}`,
      `Aroma: ${aromaProfile?.join(', ') ?? '-'}`,
      '',
      `PAIRINGS`,
      `  Eten: ${pairingFood?.join(', ') ?? '-'}`,
      `  Klassiek: ${pairingClassic?.join(', ') ?? '-'}`,
      `  Kaas: ${pairingCheese?.join(', ') ?? '-'}`,
      '',
      `Serveerstijl: ${serveStyle ?? '-'}`,
      `Productiemethode: ${productionMethod ?? '-'}`,
    ];

    if (factcheckJson) {
      lines.push('', `FACTCHECK (confidence: ${factcheckJson.confidence_score ?? '?'}%)`, '');
      if (factcheckJson.awards?.length) {
        lines.push('Awards:');
        factcheckJson.awards.forEach((a: any) => lines.push(`  - ${a.name} (${a.year}) ${a.medal}`));
      }
      if (factcheckJson.issues?.length) {
        lines.push('Issues:');
        factcheckJson.issues.forEach((i: string) => lines.push(`  ⚠ ${i}`));
      }
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analyse-${beerName.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Admin buttons (no analysis yet) ──
  if (!hasAnalysis && !isAdmin) return null;

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-6">
      {/* Admin action buttons */}
      {isAdmin && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleAnalyze} disabled={analyzing} size="sm" variant="outline" className="gap-1.5">
            <FlaskConical size={14} />
            {analyzing ? 'Analyseren...' : hasAnalysis ? 'Heranalyseer' : 'AI Analyse'}
          </Button>
          <Button onClick={handleFactcheck} disabled={factchecking} size="sm" variant="outline" className="gap-1.5">
            <ShieldCheck size={14} />
            {factchecking ? 'Checken...' : hasFactcheck ? 'Hercheck' : 'Factcheck'}
          </Button>
          {hasAnalysis && (
            <Button onClick={handleDownloadPdf} size="sm" variant="ghost" className="gap-1.5">
              <Download size={14} /> Download rapport
            </Button>
          )}
        </div>
      )}

      {(analyzing || factchecking) && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {/* ── Analysis Report ── */}
      {hasAnalysis && !analyzing && (
        <div className="space-y-5">
          {/* Score + Radar row */}
          <div className="grid md:grid-cols-2 gap-5">
            {/* Score + Summary */}
            <div className="bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] p-5">
              <div className="flex items-start gap-4">
                <div className="relative flex items-center justify-center shrink-0" style={{ width: 80, height: 80 }}>
                  {isAdmin && editingScore ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleScoreSave(); }} className="flex flex-col items-center gap-1">
                      <input
                        type="number" min={0} max={100}
                        value={scoreInput}
                        onChange={e => setScoreInput(e.target.value)}
                        className="w-16 h-8 text-center text-sm font-bold bg-muted border border-border rounded"
                        autoFocus
                      />
                      <div className="flex gap-1">
                        <Button type="submit" size="sm" variant="ghost" className="h-5 px-1 text-[10px]">✓</Button>
                        <Button type="button" size="sm" variant="ghost" className="h-5 px-1 text-[10px]" onClick={() => setEditingScore(false)}>✗</Button>
                      </div>
                    </form>
                  ) : (
                    <div
                      className={isAdmin ? 'cursor-pointer' : ''}
                      onClick={() => { if (isAdmin) { setScoreInput(String(qualityScore ?? '')); setEditingScore(true); } }}
                      title={isAdmin ? 'Klik om score aan te passen' : undefined}
                    >
                      <ScoreRing score={qualityScore} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={14} className="text-accent" />
                    <h3 className="font-display text-base">Quality Score</h3>
                    {isAdmin && !editingScore && <span className="text-[9px] text-muted-foreground">(klik om te wijzigen)</span>}
                  </div>
                  {summary && <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>}
                </div>
              </div>
              {tasteNotes && (
                <div className="mt-4 pt-3 border-t border-dashed border-border/40">
                  <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Proefnotities</h4>
                  <p className="text-sm leading-relaxed">{tasteNotes}</p>
                </div>
              )}
            </div>

            {/* Radar */}
            {radarData && (
              <div className="bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] p-5">
                <h3 className="font-display text-base mb-2 text-center">Smaakradar</h3>
                <RadarChart data={radarData} />
              </div>
            )}
          </div>

          {/* Flavors + Aroma */}
          {(primaryFlavors?.length || secondaryFlavors?.length || aromaProfile?.length) && (
            <div className="bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] p-5">
              <h3 className="font-display text-base mb-3">Smaak & Aroma</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {primaryFlavors?.length ? (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Primair</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {primaryFlavors.map(f => (
                        <span key={f} className="px-2 py-0.5 bg-accent/10 text-accent border border-accent/20 text-[10px] font-bold uppercase tracking-wide">{f}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {secondaryFlavors?.length ? (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Secundair</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {secondaryFlavors.map(f => (
                        <span key={f} className="px-2 py-0.5 bg-secondary/80 border border-border/40 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{f}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {aromaProfile?.length ? (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Aroma</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {aromaProfile.map(a => (
                        <span key={a} className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 text-[10px] font-medium uppercase tracking-wide">{a}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Pairings accordion */}
          {(pairingFood?.length || pairingClassic?.length || pairingCheese?.length || serveStyle || productionMethod) && (
            <Accordion type="multiple" className="bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)]">
              {pairingFood?.length ? (
                <AccordionItem value="food" className="border-border/40 px-5">
                  <AccordionTrigger className="text-sm font-display py-3">
                    <span className="flex items-center gap-2">🍽 Food Pairings</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-2">
                      {pairingFood.map(p => <Badge key={p} variant="secondary">{p}</Badge>)}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ) : null}
              {pairingClassic?.length ? (
                <AccordionItem value="classic" className="border-border/40 px-5">
                  <AccordionTrigger className="text-sm font-display py-3">
                    <span className="flex items-center gap-2">🇧🇪 Klassieke Pairings</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-2">
                      {pairingClassic.map(p => <Badge key={p} variant="secondary">{p}</Badge>)}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ) : null}
              {pairingCheese?.length ? (
                <AccordionItem value="cheese" className="border-border/40 px-5">
                  <AccordionTrigger className="text-sm font-display py-3">
                    <span className="flex items-center gap-2">🧀 Kaaspairings</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-2">
                      {pairingCheese.map(p => <Badge key={p} variant="secondary">{p}</Badge>)}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ) : null}
              {serveStyle && (
                <AccordionItem value="serve" className="border-border/40 px-5">
                  <AccordionTrigger className="text-sm font-display py-3">
                    <span className="flex items-center gap-2"><Wine size={14} /> Serveerstijl</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">{serveStyle}</p>
                  </AccordionContent>
                </AccordionItem>
              )}
              {productionMethod && (
                <AccordionItem value="production" className="border-border/40 px-5">
                  <AccordionTrigger className="text-sm font-display py-3">
                    <span className="flex items-center gap-2"><FlaskConical size={14} /> Productiemethode</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">{productionMethod}</p>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          )}

          {/* ── Factcheck Report ── */}
          {hasFactcheck && !factchecking && (
            <div className="bg-card border border-border/60 [box-shadow:var(--shadow-scrapbook)] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-accent" />
                  <h3 className="font-display text-base">Factcheck Rapport</h3>
                </div>
                {factcheckJson.confidence_score != null && (
                  <Badge className={`${factcheckJson.confidence_score >= 70 ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
                    {factcheckJson.confidence_score}% betrouwbaar
                  </Badge>
                )}
              </div>

              {/* Verification badges */}
              <div className="flex flex-wrap gap-2">
                {factcheckJson.abv_verified != null && (
                  <Badge variant="outline" className="gap-1">
                    {factcheckJson.abv_verified ? <CheckCircle2 size={10} className="text-success" /> : <AlertTriangle size={10} className="text-warning" />}
                    ABV {factcheckJson.abv_verified ? 'geverifieerd' : 'onbevestigd'}
                  </Badge>
                )}
                {factcheckJson.style_verified != null && (
                  <Badge variant="outline" className="gap-1">
                    {factcheckJson.style_verified ? <CheckCircle2 size={10} className="text-success" /> : <AlertTriangle size={10} className="text-warning" />}
                    Stijl {factcheckJson.style_verified ? 'geverifieerd' : 'onbevestigd'}
                  </Badge>
                )}
              </div>

              {/* Awards */}
              {factcheckJson.awards?.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Awards</h4>
                  <div className="space-y-1">
                    {factcheckJson.awards.map((a: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Star size={12} className="text-accent shrink-0" />
                        <span>{a.name}</span>
                        {a.year && <span className="text-muted-foreground text-xs">({a.year})</span>}
                        {a.medal && <Badge variant="secondary" className="text-[9px]">{a.medal}</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Price range */}
              {factcheckJson.price_range?.min != null && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Prijsrange</h4>
                  <p className="text-sm font-medium">€{factcheckJson.price_range.min} – €{factcheckJson.price_range.max}</p>
                </div>
              )}

              {/* External ratings */}
              {factcheckJson.external_ratings && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Externe Ratings</h4>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(factcheckJson.external_ratings).map(([key, val]: [string, any]) => {
                      if (!val?.score) return null;
                      return (
                        <div key={key} className="flex items-center gap-1.5">
                          <span className="text-xs font-medium capitalize">{key}</span>
                          <span className="text-xs font-bold tabular-nums text-accent">{val.score}</span>
                          {val.url && (
                            <a href={val.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-accent">
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* External links */}
              {factcheckJson.external_links?.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Externe Links</h4>
                  <div className="flex flex-wrap gap-2">
                    {factcheckJson.external_links.map((l: any, i: number) => (
                      <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                        <ExternalLink size={10} /> {l.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Issues */}
              {factcheckJson.issues?.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-destructive font-medium mb-2">Issues</h4>
                  <ul className="space-y-1">
                    {factcheckJson.issues.map((issue: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <AlertTriangle size={12} className="text-destructive shrink-0 mt-0.5" />
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {factcheckJson.suggestions?.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Suggesties</h4>
                  <ul className="space-y-1">
                    {factcheckJson.suggestions.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 size={12} className="text-success shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </motion.section>
  );
}
