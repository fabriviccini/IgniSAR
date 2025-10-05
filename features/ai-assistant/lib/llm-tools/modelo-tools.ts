import { tool } from 'ai'
import { z } from 'zod'

// Esquema para la herramienta de predicción
const PredictFireRiskSchema = z.object({
  polygon: z
    .object({
      type: z.literal('Feature'),
      geometry: z.object({
        type: z.literal('Polygon'),
        coordinates: z.array(z.array(z.array(z.number())))
      }),
      properties: z.record(z.any()).optional(),
      id: z.string().optional()
    })
    .optional()
    .describe(
      "Polígono GeoJSON para el análisis. Si es 'unknown', se usará el polígono dibujado en el mapa."
    )
})

// Herramienta para predecir riesgo de incendios
export const predictFireRiskTool = tool({
  description:
    'Predice el riesgo de incendio en un área específica basado en datos históricos y características geoespaciales.',
  parameters: PredictFireRiskSchema,
  execute: async ({ polygon }: z.infer<typeof PredictFireRiskSchema>) => {
    try {
      console.log('hola')
      console.log('[predictFireRisk] Llamando a la API con polígono:', polygon)

      const response = await fetch('http://localhost:8000/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ polygon })
      })

      if (!response.ok) {
        throw new Error(`Error en la API: ${response.status}`)
      }

      const result = await response.json()

      // Formatear el resultado para que sea más amigable para el usuario
      const probabilidadPorcentaje = (
        result.probabilidad_incendio * 100
      ).toFixed(2)
      const nivelRiesgo = result.prediccion
        ? 'ALTO'
        : result.probabilidad_incendio > 0.3
        ? 'MEDIO'
        : 'BAJO'

      return {
        success: true,
        result: {
          probabilidad: result.probabilidad_incendio,
          probabilidadPorcentaje: `${probabilidadPorcentaje}%`,
          prediccion: result.prediccion,
          nivelRiesgo,
          mensaje: `El área analizada tiene un riesgo de incendio ${nivelRiesgo} (${probabilidadPorcentaje}%).`
        }
      }
    } catch (error: unknown) {
      console.error('[predictFireRisk] Error:', error)
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al predecir riesgo de incendio'
      }
    }
  }
})

// Herramienta para obtener zonas con mayor riesgo
export const getHighRiskZonesTool = tool({
  description:
    'Obtiene las zonas con mayor riesgo de incendio basado en predicciones precalculadas.',
  parameters: z.object({}),
  execute: async () => {
    try {
      const response = await fetch('http://localhost:8000/api/predictions')

      if (!response.ok) {
        throw new Error(`Error en la API: ${response.status}`)
      }

      const predictions = await response.json()

      // Ordenar por probabilidad de incendio (descendente)
      const sortedPredictions = [...predictions].sort(
        (a, b) => b.probabilidad_incendio - a.probabilidad_incendio
      )

      // Tomar las 5 zonas de mayor riesgo
      const highRiskZones = sortedPredictions.slice(0, 5).map((p) => ({
        zona: p.zona,
        probabilidad: p.probabilidad_incendio,
        probabilidadPorcentaje: `${(p.probabilidad_incendio * 100).toFixed(
          2
        )}%`,
        prediccion: p.prediccion
      }))

      return {
        success: true,
        result: {
          highRiskZones,
          mensaje: `Las zonas con mayor riesgo de incendio son: ${highRiskZones
            .map((z) => `Zona ${z.zona} (${z.probabilidadPorcentaje})`)
            .join(', ')}.`
        }
      }
    } catch (error: unknown) {
      console.error('[getHighRiskZones] Error:', error)
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al obtener zonas de alto riesgo'
      }
    }
  }
})
