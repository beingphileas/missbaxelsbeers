import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface BreweryLink {
  id: string;
  brewery_id: string;
  brewery_name: string;
}

export function useBreweryUser() {
  const { user, loading: authLoading } = useAuth();
  const [breweryLink, setBreweryLink] = useState<BreweryLink | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setBreweryLink(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const check = async () => {
      // Check admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      setIsAdmin(!!roleData);

      // Check brewery link
      const { data: linkData } = await supabase
        .from('brewery_users')
        .select('id, brewery_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (linkData) {
        const { data: brewery } = await supabase
          .from('breweries')
          .select('name')
          .eq('id', linkData.brewery_id)
          .single();

        setBreweryLink({
          id: linkData.id,
          brewery_id: linkData.brewery_id,
          brewery_name: brewery?.name || 'Onbekend',
        });
      } else {
        setBreweryLink(null);
      }

      setLoading(false);
    };

    check();
  }, [user, authLoading]);

  return { user, breweryLink, isAdmin, loading };
}
