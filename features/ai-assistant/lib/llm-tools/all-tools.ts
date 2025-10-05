// features/ai-assistant/lib/llm-tools/all-tools.ts

import { predictFireRiskTool, getHighRiskZonesTool } from "./modelo-tools";

// Importa otras herramientas existentes
// Por ejemplo:
import { geospatialTools } from "./basic-geospatial-tools"; // Ajusta según tus archivos reales
import { geocodingTools } from "./geocoding-tools"; // Ajusta según tus archivos reales

// Combina todas las herramientas
export const allTools = {
  ...geospatialTools,
  ...geocodingTools,
  // Añade las nuevas herramientas
  predictFireRisk: predictFireRiskTool,
  getHighRiskZones: getHighRiskZonesTool,
};

// También puedes exportarlas por categorías
