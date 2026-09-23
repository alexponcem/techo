# Techo

App de control de gastos por sobres: el sueldo entra, el ahorro se reserva primero, cada gasto resta de su techo y te dice si cabe.

Los datos se guardan en el navegador de cada persona. No hay cuentas ni servidor.

## Arrancar en el PC

```bash
cd techo
npm install
npm run dev
```

Abre `http://localhost:5173`.

En internet (móvil, sin el PC): https://alexponcem.github.io/techo/

## Usarla en el móvil (misma Wi‑Fi)

1. Arranca con `npm run dev`.
2. En la terminal aparece una URL tipo `http://192.168.x.x:5173`.
3. Ábrela en el Safari/Chrome del móvil.
4. En iPhone: Compartir → **Añadir a pantalla de inicio**.
5. En Android: menú → **Instalar app** / Añadir a pantalla de inicio.

## Cómo se usa

Al crear el plan, el sueldo se reparte en cuotas, techos y fondos. Libre se calcula solo con lo que queda. Los techos semanales eligen el día en que empieza su semana; el diario va de lunes a domingo (se puede cambiar en Ajustes).
