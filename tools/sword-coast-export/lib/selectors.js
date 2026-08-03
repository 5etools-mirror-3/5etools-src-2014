export function selectWorkContent (work) {
	const {manifest, meta, data} = work;
	const contents = meta.contents || [];

	if (contents.length !== data.length) {
		throw new Error(`${manifest.id}: catálogo possui ${contents.length} entradas, mas o arquivo possui ${data.length}.`);
	}

	if (manifest.mode === "full") {
		return data.map((entry, index) => ({
			entry,
			index,
			title: contents[index]?.name || entry.name || `Seção ${index + 1}`,
			isSubtree: false,
		}));
	}

	if (!["chapters", "mixed"].includes(manifest.mode)) {
		throw new Error(`${manifest.id}: modo de seleção inválido "${manifest.mode}".`);
	}

	if (!manifest.selections?.length) throw new Error(`${manifest.id}: seleção curada vazia.`);

	const seen = new Set();
	return manifest.selections.map(selection => {
		const key = `${selection.index}::${selection.subtreeName || ""}::${selection.subtreeId || ""}`;
		if (seen.has(key)) throw new Error(`${manifest.id}: seleção duplicada "${key}".`);
		seen.add(key);

		const catalogEntry = contents[selection.index];
		const root = data[selection.index];
		if (!catalogEntry || !root) throw new Error(`${manifest.id}: índice ${selection.index} não existe.`);
		if (catalogEntry.name !== selection.catalogName) {
			throw new Error(`${manifest.id}[${selection.index}]: esperado "${selection.catalogName}", encontrado "${catalogEntry.name}".`);
		}
		if (String(root.id || "") !== selection.rootId) {
			throw new Error(`${manifest.id}[${selection.index}]: ID raiz esperado "${selection.rootId}", encontrado "${root.id || ""}".`);
		}

		if (!selection.subtreeName) {
			return {
				entry: root,
				index: selection.index,
				title: catalogEntry.name,
				isSubtree: false,
			};
		}

		const matches = findNamedEntries(root, selection.subtreeName)
			.filter(it => !selection.subtreeId || String(it.id || "") === selection.subtreeId);
		if (matches.length !== 1) {
			throw new Error(`${manifest.id}[${selection.index}]: subtree "${selection.subtreeName}" encontrou ${matches.length} correspondências.`);
		}

		return {
			entry: matches[0],
			index: selection.index,
			title: selection.subtreeName,
			isSubtree: true,
		};
	});
}

export function findNamedEntries (root, name) {
	const out = [];
	const seen = new Set();

	const visit = value => {
		if (!value || typeof value !== "object" || seen.has(value)) return;
		seen.add(value);

		if (!Array.isArray(value) && value.name === name) out.push(value);
		if (Array.isArray(value)) value.forEach(visit);
		else Object.values(value).forEach(visit);
	};

	visit(root);
	return out;
}
