export class RacePreviewRenderer {
	static render ({wrpPreview, race}) {
		wrpPreview.empty();
		if (!race) {
			wrpPreview.append(ee`<div class="initial-message initial-message--med ve-flex-vh-center flex-1 min-h-0">Select a Species to view it here</div>`);
			return;
		}
		
		const html = Renderer.race.getCompactRenderedString(race);
		wrpPreview.append(ee`<div class="ve-p-3">${html}</div>`);
	}
}
