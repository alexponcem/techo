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
    screen: 'Tus sobres',
    title: 'Tres tipos. Libre se crea solo.',
    lead: 'Antes de pagar, miras la cajita. Techo te dice si el gasto cabe.',
    items: [
      {
        k: 'Cuota',
        v: 'Fijos y ahorro. Se reservan al cobrar. El ahorro no es “lo que sobre a fin de mes”: si esperas a que sobre, no sobra.',
      },
      {
        k: 'Techo',
        v: 'Gastos con límite. Ej.: super, ocio, un hobby. Se van comiendo a medida que gastas.',
      },
      {
        k: 'Fondo',
        v: 'Una meta con nombre. Sale del ahorro, no del diario. Ej.: un viaje o un curso.',
      },
      {
        k: 'Libre',
        v: 'No lo creas tú. Aparece solo con lo que queda del sueldo. Ese es el dinero del día a día.',
      },
    ],
  },
  {
    screen: 'El día que cobras',
    title: 'Reservas primero. El resto se parte.',
    lead: '',
    items: [
      {
        k: 'Lo que se aparta',
        v: 'Cuotas, ahorro y techos salen del sueldo al instante. Ej.: entran 1.000, reservas 700, Libre = 300.',
      },
      {
        k: 'El diario',
        v: 'Libre se divide entre los días hasta el próximo sueldo. 300 ÷ 30 ≈ 10 al día. Si empiezas el 15, se parte entre los días que quedan.',
      },
      {
        k: 'Sumar al diario',
        v: 'Un techo puede marcarse y juntarse con Libre. Entonces pasa a Día a día. Si no lo marcas, se queda en Techos.',
      },
    ],
  },
  {
    screen: 'Inicio',
    title: 'Día a día, techos y un toque.',
    lead: '',
    items: [
      {
        k: 'Día a día',
        v: 'Libre y los techos marcados. Semana lunes a domingo. Si te pasas, se recalcula el resto de ESTA semana. Lo que no gastes no se va a la siguiente.',
      },
      {
        k: 'Techos',
        v: 'El límite es el del mes. Si es semanal (ej. el super), tú eliges el día en que empieza esa semana: si eliges sábado, termina el viernes.',
      },
      {
        k: '+ Gasto',
        v: 'Importe, sobre, listo. Si cabe, adelante. Si no, te avisa y puedes sacar del ahorro.',
      },
    ],
    tip: 'Si el gasto fue ayer, pon esa fecha. Así no le pegas al presupuesto de hoy.',
  },
  {
    screen: 'Cuotas y banco',
    title: 'Lo de aquí es lo de tu cuenta.',
    lead: 'Las cuotas están reservadas, pero siguen en el saldo hasta que el banco las cobre.',
    items: [
      {
        k: 'Marcar pagado',
        v: 'Cuando veas el cobro, tócalo. Baja en Techo y en el banco a la vez.',
      },
      {
        k: 'En tu cuenta ahora',
        v: 'Si anotaste todo, ese total coincide con el banco al céntimo.',
      },
    ],
  },
  {
    screen: 'Fondos y el cierre',
    title: 'Lo que no te gastas, se te queda.',
    lead: '',
    items: [
      {
        k: 'Fondos',
        v: 'Salen del ahorro, no del diario. Puedes apartar un poco cada ciclo o mover cuando lo necesites.',
      },
      {
        k: 'Cerrar el ciclo',
        v: 'Lo que sobró en techos y Libre puede ir al ahorro o a un fondo. Ese es el premio por aguantar el mes.',
      },
    ],
  },
  {
    screen: 'Tus datos',
    title: 'Nadie más los ve. Ni Alex.',
    lead: 'Techo aún no está terminada: vive en tu navegador, no en la nube.',
    items: [
      {
        k: 'En tu móvil',
        v: 'Nada de incógnito ni borrar el historial: ahí se pierde todo.',
      },
      {
        k: 'Copia de seguridad',
        v: 'Ajustes → Exportar copia. Guárdala en el teléfono o en Drive.',
      },
      {
        k: 'Si te atascas',
        v: 'Escríbele a Alex. Tus quejas y ideas construyen la app.',
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
    hint: 'Límite del ciclo. Semanal = consejo para que dure; eliges el día en que empieza esa semana. Si marcas “sumar al diario”, se junta con Libre y pasa a Día a día.',
  },
  fund: {
    label: 'Fondo',
    hint: 'Una parte del ahorro con nombre (ej. un viaje o un curso). Si está a 0 €, sale del ahorro general.',
  },
  buffer: {
    label: 'Libre',
    hint: 'Lo que queda del sueldo después de cuotas, ahorro y techos. Se crea solo y se reparte entre los días del ciclo.',
  },
}
