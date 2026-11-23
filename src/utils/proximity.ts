import type { Coordinates, Marker } from '@/types';

import { distanceMeters } from './geo';

const EXIT_FACTOR = 1.5;

export interface ProximityTracker {
  known: Set<number> | null;
  inside: Set<number>;
}

export interface ProximityHit {
  marker: Marker;
  distance: number;
}

export function createTracker(): ProximityTracker {
  return { known: null, inside: new Set() };
}

export function evaluateProximity(
  tracker: ProximityTracker,
  markers: Marker[],
  position: Coordinates,
  radius: number,
): ProximityHit[] {
  const hits: ProximityHit[] = [];
  const firstRun = tracker.known === null;
  const known = tracker.known ?? new Set<number>();
  const currentIds = new Set(markers.map((m) => m.id));

  for (const id of [...tracker.inside]) {
    if (!currentIds.has(id)) tracker.inside.delete(id);
  }

  for (const marker of markers) {
    const distance = distanceMeters(position, marker);
    const isNew = !known.has(marker.id);

    if (distance <= radius) {
      if (!tracker.inside.has(marker.id)) {
        tracker.inside.add(marker.id);
        if (firstRun || !isNew) hits.push({ marker, distance });
      }
    } else if (distance > radius * EXIT_FACTOR) {
      tracker.inside.delete(marker.id);
    }

    known.add(marker.id);
  }

  tracker.known = known;
  return hits;
}