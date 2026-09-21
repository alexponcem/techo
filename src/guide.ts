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
    lead: 'Es una app para controlar tus gastos. Nació por la necesidad de Alex de querer ahorrar porque nunca sabía dónde se iba su dinero jajaja. Hasta el último céntimo (euro, dólar o lo que uses) tiene un sitio.',
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
    tip: 'Ejemplo: un café de 3 €. Lo metes en Ocio. Si te quedan 20 € en ocio, cabe. Si te queda 1 €, te avisa que te vas a pasar del presupuesto de ese sobre.',
  },
  {
    title: 'El sueldo se parte (esto es lo importante)',
    lead: 'Todo junto es tu sueldo, de un cobro al siguiente. No es un montón misterioso: primero se separa lo serio, y lo que queda es lo que puedes ir gastando.',
    items: [
      {
        k: '1. Ahorro',
        v: 'Se aparta el día que cobras (ej. 200 €). No es “lo que sobre a fin de mes”, porque si esperas a que sobre, nunca sobrará jaja.',
      },
      {
        k: '2. Cuotas (gastos fijos)',
        v: 'Alquiler, móvil, seguro… importes que ya conoces. Se reservan. Lo que queda después de 1 y 2 es lo gastable.',
      },
      {
        k: '3. Lo que sí puedes gastar',
        v: 'Comida, ocio, imprevistos chicos. Ahí vive el día a día. Si no lo gastas todo, al terminar el ciclo ese resto puede ir al ahorro.',
      },
    ],
    tip: 'Ejemplo: entran 1.500 €. Apartas 200 € de ahorro y 700 € de alquiler + móvil. Te quedan 600 € para comida, ocio y el resto. Eso es lo que “se puede gastar”.',
  },
  {
    title: 'Cuotas: gastos fijos',
    lead: 'Son gastos que ya sabes: casi el mismo importe todos los meses. La app los deja apartados hasta que el banco los cobra.',
    items: [
      { k: 'Ejemplos', v: 'Alquiler o arriendo, móvil, seguro, gimnasio.' },
      {
        k: 'Qué haces',
        v: 'Cuando salgan de tu cuenta del banco, pulsas “Marcar pagado”. No hace falta poner el importe otra vez.',
      },
      {
        k: 'Que coincida con el banco',
        v: 'Techo te muestra un total: el dinero que, si anotaste todo, deberías ver en tu cuenta bancaria. Mientras una cuota NO esté marcada pagada, ese dinero sigue sumando en Techo, igual que en el banco, porque aún no te lo han cobrado. El día que el banco lo cobre, lo marcas y los dos números bajan a la vez.',
      },
    ],
  },
  {
    title: 'Qué haces cada día',
    lead: 'Esto es lo variable: café, super, un capricho. Se te escapan si no los anotas. En Techo los registras en unos 10 segundos y ya están controlados. Nada de “luego lo apunto”: los gastos hormiga son los más peligrosos, hay que tenerlos controlados.',
    items: [
      { k: '1', v: 'Pulsa + Gasto.' },
      { k: '2', v: 'Escribe cuántos € y elige el sobre (comida, ocio…).' },
      { k: '3', v: 'Lee si cabe en ese sobre y pulsa Anotar.' },
    ],
    tip: 'Si se te olvidó, pon la fecha real (ayer, el domingo…). Cuenta ese día, no como si lo hubieras gastado hoy.',
  },
  {
    title: 'Techos: diario y semanal (no es lo mismo)',
    lead: 'Un techo es un límite para este cobro. Lo importante: comida (y similares) se APARTA desde el inicio. No se suma a lo que puedes gastar cada día.',
    items: [
      {
        k: 'Primero se reserva',
        v: 'Ahorro, alquiler, móvil y también el super (comida) se quitan del sueldo al empezar. Ese dinero ya tiene dueño. No está “suelto” para el café de hoy.',
      },
      {
        k: 'Lo diario es SOLO lo que sobra',
        v: 'Cuando ya apartaste ahorro + fijos + comida, lo que queda (ocio, imprevistos chicos) es lo gastable día a día. La app parte ESO entre los días hasta el próximo sueldo. Eso es “cuánto te queda hoy”. Un café de 3 € sale de ahí. No es todo el sueldo ÷ 30.',
      },
      {
        k: 'Lo semanal (super, un hobby)',
        v: 'El super del sábado sale de su cajita de comida, no de lo diario. Techo te da un consejo: “para que te dure el mes, unos 28 € esta semana”. Si te pasas esa semana, aviso suave. El límite de verdad es el del MES.',
      },
      {
        k: 'Cómo se configura lo semanal',
        v: 'Al crear el sobre, elige “Semanal”. Luego dices qué día empieza tu semana (sábado si compras el sábado). Eso también está en Ajustes.',
      },
    ],
    tip: 'Resumen: el diario = lo que queda DESPUÉS de separar ahorro, cuotas y comida.',
  },
  {
    title: 'Ahorro y fondos',
    lead: 'El ahorro se junta. Tocar el colchón no es un café más.',
    items: [
      {
        k: 'Ahorro',
        v: 'Lo apartas cada vez que cobras. Si quieres usarlo, Techo te para y te pide una razón. Así sabes que no es cosa sencilla: no sale “sin querer”.',
      },
      {
        k: 'Fondos',
        v: 'Son como una extensión del ahorro. Puedes ir separando una parte para un viaje, para ropa, para medicina… y ver cuánto quieres destinar a ese plan, sin sacarlo del montón general de ahorro a ciegas.',
      },
      {
        k: 'Si el fondo está a 0 €',
        v: 'El gasto sale del ahorro (Techo te lo dice y te pide que aceptes). Para eso ahorrabas, no para el café del martes.',
      },
    ],
  },
  {
    title: 'Un ciclo entero (números fáciles)',
    lead: 'Cobras 1.000 €. El próximo sueldo es dentro de 30 días. Mira el ciclo de punta a punta:',
    items: [
      {
        k: 'Día 1 — se parte',
        v: '100 € ahorro + 400 € alquiler + 50 € móvil + 150 € comida = 700 € ya apartados. Te quedan 300 € para ocio y Libre. Eso, entre 30 días, es unos 10 €/día. La comida NO está en esos 10 €: ya tiene su cajita de 150 €.',
      },
      {
        k: 'Una semana — se gasta',
        v: 'Super 35 € → sale de comida (quedan 115 € en comida). Café 3 € → sale de ocio y los ~10 €/día bajan un poquito. El alquiler aún no lo han cobrado: Techo y el banco siguen mostrando esos 400 €.',
      },
      {
        k: 'El banco cobra el alquiler',
        v: 'Marcas “pagado”. El total de Techo baja 400 €, igual que el banco. Los 10 €/día no cambian por eso: el alquiler nunca fue dinero “de hoy”.',
      },
      {
        k: 'Cierre — llega el siguiente sueldo',
        v: 'Comida: gastaste 120 € de 150 € → sobran 30 €. Ocio: 80 € de 100 € → sobran 20 €. Esos 50 € pueden ir al ahorro. Empiezas el ciclo nuevo con 100 € + 50 € de ahorro, y otro sueldo de 1.000 €.',
      },
    ],
    tip: 'Café = diario. Super = cajita de comida. Alquiler = marcar pagado. Lo que no gastes en techos puede volver al ahorro.',
  },
  {
    title: 'Antes de que te lances…',
    lead: 'No te preocupes: esta app aún no está “terminada-terminada”. Va en tu navegador, no en la nube.',
    items: [
      {
        k: 'Lo bueno',
        v: 'Alex no puede ver nada de lo que gastes ni lo que registres. Menos mal, ¿no? Jajaja. Nadie te espía ni te juzga. Anota ese sándwich con tranquilidad.',
      },
      {
        k: 'Lo no tan bueno',
        v: 'Como no está en la nube, si usas incógnito o borras datos del sitio, se puede ir todo al carajo. Nadie dijo que fuera perfecta :( pero lo será algún día: este solo es el comienzo y tú serás parte de esto.',
      },
      {
        k: 'El plan (copias)',
        v: 'De vez en cuando: Ajustes → Exportar copia, y guarda el archivo (Drive, o envíatelo a ti mismo). Si un día se borra por accidente, con esa copia se puede restaurar. Un minuto que te ahorra un drama.',
      },
      {
        k: 'Gracias',
        v: 'De verdad: tu uso, tus quejas y tus ideas van a construir la app definitiva. Sin testers como tú, esto se quedaría en la cabeza de Alex.',
      },
    ],
    tip: 'Si te atascas, pregúntale a Alex. Él está detrás de esto (para bien y para las bromas). ¡A controlar ese sueldo!',
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
    hint: 'Límite del ciclo. Diario = cuánto te queda hoy. Semanal = consejo para que dure el mes (super).',
  },
  fund: {
    label: 'Fondo',
    hint: 'Una parte del ahorro con nombre (viaje, medicina). Si está a 0 €, sale del ahorro general.',
  },
  buffer: {
    label: 'Libre',
    hint: 'Lo que sobra del sueldo después de ahorro y cuotas. Imprevistos chicos, no ocio.',
  },
}
