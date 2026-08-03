import {ClassOptionsBuildState} from "./class-options-build-state.js";

export class ClassOptionsUi {
	constructor ({dataset, buildState, classDomainState, onStateChange}) {
		this._dataset = dataset;
		this._buildState = buildState;
		this._classDomainState = classDomainState;
		this._onStateChange = onStateChange;

		if (!this._buildState.classState.optionalFeatures) {
			this._buildState.classState.optionalFeatures = {};
		}
	}

	render (wrpDetailsScroll) {
		let stgOptions = wrpDetailsScroll.find(".cmchr__class-options");
		if (!stgOptions) {
			stgOptions = ee`<div class="cmchr__class-options ve-flex-col"></div>`;
			wrpDetailsScroll.append(stgOptions);
		} else {
			stgOptions.empty();
		}

		const cls = this._getActiveClass();
		const sc = this._getActiveSubclass();
		const level = this._classDomainState.targetLevel || 1;

		const progressions = [];
		if (cls?.optionalfeatureProgression) progressions.push(...cls.optionalfeatureProgression);
		if (sc?.optionalfeatureProgression) progressions.push(...sc.optionalfeatureProgression);

		if (!progressions.length) {
			stgOptions.toggleVe(false);
			return;
		}

		let hasRenderedAny = false;

		progressions.forEach(prog => {
			const totalOptions = this._getTotalOptionsAtLevel(prog, level);
			if (totalOptions <= 0) return;

			hasRenderedAny = true;
			const wrpProg = this._renderProgression(prog, totalOptions);
			stgOptions.append(wrpProg);
		});

		if (hasRenderedAny) {
			stgOptions.prepend(ee`<hr class="ve-hr-2"><div class="ve-bold ve-mb-2">Class Options</div>`);
			stgOptions.toggleVe(true);
		} else {
			stgOptions.toggleVe(false);
		}
	}

	_getActiveClass () {
		if (this._classDomainState.ixClass != null) {
			return this._dataset.class[this._classDomainState.ixClass];
		}
		return null;
	}

	_getActiveSubclass () {
		const cls = this._getActiveClass();
		if (!cls) return null;
		if (this._classDomainState.ixSubclass != null) {
			return cls.subclasses?.[this._classDomainState.ixSubclass];
		}
		return null;
	}

	_getTotalOptionsAtLevel (prog, level) {
		let total = 0;
		if (!prog.progression) return total;
		
		// progression keys are levels, values are totals at that level
		// find the highest level <= current level
		const levels = Object.keys(prog.progression).map(Number).sort((a, b) => a - b);
		for (const l of levels) {
			if (l <= level) {
				total = prog.progression[l];
			} else {
				break;
			}
		}
		return total;
	}

	_getAvailableFeatures (featureTypeArray) {
		const allFeatures = this._dataset.optionalfeature || [];
		return allFeatures.filter(f => {
			if (!f.featureType) return false;
			return featureTypeArray.some(ft => f.featureType.includes(ft));
		});
	}

	_renderProgression (prog, totalOptions) {
		const available = this._getAvailableFeatures(prog.featureType);
		const stateKey = prog.name;

		if (!this._buildState.classState.optionalFeatures[stateKey]) {
			this._buildState.classState.optionalFeatures[stateKey] = [];
		}
		const selections = this._buildState.classState.optionalFeatures[stateKey];

		const wrp = ee`<div class="ve-flex-col ve-mb-2"></div>`;
		wrp.append(ee`<div class="ve-bold ve-muted ve-mb-1">Choose ${totalOptions} Option${totalOptions > 1 ? "s" : ""}: ${prog.name}</div>`);

		for (let i = 0; i < totalOptions; i++) {
			const wrpSel = ee`<div class="ve-mb-1"></div>`;
			
			// Custom searchable dropdown for each choice
			const sel = ee`<select class="form-control input-xs"><option value="">(Select...)</option></select>`;
			
			available.forEach((feat, ix) => {
				const opt = ee`<option value="${ix}">${feat.name} [${Parser.sourceJsonToAbv(feat.source)}]</option>`;
				sel.append(opt);
			});

			if (selections[i]) {
				const matchedIx = available.findIndex(f => f.name === selections[i].name && f.source === selections[i].source);
				if (~matchedIx) sel.val(`${matchedIx}`);
			}

			sel.onn("change", () => {
				const val = sel.val();
				if (val === "") {
					selections[i] = null;
				} else {
					const feat = available[Number(val)];
					selections[i] = { name: feat.name, source: feat.source };
				}
				this._onStateChange?.();
			});

			wrpSel.append(sel);
			wrp.append(wrpSel);
		}

		return wrp;
	}
}
