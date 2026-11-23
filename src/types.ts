export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Marker {
  id: number;
  latitude: number;
  longitude: number;
  createdAt: string;
  imageCount: number;
}

export interface MarkerImage {
  id: number;
  markerId: number;
  uri: string;
  createdAt: string;
}

export interface MarkerRow {
  id: number;
  latitude: number;
  longitude: number;
  created_at: string;
  image_count: number;
}

export interface MarkerImageRow {
  id: number;
  marker_id: number;
  uri: string;
  created_at: string;
}

export type MarkerRouteParams = {
  id: string;
};

export interface MarkersMapProps {
  markers: Marker[];
  onAddMarker: (coordinate: Coordinates) => void;
  onMarkerPress: (markerId: number) => void;
}