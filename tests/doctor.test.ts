import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import doctorExtension, { collectDoctorChecks, formatDoctorReport } from "../extensions/feature/doctor.ts";

function fixture() {
	const root = mkdtempSync(join(tmpdir(), "pi-one-doctor-"));
	const packageRoot = join(root, "package");
	mkdirSync(join(packageRoot, "extensions"), { recursive: true });
	mkdirSync(join(packageRoot, "themes"), { recursive: true });
	writeFileSync(
		join(packageRoot, "package.json"),
		JSON.stringify({
			name: "pi-one-agent",
			version: "0.2.0",
			dependencies: {},
			pi: { extensions: ["./extensions/index.ts"], themes: ["./themes/test.json"] },
		}),
	);
	writeFileSync(join(packageRoot, "extensions", "index.ts"), "export {};\n");
	writeFileSync(join(packageRoot, "themes", "test.json"), JSON.stringify({ name: "test" }));
	const piPackageJson = join(root, "pi", "package.json");
	mkdirSync(join(root, "pi"), { recursive: true });
	writeFileSync(piPackageJson, JSON.stringify({ name: "@earendil-works/pi-coding-agent", version: "1.2.3" }));
	return { root, packageRoot, piPackageJson };
}

test("doctor reports package, Pi and Node versions, valid files and config without writing", (t) => {
	const paths = fixture();
	t.after(() => rmSync(paths.root, { recursive: true, force: true }));
	const configPath = join(paths.root, "agent", "pi-one-agent.json");
	const checks = collectDoctorChecks({ ...paths, configPath });
	assert.deepEqual(checks.map((check) => check.status), ["OK", "OK", "OK", "OK", "OK", "OK", "OK", "OK"]);
	assert.match(checks[0]!.detail, /1\.2\.3/);
	assert.match(checks[1]!.detail, new RegExp(process.versions.node));
	assert.match(checks[3]!.detail, /pi-one-agent v0\.2\.0/);
	assert.match(checks[4]!.detail, /2 extensiones\/temas declarados encontrados/);
	assert.match(checks[5]!.detail, /1 temas válidos/);
	assert.equal(formatDoctorReport(checks).includes("Solo lectura"), true);
	assert.equal(existsSync(configPath), false);
});

test("doctor flags missing package assets, malformed theme and invalid config", (t) => {
	const paths = fixture();
	t.after(() => rmSync(paths.root, { recursive: true, force: true }));
	writeFileSync(join(paths.packageRoot, "themes", "test.json"), "{");
	const manifestPath = join(paths.packageRoot, "package.json");
	const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
	manifest.pi.extensions.push("./extensions/missing.ts");
	writeFileSync(manifestPath, JSON.stringify(manifest));
	const configPath = join(paths.root, "broken.json");
	writeFileSync(configPath, "not-json");
	const checks = collectDoctorChecks({ ...paths, configPath });
	assert.equal(checks.find((check) => check.label === "Archivos del paquete")?.status, "FAIL");
	assert.equal(checks.find((check) => check.label === "Temas")?.status, "FAIL");
	assert.equal(checks.find((check) => check.label === "Configuración")?.status, "WARN");
	assert.match(formatDoctorReport(checks), /2 problema\(s\)/);
});

test("doctor registers /pi-one-doctor and reports checks without mutating state", async () => {
	let command: any;
	let notification: { message: string; level: string } | undefined;
	doctorExtension({
		registerCommand(name: string, options: any) {
			assert.equal(name, "pi-one-doctor");
			command = options;
		},
	} as any);
	assert.match(command.description, /solo lectura/);
	await command.handler("", {
		ui: {
			notify(message: string, level: string) {
				notification = { message, level };
			},
		},
	});
	assert.equal(notification?.level, "info");
	assert.match(notification?.message ?? "", /Pi-One Doctor/);
	assert.match(notification?.message ?? "", /Solo lectura: no se modificó ningún archivo/);
});
