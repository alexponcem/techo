import type { Locale } from './types'

export type { Locale }

const msg = {
  'lang.es': { es: 'Español', en: 'Español' },
  'lang.en': { es: 'English', en: 'English' },
  'lang.esSub': { es: 'Tu dinero, con un techo.', en: 'Tu dinero, con un techo.' },
  'lang.enSub': {
    es: 'Techo means cap — a ceiling on spending.',
    en: 'Techo means cap — a ceiling on spending.',
  },
  'lang.hint': {
    es: 'Luego lo puedes cambiar en Ajustes. You can change this later in Settings.',
    en: 'You can change this later in Settings. Luego lo puedes cambiar en Ajustes.',
  },

  'nav.home': { es: 'Inicio', en: 'Home' },
  'nav.stats': { es: 'Estadísticas', en: 'Stats' },
  'nav.add': { es: 'Añadir gasto', en: 'Add spend' },
  'nav.cycle': { es: 'Ciclo', en: 'Cycle' },
  'nav.settings': { es: 'Ajustes', en: 'Settings' },

  'common.back': { es: '← Atrás', en: '← Back' },
  'common.next': { es: 'Siguiente', en: 'Next' },
  'common.skipGuide': { es: 'Saltar explicación', en: 'Skip' },
  'common.skipTour': { es: 'Saltar', en: 'Skip' },
  'common.cancel': { es: 'Cancelar', en: 'Cancel' },
  'common.save': { es: 'Guardar', en: 'Save' },
  'common.close': { es: 'Cerrar', en: 'Close' },
  'common.start': { es: 'Empezar', en: 'Start' },
  'common.day': { es: 'día', en: 'day' },
  'common.days': { es: 'días', en: 'days' },
  'common.yesDelete': { es: 'Sí, borrar', en: 'Yes, delete' },

  'weekday.0': { es: 'domingo', en: 'Sunday' },
  'weekday.1': { es: 'lunes', en: 'Monday' },
  'weekday.2': { es: 'martes', en: 'Tuesday' },
  'weekday.3': { es: 'miércoles', en: 'Wednesday' },
  'weekday.4': { es: 'jueves', en: 'Thursday' },
  'weekday.5': { es: 'viernes', en: 'Friday' },
  'weekday.6': { es: 'sábado', en: 'Saturday' },

  'kind.savings': { es: 'Ahorro protegido', en: 'Protected savings' },
  'kind.fixed': { es: 'Cuota', en: 'Bill' },
  'kind.cap': { es: 'Techo', en: 'Cap' },
  'kind.fund': { es: 'Fondo (sale del ahorro)', en: 'Goal (from savings)' },
  'kind.buffer': { es: 'Libre', en: 'Free' },

  'kindHint.savings': {
    es: 'Se reserva primero y se acumula. No es “lo que sobre”.',
    en: 'Set aside first, then it grows. It is not “whatever is left”.',
  },
  'kindHint.fixed': {
    es: 'Importe conocido. Márcalo pagado cuando salga de la cuenta.',
    en: 'A known amount. Mark it paid when it leaves your account.',
  },
  'kindHint.cap': {
    es: 'Límite del ciclo. Márcalo “sumar al diario” si quieres que se parta con Libre entre los días. Si es semanal, eliges el día en que empieza esa semana.',
    en: 'A cap for the cycle. Check “Add to daily” to split it with Free across the days. If it’s weekly, you pick the day that week starts.',
  },
  'kindHint.fund': {
    es: 'Sin techo mensual. No resta del sueldo: si está vacío, el gasto sale del ahorro.',
    en: 'No monthly cap. It does not come from this paycheck: if it’s empty, the spend comes from savings.',
  },
  'kindHint.buffer': {
    es: 'Lo que queda del sueldo. Se reparte solo por los días del ciclo.',
    en: 'What’s left of the paycheck. Split across the days of the cycle.',
  },

  'explain.savings': {
    es: 'Se reserva primero y se junta. Ejemplo: 200 € cada vez que cobras. Para usarlo, Techo pide una razón.',
    en: 'Set aside first, then it piles up. Example: 200 each payday. To use it, Techo asks for a reason.',
  },
  'explain.fixed': {
    es: 'Gasto fijo. Márcalo pagado cuando el banco lo cobre. Ejemplo: alquiler 600 €, móvil 20 €.',
    en: 'A fixed cost. Mark it paid when the bank charges it. Example: rent 600, phone 20.',
  },
  'explain.cap': {
    es: 'Límite del ciclo. Semanal = consejo para que dure; eliges el día en que empieza esa semana. Si marcas “sumar al diario”, se junta con Libre y pasa a Día a día.',
    en: 'A cap for the cycle. Weekly = pacing so it lasts; you pick the day that week starts. If you check “Add to daily”, it joins Free and moves to Day to day.',
  },
  'explain.fund': {
    es: 'Una parte del ahorro con nombre (ej. un viaje o un curso). Si está a 0 €, sale del ahorro general.',
    en: 'A named slice of savings (e.g. a trip or a course). If it’s at 0, the spend comes from general savings.',
  },
  'explain.buffer': {
    es: 'Lo que queda del sueldo después de cuotas, ahorro y techos. Se crea solo y se reparte entre los días del ciclo.',
    en: 'What’s left after bills, savings and caps. Created for you, split across the days of the cycle.',
  },

  'names.savings': { es: 'Ahorro', en: 'Savings' },
  'names.rent': { es: 'Alquiler / arriendo', en: 'Rent' },
  'names.phone': { es: 'Móvil / internet', en: 'Phone / internet' },
  'names.food': { es: 'Comida / super', en: 'Groceries' },
  'names.leisure': { es: 'Ocio', en: 'Leisure' },
  'names.travel': { es: 'Viajes', en: 'Travel' },
  'names.medicine': { es: 'Medicina', en: 'Medicine' },
  'names.free': { es: 'Libre', en: 'Free' },
  'names.newEnvelope': { es: 'Nuevo sobre', en: 'New envelope' },

  'group.daily': { es: 'Día a día', en: 'Day to day' },
  'group.dailyHint': {
    es: 'Libre y techos marcados para partir entre los días',
    en: 'Free plus caps marked to split across the days',
  },
  'group.cap': { es: 'Techos', en: 'Caps' },
  'group.capHint': {
    es: 'Límite del ciclo. Ej.: super, un hobby, un curso…',
    en: 'A cap for the cycle. E.g. groceries, a hobby, a class…',
  },
  'group.fixed': { es: 'Cuotas', en: 'Bills' },
  'group.fixedHint': {
    es: 'Reservadas al cobrar. Márcalas pagadas',
    en: 'Set aside at payday. Mark them paid',
  },
  'group.fund': { es: 'Fondos', en: 'Goals' },
  'group.fundHint': { es: 'Salen del ahorro', en: 'Come from savings' },
  'group.savings': { es: 'Ahorro', en: 'Savings' },
  'group.savingsHint': { es: 'Se acumula y se protege', en: 'It grows and stays protected' },

  'home.spend': { es: '+ Gasto', en: '+ Spend' },
  'home.move': { es: 'Mover', en: 'Move' },
  'home.today': { es: 'Hoy puedes gastar', en: 'You can spend today' },
  'home.todayClosed': {
    es: 'hoy cerrado · el resto de la semana se recalcula',
    en: 'today is closed · the rest of the week recalculates',
  },
  'home.todayLogged': { es: 'hoy ya {amount}', en: 'already {amount} today' },
  'home.todayHint': {
    es: '{names} · si te pasas, se cierra el día',
    en: '{names} · go over and the day closes',
  },
  'home.thisWeek': { es: 'Esta semana', en: 'This week' },
  'home.weekMeta': {
    es: 'techo inicial {cap} · {daily}/día · quedan {days} {dayWord}',
    en: 'starting cap {cap} · {daily}/day · {days} {dayWord} left',
  },
  'home.month': { es: 'Al mes', en: 'This cycle' },
  'home.monthMeta': {
    es: 'techo inicial {original} · {daily}/día',
    en: 'starting cap {original} · {daily}/day',
  },
  'home.weekBreak': {
    es: 'Semana {from}–{to}. Lo que no gastes esta semana no se suma a la siguiente; al cierre puede ir a ahorro.',
    en: '{from}–{to} week. What you don’t spend this week does not roll into the next; at close it can go to savings.',
  },
  'home.cameIn': { es: 'Entraron {amount}', en: '{amount} came in' },
  'home.inAccount': { es: 'En tu cuenta ahora', en: 'In your account now' },
  'home.inAccountHint': {
    es: 'Debería coincidir con el banco si anotaste todo (un solo bolsillo).',
    en: 'Should match your bank if you logged everything (one pocket).',
  },
  'home.whenBillsLeave': { es: 'Cuando salgan las cuotas pendientes', en: 'When pending bills leave' },
  'home.billsLeft': {
    es: 'Falta: {names}. Eso que queda es ahorro + variables + fondos.',
    en: 'Still due: {names}. What’s left is savings + variable + goals.',
  },
  'home.billsDone': {
    es: 'Cuotas de este ciclo ya marcadas. Este es el saldo que te queda.',
    en: 'Bills for this cycle are marked paid. This is what’s left.',
  },
  'home.floor': {
    es: 'Si agotas techos y Libre, te quedarían {amount} (ahorro + fondos).',
    en: 'If you drain caps and Free, you’d still have {amount} (savings + goals).',
  },
  'home.newEnvelope': { es: '+ Nuevo sobre', en: '+ New envelope' },
  'home.inDaily': { es: 'En el diario', en: 'In daily' },
  'home.savingsUsed': { es: 'Usado {amount} este mes', en: 'Used {amount} this cycle' },
  'home.fundSpent': { es: 'Fondo · gastado {amount} este ciclo', en: 'Goal · spent {amount} this cycle' },
  'home.weekLine': {
    es: 'Esta semana {spent} / ~{target} · mes {monthSpent} / {total}',
    en: 'This week {spent} / ~{target} · cycle {monthSpent} / {total}',
  },
  'home.usedPct': { es: ' · {pct}% usado', en: ' · {pct}% used' },
  'home.brought': { es: ' · traes {amount}', en: ' · you brought {amount}' },
  'home.weekAdvice': {
    es: '{label}{clip}. Consejo para que dure, no un techo.{pace}',
    en: '{label}{clip}. Pacing so it lasts, not a hard cap.{pace}',
  },
  'home.weekClip': { es: ' · {n} días de este ciclo', en: ' · {n} days in this cycle' },
  'home.paceFast': { es: ' Esta semana vas un poco rápido.', en: ' This week is running a bit fast.' },
  'home.paceOver': { es: ' Esta semana por encima del consejo.', en: ' This week is over the pacing.' },
  'home.reserved': { es: 'Reservado, aún no marcado', en: 'Set aside, not marked yet' },
  'home.markPaid': { es: 'Marcar pagado', en: 'Mark paid' },
  'home.log': { es: 'Anotar', en: 'Log' },
  'home.pillPaid': { es: 'Pagado', en: 'Paid' },
  'home.pillOk': { es: 'Bien', en: 'OK' },
  'home.pillSet': { es: 'Apartado', en: 'Set aside' },
  'home.pillFromSav': { es: 'Del ahorro', en: 'From savings' },
  'home.pillEmpty': { es: 'Vacío', en: 'Empty' },
  'home.pillLimit': { es: 'Al límite', en: 'At the cap' },
  'home.alertHalf': { es: 'Pasó el 50% ({pct}%)', en: 'Past 50% ({pct}%)' },
  'home.alertNear': { es: 'Se acerca al límite ({pct}%)', en: 'Near the cap ({pct}%)' },
  'home.alertAlmost': { es: 'Casi al límite ({pct}%)', en: 'Almost at the cap ({pct}%)' },
  'home.alertLimit': { es: 'Al límite', en: 'At the cap' },
  'home.alertOver': { es: 'Superó el techo', en: 'Went over the cap' },
  'home.overOne': { es: '{name} superó el techo.', en: '{name} went over the cap.' },
  'home.overMany': { es: 'Superaron el techo: {names}.', en: 'Went over the cap: {names}.' },
  'home.atLimitOne': { es: '{name} está al límite.', en: '{name} is at the cap.' },
  'home.atLimitMany': { es: 'Al límite: {names}.', en: 'At the cap: {names}.' },
  'home.almostOne': { es: '{name} está casi al límite ({pct}%).', en: '{name} is almost at the cap ({pct}%).' },
  'home.almostMany': { es: 'Casi al límite: {names}.', en: 'Almost at the cap: {names}.' },
  'home.nearOne': { es: '{name} se acerca al límite ({pct}%).', en: '{name} is near the cap ({pct}%).' },
  'home.nearMany': { es: 'Cerca del límite: {names}.', en: 'Near the cap: {names}.' },

  'tour.account': { es: 'En tu cuenta ahora', en: 'In your account now' },
  'tour.accountBody': {
    es: 'Ese total es lo que debería verse en el banco: ahorro + lo no gastado + alquiler u otras cuotas que aún no hayas marcado pagadas.',
    en: 'That total is what your bank should show: savings + unspent + rent or other bills you haven’t marked paid yet.',
  },
  'tour.today': { es: 'Hoy puedes gastar', en: 'You can spend today' },
  'tour.todayBody': {
    es: 'Cuenta Libre y los techos que marques para el diario. Los techos semanales van en su propio grupo.',
    en: 'This is Free plus any caps you add to daily. Weekly caps live in their own group.',
  },
  'tour.add': { es: '+ Gasto', en: '+ Spend' },
  'tour.addBody': {
    es: 'Cuánto, en qué sobre, anotar. La app te dice si cabe en ESE sobre. Las cuotas: “Marcar pagado” cuando salgan.',
    en: 'How much, which envelope, log it. Techo tells you if it fits THAT envelope. Bills: “Mark paid” when they leave.',
  },

  'welcome.kicker': { es: 'Control de dinero', en: 'Money, with a cap' },
  'welcome.p1': {
    es: 'App para controlar tus gastos. Hasta el último céntimo (euro, dólar o lo que uses) tiene un sitio.',
    en: 'An app to control spending. Every last cent (euro, dollar, whatever you use) has a place.',
  },
  'welcome.p2': {
    es: 'Antes de pagar, le dices cuánto y en qué sobre. Techo te dice si cabe en esa cajita o si te pasas.',
    en: 'Before you pay, you say how much and which envelope. Techo tells you if it fits, or if you go over.',
  },
  'welcome.create': { es: 'Crear mi plan', en: 'Create my plan' },
  'welcome.createSub': {
    es: 'Primero cómo se usa, luego tus números',
    en: 'How it works first, then your numbers',
  },
  'welcome.restore': { es: 'Restaurar una copia', en: 'Restore a backup' },
  'welcome.restoreSub': {
    es: 'Si ya usabas Techo y tienes un techo-backup.json',
    en: 'If you already used Techo and have a techo-backup.json',
  },
  'welcome.incognito': {
    es: 'No uses ventana de incógnito: ahí no se guarda nada.',
    en: 'Don’t use a private window: nothing is saved there.',
  },

  'setup.myNumbers': { es: 'Poner mis números', en: 'Enter my numbers' },
  'setup.prev': { es: 'Explicación anterior', en: 'Previous' },
  'setup.cycle': { es: 'Este ciclo', en: 'This cycle' },
  'setup.cycleHint': {
    es: 'El ciclo empieza el día que cobras, no el 1 del mes. Si pagan un viernes porque el 31 es domingo, usa esa fecha.',
    en: 'The cycle starts on payday, not the 1st of the month. If they pay Friday because the 31st is a Sunday, use that date.',
  },
  'setup.income': { es: '¿Cuánto ha entrado? (sueldo de este ciclo)', en: 'How much came in? (this cycle’s pay)' },
  'setup.saved': { es: '¿Ya traes ahorro de antes?', en: 'Do you already have savings?' },
  'setup.savedHint': {
    es: 'Eso se suma al sobre Ahorro y no se gasta en el mes. Si empiezas de cero, déjalo en 0.',
    en: 'That goes into Savings and is not spent this cycle. Starting from zero? Leave it at 0.',
  },
  'setup.payday': { es: '¿Qué día llegó (o el cobro anterior)?', en: 'Which day did it arrive (or the last payday)?' },
  'setup.howPay': { es: '¿Cómo sueles cobrar?', en: 'How do you usually get paid?' },
  'setup.payLast': { es: 'Último día laborable del mes', en: 'Last weekday of the month' },
  'setup.payFixed': { es: 'Un día fijo', en: 'A fixed day' },
  'setup.payManual': { es: 'Lo marco yo cada vez', en: 'I’ll set it each time' },
  'setup.dayOfMonth': { es: 'Día del mes', en: 'Day of the month' },
  'setup.nextPay': { es: 'Próximo sueldo estimado', en: 'Next payday (estimate)' },
  'setup.weekDefault': {
    es: 'Día por defecto de los techos semanales',
    en: 'Default start day for weekly caps',
  },
  'setup.weekDefaultHint': {
    es: 'Independiente del diario (lunes a domingo). Ej.: el día que sueles hacer la compra. Luego cada sobre semanal puede elegir el suyo.',
    en: 'Independent from daily (Monday–Sunday). E.g. the day you usually grocery shop. Each weekly envelope can pick its own later.',
  },
  'setup.toEnvelopes': { es: 'Seguir a los sobres', en: 'Continue to envelopes' },
  'setup.envelopes': { es: 'Sobres', en: 'Envelopes' },
  'setup.liBill': {
    es: 'Cuota. Alquiler, móvil. Márcala pagada cuando salga del banco.',
    en: 'Bill. Rent, phone. Mark it paid when it leaves the bank.',
  },
  'setup.liDaily': {
    es: 'Techo diario. Ej.: ocio o café. Entra en “hoy puedes gastar”.',
    en: 'Daily cap. E.g. leisure or coffee. It goes into “you can spend today”.',
  },
  'setup.liWeekly': {
    es: 'Techo semanal. Ej.: super o un hobby. Consejo por semana; el límite duro es el mes. Eliges el día en que empieza esa semana.',
    en: 'Weekly cap. E.g. groceries or a hobby. Weekly pacing; the hard limit is the cycle. You pick the day that week starts.',
  },
  'setup.liGoal': {
    es: 'Fondo. Ej.: un viaje o un curso. Sin techo. Si está a 0, sale del ahorro.',
    en: 'Goal. E.g. a trip or a class. No cap. If it’s at 0, it comes from savings.',
  },
  'setup.envHint': {
    es: 'Quita lo que no uses y pon tus importes. Cuotas y techos se reservan al cobrar. Libre se crea solo con lo que queda y se reparte por los días que quedan hasta el próximo sueldo. Un techo (ej. ocio o café) puede sumarse a ese diario con el check.',
    en: 'Remove what you don’t use and enter your amounts. Bills and caps are set aside at payday. Free is created from what’s left and split across the days until the next payday. A cap (e.g. leisure or coffee) can join that daily split with the check.',
  },
  'setup.name': { es: 'Nombre', en: 'Name' },
  'setup.remove': { es: 'quitar', en: 'remove' },
  'setup.type': { es: 'Tipo', en: 'Type' },
  'setup.typeBill': { es: 'Cuota (marcar pagado)', en: 'Bill (mark paid)' },
  'setup.typeCap': { es: 'Techo (límite del ciclo)', en: 'Cap (cycle limit)' },
  'setup.typeGoal': { es: 'Fondo (sale del ahorro)', en: 'Goal (from savings)' },
  'setup.dailyOrWeekly': { es: '¿Diario o semanal?', en: 'Daily or weekly?' },
  'setup.optWeekly': {
    es: 'Semanal — consejo por semana (ej. super o hobby)',
    en: 'Weekly — pacing per week (e.g. groceries or a hobby)',
  },
  'setup.optDaily': {
    es: 'Límite del ciclo (sin consejo semanal)',
    en: 'Cycle cap (no weekly pacing)',
  },
  'setup.addDaily': { es: 'Sumar al diario del mes (pasa a Día a día, junto con Libre)', en: 'Add to daily (moves to Day to day, with Free)' },
  'setup.amount': { es: 'Importe de este ciclo', en: 'Amount this cycle' },
  'setup.amountGoal': { es: 'Apartar este ciclo (puede ser 0)', en: 'Set aside this cycle (can be 0)' },
  'setup.freeCard': {
    es: 'Se crea solo. Es lo que queda después de cuotas, ahorro y techos. Ese dinero se reparte entre los días que quedan hasta el próximo sueldo{extra}.',
    en: 'Created for you. What’s left after bills, savings and caps. Split across the days until the next payday{extra}.',
  },
  'setup.freeCardExtra': {
    es: ', junto con los techos que hayas marcado para el diario',
    en: ', plus any caps you marked for daily',
  },
  'setup.addRow': { es: '+ Añadir sobre', en: '+ Add envelope' },
  'setup.review': { es: 'Ver si el plan cierra', en: 'See if the plan closes' },
  'setup.closes': { es: '¿Cierra?', en: 'Does it close?' },
  'setup.closesHint': {
    es: 'Cada euro tiene trabajo. Libre es lo que queda. Si no gastas un techo, al cerrar el ciclo puede ir al ahorro.',
    en: 'Every euro has a job. Free is what’s left. If you don’t spend a cap, it can go to savings when you close the cycle.',
  },
  'setup.incomeRow': { es: 'Entra (sueldo)', en: 'In (pay)' },
  'setup.savedRow': { es: 'Ahorro que ya traes', en: 'Savings you already have' },
  'setup.deficit': {
    es: 'El plan pide {amount} más que el dinero. Baja un techo o el ahorro.',
    en: 'The plan asks for {amount} more than the money. Lower a cap or savings.',
  },
  'setup.freeHint': {
    es: 'Libre: {amount}. Se reparte entre los días que quedan hasta el próximo sueldo{extra}. Si no lo usas, puede ir al ahorro.',
    en: 'Free: {amount}. Split across the days until the next payday{extra}. If you don’t use it, it can go to savings.',
  },
  'setup.freeHintExtra': {
    es: ', junto con los techos marcados para el diario',
    en: ', plus caps marked for daily',
  },
  'setup.allAssigned': {
    es: 'Todo el sueldo está asignado. Los fondos salen del ahorro si están a 0.',
    en: 'The whole paycheck is assigned. Goals come from savings if they’re at 0.',
  },
  'setup.open': { es: 'Abrir el ciclo', en: 'Open the cycle' },
  'setup.openBlocked': { es: 'Aún no cierra — mira el aviso', en: 'It doesn’t close yet — see the notice' },
  'setup.starts': { es: 'Empieza {start} · próximo sueldo {end}', en: 'Starts {start} · next payday {end}' },
  'setup.needIncome': { es: 'Pon cuánto dinero entra o te queda.', en: 'Enter how much money came in, or what’s left.' },
  'setup.overPlan': {
    es: 'El plan pide {amount} de más. Baja un techo o el ahorro.',
    en: 'The plan asks for {amount} too much. Lower a cap or savings.',
  },
  'setup.openFail': { es: 'No se pudo abrir el ciclo.', en: 'Couldn’t open the cycle.' },
  'setup.how': { es: 'Cómo funciona', en: 'How it works' },

  'week.starts': { es: 'La semana empieza el', en: 'The week starts on' },
  'week.span': {
    es: 'Semana {span} (termina el {end}).',
    en: '{span} week (ends on {end}).',
  },

  'settings.title': { es: 'Ajustes', en: 'Settings' },
  'settings.pay': { es: 'Cobro:', en: 'Payday:' },
  'settings.thisCycle': { es: 'Este ciclo:', en: 'This cycle:' },
  'settings.safari': {
    es: 'Abre Techo siempre en Safari normal, no en incógnito: ahí no se guarda nada. Quitar el icono no suele borrar datos; una ventana privada sí.',
    en: 'Open Techo in a normal browser, not a private window: nothing is saved there. Removing the icon usually keeps your data; a private window does not.',
  },
  'settings.dailyWeek': {
    es: 'Semana del gasto diario (Libre y techos marcados)',
    en: 'Daily spend week (Free and marked caps)',
  },
  'settings.dailyWeekHint': {
    es: 'Por defecto lunes → domingo. Si te pasas un día, se recalcula solo el resto de esta semana.',
    en: 'Default Monday → Sunday. If you go over one day, only the rest of this week recalculates.',
  },
  'settings.weeklyDefault': {
    es: 'Día por defecto de los techos semanales',
    en: 'Default start day for weekly caps',
  },
  'settings.weeklyDefaultHint': {
    es: 'Independiente del diario. Cada techo semanal puede elegir el suyo (ej. el día que haces la compra). Si no elige, usa este.',
    en: 'Independent from daily. Each weekly cap can pick its own (e.g. grocery day). If it doesn’t, it uses this.',
  },
  'settings.language': { es: 'Idioma', en: 'Language' },
  'settings.extraIncome': { es: 'Registrar ingreso extra', en: 'Log extra income' },
  'settings.undo': { es: 'Deshacer último movimiento', en: 'Undo last movement' },
  'settings.export': { es: 'Exportar copia (JSON)', en: 'Export backup (JSON)' },
  'settings.restore': { es: 'Restaurar copia (JSON)', en: 'Restore backup (JSON)' },
  'settings.restoreConfirm': {
    es: 'Esto sustituye lo que hay ahora por la copia.',
    en: 'This replaces what’s here with the backup.',
  },
  'settings.restored': {
    es: 'Copia restaurada. Ya deberías ver tu ciclo en Inicio.',
    en: 'Backup restored. You should see your cycle on Home.',
  },
  'settings.fileFail': { es: 'No pude abrir ese archivo.', en: 'Couldn’t open that file.' },
  'settings.wipe': { es: 'Borrar todo y empezar de cero', en: 'Erase everything and start over' },
  'settings.wipeConfirm': {
    es: 'Se borra el plan y los movimientos de este dispositivo.',
    en: 'This deletes the plan and movements on this device.',
  },

  'env.missing': { es: 'No está este sobre.', en: 'This envelope isn’t here.' },
  'env.leftOf': { es: ' · quedan de {total}', en: ' · left of {total}' },
  'env.savingsUsed': { es: ' · usado {amount} este mes ({pct}%)', en: ' · used {amount} this cycle ({pct}%)' },
  'env.weekHint': {
    es: 'Consejo esta semana ({label}, {days} {dayWord} de este ciclo): ~{target}. Llevas {spent}. El techo duro es el del mes ({total}).',
    en: 'Pacing this week ({label}, {days} {dayWord} in this cycle): ~{target}. You’ve logged {spent}. The hard cap is the cycle ({total}).',
  },
  'env.hintBill': {
    es: 'Cuota: márcala pagada cuando salga de la cuenta. Hasta entonces sigue en el saldo del banco.',
    en: 'Bill: mark it paid when it leaves the account. Until then it still sits in the bank balance.',
  },
  'env.hintWeekly': {
    es: 'Techo semanal: el límite duro es el del mes. La cifra de la semana es un consejo para que te dure. Tú eliges el día en que empieza esa semana.',
    en: 'Weekly cap: the hard limit is the cycle. The weekly figure is pacing so it lasts. You pick the day that week starts.',
  },
  'env.hintGoal': {
    es: 'Fondo: si está vacío, el gasto sale del ahorro. Puedes apartar antes con Mover.',
    en: 'Goal: if it’s empty, the spend comes from savings. You can move money in first.',
  },
  'env.hintSav': {
    es: 'Ahorro protegido. Se acumula. Fondos y imprevistos grandes salen de aquí.',
    en: 'Protected savings. It grows. Goals and big surprises come from here.',
  },
  'env.useSav': { es: 'Usar ahorro', en: 'Use savings' },
  'env.changeName': { es: 'Cambiar nombre', en: 'Rename' },
  'env.saveName': { es: 'Guardar nombre', en: 'Save name' },
  'env.nameOk': { es: 'Nombre actualizado.', en: 'Name updated.' },
  'env.needName': { es: 'Pon un nombre.', en: 'Enter a name.' },
  'env.needAmount': { es: 'Pon un importe válido.', en: 'Enter a valid amount.' },
  'env.capOk': { es: 'Techo actualizado. Libre se reajusta solo.', en: 'Cap updated. Free readjusts on its own.' },
  'env.cycleCap': { es: 'Techo de este ciclo', en: 'Cap this cycle' },
  'env.editCap': { es: 'Editar techo', en: 'Edit cap' },
  'env.newCap': { es: 'Nuevo techo', en: 'New cap' },
  'env.addDaily': { es: 'Sumar al diario del mes', en: 'Add to daily' },
  'env.addDailyHint': {
    es: 'Se junta con Libre y se parte entre los días. El sobre pasa a Día a día en Inicio.',
    en: 'It joins Free and splits across the days. The envelope moves to Day to day on Home.',
  },
  'env.txs': { es: 'Movimientos', en: 'Activity' },
  'env.noTx': { es: 'Aún no hay movimientos en este ciclo.', en: 'No activity in this cycle yet.' },
  'env.edit': { es: 'editar', en: 'edit' },
  'env.delete': { es: 'borrar', en: 'delete' },
  'env.deleteTitle': { es: '¿Borrar este movimiento?', en: 'Delete this movement?' },
  'env.deleteBody': {
    es: 'Si era un gasto cubierto con ahorro o libre, también se deshace ese traspaso. Esto no se puede deshacer después (salvo “deshacer último” en ajustes, si era el último).',
    en: 'If it was covered with savings or Free, that transfer is undone too. You can’t undo this after (except “undo last” in Settings, if it was the last one).',
  },
  'env.txExpense': { es: 'Gasto', en: 'Spend' },
  'env.txIncome': { es: 'Ingreso', en: 'Income' },
  'env.txOut': { es: 'Salida a otro sobre', en: 'Sent to another envelope' },
  'env.txIn': { es: 'Entrada de otro sobre', en: 'From another envelope' },

  'sheet.add': { es: '+ Gasto', en: '+ Spend' },
  'sheet.when': { es: '¿Cuándo lo gastaste?', en: 'When did you spend it?' },
  'sheet.today': { es: 'Hoy', en: 'Today' },
  'sheet.yesterday': { es: 'Ayer', en: 'Yesterday' },
  'sheet.date': { es: 'Fecha', en: 'Date' },
  'sheet.note': { es: 'Nota', en: 'Note' },
  'sheet.amount': { es: 'Importe', en: 'Amount' },
  'sheet.envelope': { es: 'Sobre', en: 'Envelope' },
  'sheet.pick': { es: 'Elegir…', en: 'Choose…' },
  'sheet.save': { es: 'Anotar', en: 'Log it' },
  'sheet.reasonSav': { es: 'Motivo (sales del ahorro)', en: 'Reason (this comes from savings)' },
  'sheet.reasonCover': { es: 'Motivo (el extra sale del ahorro)', en: 'Reason (the extra comes from savings)' },
  'sheet.phSav': { es: 'Ej. urgente, arreglo, imprevisto…', en: 'E.g. emergency, repair, surprise…' },
  'sheet.phSpend': { es: 'ej. café, super, hobby…', en: 'e.g. coffee, groceries, hobby…' },
  'sheet.dayOver': {
    es: 'Pasa el techo de hoy. El día se cierra y el resto de esta semana bajará a ~{amount}/día.',
    en: 'This goes over today’s cap. The day closes and the rest of this week drops to ~{amount}/day.',
  },
  'sheet.weekOut': {
    es: 'Esto agota la semana. El extra saldría del ahorro, no de la semana siguiente.',
    en: 'This empties the week. The extra would come from savings, not next week.',
  },
  'sheet.fromFree': {
    es: 'Se descontarán {amount} de Libre. ¿De acuerdo?',
    en: '{amount} will come from Free. OK?',
  },
  'sheet.freeShort': {
    es: 'Libre no alcanza. El resto ({amount}) saldría del ahorro',
    en: 'Free isn’t enough. The rest ({amount}) would come from savings',
  },
  'sheet.needReason': { es: 'Escribe un motivo (mínimo 4 letras).', en: 'Write a reason (at least 4 characters).' },
  'sheet.notEnough': {
    es: 'No hay suficiente en Libre + Ahorro para cubrir el extra.',
    en: 'There isn’t enough in Free + Savings to cover the extra.',
  },
  'sheet.agree': { es: 'De acuerdo, anotar', en: 'OK, log it' },
  'sheet.edit': { es: 'Editar gasto', en: 'Edit spend' },
  'sheet.editHint': {
    es: 'Así no hace falta borrarlo y volverlo a meter. Si salió del ahorro, el traspaso se ajusta al nuevo importe.',
    en: 'No need to delete and log again. If it came from savings, the transfer is adjusted to the new amount.',
  },
  'sheet.saveEdit': { es: 'Guardar cambios', en: 'Save changes' },
  'sheet.cantEdit': { es: 'Ese movimiento no se puede editar.', en: 'That movement can’t be edited.' },
  'sheet.move': { es: 'Mover dinero', en: 'Move money' },
  'sheet.moveHint': {
    es: 'Para un fondo, un extra o para reforzar el ahorro. El dinero no desaparece: cambia de sobre.',
    en: 'For a goal, a top-up, or to grow savings. The money doesn’t vanish: it changes envelope.',
  },
  'sheet.from': { es: 'De', en: 'From' },
  'sheet.to': { es: 'A', en: 'To' },
  'sheet.moveSavReason': {
    es: 'Motivo (obligatorio: sales del ahorro)',
    en: 'Reason (required: this leaves savings)',
  },
  'sheet.movePh': { es: 'Ej. viaje urgente, reparación…', en: 'E.g. urgent trip, repair…' },
  'sheet.moveBtn': { es: 'Mover', en: 'Move' },
  'sheet.income': { es: 'Dinero extra', en: 'Extra money' },
  'sheet.incomeHint': {
    es: 'Un extra, un Bizum, una venta. Elige a qué sobre entra.',
    en: 'A bonus, a transfer, a sale. Choose which envelope it goes into.',
  },
  'sheet.incomeBtn': { es: 'Añadir ingreso', en: 'Add income' },
  'sheet.new': { es: 'Nuevo sobre', en: 'New envelope' },
  'sheet.newHint': {
    es: 'Cuota, techo o fondo. Libre se crea solo. Si el techo se suma al diario, aparece en Día a día.',
    en: 'Bill, cap or goal. Free is created for you. If the cap is added to daily, it shows under Day to day.',
  },
  'sheet.newPh': { es: 'Ej. Café, Netflix…', en: 'E.g. Coffee, Netflix…' },
  'sheet.create': { es: 'Crear sobre', en: 'Create envelope' },
  'sheet.addDaily': { es: 'Sumar al diario del mes', en: 'Add to daily' },
  'sheet.addDailyHint': {
    es: 'Se junta con Libre. El sobre va a Día a día.',
    en: 'It joins Free. The envelope goes to Day to day.',
  },

  'cycle.title': { es: 'Cerrar ciclo', en: 'Close cycle' },
  'cycle.lead': {
    es: 'Si no llegas al techo de un sobre, ese dinero no se pierde: al cerrar el ciclo pasa al ahorro o al fondo que elijas. Los fondos que ya tenían apartado se quedan como están.',
    en: 'If you don’t hit an envelope’s cap, that money isn’t lost: at close it goes to savings or the goal you pick. Goals that already had money stay as they are.',
  },
  'cycle.savNow': { es: 'Ahorro ahora: {amount}.', en: 'Savings now: {amount}.' },
  'cycle.left': { es: ' Residual de techos/cuotas/libre: {amount}.', en: ' Left in caps/bills/Free: {amount}.' },
  'cycle.fundsStay': { es: ' Fondos se quedan como están: {list}.', en: ' Goals stay as they are: {list}.' },
  'cycle.bring': { es: 'Traes {carried}', en: 'You bring {carried}' },
  'cycle.plusPay': { es: ' + sueldo {pay} = {pot}', en: ' + pay {pay} = {pot}' },
  'cycle.assign': {
    es: 'De ese total se asigna el mes nuevo. El ahorro no se reinicia.',
    en: 'The new cycle is assigned from that total. Savings does not reset.',
  },
  'cycle.where': { es: '¿A dónde va lo que sobró?', en: 'Where does the leftover go?' },
  'cycle.pay': { es: 'Sueldo que acaba de entrar', en: 'Pay that just arrived' },
  'cycle.when': { es: 'Fecha en que llegó', en: 'Date it arrived' },
  'cycle.next': { es: 'Próximo sueldo estimado', en: 'Next payday (estimate)' },
  'cycle.close': { es: 'Cerrar y abrir el siguiente', en: 'Close and open the next' },
  'cycle.home': { es: '← Inicio', en: '← Home' },

  'stats.title': { es: 'Estadísticas', en: 'Stats' },
  'stats.prev': { es: 'Meses anteriores', en: 'Previous cycles' },
  'stats.this': { es: 'Este ciclo', en: 'This cycle' },
  'stats.savedShape': { es: 'Qué forma este ahorro', en: 'What makes up this savings' },
  'stats.noSav': { es: 'Aún no hay ahorro que mostrar en este ciclo.', en: 'No savings to show this cycle yet.' },
  'stats.usedSav': {
    es: 'De esa suma hay que restar {used} que salieron del colchón → neto {net}.',
    en: 'Subtract {used} that left the cushion → net {net}.',
  },
  'stats.variable': { es: 'Variables: en qué se fue el techo', en: 'Variable: where the cap went' },
  'stats.variableHint': {
    es: 'Techos y Libre de este ciclo. Si no gastaste nada, no hay gráfico.',
    en: 'Caps and Free this cycle. If you spent nothing, there’s no chart.',
  },
  'stats.noVar': { es: 'Todavía no hay gastos variables.', en: 'No variable spending yet.' },
  'stats.spentOf': {
    es: 'Gastaste {spent} de {cap} en lo que sí cambia.',
    en: 'You spent {spent} of {cap} on what actually moves.',
  },
  'stats.touched': { es: 'Si tocaste el ahorro', en: 'If you touched savings' },
  'stats.touchedHint': {
    es: 'Aquí ves cuánto salió del ahorro y a qué fondo o gasto se fue.',
    en: 'Here you see how much left savings and which goal or spend it went to.',
  },
  'stats.untouched': {
    es: 'Este ciclo no tocaste el ahorro. El colchón sigue quieto.',
    en: 'You didn’t touch savings this cycle. The cushion is still.',
  },
  'stats.leftSav': { es: 'Salieron {amount} del colchón.', en: '{amount} left the cushion.' },
  'stats.netSav': { es: 'Ahorro neto', en: 'Net savings' },
  'stats.noChart': { es: 'Nada que graficar aún.', en: 'Nothing to chart yet.' },

  'logic.logged': { es: 'Anotado', en: 'Logged' },
  'logic.loggedOk': { es: 'El gasto quedó registrado.', en: 'The spend was saved.' },
  'logic.loggedIn': { es: 'Quedó en {name} el {when}.', en: 'Logged in {name} on {when}.' },
  'logic.loggedDay': { es: 'Anotado el {when}', en: 'Logged {when}' },
  'logic.weekOverTitle': { es: 'Esa semana vas por encima del consejo', en: 'That week is over the pacing' },
  'logic.weekBody': {
    es: 'Semana {label}: {spent} de ~{target} (consejo para que dure el mes) en {name}. El techo de verdad es el del mes.',
    en: 'Week {label}: {spent} of ~{target} (pacing so the month lasts) in {name}. The real cap is the cycle.',
  },
  'logic.dayOver': {
    es: 'Ese día el techo era ~{cap} y gastaste {spent}. El exceso se resta de los días que quedan de ESTA semana, no de todo el mes.',
    en: 'That day’s cap was ~{cap} and you spent {spent}. The extra comes off the rest of THIS week, not the whole cycle.',
  },
  'logic.dayOk': {
    es: 'Ese día en {name}: {spent}. Techo del día ~{cap}. Lo que no uses hoy suma a los días que quedan de esta semana (finde); al cerrar la semana no infla la siguiente.',
    en: 'That day in {name}: {spent}. Day cap ~{cap}. What you don’t use today stays for the rest of this week; closing the week does not inflate the next one.',
  },
  'logic.pickEnv': { es: 'Elige un sobre.', en: 'Pick an envelope.' },
  'logic.needAmt': { es: 'Pon un importe.', en: 'Enter an amount.' },
  'logic.weekMonthOver': {
    es: 'No cabe en el techo del mes de {name}. Te pasas por {over}.',
    en: 'It doesn’t fit {name}’s cycle cap. You’re over by {over}.',
  },
  'logic.weekTight': {
    es: 'Cabe en el mes ({left}). Consejo de esta semana ~{target}; con esto llevarías {after}.',
    en: 'It fits the cycle ({left}). This week’s pacing ~{target}; this would take you to {after}.',
  },
  'logic.weekOk': {
    es: 'Consejo esta semana ~{target} (llevas {after}). En el mes quedarían {left}.',
    en: 'This week’s pacing ~{target} (you’d be at {after}). {left} would remain in the cycle.',
  },
  'logic.savOver': {
    es: 'Esto come el ahorro y lo deja en {left}.',
    en: 'This eats into savings and leaves it at {left}.',
  },
  'logic.savTight': {
    es: 'Sale del ahorro protegido. Quedarían {left}.',
    en: 'This comes from protected savings. {left} would remain.',
  },
  'logic.noFit': { es: 'No cabe en {name}. Te pasas por {over}.', en: 'It doesn’t fit {name}. You’re over by {over}.' },
  'logic.goalOk': {
    es: 'Sale de lo apartado en {name}. Quedarían {left} en el fondo.',
    en: 'This comes from what’s set aside in {name}. {left} would remain in the goal.',
  },
  'logic.goalEmpty': {
    es: 'En {name} no hay apartado. Este gasto sale del ahorro.',
    en: 'Nothing is set aside in {name}. This spend comes from savings.',
  },
  'logic.tightFit': {
    es: 'Cabe, pero {name} queda justo: {left}.',
    en: 'It fits, but {name} will be tight: {left}.',
  },
  'logic.fits': { es: 'Cabe. En {name} quedarían {left}.', en: 'It fits. {left} would remain in {name}.' },
  'logic.monthHard': { es: 'Mes difícil', en: 'Tough cycle' },
  'logic.monthHardDown': {
    es: 'El colchón bajó: salió más del ahorro de lo que este ciclo aportó.',
    en: 'The cushion dropped: more left savings than this cycle put in.',
  },
  'logic.monthHardLow': {
    es: 'Ahorraste menos de la mitad de tu meta. El mes se comió el plan.',
    en: 'You saved less than half your goal. The cycle ate the plan.',
  },
  'logic.monthGood': { es: 'Mes bueno', en: 'Good cycle' },
  'logic.monthGoodClean': {
    es: 'Llegaste a la meta y no tocaste el ahorro extra. Eso es control.',
    en: 'You hit the goal and didn’t touch extra savings. That’s control.',
  },
  'logic.monthGoodUsed': {
    es: 'La meta se cumple, aunque parte del ahorro se usó en un fondo o un imprevisto.',
    en: 'The goal is met, even though some savings went to a goal or a surprise.',
  },
  'logic.monthOk': { es: 'Mes correcto', en: 'Solid cycle' },
  'logic.monthOkDetail': { es: 'Vas al {pct}% de tu meta de ahorro. Casi.', en: 'You’re at {pct}% of your savings goal. Close.' },
  'logic.monthTight': { es: 'Mes justo', en: 'Tight cycle' },
  'logic.monthTightDetail': {
    es: 'Ahorraste, pero por debajo de lo que te habías propuesto.',
    en: 'You saved, but less than you meant to.',
  },
  'logic.other': { es: 'Otros', en: 'Other' },
  'logic.leftoverOf': { es: 'Sobra de {name}', en: 'Left from {name}' },
  'logic.savSet': { es: 'Ahorro apartado', en: 'Savings set aside' },

  'store.noCycle': { es: 'No hay un ciclo abierto.', en: 'No cycle is open.' },
  'store.needName': { es: 'Pon un nombre.', en: 'Enter a name.' },
  'store.unique': {
    es: 'Ahorro y Libre ya están en el plan.',
    en: 'Savings and Free are already in the plan.',
  },
  'store.negFree': {
    es: 'Ese importe no cabe: Libre quedaría en negativo. Baja el importe.',
    en: 'That amount doesn’t fit: Free would go negative. Lower the amount.',
  },
  'store.badFile': { es: 'Ese archivo no es una copia de Techo.', en: 'That file isn’t a Techo backup.' },
  'store.incomplete': { es: 'La copia está incompleta o dañada.', en: 'The backup is incomplete or damaged.' },
  'store.readFail': { es: 'No pude leer el archivo. ¿Es el techo-backup.json?', en: 'Couldn’t read the file. Is it techo-backup.json?' },
  'store.paid': { es: 'Pagado', en: 'Paid' },
  'store.coveredFree': { es: 'Extra cubierto con Libre', en: 'Extra covered with Free' },
  'store.moved': { es: 'Reasignado', en: 'Reassigned' },
} as const

export type MsgKey = keyof typeof msg

export function t(locale: Locale, key: MsgKey, vars?: Record<string, string | number>): string {
  const row = msg[key]
  let s: string = locale === 'en' ? row.en : row.es
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
  }
  return s
}

export function intlTag(locale: Locale): string {
  return locale === 'en' ? 'en-US' : 'es-ES'
}

export function weekdayName(locale: Locale, day: number): string {
  const i = ((day % 7) + 7) % 7
  return t(locale, `weekday.${i}` as MsgKey)
}
