import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type { Coordinates, MarkerData, MarkerImage } from '@/types';

interface MarkersContextValue {
  markers: MarkerData[];
  addMarker: (coordinate: Coordinates) => MarkerData;
  removeMarker: (markerId: string) => void;
  getMarker: (markerId: string) => MarkerData | undefined;
  addImages: (markerId: string, images: MarkerImage[]) => void;
  removeImage: (markerId: string, imageId: string) => void;
}

const MarkersContext = createContext<MarkersContextValue | null>(null);

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function MarkersProvider({ children }: { children: ReactNode }) {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const counter = useRef(0);

  const addMarker = useCallback((coordinate: Coordinates) => {
    counter.current += 1;
    const marker: MarkerData = {
      id: createId(),
      title: `Маркер ${counter.current}`,
      coordinate,
      createdAt: Date.now(),
      images: [],
    };
    setMarkers((prev) => [...prev, marker]);
    return marker;
  }, []);

  const removeMarker = useCallback((markerId: string) => {
    setMarkers((prev) => prev.filter((m) => m.id !== markerId));
  }, []);

  const getMarker = useCallback(
    (markerId: string) => markers.find((m) => m.id === markerId),
    [markers],
  );

  const addImages = useCallback((markerId: string, images: MarkerImage[]) => {
    setMarkers((prev) =>
      prev.map((m) => (m.id === markerId ? { ...m, images: [...m.images, ...images] } : m)),
    );
  }, []);

  const removeImage = useCallback((markerId: string, imageId: string) => {
    setMarkers((prev) =>
      prev.map((m) =>
        m.id === markerId ? { ...m, images: m.images.filter((img) => img.id !== imageId) } : m,
      ),
    );
  }, []);

  const value = useMemo(
    () => ({ markers, addMarker, removeMarker, getMarker, addImages, removeImage }),
    [markers, addMarker, removeMarker, getMarker, addImages, removeImage],
  );

  return <MarkersContext.Provider value={value}>{children}</MarkersContext.Provider>;
}

export function useMarkers(): MarkersContextValue {
  const ctx = useContext(MarkersContext);
  if (!ctx) {
    throw new Error('useMarkers нужно вызывать внутри <MarkersProvider>');
  }
  return ctx;
}
