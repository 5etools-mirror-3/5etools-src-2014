export class BackgroundPreviewRenderer {
	static render ({wrpPreview, background}) {
		wrpPreview.empty();
		if (!background) {
			wrpPreview.append(ee`<div class="initial-message initial-message--med ve-flex-vh-center flex-1 min-h-0">Select a Background to view it here</div>`);
			return;
		}
		
		const html = Renderer.background.getCompactRenderedString(background);
		wrpPreview.append(ee`<div class="ve-p-3">${html}</div>`);
	}
}
