export type GuideItem = { k: string; v: string }

export type GuidePage = {
  title: string
  lead: string
  items?: GuideItem[]
  tip?: string
}

export const TUTORIAL: GuidePage[] = [
  {
    title: 'Qué es Techo (y por qué existe)',
    lead: 'Es una app para controlar tus gastos. La montó Alex porque nunca sabía ahorrar: el sueldo llegaba, el sueldo se iba, y él se quedaba con cara de “¿pero en qué se me ha ido?” Jajaja. Hasta el último céntimo (euro, dólar o lo que uses) tiene un sitio.',
    items: [
      {
        k: 'Sobres',
        v: 'Partes tu sueldo en cajitas. Esas cajitas las llamamos sobres: alquiler, comida, ocio, ahorro… Cada euro va a una.',
      },
      {
        k: '¿Cabe?',
        v: 'Antes de pagar, pones el importe y eliges el sobre. Techo te dice si ese gasto cabe en ESA cajita. Vamos: si se ajusta a lo que te habías propuesto, o si ya te empieza a poner en aprietos.',
      },
    ],
    tip: 'Ejemplo: un café de 3 €. Lo metes en Ocio. Si te quedan 20 € en ocio, cabe. Si te queda 1 €, te avisa: te vas a pasar del presupuesto de ese sobre.',
  },
  {
    title: 'Qué haces cada día',
    lead: 'Los gastos del día a día (café, super, un capricho) se te escapan si no los anotas. Aquí los registras en unos 10 segundos y ya están controlados. Nada de “luego lo apunto”.',
    items: [
      { k: '1', v: 'Pulsa + Gasto.' },
      { k: '2', v: 'Escribe cuántos € y elige el sobre (comida, ocio…).' },
      { k: '3', v: 'Lee si cabe en ese sobre y pulsa Anotar.' },
    ],
    tip: 'Si se te olvidó, pon la fecha real (ayer, el domingo…). Cuenta ese día, no como si lo hubieras gastado hoy.',
  },
  {
    title: 'El sueldo se parte (esto es lo importante)',
    lead: 'Todo junto es tu sueldo del ciclo. No es un montón misterioso: primero se separa lo serio, y lo que queda es lo que puedes ir gastando.',
    items: [
      {
        k: '1. Ahorro',
        v: 'Se aparta el día que cobras (ej. 200 €). No es “lo que sobre a fin de mes”, porque eso nunca sobra.',
      },
      {
        k: '2. Cuotas (fijos)',
        v: 'Alquiler, móvil, seguro… importes que ya conoces. Se reservan. Lo que queda después de 1 y 2 es lo gastable.',
      },
      {
        k: '3. Lo que sí puedes gastar',
        v: 'Comida, ocio, imprevistos chicos. Ahí vive el día a día. Si no lo gastas, al cerrar el ciclo puede ir al ahorro.',
      },
    ],
    tip: 'Ejemplo: entran 1.500 €. Apartas 200 € de ahorro y 700 € de alquiler+móvil. Te quedan 600 € para comida, ocio y el resto. Eso es lo que “se puede gastar”.',
  },
  {
    title: 'Cuotas: fijos que se marcan pagados',
    lead: 'Son gastos fijos: casi el mismo importe todos los meses. La app los deja reservados hasta que el banco los cobra.',
    items: [
      { k: 'Ejemplos', v: 'Alquiler o arriendo, móvil, seguro, gimnasio.' },
      {
        k: 'Qué haces',
        v: 'Cuando salgan de la cuenta, pulsas “Marcar pagado”. No hace falta poner el importe otra vez.',
      },
      {
        k: 'El banco',
        v: 'Mientras NO las marques pagadas, “en tu cuenta ahora” incluye ese dinero: es lo mismo que ves en el banco, porque aún no lo han cobrado. El día que lo cobren, lo marcas y el saldo de Techo baja igual que el del banco.',
      },
    ],
  },
  {
    title: 'Techos: diario y semanal (no es lo mismo)',
    lead: 'Un techo es un límite para este cobro. Hay dos ritmos. Si los mezclas, te lías.',
    items: [
      {
        k: 'Diario (ocio, café, Libre)',
        v: 'Entra en el número grande “hoy puedes gastar”. Es lo que te queda de esas cajitas, partido entre los días hasta el próximo sueldo. Un café de 3 € baja un poquito ese “hoy”.',
      },
      {
        k: 'Semanal (super, un hobby)',
        v: 'NO entra en ese “hoy”. El super del sábado no es un café. Ves un consejo: “para que te dure el mes, unos 28 € esta semana”. Si te pasas esa semana, te avisa suave. El límite de verdad es el del MES.',
      },
      {
        k: 'Cómo se configura',
        v: 'Al crear el sobre, elige “Semanal”. Más abajo (y en Ajustes) dices qué día empieza tu semana: sábado si compras el sábado, lunes, el que sea.',
      },
    ],
  },
  {
    title: 'Ahorro y fondos',
    lead: 'El ahorro se junta. Los fondos (viaje, ropa, medicina) no tienen techo cada mes.',
    items: [
      {
        k: 'Ahorro',
        v: 'Lo pones tú cada ciclo. No se gasta en cafés. Si un día lo usas, Techo te para y te pregunta.',
      },
      {
        k: 'Fondos',
        v: 'Si el fondo está a 0 €, el gasto SALE DEL AHORRO. Para eso ahorrabas, no para el café del martes.',
      },
    ],
  },
  {
    title: 'Un ejemplo entero (para que cierre)',
    lead: 'Imagina que cobras 1.500 €.',
    items: [
      { k: 'Apartas', v: '200 € ahorro + 600 € alquiler + 50 € móvil = 850 € ya “ocupados”.' },
      { k: 'Techos', v: '150 € super (semanal) + 100 € ocio (diario).' },
      { k: 'Libre', v: 'Lo que sobre de los 1.500 €. Imprevistos chicos.' },
      {
        k: 'El día a día',
        v: 'El café va a ocio y mueve el “hoy”. El super va a comida y al consejo de la semana. El alquiler: “Marcar pagado” cuando lo cobren.',
      },
    ],
    tip: 'Si al final del ciclo no te gastaste los 150 € de super, ese resto puede ir al ahorro. Magia (bueno, disciplina).',
  },
  {
    title: 'Antes de que te lances…',
    lead: 'No te preocupes: esta app aún no está “terminada-terminada”. Va en tu navegador, no en la nube.',
    items: [
      {
        k: 'Lo bueno',
        v: 'Alex no puede ver nada de lo que gastes ni lo que registres. Menos mal, ¿no? Jajaja. Nadie te espía ni te juzga. Anota el kebab con tranquilidad.',
      },
      {
        k: 'Lo no tan bueno',
        v: 'Como no está en la nube, si usas incógnito o borras datos del sitio, se puede ir todo a tomar viento. Nadie dijo que fuera perfecta :(',
      },
      {
        k: 'El plan',
        v: 'De vez en cuando: Ajustes → Exportar copia, y mándate el archivo (Drive, WhatsApp a ti mismo…). Un minuto que te ahorra un drama.',
      },
    ],
    tip: 'Si te atascas, pregúntale a Alex. Él está detrás de esto (para bien y para las bromas). ¡A controlar ese sueldo!',
  },
]

export const HOW_IT_WORKS: GuidePage[] = TUTORIAL

export const KIND_EXPLAIN: Record<string, { label: string; hint: string }> = {
  savings: {
    label: 'Ahorro',
    hint: 'Se reserva primero y se junta. Ejemplo: 200 € cada vez que cobras.',
  },
  fixed: {
    label: 'Cuota',
    hint: 'Gasto fijo. Márcalo pagado cuando el banco lo cobre. Ejemplo: alquiler 600 €, móvil 20 €.',
  },
  cap: {
    label: 'Techo',
    hint: 'Límite del ciclo. Diario = “hoy puedes gastar”. Semanal = consejo para que dure el mes (super).',
  },
  fund: {
    label: 'Fondo',
    hint: 'Sin techo mensual. Ejemplo: viaje, medicina. Si está a 0 €, sale del ahorro.',
  },
  buffer: {
    label: 'Libre',
    hint: 'Lo que sobra del sueldo después de ahorro y cuotas. Imprevistos chicos, no ocio.',
  },
}
