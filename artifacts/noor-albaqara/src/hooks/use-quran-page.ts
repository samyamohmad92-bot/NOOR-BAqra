import { useState, useEffect } from "react";

interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
}

interface UseQuranPageResult {
  ayahs: Ayah[];
  loading: boolean;
  error: boolean;
}

const cache: Record<number, Ayah[]> = {};

export function useQuranPage(pageNum: number): UseQuranPageResult {
  const [ayahs, setAyahs] = useState<Ayah[]>(cache[pageNum] || []);
  const [loading, setLoading] = useState(!cache[pageNum]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (cache[pageNum]) {
      setAyahs(cache[pageNum]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    fetch(`https://api.alquran.cloud/v1/page/${pageNum}/quran-uthmani`)
      .then(r => r.json())
      .then(data => {
        if (data.code === 200) {
          const result: Ayah[] = data.data.ayahs;
          cache[pageNum] = result;
          setAyahs(result);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [pageNum]);

  return { ayahs, loading, error };
}
