<h1 align="center">RAVAL FIGHTER</h1>

<p align="center"><b>Una historia de barrio.</b> DEMO: Juego de lucha arcade 2D en pixel art ambientado en El Raval, Barcelona.</p>

<p align="center">
  <a href="https://freddysae0.github.io/raval-fighter/"><img src="https://img.shields.io/badge/▶_Jugar_en_el_navegador-ff5c5c?style=for-the-badge" alt="Jugar"></a>
</p>

<p align="center"><img src="docs/title.png" alt="Pantalla de título de Raval Fighter" width="820"></p>

HTML5 Canvas + WebAudio, **sin dependencias**: todo el arte y el sonido se generan por código. Modo historia con 5 combates por el Raval, pelea rápida, tres dificultades y controles de teclado y ratón.

<table>
  <tr>
    <td><img src="docs/fight.png" alt="Combate en Carrer de l'Hospital"></td>
    <td><img src="docs/rival-select.png" alt="Selección de rival"></td>
  </tr>
  <tr>
    <td align="center"><sub>Ronda 1 contra El Fumeta, Carrer de l'Hospital</sub></td>
    <td align="center"><sub>Pelea rápida: elige rival</sub></td>
  </tr>
</table>

## Cómo jugar

Juega online en **[freddysae0.github.io/raval-fighter](https://freddysae0.github.io/raval-fighter/)** o en local:

```
python serve.py
```
Abre http://localhost:8765 (también funciona abriendo `index.html` directamente).

Se juega con **teclado y ratón**, con los mismos controles que la versión completa del juego:

| Control | Acción |
|---|---|
| A / D | Andar sin girarse (hacia atrás = bloquear) |
| Ratón | El luchador mira hacia el cursor (se dibuja una mira de pixel art) |
| Shift | Correr |
| Espacio | Saltar |
| W | Mirar arriba · W + clic izq. = gancho |
| S | Agacharse (S + atrás = bloqueo bajo) |
| Clic izquierdo | Puñetazo (×2 = combo) |
| Clic derecho | Patada (S + clic der. = barrido) |
| Rueda ↑ | ¡Chanclazo! (el especial) |
| Rueda ↓ | Cargar energía: llena la barra del súper, lento y arriesgado (no puedes bloquear y recibes más daño) |
| F | Súper (con la barra azul llena): ¡Furia Latina! |
| Enter | Confirmar / pasar diálogo |
| Esc / P | Pausa · saltar escena |
| M | Sonido on/off |

«Adelante» y «atrás» dependen de hacia dónde mires: con el cursor detrás de ti, andar hacia él es avanzar y alejarte es retroceder (bloquear). Las flechas solo sirven para moverse por los menús. Dentro de un iframe, haz clic en el juego para darle el foco: mientras lo tenga, la rueda no hace scroll en la página.

## Historia
Eliges tu país → despedida en el aeropuerto (la abuela te da la chancla) → vuelo y la bandera en El Prat → llegada al metro de Liceu → 5 combates por el Raval hasta el Airbnb:

1. **El Fumeta** — Carrer de l'Hospital (tarde) — *"Amigo... ¿tiene cigarro?"*
2. **El Latero** — Rambla del Raval (atardecer) — *"¡Cerveza, beer, un euro!"*
3. **La Carterista** — Plaça dels Àngels / MACBA (anochecer) — *"Oye guapo, ¿me haces una foto?"*
4. **El Relojero** — Carrer de Joaquín Costa (noche) — *"Amigo, amigo... ¿tiene hora?"*
5. **El Brayan** (jefe) — Carrer de la Riera Baixa (lluvia) — *"Amigo... ¿tú de dónde eres?"*

Modo **Pelea rápida** en el menú para elegir rival directamente.

**Dificultad:** Fácil / Medio / Difícil, seleccionable en el menú principal y en el menú de pausa (se aplica al momento y se guarda para la próxima vez).

## Estructura
- `js/core.js` — canvas, utilidades, texto pixel, input (teclado y ratón, mira de pixel art), efectos
- `js/audio.js` — sintetizador chiptune (pulso/triángulo/ruido), SFX y secuenciador de música
- `js/art.js` — personajes: esqueleto + poses con keyframes rasterizados a pixel art, caras, retratos (Scale2x)
- `js/world.js` — escenarios procedurales con parallax, suelo en perspectiva, público, palomas, lluvia
- `js/fight.js` — luchadores, frame data, IA, proyectiles, HUD
- `js/story.js` — escenas, diálogos y flujo de la historia
- `js/main.js` — bucle principal (60 Hz fijo). Atajos dev: `#airport`, `#flight`, `#arrival`, `#stage=0..4`, `#fight=0..4`, `#ending`, `#quick`
