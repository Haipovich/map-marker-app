export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface MarkerImage {
  id: string;
  uri: string;
  width?: number;
  height?: number;
  addedAt: number;
}

export interface MarkerData {
  id: string;
  title: string;
  coordinate: Coordinates;
  createdAt: number;
  images: MarkerImage[];
}

export type MarkerRouteParams = {
  id: string;
};

export interface MarkersMapProps {
  markers: MarkerData[];
  onAddMarker: (coordinate: Coordinates) => void;
  onMarkerPress: (markerId: string) => void;
}
