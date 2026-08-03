import fs from "fs";
import path from "path";

import {MAX_FILE_CHARS, OUTPUT_DIR} from "../config.js";

export function prepareOutputDir () {
	fs.rmSync(OUTPUT_DIR, {recursive: true, force: true});
	fs.mkdirSync(OUTPUT_DIR, {recursive: true});
}

export function writeMarkdownDocument ({fileName, preamble, sections, metadata, indexEntries}) {
	assertFlatSafeName(fileName);
	const semanticSections = sections.flatMap(splitSemanticSection);
	const parts = packSections(preamble, semanticSections);
	const written = [];

	parts.forEach((body, index) => {
		const outputName = parts.length === 1
			? fileName
			: fileName.replace(/\.md$/, `-parte-${index + 1}.md`);
		const partNote = parts.length === 1 ? "" : `\n> Parte ${index + 1} de ${parts.length}.\n`;
		const content = `${preamble.trim()}${partNote}\n\n${body.trim()}\n`;
		fs.writeFileSync(path.join(OUTPUT_DIR, outputName), content, "utf8");
		written.push(outputName);
		indexEntries.push({
			file: outputName,
			...metadata,
			part: parts.length === 1 ? null : {number: index + 1, total: parts.length},
		});
	});

	return written;
}

export function writeSupportFiles ({toolRoot, indexEntries, manifest, version, elapsedMs}) {
	fs.copyFileSync(
		path.join(toolRoot, "DIRETRIZES-PROMPT.md"),
		path.join(OUTPUT_DIR, "00-DIRETRIZES-PROMPT.md"),
	);

	const generatedAt = new Date().toISOString();
	const manifestLines = [
		"# Manifesto do corpus — Costa da Espada",
		"",
		`**Gerado em:** ${generatedAt}`,
		`**Versão 5etools:** ${version}`,
		`**Tempo de exportação:** ${(elapsedMs / 1000).toFixed(1)}s`,
		"",
		"## Obras e recortes",
		"",
	];
	manifest.forEach(entry => {
		manifestLines.push(`- **${entry.id}** — ${entry.kind}; ${entry.mode}; ${entry.region}.`);
		(entry.selections || []).forEach(selection => {
			const detail = selection.subtreeName
				? `${selection.catalogName} → ${selection.subtreeName}`
				: selection.catalogName;
			manifestLines.push(`  - Índice ${selection.index}: ${detail} (ID ${selection.subtreeId || selection.rootId}).`);
		});
	});
	manifestLines.push("", "## Arquivos gerados", "");
	indexEntries
		.slice()
		.sort((a, b) => a.file.localeCompare(b.file))
		.forEach(entry => manifestLines.push(`- \`${entry.file}\` — ${entry.title}; cobertura: ${entry.coverage}.`));

	fs.writeFileSync(
		path.join(OUTPUT_DIR, "00-MANIFESTO.md"),
		`${manifestLines.join("\n")}\n`,
		"utf8",
	);

	const lines = [
		"# Índice — Costa da Espada",
		"",
		"Corpus em inglês, preparado para consulta no NotebookLM. Responda em português e preserve os nomes oficiais em inglês.",
		"",
		"Leia `00-DIRETRIZES-PROMPT.md` antes dos demais arquivos.",
		"",
		`**Gerado em:** ${generatedAt}`,
		`**Versão 5etools:** ${version}`,
		`**Arquivos de conteúdo:** ${indexEntries.length}`,
		"",
		"## Convenções",
		"",
		"- `01-`: livros e guias integrais.",
		"- `02-`: campanhas integrais; contêm spoilers para Mestre.",
		"- `03-`: recortes regionais curados de obras parcialmente relacionadas.",
		"- `04-` a `07-`: anexos de referência.",
		"- LMoP e PaBTSO são versões editoriais distintas e não devem ser fundidas silenciosamente.",
		"",
		"## Arquivos",
		"",
	];

	indexEntries
		.sort((a, b) => a.file.localeCompare(b.file))
		.forEach(entry => {
			const coverage = entry.coverage === "full" ? "integral" : entry.coverage;
			const spoiler = entry.spoiler ? " — SPOILERS DE MESTRE" : "";
			lines.push(`- \`${entry.file}\` — ${entry.title}; ${entry.region}; ${coverage}${spoiler}.`);
		});

	fs.writeFileSync(path.join(OUTPUT_DIR, "00-INDICE.md"), `${lines.join("\n")}\n`, "utf8");
}

function packSections (preamble, sections) {
	const limit = Math.max(1, MAX_FILE_CHARS - preamble.length - 100);
	const parts = [];
	let buffer = "";

	for (const section of sections) {
		const addition = `${buffer ? "\n\n" : ""}${section}`;
		if (buffer && buffer.length + addition.length > limit) {
			parts.push(buffer);
			buffer = section;
		} else {
			buffer += addition;
		}
	}
	if (buffer) parts.push(buffer);
	return parts.length ? parts : [""];
}

export function splitSemanticSection (section) {
	if (section.length <= MAX_FILE_CHARS) return [section];

	for (const pattern of [/(?=^##\s)/m, /(?=^###\s)/m, /\n{2,}(?=\S)/]) {
		const chunks = section.split(pattern).filter(Boolean);
		if (chunks.length > 1) return chunks.flatMap(splitSemanticSection);
	}

	// Preserve a single oversized paragraph instead of cutting prose mid-sentence.
	return [section];
}

export function assertFlatSafeName (fileName) {
	if (!fileName.endsWith(".md") || path.basename(fileName) !== fileName || fileName.includes("..")) {
		throw new Error(`Nome de saída inválido: "${fileName}".`);
	}
}
