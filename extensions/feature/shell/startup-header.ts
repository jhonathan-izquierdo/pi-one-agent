import { readFileSync } from "node:fs";
import { InteractiveMode, VERSION, type AppKeybinding } from "@earendil-works/pi-coding-agent";
import { getKeybindings } from "@earendil-works/pi-tui";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { config } from "../../config/config.ts";
import { stripAnsi } from "../../utils/ansi-text.ts";
import {
	EARLY_STARTUP_HEADER_PATCH,
	EARLY_STARTUP_HEADER_SWAP_KEY,
	patchRegistry,
} from "../../utils/patch-keys.ts";
type StyledPart = {
	raw: string;
	styled: string;
};

function loadOfficialLogo(): string[] {
	const content = readFileSync(new URL("../../../assets/pi-logo-2.txt", import.meta.url), "utf8")
		.replace(/\r\n/g, "\n");
	return content.split("\n").filter((line, index, lines) => index < lines.length - 1 || line.length > 0);
}

// The header always uses the supplied, official Pi-One Agent logo without redrawing or simplifying it.
const OFFICIAL_LOGO_LINES = loadOfficialLogo();

type NeonColor = { r: number; g: number; b: number };

const NEON_STOPS: readonly NeonColor[] = [
	{ r: 0, g: 255, b: 255 },
	{ r: 0, g: 145, b: 255 },
	{ r: 115, g: 45, b: 255 },
	{ r: 255, g: 0, b: 230 },
];

function neonColorAt(column: number, logoWidth: number): NeonColor {
	const position = (column / Math.max(logoWidth - 1, 1)) * (NEON_STOPS.length - 1);
	const start = Math.min(Math.floor(position), NEON_STOPS.length - 2);
	const blend = position - start;
	const from = NEON_STOPS[start]!;
	const to = NEON_STOPS[start + 1]!;
	return {
		r: Math.round(from.r + (to.r - from.r) * blend),
		g: Math.round(from.g + (to.g - from.g) * blend),
		b: Math.round(from.b + (to.b - from.b) * blend),
	};
}

function renderOfficialLogoLine(
	line: string,
	width: number,
	theme: { style(text: string, options: { fg: { kind: "rgb"; r: number; g: number; b: number } }): string },
): string {
	const logoWidth = Math.max(...OFFICIAL_LOGO_LINES.map((logoLine) => logoLine.length));
	return [...line.slice(0, width)]
		.map((glyph, column) =>
			glyph === " "
				? glyph
				: theme.style(glyph, { fg: { kind: "rgb", ...neonColorAt(column, logoWidth) } }),
		)
		.join("");
}

// Branded startup message, replacing Pi's generic hero line.
const HERO_PREFIX = "Your Pi, ";
const HERO_HIGHLIGHT = "your way";
const HERO_SUFFIX = "."


function getVisibleLength(text: string): number {
	return [...stripAnsi(text)].length;
}


function createCenteredStyledLine(parts: StyledPart[], width: number): string {
	const rawText = parts.map((part) => part.raw).join("");
	const leftPadding = Math.max(0, Math.floor((width - [...rawText].length) / 2));
	const styledText = parts.map((part) => part.styled).join("");
	return `${" ".repeat(leftPadding)}${styledText}`;
}

function fitLineToWidth(line: string, width: number): string {
	if (getVisibleLength(line) <= width) {
		return line;
	}

	return stripAnsi(line).slice(0, width);
}

// ---- 右侧：产品名称、快捷键与提示；按键文本随用户 keybindings 动态渲染 ----

function formatKeyPart(part: string): string {
	// 与 pi 内置 keybinding-hints 一致：macOS 上 alt 显示为 option
	return process.platform === "darwin" && part.toLowerCase() === "alt" ? "option" : part;
}

function formatKeyText(key: string): string {
	return key
		.split("/")
		.map((part) => part.split("+").map(formatKeyPart).join("+"))
		.join("/");
}

function keyText(keybinding: AppKeybinding): string {
	const keys = getKeybindings().getKeys(keybinding);
	return keys.length === 0 ? "" : formatKeyText(keys.join("/"));
}

function renderNativeLines(theme: {
	fg(name: string, text: string): string;
	bold(text: string): string;
}): string[] {
	// 保持键位低调，让产品名称与提示更醒目。
	const hint = (keybinding: AppKeybinding, description: string) =>
		theme.fg("dim", keyText(keybinding)) + theme.fg("muted", ` ${description}`);
	const rawHint = (key: string, description: string) =>
		theme.fg("dim", formatKeyText(key)) + theme.fg("muted", ` ${description}`);

	const productName =
		theme.bold(theme.fg("accent", "PI-ONE")) +
		theme.fg("muted", ` Agent  ·  v${VERSION}`);
	const compact = [
		hint("app.interrupt", "interrupt"),
		rawHint(`${keyText("app.clear")}/${keyText("app.exit")}`, "clear/exit"),
		rawHint("/", "commands"),
		rawHint("!", "bash"),
		hint("app.tools.expand", "more"),
	].join(theme.fg("muted", " · "));

	return [
		productName,
		compact,
		theme.fg(
			"dim",
			`Press ${keyText("app.tools.expand")} to show full startup help and loaded resources.`,
		),
		"",
		// hero 文案替换原生 "Pi can explain..." 行位置
		renderHeroParts(theme)
			.map((part) => part.styled)
			.join(""),
	];
}

function renderHeroParts(theme: {
	fg(name: string, text: string): string;
	bold(text: string): string;
}): StyledPart[] {
	return [
		{ raw: HERO_PREFIX, styled: theme.fg("accent", HERO_PREFIX) },
		{ raw: HERO_HIGHLIGHT, styled: theme.bold(theme.fg("mdLink", HERO_HIGHLIGHT)) },
		{ raw: HERO_SUFFIX, styled: theme.fg("accent", HERO_SUFFIX) },
	];
}

export function renderHeaderLines(
	width: number,
	theme: {
		fg(name: string, text: string): string;
		bold(text: string): string;
		style(text: string, options: { fg: { kind: "rgb"; r: number; g: number; b: number } }): string;
	},
): string[] {
	const information = renderNativeLines(theme);
	const heroLine = createCenteredStyledLine(renderHeroParts(theme), width);

	// Do not redraw, simplify, or replace the official artwork. The source art is clipped before
	// styling on narrow terminals, so its visible glyphs retain the official neon gradient.
	return [
		...OFFICIAL_LOGO_LINES.map((line) => renderOfficialLogoLine(line, width, theme)),
		"",
		...information.slice(0, 3).map((line) => fitLineToWidth(line, width)),
		heroLine,
	];
}

/** 官方 setHeader 的组件工厂：theme 由宿主注入。 */
function headerFactory(): (
	tui: unknown,
	theme: any,
) => {
	render(width: number): string[];
	invalidate(): void;
} {
	return (_tui: unknown, theme: any) => ({
		render(width: number): string[] {
			return renderHeaderLines(width, theme);
		},
		invalidate() {},
	});
}

/** 按配置安装启动头。禁用时不碰槽位，避免清掉其他扩展的 header。 */
export function applyStartupHeader(ctx: any): void {
	if (!ctx?.hasUI || typeof ctx.ui?.setHeader !== "function" || !config.showStartupHeader) {
		return;
	}
	ctx.ui.setHeader(headerFactory());
}

type EarlyHeaderPatch = {
	active: boolean;
	original: (...args: any[]) => unknown;
	installed: (...args: any[]) => unknown;
};

type HeaderContainerSwap = {
	original: (child: any) => unknown;
	installed: (child: any) => unknown;
};

/**
 * Pi 在 session_start 之前就把原生启动头画上去了：init() 先建 header 再 requestRender，
 * 之后才 await 工具检查、加载扩展，所以扩展最早只能到 session_start 换头，启动时会闪一下原生头。
 * 这里补 init，在原生 header 刚进容器的瞬间换成 ccstyle 的，首次绘制就已经是我们的。
 * 判定用 child === mode.builtInHeader，不依赖类名；配置关掉时不碰槽位，保留原生头。
 */
export function installEarlyStartupHeader(): void {
	const prototype = (InteractiveMode as any)?.prototype;
	if (!prototype || typeof prototype.init !== "function") return;
	const previous = patchRegistry.get<EarlyHeaderPatch>(EARLY_STARTUP_HEADER_PATCH);
	if (previous) previous.active = false;
	const original =
		previous && prototype.init === previous.installed ? previous.original : prototype.init;
	const patch: EarlyHeaderPatch = {
		active: true,
		original,
		installed: async function (this: any, ...args: any[]) {
			installHeaderContainerSwap(this, patch);
			return original.apply(this, args);
		},
	};
	prototype.init = patch.installed;
	patchRegistry.install(EARLY_STARTUP_HEADER_PATCH, patch);
}

/** 只包一次 headerContainer.addChild；/reload 后按所有权接管旧包装。 */
function installHeaderContainerSwap(mode: any, patch: EarlyHeaderPatch): void {
	const container = mode?.headerContainer;
	if (!container || typeof container.addChild !== "function") return;
	const previous = container[EARLY_STARTUP_HEADER_SWAP_KEY] as HeaderContainerSwap | undefined;
	const original =
		previous && container.addChild === previous.installed
			? previous.original
			: container.addChild.bind(container);
	const installed = function (child: any) {
		const result = original(child);
		if (!patch.active || !config.showStartupHeader || child !== mode.builtInHeader) return result;
		if (typeof mode.setExtensionHeader !== "function") return result;
		try {
			mode.setExtensionHeader(headerFactory());
		} catch {
			// 换头失败就退回原生 header，不影响启动
		}
		return result;
	};
	container.addChild = installed;
	container[EARLY_STARTUP_HEADER_SWAP_KEY] = { original, installed };
}

/** 用户从 /pi-style 关掉本扩展启动头时，恢复官方 header。 */
export function clearStartupHeader(ctx: any): void {
	if (!ctx?.hasUI || typeof ctx.ui?.setHeader !== "function") return;
	ctx.ui.setHeader(undefined);
}

export default function piStartupHeader(pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		applyStartupHeader(ctx);
	});

	pi.on("session_shutdown", async (_event, ctx) => {
		if (!ctx.hasUI) return;

		ctx.ui.setHeader(undefined);
	});
}
