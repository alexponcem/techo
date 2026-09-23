import { t } from './i18n'
import type { Locale } from './types'

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

const TUTORIAL_EN: GuidePage[] = [
  {
    screen: 'Your envelopes',
    title: 'Three types. Free is created for you.',
    lead: 'Before you pay, you look at the envelope. Techo tells you if it fits. Techo means cap — a ceiling on spending.',
    items: [
      {
        k: 'Bill',
        v: 'Fixed costs and savings. Set aside at payday. Savings is not “whatever is left at month-end”: if you wait for leftover, there isn’t any.',
      },
      {
        k: 'Cap',
        v: 'Spending with a limit. E.g. groceries, leisure, a hobby. It shrinks as you spend.',
      },
      {
        k: 'Goal',
        v: 'A named target. It comes from savings, not from daily spend. E.g. a trip or a class.',
      },
      {
        k: 'Free',
        v: 'You don’t create this one. It appears with what’s left of the paycheck. That’s day-to-day money.',
      },
    ],
  },
  {
    screen: 'Payday',
    title: 'Set aside first. Then split the rest.',
    lead: '',
    items: [
      {
        k: 'What is reserved',
        v: 'Bills, savings and caps leave the paycheck immediately. E.g. 1,000 comes in, you reserve 700, Free = 300.',
      },
      {
        k: 'Daily',
        v: 'Free is split across the days until the next payday. 300 ÷ 30 ≈ 10 a day. If you start on the 15th, it’s split across the days left.',
      },
      {
        k: 'Add to daily',
        v: 'A cap can be checked to join Free. Then it moves to Day to day. If you don’t check it, it stays under Caps.',
      },
    ],
  },
  {
    screen: 'Home',
    title: 'Day to day, caps, and a tap.',
    lead: '',
    items: [
      {
        k: 'Day to day',
        v: 'Free and the caps you marked. Week is Monday to Sunday. If you go over, the rest of THIS week recalculates. What you don’t spend does not roll into the next week.',
      },
      {
        k: 'Caps',
        v: 'The hard limit is the cycle. If it’s weekly (e.g. groceries), you pick the day that week starts: Saturday means it ends Friday.',
      },
      {
        k: '+ Spend',
        v: 'Amount, envelope, done. If it fits, go ahead. If not, Techo warns you and you can take it from savings.',
      },
    ],
    tip: 'If the spend was yesterday, log that date. Don’t hit today’s budget.',
  },
  {
    screen: 'Bills and bank',
    title: 'What’s here is what’s in your account.',
    lead: 'Bills are reserved, but they stay in the balance until the bank charges them.',
    items: [
      {
        k: 'Mark paid',
        v: 'When you see the charge, tap it. It drops in Techo and at the bank together.',
      },
      {
        k: 'In your account now',
        v: 'If you logged everything, that total matches the bank to the cent.',
      },
    ],
  },
  {
    screen: 'Goals and close',
    title: 'What you don’t spend, you keep.',
    lead: '',
    items: [
      {
        k: 'Goals',
        v: 'They come from savings, not daily money. Set a little aside each cycle, or move it when you need it.',
      },
      {
        k: 'Close the cycle',
        v: 'What’s left in caps and Free can go to savings or a goal. That’s the prize for holding the line.',
      },
    ],
  },
  {
    screen: 'Your data',
    title: 'Nobody else sees it. Not even Alex.',
    lead: 'Techo isn’t finished yet: it lives in your browser, not in the cloud.',
    items: [
      {
        k: 'On your phone',
        v: 'No private windows, no clearing history: that’s how it all disappears.',
      },
      {
        k: 'Backup',
        v: 'Settings → Export backup. Save it on your phone or Drive.',
      },
      {
        k: 'If you’re stuck',
        v: 'Write to Alex. Your notes and complaints build the app.',
      },
    ],
  },
]

export function tutorialFor(locale: Locale): GuidePage[] {
  return locale === 'en' ? TUTORIAL_EN : TUTORIAL
}

export const HOW_IT_WORKS: GuidePage[] = TUTORIAL

export function kindExplain(locale: Locale): Record<string, { label: string; hint: string }> {
  return {
    savings: { label: t(locale, 'kind.savings'), hint: t(locale, 'explain.savings') },
    fixed: { label: t(locale, 'kind.fixed'), hint: t(locale, 'explain.fixed') },
    cap: { label: t(locale, 'kind.cap'), hint: t(locale, 'explain.cap') },
    fund: { label: t(locale, 'kind.fund'), hint: t(locale, 'explain.fund') },
    buffer: { label: t(locale, 'kind.buffer'), hint: t(locale, 'explain.buffer') },
  }
}

export const KIND_EXPLAIN = kindExplain('es')
