# Extension local de la Constitution (MyStudyDiary)

- [ADD] LOCAL-1: HTML, CSS y JS puros, sin dependencias ni paso de build; la app funciona abriendo index.html con doble clic.
- [ADD] LOCAL-2: Nada se implementa si no esta en la spec activa; si falta una decision, se para y se pregunta.
- [ADD] LOCAL-3: Los calculos (fechas, rachas, estadisticas) son funciones puras, sin DOM ni localStorage, y reciben "hoy" como parametro.
- [ADD] LOCAL-4: La logica se prueba con `node --test` sin instalar paquetes; no se avanza con tests en rojo.
- [ADD] LOCAL-5: Los datos del usuario son sagrados: localStorage con compatibilidad hacia atras y hora local; nunca se pierde una sesion.
- [ADD] LOCAL-6: Codigo en ingles; interfaz y documentacion en espanol.
