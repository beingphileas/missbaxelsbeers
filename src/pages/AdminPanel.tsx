import { useEffect, useState } from 'react';
import { Beer, Building2, Newspaper, FlaskConical, UtensilsCrossed, ShieldAlert, Download, Wine, ShieldCheck, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import BeersSection from '@/components/admin-mb/BeersSection';
import BreweriesSection from '@/components/admin-mb/BreweriesSection';
import BlogPostsSection from '@/components/admin-mb/BlogPostsSection';
import BierstekersSection from '@/components/admin-mb/BierstekersSection';
import RestaurantSection from '@/components/admin-mb/RestaurantSection';
import FirecrawlImport from '@/components/admin/FirecrawlImport';
import QuickTasting from '@/components/admin/QuickTasting';
import BulkFactCheck from '@/components/admin/BulkFactCheck';
import QuickStorySheet from '@/components/QuickStorySheet';

type SectionKey = 'bieren' | 'brouwerijen' | 'blogposts' | 'bierstekers' | 'restaurant' | 'import' | 'tasting' | 'factcheck';

const SECTIONS: { key: SectionKey; label: string; icon: React.ComponentType<any> }[] = [
  { key: 'bieren', label: 'Bieren', icon: Beer },
  { key: 'brouwerijen', label: 'Brouwerijen', icon: Building2 },
  { key: 'blogposts', label: 'Blogposts', icon: Newspaper },
  { key: 'bierstekers', label: 'Bierstekers', icon: FlaskConical },
  { key: 'restaurant', label: 'Restaurant', icon: UtensilsCrossed },
  { key: 'import', label: 'Importeren', icon: Download },
  { key: 'tasting', label: 'Quick Tasting', icon: Wine },
  { key: 'factcheck', label: 'Factcheck', icon: ShieldCheck },
];

export default function AdminPanel() {
  const { user } = useAuth();
  const [section, setSection] = useState<SectionKey>('bieren');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }).then(({ data }) => {
      setIsAdmin(Boolean(data));
    });
  }, [user?.id]);

  if (isMobile) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-8">
        <div className="max-w-sm text-center bg-card border border-border rounded-[12px] p-8">
          <ShieldAlert size={28} className="mx-auto text-muted-foreground mb-3" />
          <h1 className="font-display text-lg mb-2" style={{ fontWeight: 900 }}>Desktop vereist</h1>
          <p className="text-[13px] text-muted-foreground">Gebruik desktop voor het beheerpaneel.</p>
        </div>
      </div>
    );
  }

  if (isAdmin === null) {
    return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center text-muted-foreground text-sm">Toegang verifiëren…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-8">
        <div className="max-w-md text-center bg-card border border-border rounded-[12px] p-8">
          <ShieldAlert size={32} className="mx-auto text-[hsl(var(--tertiary))] mb-3" />
          <h1 className="font-display text-xl mb-2" style={{ fontWeight: 900 }}>Geen toegang</h1>
          <p className="text-[13px] text-muted-foreground">Je account is wel ingelogd, maar heeft geen admin-rechten op deze database.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-5 py-6">
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
        <aside>
          <h2 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3 px-2">Beheer</h2>
          <nav className="space-y-1">
            {SECTIONS.map(s => {
              const Icon = s.icon;
              const active = section === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setSection(s.key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] rounded-[8px] transition-colors text-left ${
                    active
                      ? 'bg-[hsl(var(--primary-light))] text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  <Icon size={14} /> {s.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main>
          {section === 'bieren' && <BeersSection />}
          {section === 'brouwerijen' && <BreweriesSection />}
          {section === 'blogposts' && <BlogPostsSection />}
          {section === 'bierstekers' && <BierstekersSection />}
          {section === 'restaurant' && <RestaurantSection />}
          {section === 'import' && <FirecrawlImport />}
          {section === 'tasting' && <QuickTasting onPublished={() => {}} />}
          {section === 'factcheck' && <BulkFactCheck />}
        </main>
      </div>
    </div>
  );
}
