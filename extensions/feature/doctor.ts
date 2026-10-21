import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { CONFIG_PATH } from "../config/config.ts";

type CheckStatus = "OK" | "WARN" | "FAIL";
type DoctorCheck = { status: CheckStatus; label: string; detail: string };

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function readJson(path: string): unknown {
	return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function locatePackageJson(packageName: string): string | undefined {
	try {
		let directory = dirname(fileURLToPath(import.meta.resolve(packageName)));
		while (true) {
			const candidate = join(directory, "package.json");
			if (existsSync(candidate)) {
				const metadata = readJson(candidate) as { name?: unknown };
				if (metadata.name === packageName) return candidate;
			}
			const parent = dirname(directory);
			if (parent === directory) return undefined;
			directory = parent;
		}
	} catch {
		return undefined;
	}
}

function packageChecks(packageRoot: string): DoctorCheck[] {
	const manifestPath = join(packageRoot, "package.json");
	let manifest: Record<string, any>;
	try {
		const parsed = readJson(manifestPath);
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid package metadata");
		manifest = parsed as Record<string, any>;
	} catch {
		return [
			{
				status: "FAIL",
				label: "Pi-One package",
				detail: "No se pudo leer package.json; revisa la instalación del paquete.",
			},
		];
	}

	const checks: DoctorCheck[] = [
		{
			status: manifest.name === "pi-one-agent" ? "OK" : "FAIL",
			label: "Pi-One package",
			detail:
				typeof manifest.version === "string"
					? `${manifest.name ?? "nombre desconocido"} v${manifest.version}`
					: `${manifest.name ?? "nombre desconocido"}; versión no declarada`,
		},
	];

	const listedFiles = [
		...(Array.isArray(manifest.pi?.extensions) ? manifest.pi.extensions : []),
		...(Array.isArray(manifest.pi?.themes) ? manifest.pi.themes : []),
	];
	const missingFiles = listedFiles.filter(
		(path): path is string => typeof path === "string" && !existsSync(resolve(packageRoot, path)),
	);
	checks.push({
		status: missingFiles.length ? "FAIL" : "OK",
		label: "Archivos del paquete",
		detail: missingFiles.length
			? `Faltan: ${missingFiles.join(", ")}`
			: `${listedFiles.length} extensiones/temas declarados encontrados`,
	});

	const invalidThemes: string[] = [];
	for (const theme of Array.isArray(manifest.pi?.themes) ? manifest.pi.themes : []) {
		if (typeof theme !== "string") continue;
		try {
			readJson(resolve(packageRoot, theme));
		} catch {
			invalidThemes.push(theme);
		}
	}
	checks.push({
		status: invalidThemes.length ? "FAIL" : "OK",
		label: "Temas",
		detail: invalidThemes.length
			? `JSON inválido o ilegible: ${invalidThemes.join(", ")}`
			: `${Array.isArray(manifest.pi?.themes) ? manifest.pi.themes.length : 0} temas válidos`,
	});

	const dependencies = Object.keys(manifest.dependencies ?? {});
	const missingDependencies = dependencies.filter((name) => {
		try {
			import.meta.resolve(name);
			return false;
		} catch {
			return true;
		}
	});
	checks.push({
		status: missingDependencies.length ? "WARN" : "OK",
		label: "Dependencias",
		detail: missingDependencies.length
			? `No resueltas: ${missingDependencies.join(", ")}`
			: `${dependencies.length} dependencias declaradas resueltas`,
	});
	return checks;
}

function configCheck(path: string): DoctorCheck {
	if (!existsSync(path)) {
		return { status: "OK", label: "Configuración", detail: "No existe; Pi-One usará valores predeterminados." };
	}
	try {
		const parsed = readJson(path);
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid config shape");
		return { status: "OK", label: "Configuración", detail: "pi-one-agent.json existe y contiene un objeto JSON válido." };
	} catch {
		return {
			status: "WARN",
			label: "Configuración",
			detail: "pi-one-agent.json no se puede leer como JSON; Pi-One usará valores predeterminados.",
		};
	}
}

export function collectDoctorChecks(options: {
	packageRoot?: string;
	configPath?: string;
	piPackageJson?: string;
} = {}): DoctorCheck[] {
	const packageRoot = options.packageRoot ?? PACKAGE_ROOT;
	const piPackageJson = options.piPackageJson ?? locatePackageJson("@earendil-works/pi-coding-agent");
	let piVersion = "no detectada";
	if (piPackageJson) {
		try {
			const metadata = readJson(piPackageJson) as { version?: unknown };
			if (typeof metadata.version === "string") piVersion = metadata.version;
		} catch {
			piVersion = "metadatos ilegibles";
		}
	}

	return [
		{
			status: piPackageJson ? "OK" : "WARN",
			label: "Pi Coding Agent",
			detail: `versión ${piVersion}`,
		},
		{
			status: process.versions.node ? "OK" : "WARN",
			label: "Node.js",
			detail: process.versions.node || "versión no disponible",
		},
		{
			status: "OK",
			label: "Entorno",
			detail: `${process.platform} · ${process.arch} · ${process.env.PI_CODING_AGENT_DIR ? "directorio Pi personalizado" : `directorio predeterminado (${join(homedir(), ".pi", "agent")})`}`,
		},
		...packageChecks(packageRoot),
		configCheck(options.configPath ?? CONFIG_PATH),
	];
}

export function formatDoctorReport(checks: readonly DoctorCheck[]): string {
	const failed = checks.filter((check) => check.status === "FAIL").length;
	const warned = checks.filter((check) => check.status === "WARN").length;
	const summary = failed ? `${failed} problema(s)` : warned ? `${warned} aviso(s)` : "sin problemas detectados";
	return [
		`Pi-One Doctor · ${summary}`,
		...checks.map((check) => `${check.status} · ${check.label}: ${check.detail}`),
		"Solo lectura: no se modificó ningún archivo.",
	].join("\n");
}

export default function doctorExtension(pi: ExtensionAPI): void {
	pi.registerCommand("pi-one-doctor", {
		description: "Diagnostica la instalación y configuración de Pi-One (solo lectura)",
		handler: async (_args, ctx) => {
			ctx.ui.notify(formatDoctorReport(collectDoctorChecks()), "info");
		},
	});
}
