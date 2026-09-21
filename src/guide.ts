export const TUTORIAL = [
  {
    title: 'El ciclo no es el mes',
    body: 'Empieza el día que cobras y acaba el siguiente cobro. Si pagan el viernes porque el 31 es domingo, el ciclo empieza el viernes.',
    example: 'Ejemplo: cobras el 28. Ese dinero dura hasta el próximo 28.',
  },
  {
    title: 'Tres tipos de sobre',
    body: 'Cuota: siempre el mismo importe. Lo marcas pagado cuando sale (alquiler, móvil). Techo: un límite para el ciclo (super, ocio). Fondo: sin límite mensual; si está vacío, sale del ahorro (viaje, medicina).',
    example: 'El ahorro se reserva primero y se acumula. No es “lo que sobre”.',
  },
  {
    title: 'Diario o semanal',
    body: 'Un techo diario (ocio, café) entra en “hoy puedes gastar”: la app reparte lo que queda entre los días hasta el sueldo. Un techo semanal (super, un hobby) no entra en ese “hoy”. Tiene un consejo por semana para que el mes te dure. El techo de verdad es el del mes; la semana es una guía.',
    example: 'Si el super es el sábado, pon la semana a empezar el sábado (o el viernes) en Ajustes.',
  },
  {
    title: 'Anota cuando pagas',
    body: 'Importe, sobre, listo. Si te olvidaste, pon la fecha real (ayer, el domingo…). Si no gastas el techo, al cerrar el ciclo ese resto puede ir al ahorro.',
    example: 'Tres toques. Si un sobre no alcanza, te pregunta si sale de Libre o del ahorro.',
  },
] as const

export const HOW_IT_WORKS = [
  {
    title: 'Cuotas (marcar pagado)',
    body: 'Alquiler, seguro, gimnasio, tarifa del móvil: el importe se conoce. La app lo reserva. Cuando salga de la cuenta, Márcalo pagado. Hasta entonces sigue en “en tu cuenta ahora”, porque el banco aún no lo ha cobrado.',
  },
  {
    title: 'Techos diarios',
    body: 'Ocio, cafés, imprevistos chicos (Libre). Cada gasto baja el ritmo de “hoy”. Ese número no es un bote aparte: es lo que te queda dividido entre los días hasta el sueldo.',
  },
  {
    title: 'Techos semanales',
    body: 'Comida del super, un deporte, lo que compras una o dos veces por semana. No restan del “hoy”. Ves un consejo (“para que dure, ~X esta semana”). Si te pasas esa semana, avisa suave. Si te pasas el mes, ahí sí es el techo. En Ajustes eliges si tu semana empieza el lunes, el sábado, etc.',
  },
  {
    title: 'Ahorro y fondos',
    body: 'El ahorro se aparta al cobrar y se acumula. Viajes, ropa o medicina no tienen techo cada mes: si no apartaste antes, el gasto sale del ahorro (con confirmación).',
  },
  {
    title: 'El saldo',
    body: '“En tu cuenta ahora” suma todo lo que sigue en sobres (incluido el alquiler si aún no lo marcaste pagado). Debería parecerse al banco si anotaste todo.',
  },
] as const

export const KIND_EXPLAIN: Record<string, { label: string; hint: string }> = {
  savings: {
    label: 'Ahorro',
    hint: 'Se reserva primero y se junta de un cobro a otro. Ejemplo: 200 € cada vez que cobras.',
  },
  fixed: {
    label: 'Cuota',
    hint: 'Importe fijo. Márcalo pagado cuando salga. Ejemplo: alquiler o arriendo, móvil.',
  },
  cap: {
    label: 'Techo',
    hint: 'Límite del ciclo. Elige si es diario (ocio) o semanal (super). Lo que no gastes puede ir al ahorro.',
  },
  fund: {
    label: 'Fondo',
    hint: 'Sin techo mensual. Ejemplo: viaje, ropa, medicina. Vacío = sale del ahorro.',
  },
  buffer: {
    label: 'Libre',
    hint: 'Lo que sobra del sueldo tras asignar el resto. Imprevistos chicos, no ocio.',
  },
}
