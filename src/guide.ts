export type GuideItem = { k: string; v: string }

export type GuidePage = {
  title: string
  lead: string
  items?: GuideItem[]
  tip?: string
}

export const TUTORIAL: GuidePage[] = [
  {
    title: 'Qué es Techo',
    lead: 'Es una app para controlar tus gastos. Hasta el último céntimo (euro, dólar o la moneda que uses) tiene un sitio: no se gasta “de la cuenta” a ciegas.',
    items: [
      {
        k: 'Sobres',
        v: 'Partes tu sueldo en cajitas: alquiler, comida, ocio, ahorro…',
      },
      {
        k: '¿Cabe?',
        v: 'Antes de pagar, pones el importe y eliges el sobre. Techo te dice si cabe en ESA cajita o si te pasas.',
      },
    ],
    tip: 'Ejemplo: un café de 3. Lo metes en Ocio. Si en ocio te quedan 20, cabe. Si te quedan 1, te avisa.',
  },
  {
    title: 'Qué haces cada día',
    lead: 'Solo anotas lo que pagas. Tres toques.',
    items: [
      { k: '1', v: 'Pulsa + Gasto.' },
      { k: '2', v: 'Escribe cuánto y elige el sobre (comida, ocio…).' },
      { k: '3', v: 'Lee si cabe y pulsa Anotar.' },
    ],
    tip: 'Si se te olvidó, pon la fecha real (ayer, el domingo…). El gasto cuenta ese día, no hoy.',
  },
  {
    title: 'Cuotas: se marcan pagadas',
    lead: 'Son gastos que ya sabes: el mismo importe casi todos los meses.',
    items: [
      { k: 'Ejemplos', v: 'Alquiler o arriendo, móvil, seguro, gimnasio.' },
      { k: 'Qué haces', v: 'La app los reserva. Cuando salgan del banco, pulsas “Marcar pagado”.' },
      {
        k: 'Por qué',
        v: 'Hasta que no los marques, siguen en “en tu cuenta ahora”: el banco aún no los ha cobrado.',
      },
    ],
  },
  {
    title: 'Techos: lo que sí cambia',
    lead: 'Son un límite para este cobro. Hay dos ritmos. No los mezcles.',
    items: [
      {
        k: 'Diario (ocio, café, Libre)',
        v: 'Entra en el número grande “hoy puedes gastar”. Es lo que te queda, partido entre los días hasta el próximo sueldo.',
      },
      {
        k: 'Semanal (super, un hobby)',
        v: 'NO entra en ese “hoy”. Ves un consejo: “para que te dure el mes, gasta unos X esta semana”. El límite de verdad es el del MES. La semana es una guía.',
      },
      {
        k: 'Cómo se configura lo semanal',
        v: 'Al crear el sobre, elige “Semanal”. En Ajustes dices qué día empieza tu semana (sábado si compras el sábado, lunes, etc.).',
      },
    ],
    tip: 'Si no gastas todo el techo, al cerrar el ciclo ese resto puede ir al ahorro.',
  },
  {
    title: 'Ahorro y fondos',
    lead: 'El ahorro no es lo que “sobra”. Se aparta al cobrar y se va juntando.',
    items: [
      {
        k: 'Ahorro',
        v: 'Lo pones tú cada ciclo (ej. 200). No se gasta en cafés. Si un día lo usas, la app pide confirmación.',
      },
      {
        k: 'Fondos (viaje, ropa, medicina)',
        v: 'No tienen techo cada mes. Si el fondo está a 0, el gasto SALE DEL AHORRO.',
      },
    ],
  },
  {
    title: 'De un cobro al siguiente',
    lead: 'Un “ciclo” no es el 1 al 30 del calendario. Es de sueldo a sueldo.',
    items: [
      { k: 'Empieza', v: 'El día que te pagan (aunque sea un viernes).' },
      { k: 'Acaba', v: 'El día que te vuelven a pagar.' },
      {
        k: 'En tu cuenta ahora',
        v: 'Ese número debe parecerse al banco: ahorro + lo no gastado + cuotas aún no pagadas.',
      },
    ],
    tip: 'Cuando cobres otra vez, cierra el ciclo (↻). Lo que no gastaste puede pasar al ahorro.',
  },
]

export const HOW_IT_WORKS: GuidePage[] = TUTORIAL

export const KIND_EXPLAIN: Record<string, { label: string; hint: string }> = {
  savings: {
    label: 'Ahorro',
    hint: 'Se reserva primero y se junta. Ejemplo: 200 cada vez que cobras.',
  },
  fixed: {
    label: 'Cuota',
    hint: 'Importe fijo. Márcalo pagado cuando salga. Ejemplo: alquiler, móvil.',
  },
  cap: {
    label: 'Techo',
    hint: 'Límite del ciclo. Diario = “hoy puedes gastar”. Semanal = consejo para que dure el mes.',
  },
  fund: {
    label: 'Fondo',
    hint: 'Sin techo mensual. Ejemplo: viaje, medicina. Si está a 0, sale del ahorro.',
  },
  buffer: {
    label: 'Libre',
    hint: 'Lo que sobra del sueldo. Imprevistos chicos, no ocio.',
  },
}
