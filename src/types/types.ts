
export interface Component {
  name: string;
  file: string;
  isUsed: boolean;
  usageCount: number; // New field for usage count
  usedIn?: string[]; // Optional: tracks where component is used
}

export interface TrackerMaps {
  componentUsages: Map<string, Set<string>>; // Tracks usage locations
  importedComponents: Map<string, Set<string>>; // Tracks import locations
}

//Creates and initializes the tracker maps for component usage and imports
export function createTrackerMaps(): TrackerMaps {
  return {
    componentUsages: new Map<string, Set<string>>(),
    importedComponents: new Map<string, Set<string>>()
  };
}