import {CORPUS_MANIFEST, ORGANIZATION_EXCERPTS} from "../corpus-manifest.js";
import {selectWorkContent, findNamedEntries} from "./selectors.js";
import {getEntitySource, renderEntity, renderWork, slugify, sortEntities} from "./render-utils.js";
import {writeMarkdownDocument} from "./writers.js";

export async function exportCorpus (data, indexEntries) {
	const stats = {works: 0, monsters: 0, items: 0, backgrounds: 0, organizations: 0};
	const selectionsByWork = new Map();

	for (const work of data.works) {
		const selections = selectWorkContent(work);
		selectionsByWork.set(work, selections);
		const rendered = renderWork(work, selections);
		const isFull = work.manifest.mode === "full";
		const prefix = work.manifest.kind === "book" ? "01-guia" : isFull ? "02-campanha" : "03-recorte";
		const fileName = `${prefix}-${work.manifest.id.toLowerCase()}-${slugify(work.meta.name)}.md`;

		writeMarkdownDocument({
			fileName,
			...rendered,
			metadata: {
				kind: work.manifest.kind,
				source: work.manifest.id,
				title: work.meta.name,
				region: work.manifest.region,
				coverage: isFull ? "full" : "recorte regional",
				spoiler: work.manifest.kind === "adventure",
			},
			indexEntries,
		});
		stats.works++;
	}

	const companionFilter = buildCompanionFilter(data.works, selectionsByWork);
	stats.monsters = await exportMonsters(data.monsters, companionFilter, indexEntries);
	stats.items = exportItems(data.items, companionFilter, indexEntries);
	stats.backgrounds = exportBackgrounds(data.backgrounds, companionFilter, indexEntries);
	stats.organizations = exportOrganizations(data.works, indexEntries);

	return stats;
}

async function exportMonsters (allMonsters, companionFilter, indexEntries) {
	const monsters = sortEntities(allMonsters.filter(entity => companionFilter(entity, "creature")));
	const bySource = groupBySource(monsters);
	let count = 0;

	for (const [source, entries] of bySource) {
		const sections = [];
		for (const monster of entries) {
			sections.push((await RendererMarkdown.exporting.pGetMarkdownDoc({
				ents: [monster],
				prop: "monster",
				pFnGetFluff: Renderer.monster.pGetFluff.bind(Renderer.monster),
			})).trim());
		}
		writeMarkdownDocument({
			fileName: `04-npcs-monstros-${source.toLowerCase()}-${slugify(Parser.sourceJsonToFull(source))}.md`,
			preamble: `# NPCs e monstros — ${Parser.sourceJsonToFull(source)}\n\n**Fonte:** ${source}\n\n---\n`,
			sections,
			metadata: {
				kind: "companion-monsters",
				source,
				title: `NPCs e monstros — ${Parser.sourceJsonToFull(source)}`,
				region: "Fontes selecionadas da Costa da Espada",
				coverage: "anexo",
				spoiler: true,
			},
			indexEntries,
		});
		count += entries.length;
	}
	return count;
}

function exportItems (allItems, companionFilter, indexEntries) {
	const items = sortEntities(allItems.filter(entity => companionFilter(entity, "item")));
	if (!items.length) return 0;

	const sections = items.map(item => {
		const body = RendererMarkdown.item.getCompactRenderedString(item);
		return renderEntity(item, body);
	});
	writeMarkdownDocument({
		fileName: "05-itens-e-recompensas.md",
		preamble: "# Itens e recompensas da Costa da Espada\n\nEntidades originárias das fontes selecionadas.\n\n---\n",
		sections,
		metadata: {
			kind: "companion-items",
			source: "multiple",
			title: "Itens e recompensas",
			region: "Fontes selecionadas da Costa da Espada",
			coverage: "anexo",
			spoiler: true,
		},
		indexEntries,
	});
	return items.length;
}

function exportBackgrounds (allBackgrounds, companionFilter, indexEntries) {
	const backgrounds = sortEntities(allBackgrounds.filter(entity => companionFilter(entity, "background")));
	if (!backgrounds.length) return 0;

	const sections = backgrounds.map(background => {
		const body = RendererMarkdown.background.getCompactRenderedString(background);
		return renderEntity(background, body);
	});
	writeMarkdownDocument({
		fileName: "06-backgrounds-regionais.md",
		preamble: "# Backgrounds regionais\n\nBackgrounds originários das fontes selecionadas.\n\n---\n",
		sections,
		metadata: {
			kind: "companion-backgrounds",
			source: "multiple",
			title: "Backgrounds regionais",
			region: "Costa da Espada e o Norte",
			coverage: "anexo",
			spoiler: false,
		},
		indexEntries,
	});
	return backgrounds.length;
}

function exportOrganizations (works, indexEntries) {
	const sections = ORGANIZATION_EXCERPTS.map(excerpt => {
		const work = works.find(it => it.manifest.kind === excerpt.kind && it.manifest.id === excerpt.id);
		if (!work) throw new Error(`Fonte de organização não carregada: ${excerpt.kind}/${excerpt.id}.`);

		const matches = work.data
			.flatMap(root => findNamedEntries(root, excerpt.name))
			.filter(entry => String(entry.id || "") === excerpt.entryId);
		if (matches.length !== 1) {
			throw new Error(`${excerpt.id}: seção "${excerpt.name}" encontrou ${matches.length} correspondências.`);
		}

		const rendered = RendererMarkdown.get().render(matches[0]).trim();
		return `## ${work.meta.name}: ${excerpt.name}\n\n**Fonte:** ${excerpt.id}\n\n${rendered}`;
	});

	writeMarkdownDocument({
		fileName: "07-faccoes-e-organizacoes.md",
		preamble: "# Facções e organizações\n\nTrechos de referência curados das obras selecionadas.\n\n---\n",
		sections,
		metadata: {
			kind: "companion-organizations",
			source: "AI, MaBJoV",
			title: "Facções e organizações",
			region: "Costa da Espada e o Norte",
			coverage: "anexo curado",
			spoiler: false,
		},
		indexEntries,
	});
	return sections.length;
}

function groupBySource (entities) {
	const grouped = new Map();
	for (const entity of entities) {
		const source = getEntitySource(entity);
		if (!grouped.has(source)) grouped.set(source, []);
		grouped.get(source).push(entity);
	}
	return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function buildCompanionFilter (works, selectionsByWork) {
	const fullSources = new Set(works
		.filter(work => work.manifest.mode === "full")
		.map(work => work.manifest.id.toUpperCase()));
	const references = new Set();
	const tagPattern = /\{@(creature|item|background)\s+([^|}]+)(?:\|([^|}]+))?/gi;

	for (const work of works.filter(it => it.manifest.mode !== "full")) {
		const selectedJson = JSON.stringify((selectionsByWork.get(work) || []).map(it => it.entry));
		let match;
		while ((match = tagPattern.exec(selectedJson))) {
			const [, type, name, source] = match;
			if (!source) continue;
			references.add(`${type.toLowerCase()}::${name.toLowerCase()}::${source.toUpperCase()}`);
		}
	}

	return (entity, type) => {
		const source = String(getEntitySource(entity) || "").toUpperCase();
		if (fullSources.has(source)) return true;
		return references.has(`${type}::${String(entity.name || "").toLowerCase()}::${source}`);
	};
}

export {CORPUS_MANIFEST};
