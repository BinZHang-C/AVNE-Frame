
import { SpatialDNA } from './types';

export const DEFAULT_SPATIAL_DNA: SpatialDNA = {
  material_dna: {
    texture_reference: "Polished Venetian plaster and cold-rolled steel details",
    reflection_level: 0.15,
    roughness_level: 0.6
  },
  lighting_dna: {
    time_of_day: "Blue Hour",
    color_temperature: 4200,
    intensity: 0.85
  },
  floor_height: 4.2,
  column_grid: "9m x 9m"
};
