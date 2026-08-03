import {CORPUS_MANIFEST} from "../corpus-manifest.js";

const CATALOG_CONFIG = {
	book: {path: "data/books.json", prop: "book", dir: "book"},
	adventure: {path: "data/adventures.json", prop: "adventure", dir: "adventure"},
};

export async function loadCorpusData () {
	const [booksCatalog, adventuresCatalog, monsters, items, backgrounds] = await Promise.all([
		DataUtil.loadJSON(CATALOG_CONFIG.book.path),
		DataUtil.loadJSON(CATALOG_CONFIG.adventure.path),
		DataUtil.monster.pLoadAll(),
		DataUtil.item.loadJSON(),
		DataUtil.loadJSON("data/backgrounds.json"),
	]);

	const catalogs = {
		book: booksCatalog.book || [],
		adventure: adventuresCatalog.adventure || [],
	};

	const works = [];
	for (const manifestEntry of CORPUS_MANIFEST) {
		const config = CATALOG_CONFIG[manifestEntry.kind];
		if (!config) throw new Error(`Tipo de obra desconhecido: "${manifestEntry.kind}".`);

		const meta = catalogs[manifestEntry.kind].find(it => it.id === manifestEntry.id);
		if (!meta) throw new Error(`Obra não encontrada no catálogo: ${manifestEntry.kind}/${manifestEntry.id}.`);

		const file = `data/${config.dir}/${config.dir}-${manifestEntry.id.toLowerCase()}.json`;
		const json = await DataUtil.loadJSON(file);
		works.push({manifest: manifestEntry, meta, data: json.data || [], file});
	}

	return {
		works,
		monsters,
		items: items.item || [],
		backgrounds: backgrounds.background || [],
	};
}
