# ¿Quién mató a la gallina?

Juego móvil de deducción (React Native 0.74, Android) basado en el juego de cartas homónimo: lee los testimonios de los sospechosos, ten en cuenta que los **mentirosos** dicen lo contrario y que los **testigos** cambian cómo se leen las cartas, y descubre quiénes son los asesinos y los mentirosos.

Modos: **Solitario**, **Reto diario** (semilla del día), **Cooperativo** y **Versus** local (2–4 jugadores por Wi-Fi, sin Internet).

Informe de auditoría que originó esta versión: [`AUDITORIA_Y_MEJORAS.md`](AUDITORIA_Y_MEJORAS.md) / `.pdf`.

## Arquitectura

```
App.tsx                 shell (providers + navegación)
src/domain/             TypeScript PURO (sin react-native): AST de testimonios, readAs (testigos),
                        holds, findModels (solver exacto), generateCase → Result, explain, RNG con semilla
src/net/                multijugador: protocolo NDJSON + zod, HostSession (autoritativo) / ClientSession,
                        TcpTransport y LoopbackTransport, código de sala, latido, reloj sincronizado
src/state/              Zustand + persistencia (Continuar partida)
src/ui/                 sistema de diseño (tokens de madera/pergamino/latón, iconos SVG, cartas 3D, Sheet…)
src/features/           pantallas: home, setup, lobby, game (board, sheets, result), meta
src/app/                navegación tipada (React Navigation native-stack)
__tests__/              dominio, paridad con el motor antiguo, red (loopback), store, smoke de la app
```

## Comandos

```bash
npm install
npm run typecheck   # tsc --noEmit (strict, 0 any)
npm run lint
npm test            # dominio + paridad (1 057 536 evaluaciones) + red + store + app
npm start           # Metro
npm run android     # instalar en un dispositivo/emulador
cd android && ./gradlew assembleRelease   # APK firmado en app/build/outputs/apk/release
```

Requisitos Android: JDK 17+ (probado con 21), SDK 34, NDK 26.1.10909125. La firma de *release* se lee de `android/keystore.properties` (no versionado).

## Multijugador local

El anfitrión crea una sala y obtiene un **código de 7 caracteres** que codifica su dirección y puerto; el código nunca viaja por la red (se demuestra con HMAC). El invitado prueba primero la dirección codificada y, si hace falta, barre su subred real de forma acotada y cancelable. Latido cada 2 s, reconexión automática con `resumeToken` durante 60 s y reloj sincronizado para una salida simultánea en Versus.
