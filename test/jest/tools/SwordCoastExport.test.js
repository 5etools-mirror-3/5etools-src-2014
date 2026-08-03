import fs from "fs";

import {CORPUS_MANIFEST} from "../../../tools/sword-coast-export/corpus-manifest.js";
import {slugify} from "../../../tools/sword-coast-export/lib/render-utils.js";
import {findNamedEntries, selectWorkContent} from "../../../tools/sword-coast-export/lib/selectors.js";
import {assertFlatSafeName, splitSemanticSection} from "../../../tools/sword-coast-export/lib/writers.js";

describe("Sword Coast export manifest", () => {
	const catalogs = {
		book: JSON.parse(fs.readFileSync("data/books.json", "utf8")).book,
		adventure: JSON.parse(fs.readFileSync("data/adventures.json", "utf8")).adventure,
	};

	it("resolves and validates every curated work", () => {
		expect(CORPUS_MANIFEST).toHaveLength(22);
		expect(CORPUS_MANIFEST.filter(it => it.mode === "full")).toHaveLength(15);

		for (const manifest of CORPUS_MANIFEST) {
			const meta = catalogs[manifest.kind].find(it => it.id === manifest.id);
			expect(meta).toBeDefined();

			const file = `data/${manifest.kind}/${manifest.kind}-${manifest.id.toLowerCase()}.json`;
			const data = JSON.parse(fs.readFileSync(file, "utf8")).data;
			const selections = selectWorkContent({manifest, meta, data});
			expect(selections.length).toBeGreaterThan(0);
		}
	});

	it("selects only the requested Candlekeep subtree", () => {
		const manifest = CORPUS_MANIFEST.find(it => it.id === "CM");
		const meta = catalogs.adventure.find(it => it.id === "CM");
		const data = JSON.parse(fs.readFileSync("data/adventure/adventure-cm.json", "utf8")).data;
		const selections = selectWorkContent({manifest, meta, data});

		expect(selections.map(it => it.title)).toStrictEqual(["Candlekeep", "Journey to Baldur's Gate"]);
		expect(selections[1].entry.id).toBe("090");
	});

	it("requires a unique named subtree", () => {
		const root = {entries: [{name: "Duplicated"}, {name: "Duplicated"}]};
		expect(findNamedEntries(root, "Duplicated")).toHaveLength(2);
	});
});

describe("Sword Coast export output helpers", () => {
	it("creates stable ASCII slugs", () => {
		expect(slugify("Baldur’s Gate: A Costa")).toBe("baldur-s-gate-a-costa");
	});

	it("rejects nested or unsafe output names", () => {
		expect(() => assertFlatSafeName("../escape.md")).toThrow();
		expect(() => assertFlatSafeName("nested/file.md")).toThrow();
		expect(() => assertFlatSafeName("valid.md")).not.toThrow();
	});

	it("splits oversized content at semantic headings", () => {
		const oversized = `## First\n\n${"a".repeat(250_000)}\n\n## Second\n\n${"b".repeat(250_000)}`;
		const parts = splitSemanticSection(oversized);
		expect(parts).toHaveLength(2);
		expect(parts[0]).toContain("## First");
		expect(parts[1]).toContain("## Second");
	});
});
