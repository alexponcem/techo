export type GuideItem = { k: string; v: string }

export type GuidePage = {
  screen: string
  title: string
  lead: string
  items?: GuideItem[]
  tip?: string
}

export const TUTORIAL: GuidePage[] = [
  {
    screen: '¿Qué es Techo?',
    title: 'Tu dinero bajo control, centavo a centavo.',
    lead: 'Techo divide tus ingresos en Sobres para que nunca te preguntes a dónde se fue tu dinero.',
    items: [
      {
        k: 'Tus Sobres ilimitados',
        v: 'Crea todas las cajitas que necesites (alquiler, comida, ahorro, viajes, etc.). Cada dólar que entra a tu cuenta va a un sobre.',
      },
      {
        k: 'Control en tiempo real',
        v: 'Antes de pagar algo, miras tu sobre. Techo te dice si el gasto cabe o si te va a poner en aprietos.',
      },
    ],
  },
  {
    screen: 'Los 3 tipos de Sobres que usarás',
    title: 'Todo tu dinero vive en alguno de estos 3 sobres:',
    lead: '',
    items: [
      {
        k: 'Sobres de Cuota (fijos)',
        v: 'Pagos obligatorios que ocurren en el mes. Incluye tus gastos fijos (alquiler, gym) y tu sobre de Ahorro. Se reservan al cobrar, al igual que el ahorro ya que este no es “lo que sobre a fin de mes”, porque si esperas a que sobre, nunca lo hará jaja.',
      },
      {
        k: 'Sobres de Techo (límites)',
        v: 'Tus gastos variables (comida, ocio, café). Tienen un límite que se va consumiendo a medida que gastas.',
      },
      {
        k: 'Sobres de Fondo (metas)',
        v: 'No tienen un límite, pero salen exclusivamente de tu sobre de Ahorro para compras o planes específicos (un viaje, ropa, emergencias).',
      },
    ],
  },
  {
    screen: 'Cómo se reparte tu sueldo',
    title: 'De tus sobres fijos a tu presupuesto diario.',
    lead: '',
    items: [
      {
        k: 'Paso 1 — Protege tus sobres de Cuota',
        v: 'El día que cobras, se reservan tus gastos fijos y tu sobre de Ahorro. Ejemplo: de 1.000 $ cobrados, separas 600 $ en Cuotas + 100 $ en Ahorro = te quedan 300 $.',
      },
      {
        k: 'Paso 2 — Define tu Techo diario',
        v: 'Lo que queda es Libre: se divide entre los días hasta el próximo sueldo. Ejemplo: 300 $ ÷ 30 días = ~10 $/día. Si un techo (ocio) se marca “sumar al diario”, se junta con Libre antes de partir.',
      },
      {
        k: 'Paso 3 — Si gastas de más',
        v: 'Se recalcula solo el resto de la semana para compensar rápido, sin arruinar todo el mes.',
      },
      {
        k: 'Paso 3 — Si gastas de menos',
        v: 'El dinero no gastado en la semana se acumula para tu fin de semana. Lo que te sobre al final del ciclo pasará a tus Ahorros.',
      },
    ],
  },
  {
    screen: 'Registra tus Sobres de Techo en 5 segundos',
    title: 'El control de tu día a día.',
    lead: '',
    items: [
      { k: '1', v: 'Toca en + Gasto.' },
      { k: '2', v: 'Ingresa el monto y elige su sobre de Techo (ej. Comida u Ocio).' },
      {
        k: '3 — ¿Cabe en el sobre?',
        v: 'Si pides un café de 3 € y te quedan 10 €, Techo te dará luz verde.',
      },
      {
        k: 'Si no cabe',
        v: 'Techo te avisará que te pasas del límite y te preguntará si deseas tomar el faltante de tus Ahorros. La decisión final siempre es tuya; la app te lo muestra para que tú analices si vale la pena.',
      },
    ],
    tip: 'Si olvidaste anotar un gasto ayer, pon la fecha real para que no afecte el presupuesto de hoy.',
  },
  {
    screen: 'Tus Sobres de Cuota y tu Banco',
    title: 'Tu app alineada con tu cuenta bancaria.',
    lead: 'Tus sobres de Cuota (alquiler, suscripciones, etc.) separan el dinero desde un principio en la app hasta que el banco realiza el cobro: es intocable y no está incluido en tus gastos libres.',
    items: [
      {
        k: 'Marcar pagado',
        v: 'Cuando veas el cobro en tu banco, toca “Marcar pagado” en ese sobre y solito se te actualiza todo.',
      },
      {
        k: 'El objetivo',
        v: 'Mientras no los marques, ese dinero sigue sumando en la app igual que en el banco (porque aún no se cobra). Al marcarlos, ambos saldos bajan a la vez. Si anotaste todo bien, el total en Techo y tu cuenta bancaria coincidirán al centavo.',
      },
    ],
  },
  {
    screen: 'De tu Ahorro a tus sobres de Fondo',
    title: 'Premia tu control y pon a trabajar tu dinero.',
    lead: '',
    items: [
      {
        k: 'Tus Sobres de Fondo',
        v: 'Para planes grandes (fiestas, viajes, ropa), usa tus sobres de Fondo, que se alimentan de tu Ahorro. Así no afectas tu presupuesto diario. Cada mes puedes destinar una parte del ahorro a viajes, ropa, etc., o, cuando lo necesites, pasar dinero directo del ahorro y saber en qué se fue.',
      },
      {
        k: 'Cierre de mes (tu premio)',
        v: 'Todo lo que te haya sobrado en tus sobres de Techo durante el mes se consolida para llenar tus Fondos o hacer crecer tu Ahorro. ¡Genial, no?',
      },
    ],
  },
  {
    screen: 'Antes de que te lances…',
    title: 'Tu información es 100% tuya y privada.',
    lead: 'Techo aún no está terminada, así que funciona directamente en tu navegador, no en un servidor o la nube.',
    items: [
      {
        k: 'Privacidad total',
        v: 'Alex (ni nadie más) puede ver tus gastos, tus sobres o lo que ingresas. Nadie te espía ni te juzga; anota tus gustos con total libertad ;).',
      },
      {
        k: 'Guarda tus datos en tu móvil',
        v: 'Al no usar la nube, tus datos se guardan únicamente en tu dispositivo. Evita el modo incógnito o borrar el historial del navegador para no perder tu información.',
      },
      {
        k: 'El plan: copias de seguridad',
        v: 'De vez en cuando ve a Ajustes → Exportar copia y guárdala en tu teléfono o Drive. Si cambias de móvil o algo falla, podrás restaurarlo en un clic y evitar dramas.',
      },
      {
        k: '¡Gracias por probar Techo!',
        v: 'Tus ideas, quejas y comentarios van a construir la versión definitiva. Sin testers como tú, esto se quedaría en la cabeza de Alex. Si te atascas en algo, escríbele a él: te ayudará encantado.',
      },
    ],
  },
]

export const HOW_IT_WORKS: GuidePage[] = TUTORIAL

export const KIND_EXPLAIN: Record<string, { label: string; hint: string }> = {
  savings: {
    label: 'Ahorro',
    hint: 'Se reserva primero y se junta. Ejemplo: 200 € cada vez que cobras. Para usarlo, Techo pide una razón.',
  },
  fixed: {
    label: 'Cuota',
    hint: 'Gasto fijo. Márcalo pagado cuando el banco lo cobre. Ejemplo: alquiler 600 €, móvil 20 €.',
  },
  cap: {
    label: 'Techo',
    hint: 'Límite del ciclo. Semanal = consejo para que dure (super). Si marcas “sumar al diario”, se parte con Libre entre los días.',
  },
  fund: {
    label: 'Fondo',
    hint: 'Una parte del ahorro con nombre (viaje, medicina). Si está a 0 €, sale del ahorro general.',
  },
  buffer: {
    label: 'Libre',
    hint: 'Lo que queda del sueldo después de cuotas, ahorro y techos. Se crea solo y se reparte entre los días del ciclo.',
  },
}
