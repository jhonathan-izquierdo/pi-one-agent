import { readFileSync } from "node:fs";
import type { ExtensionAPI, Theme } from "@earendil-works/pi-coding-agent";
import { matchesKey, visibleWidth } from "@earendil-works/pi-tui";

function loadLogo(path: string): string[] {
  const logo = readFileSync(new URL(path, import.meta.url), "utf8").replace(/\r\n/g, "\n");
  return logo.split("\n").filter((line, index, lines) => index < lines.length - 1 || line.length > 0);
}

const officialLogo = loadLogo("../assets/pi-logo-2.txt");
const logos = {
  "pi-logo": { lines: officialLogo, colorEveryGlyph: true, maxHeight: 32 },
  "pi-logo-2": { lines: officialLogo, colorEveryGlyph: true, maxHeight: 32 },
};

// Neon hues sampled from the supplied banner: cyan Pi mark flowing into blue, violet, and magenta text.
const neonStops = [
  { r: 0, g: 255, b: 255 },
  { r: 0, g: 145, b: 255 },
  { r: 115, g: 45, b: 255 },
  { r: 255, g: 0, b: 230 },
];

function colorAt(column: number, logoWidth: number) {
  const position = (column / Math.max(logoWidth - 1, 1)) * (neonStops.length - 1);
  const start = Math.min(Math.floor(position), neonStops.length - 2);
  const blend = position - start;
  const from = neonStops[start];
  const to = neonStops[start + 1];
  return {
    kind: "rgb" as const,
    r: Math.round(from.r + (to.r - from.r) * blend),
    g: Math.round(from.g + (to.g - from.g) * blend),
    b: Math.round(from.b + (to.b - from.b) * blend),
  };
}

function renderLogo(
  theme: Theme,
  lines: string[],
  startColumn: number,
  width: number,
  colorEveryGlyph: boolean,
): string[] {
  const logoWidth = Math.max(...lines.map((line) => visibleWidth(line)));
  return lines.map((line) => {
    const glyphs = Array.from(line);
    let visualColumn = 0;
    let rendered = "";
    let activeColor: ReturnType<typeof colorAt> | undefined;
    let segment = "";

    const flush = () => {
      if (!segment) return;
      rendered += activeColor ? theme.style(segment, { fg: activeColor }) : segment;
      segment = "";
    };

    for (const glyph of glyphs) {
      const glyphWidth = visibleWidth(glyph);
      const column = visualColumn;
      visualColumn += glyphWidth;
      if (column + glyphWidth <= startColumn || column >= startColumn + width) continue;
      const leftPadding = Math.max(0, startColumn - column);
      const rightPadding = Math.max(0, column + glyphWidth - (startColumn + width));
      const visibleGlyph = " ".repeat(leftPadding) + glyph + " ".repeat(rightPadding);
      const nextColor = (colorEveryGlyph ? glyph !== " " : glyph === "█")
        ? colorAt(column, logoWidth)
        : undefined;
      if (
        nextColor?.r !== activeColor?.r ||
        nextColor?.g !== activeColor?.g ||
        nextColor?.b !== activeColor?.b
      ) {
        flush();
        activeColor = nextColor;
      }
      segment += visibleGlyph;
    }
    flush();
    return rendered.trimEnd();
  });
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", (_event, ctx) => {
    // Make Halcy-one the package default while preserving an explicit user or CLI theme choice.
    if (ctx.mode === "tui" && ctx.ui.theme.name === "system") {
      ctx.ui.setTheme("halcy-one");
    }
  });

  for (const [command, config] of Object.entries(logos)) {
    const logoWidth = Math.max(...config.lines.map((line) => visibleWidth(line)));
    const description = command === "pi-logo"
      ? "Muestra el logo oficial ASCII neón de Pi-One Agent"
      : "Alias del logo oficial ASCII neón de Pi-One Agent";

    pi.registerCommand(command, {
      description,
      handler: async (_args, ctx) => {
        if (ctx.mode !== "tui") {
          ctx.ui.notify(config.lines.join("\n"), "info");
          return;
        }

        await ctx.ui.custom((_tui, theme, _keybindings, done) => {
          let startColumn = 0;
          return {
            render: (width: number) => {
              const viewportWidth = Math.max(1, Math.min(width, logoWidth));
              startColumn = Math.min(startColumn, Math.max(0, logoWidth - viewportWidth));
              return [
                ...renderLogo(theme, config.lines, startColumn, viewportWidth, config.colorEveryGlyph),
                theme.fg("dim", "←/→ desplazar · Enter/Esc cerrar"),
              ];
            },
            invalidate: () => {},
            handleInput: (data: string) => {
              if (matchesKey(data, "enter") || matchesKey(data, "escape")) {
                done(undefined);
              } else if (matchesKey(data, "left")) {
                startColumn = Math.max(0, startColumn - 12);
              } else if (matchesKey(data, "right")) {
                startColumn = Math.min(logoWidth - 1, startColumn + 12);
              }
            },
          };
        }, {
          overlay: true,
          overlayOptions: {
            width: "95%",
            maxHeight: config.maxHeight,
            anchor: "center",
            margin: 1,
          },
        });
      },
    });
  }
}
