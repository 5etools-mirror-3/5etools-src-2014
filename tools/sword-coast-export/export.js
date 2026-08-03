/* eslint-disable no-console */

import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";

import {CORPUS_MANIFEST} from "./corpus-manifest.js";
import {loadCorpusData} from "./lib/loaders.js";
import {exportCorpus} from "./lib/pipeline.js";
import {setupRenderer, teardownRenderer} from "./lib/setup-renderer.js";
import {prepareOutputDir, writeSupportFiles} from "./lib/writers.js";

const toolRoot = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(toolRoot, "../..");

export async function main () {
	const startedAt = Date.now();
	process.chdir(repositoryRoot);
	setupRenderer();

	try {
		prepareOutputDir();
		console.log("Exportador da Costa da Espada — carregando corpus...");
		const data = await loadCorpusData();
		const indexEntries = [];
		const stats = await exportCorpus(data, indexEntries);

		const elapsedMs = Date.now() - startedAt;
		const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
		writeSupportFiles({
			toolRoot,
			indexEntries,
			manifest: CORPUS_MANIFEST,
			version: pkg.version,
			elapsedMs,
		});

		console.log(`Obras: ${stats.works}`);
		console.log(`NPCs/monstros: ${stats.monsters}`);
		console.log(`Itens: ${stats.items}`);
		console.log(`Backgrounds: ${stats.backgrounds}`);
		console.log(`Seções de organizações: ${stats.organizations}`);
		console.log(`Arquivos de conteúdo: ${indexEntries.length}`);
		console.log(`Saída: tools/sword-coast-export/output/`);
	} finally {
		teardownRenderer();
	}
}

if (import.meta.main) {
	main().catch(error => {
		console.error(error);
		process.exitCode = 1;
	});
}
