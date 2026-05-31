// Servicio de OpenAI con retry automático, timeout y fallback mock
// Encapsula toda la lógica de comunicación con la API de OpenAI

import OpenAI from 'openai'
import {
  SYSTEM_PROMPT,
  buildDecompositionPrompt,
  BLOCK_PROMPTS,
} from '../prompts/decomposition'
import type { BlockReason } from '@prisma/client'

// Detectar si la clave de API corresponde a Google Gemini (las claves de Gemini comienzan con 'AIzaSy')
// Esto permite soportar claves de Gemini directamente usando la capa de compatibilidad oficial
const isGeminiKey = process.env.OPENAI_API_KEY?.startsWith('AIzaSy')

// Inicializar el cliente de OpenAI
// Si se detecta una clave de Gemini, se redirige el baseURL al endpoint compatible de Google
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key', // Clave provista o valor genérico para que no falle la inicialización
  baseURL: isGeminiKey
    ? 'https://generativelanguage.googleapis.com/v1beta/openai/' // Servidor de compatibilidad oficial de Google Gemini
    : undefined, // URL estándar de OpenAI
})

// -------------------------------------------------------
// Tipos de respuesta del motor de descomposición
// -------------------------------------------------------
export interface DecomposedGoal {
  summary: string
  nextAction: string
  estimatedMinutes: number
  complexity: 1 | 2 | 3 | 4 | 5
  phases: {
    title: string
    tasks: {
      title: string
      subtasks: string[]
    }[]
  }[]
}

// -------------------------------------------------------
// -------------------------------------------------------
// Respuesta mock para desarrollo sin API key
// Genera una descomposición de tareas realista basada en el análisis del objetivo del usuario
// -------------------------------------------------------
function getMockDecomposition(input: string): DecomposedGoal {
  // Convertimos la entrada a minúsculas para realizar comprobaciones insensibles a mayúsculas
  const text = input.toLowerCase();

  // CATEGORÍA 1: Cocina, alimentación, preparación de comida
  if (
    text.includes('cocinar') ||
    text.includes('pizza') ||
    text.includes('preparar') ||
    text.includes('comida') ||
    text.includes('cena') ||
    text.includes('almuerzo') ||
    text.includes('ingredientes') ||
    text.includes('receta')
  ) {
    return {
      summary: `Preparar y cocinar: ${input}`, // Resumen conciso adaptado a la actividad culinaria
      nextAction: 'Revisá la heladera y la alacena para ver qué ingredientes ya tenés.', // La primera micro-acción específica
      estimatedMinutes: 60, // Estimación de tiempo realista para una sesión de cocina
      complexity: 3, // Nivel de complejidad intermedio (Manejable)
      phases: [
        {
          title: 'Planificación y compras', // Primera fase orientada a la logística de los ingredientes
          tasks: [
            {
              title: 'Hacer inventario y lista',
              subtasks: [
                'Revisá la heladera y la alacena para ver qué ingredientes ya tenés.',
                'Anotá los ingredientes faltantes en un papel o en el celular.',
                'Dirigite al supermercado o almacén más cercano a comprar lo que falta.',
              ],
            },
          ],
        },
        {
          title: 'Preparación de la cocina', // Segunda fase orientada a la ergonomía física y el espacio de trabajo
          tasks: [
            {
              title: 'Despejar y organizar el espacio',
              subtasks: [
                'Limpiá la mesada donde vas a estirar la masa o cortar ingredientes.',
                'Prepará las fuentes, moldes y utensilios de cocina necesarios.',
                'Precalentá el horno a la temperatura recomendada para tu plato.',
              ],
            },
          ],
        },
        {
          title: 'Cocción y disfrute', // Tercera fase donde se ejecuta la tarea final
          tasks: [
            {
              title: 'Elaborar el plato',
              subtasks: [
                'Armá la base o mezcla de tus ingredientes en la fuente.',
                'Meté la preparación al horno y controlá el tiempo de cocción.',
                'Retirá con cuidado, dejá enfriar dos minutos y disfrutá de tu comida.',
              ],
            },
          ],
        },
      ],
    };
  }

  // CATEGORÍA 2: Limpieza, orden y organización del hogar
  if (
    text.includes('limpiar') ||
    text.includes('ordenar') ||
    text.includes('organizar') ||
    text.includes('lavar') ||
    text.includes('habitación') ||
    text.includes('pieza') ||
    text.includes('casa') ||
    text.includes('ropa') ||
    text.includes('platos')
  ) {
    return {
      summary: `Organizar y limpiar: ${input}`, // Título descriptivo para tareas del hogar
      nextAction: 'Delimitá un área muy pequeña de 1 metro cuadrado para empezar.', // Acción sumamente pequeña para reducir la ansiedad
      estimatedMinutes: 30, // Corta duración para evitar el aburrimiento o la fatiga ejecutiva
      complexity: 2, // Nivel de complejidad bajo (Tranquilo)
      phases: [
        {
          title: 'Preparación del entorno', // Fase inicial para preparar las herramientas y definir el foco
          tasks: [
            {
              title: 'Definir el punto de inicio',
              subtasks: [
                'Delimitá un área muy pequeña de 1 metro cuadrado para empezar (ej. solo la mesa o la cama).',
                'Buscá una bolsa para la basura y una caja para las cosas que van en otro lado.',
                'Poné música alegre de fondo para mejorar tu nivel de energía.',
              ],
            },
          ],
        },
        {
          title: 'Acción enfocada y rápida', // Fase activa con pasos secuenciales
          tasks: [
            {
              title: 'Clasificar y limpiar',
              subtasks: [
                'Juntá todos los papeles o envoltorios vacíos y tiralos a la basura.',
                'Colocá los objetos fuera de lugar en la caja de traslados.',
                'Pasá un trapo húmedo rápido sobre la superficie que acabás de despejar.',
              ],
            },
          ],
        },
      ],
    };
  }

  // CATEGORÍA 3: Estudio, redacción, informática, trabajo intelectual o digital
  if (
    text.includes('estudiar') ||
    text.includes('tesis') ||
    text.includes('examen') ||
    text.includes('leer') ||
    text.includes('escribir') ||
    text.includes('tarea') ||
    text.includes('informe') ||
    text.includes('proyecto') ||
    text.includes('presentación') ||
    text.includes('curso')
  ) {
    return {
      summary: `Avanzar en el trabajo intelectual: ${input}`, // Resumen centrado en tareas cognitivas
      nextAction: 'Buscá los apuntes, el libro o el archivo digital que necesitás abrir.', // Acción física inicial y sin fricción
      estimatedMinutes: 45, // Bloque pomodoro estándar recomendado para TDAH
      complexity: 3, // Nivel intermedio (Manejable)
      phases: [
        {
          title: 'Configuración mental y física', // Fase para mitigar la distracción y organizar materiales
          tasks: [
            {
              title: 'Eliminar fricción digital',
              subtasks: [
                'Buscá los apuntes, el libro o el archivo digital que necesitás abrir.',
                'Silenciá el celular y dejalo fuera de tu alcance visual.',
                'Cerrá todas las pestañas del navegador que no tengan relación con el tema.',
              ],
            },
          ],
        },
        {
          title: 'Avance sin juzgarse', // Fase de enfoque inicial
          tasks: [
            {
              title: 'Primeros 15 minutos de enfoque',
              subtasks: [
                'Escribí o leé una sola página sin detenerte a corregir la redacción.',
                'Anotá los 3 conceptos clave o ideas principales que lograste identificar.',
                'Hacé una pausa activa de 5 minutos para estirarte y tomar agua.',
              ],
            },
          ],
        },
      ],
    };
  }

  // CATEGORÍA 4: Caso por defecto para cualquier otro tipo de objetivo o tarea genérica
  return {
    summary: `Comenzar con: ${input}`, // Título genérico y flexible
    nextAction: 'Identificá el primer paso físico e inmediato que requiere esta tarea.', // Acción universal enfocada en dar inicio
    estimatedMinutes: 45, // Duración promedio
    complexity: 3, // Complejidad por defecto
    phases: [
      {
        title: 'Preparación y enfoque', // Fase para iniciar el impulso inicial
        tasks: [
          {
            title: 'Preparar las herramientas',
            subtasks: [
              'Identificá el primer paso físico e inmediato que requiere esta tarea.',
              'Alistá los elementos físicos o digitales necesarios en tu espacio de trabajo.',
              'Establecé un temporizador de 10 minutos para darte permiso de empezar.',
            ],
          },
        ],
      },
      {
        title: 'Acción progresiva', // Fase para mantener el enfoque de forma amigable
        tasks: [
          {
            title: 'Ejecutar micro-acciones',
            subtasks: [
              'Dedicá 5 minutos completos a avanzar de forma continua sin buscar la perfección.',
              'Revisá tu nivel de energía y decidí si estás listo para continuar con el siguiente paso.',
              'Celebrá el haber dado el primer paso, que es la parte más difícil del proceso.',
            ],
          },
        ],
      },
    ],
  };
}

// -------------------------------------------------------
// Función principal: descomponer un objetivo con la IA
// Incluye retry automático y fallback al mock
// -------------------------------------------------------
export async function decomposeGoal(
  input: string,
  energyLevel?: number,
  retries = 3
): Promise<DecomposedGoal> {
  // Si no hay API key, usar el mock (útil para desarrollo)
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[OpenAI] Sin API key — usando respuesta mock')
    return getMockDecomposition(input)
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const userPrompt = buildDecompositionPrompt({ input, energyLevel })

      // Determinar el modelo dinámicamente: gemini-3.5-flash si es clave de Google, gpt-4o en caso de OpenAI
      const modelName = isGeminiKey ? 'gemini-3.5-flash' : 'gpt-4o'

      const response = await openai.chat.completions.create({
        model: modelName, // Selección del modelo adecuado según el proveedor detectado
        messages: [
          { role: 'system', content: SYSTEM_PROMPT }, // Instrucciones del GPS cognitivo
          { role: 'user', content: userPrompt }, // Datos de entrada del objetivo del usuario
        ],
        // Forzar salida JSON para parsing confiable
        response_format: { type: 'json_object' },
        // Temperatura baja para respuestas consistentes y estructuradas
        temperature: 0.4,
        // Límite de tokens para evitar respuestas interminables
        max_tokens: 1500,
      })

      const content = response.choices[0]?.message?.content
      if (!content) throw new Error('Respuesta vacía de OpenAI')

      // Parsear y validar la respuesta JSON
      const parsed = JSON.parse(content) as DecomposedGoal
      validateDecomposition(parsed)

      // Loggear uso de tokens para monitoreo de costos
      if (response.usage) {
        console.info(
          `[OpenAI] Tokens usados — prompt: ${response.usage.prompt_tokens}, ` +
          `completion: ${response.usage.completion_tokens}`
        )
      }

      return parsed
    } catch (error) {
      const isLastAttempt = attempt === retries
      console.error(`[OpenAI] Error en intento ${attempt}/${retries}:`, error)

      if (isLastAttempt) {
        // En el último intento fallido, usar el mock como fallback
        console.warn('[OpenAI] Usando respuesta mock como fallback')
        return getMockDecomposition(input)
      }

      // Esperar antes de reintentar (backoff exponencial)
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }

  return getMockDecomposition(input)
}

// -------------------------------------------------------
// Validación básica de la respuesta de la IA
// Asegura que el JSON tiene la estructura esperada
// -------------------------------------------------------
function validateDecomposition(data: unknown): asserts data is DecomposedGoal {
  const d = data as DecomposedGoal
  if (!d.summary || !d.nextAction || !Array.isArray(d.phases)) {
    throw new Error('Respuesta de IA con estructura inválida')
  }
}

// -------------------------------------------------------
// Obtener ayuda de la IA para un tipo de bloqueo específico
// -------------------------------------------------------
export async function getBlockHelp(
  reason: BlockReason,
  taskTitle: string
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    // Mock de respuesta de bloqueo
    return 'Tranquilo, podés empezar por la parte más pequeña que se te ocurra.'
  }

  try {
    const blockPrompt = BLOCK_PROMPTS[reason]
    // Seleccionar dinámicamente gemini-3.5-flash si se detecta clave de Google, o gpt-4o para OpenAI
    const modelName = isGeminiKey ? 'gemini-3.5-flash' : 'gpt-4o'
    const response = await openai.chat.completions.create({
      model: modelName, // Selección automática del modelo según la clave provista
      messages: [
        {
          role: 'system',
          content: 'Sos un coach cognitivo empático que ayuda con bloqueos. Respondés en 2-3 oraciones máximo. Sin listas. Sin juicio.',
        },
        {
          role: 'user',
          content: `Tarea actual: "${taskTitle}"\n\n${blockPrompt}`,
        },
      ],
      temperature: 0.6,
      max_tokens: 200,
    })

    return response.choices[0]?.message?.content ?? 'Tomáte un momento y volvé cuando estés listo.'
  } catch (error) {
    console.error('[OpenAI] Error al obtener ayuda de bloqueo:', error)
    return 'Tomáte un momento. Estamos acá cuando quieras volver.'
  }
}

// -------------------------------------------------------
// COACH COGNITIVO (Fase 2)
// -------------------------------------------------------
const COACH_SYSTEM_PROMPT = `
Eres FocusFlow, un coach cognitivo especializado en TDAH, ansiedad y disfunción ejecutiva.
Tus reglas estrictas:
1. NUNCA juzgues. Valida las emociones del usuario.
2. Reduce la culpa ("Es normal sentirse abrumado, tu cerebro funciona así y está bien").
3. Sugiere SOLO UN pequeño y ridículo paso siguiente.
4. Mantén tus respuestas extremadamente cortas (1 o 2 párrafos máximo).
5. Usa tono Rioplatense (vos, tenés, hacés, podés).
`

export async function generateCoachResponse(message: string, context?: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return "Ey, entiendo que es difícil. ¿Qué te parece si empezamos solo por abrir el archivo? Sin presiones."
  }

  try {
    const modelName = isGeminiKey ? 'gemini-3.5-flash' : 'gpt-4o-mini'
    const systemContent = COACH_SYSTEM_PROMPT + (context ? `\nContexto del usuario: ${context}` : '')
    
    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 300
    })

    return response.choices[0]?.message?.content ?? 'Tranquilo, podemos intentarlo de nuevo en un rato.'
  } catch (err) {
    console.error('[OpenAI] Error en Coach Cognitivo:', err)
    return "Tuve un problema para procesar eso, pero recordá que dar un paso pequeñísimo ya es avanzar."
  }
}

