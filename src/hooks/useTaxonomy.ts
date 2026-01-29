import { useState, useEffect } from 'react';
import { fetchSwingTaxonomy, type SwingTaxonomy } from '../api/taxonomy';

interface UseTaxonomyReturn {
  data: SwingTaxonomy | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * React hook to fetch and manage the swing taxonomy data.
 * Automatically loads data on mount and provides loading/error states.
 * 
 * @returns {UseTaxonomyReturn} Taxonomy data, loading state, error, and refetch function
 */
export function useSwingTaxonomy(): UseTaxonomyReturn {
  const [data, setData] = useState<SwingTaxonomy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadTaxonomy = async () => {
      try {
        setLoading(true);
        setError(null);
        const taxonomy = await fetchSwingTaxonomy();
        
        if (isMounted) {
          setData(taxonomy);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load taxonomy'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTaxonomy();

    return () => {
      isMounted = false;
    };
  }, [refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return { data, loading, error, refetch };
}

