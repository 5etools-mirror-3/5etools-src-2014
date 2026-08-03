export function slugify (value) {
	return String(value)
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function getEntitySource (entity) {
	return SourceUtil.getEntitySource(entity);
}

export function sortEntities (entities) {
	return [...entities].sort((a, b) => {
		const byName = String(a.name || "").localeCompare(String(b.name || ""));
		if (byName) return byName;
		return String(getEntitySource(a) || "").localeCompare(String(getEntitySource(b) || ""));
	});
}

export function renderWork (work, selections) {
	const {manifest, meta} = work;
	const source = meta.source || meta.id;
	const coverage = manifest.mode === "full" ? "integral" : "recorte regional curado";
	const spoiler = manifest.kind === "adventure" ? "Sim — conteúdo para Mestre" : "Possível conteúdo de cenário";
	const preamble = [
		`# ${meta.name}`,
		"",
		`**Fonte:** ${Parser.sourceJsonToFull(source)} (${Parser.sourceJsonToAbv(source)})`,
		`**Região:** ${manifest.region}`,
		`**Cobertura:** ${coverage}`,
		`**Spoilers:** ${spoiler}`,
		"",
		"---",
		"",
	].join("\n");

	const renderer = RendererMarkdown.get();
	const sections = selections.map(({entry, title}) => {
		const body = renderer.render(entry);
		if (/^#{1,6}\s/m.test(body)) return body.trim();
		return `## ${title}\n\n${body.trim()}`;
	});

	return {preamble, sections};
}

export function renderEntity (entity, body) {
	const source = getEntitySource(entity);
	const fullSource = source ? Parser.sourceJsonToFull(source) : "Desconhecida";
	const page = Renderer.utils.isDisplayPage(entity.page) ? `, página ${entity.page}` : "";
	const cleanBody = String(body || "").replace(/^#{1,6}\s+[^\n]+\n+\n?/, "").trim();
	return [
		`## ${entity._displayName || entity.name || "Sem nome"}`,
		"",
		`**Fonte:** ${fullSource} (${source || "?"})${page}`,
		"",
		cleanBody,
		"",
	].join("\n");
}
