import {BaseDomainComponent} from "../base-domain-component.js";
import {OriginSpeciesBuildUi} from "./origin-species-build-ui.js";

export class OriginSpeciesDomainComponent extends BaseDomainComponent {
	constructor (ctx) {
		super(ctx);
		/** @type {OriginSpeciesBuildUi|null} */
		this._ui = null;
	}

	async pLoad () {
		if (!this._buildState.speciesState) {
			this._buildState.speciesState = { speciesRef: null };
		}

		this._ui = new OriginSpeciesBuildUi({
			dataset: this._dataset,
			buildState: this._buildState,
			frameMount: this._frameMount,
			headerMetaLabel: this._tab.headerMetaLabel,
			onStateChange: () => this._updateDevState?.(),
		});

		await this._ui.pInitFilters();
	}

	render (mount = this._frameMount) {
		if (!this._ui) {
			this._ui = new OriginSpeciesBuildUi({
				dataset: this._dataset,
				buildState: this._buildState,
				frameMount: mount,
				headerMetaLabel: this._tab.headerMetaLabel,
				onStateChange: () => this._updateDevState?.(),
			});
		} else if (mount) {
			this._ui._frameMount = mount;
		}

		this._ui.render();
	}

	destroy () {
		this._ui = null;
	}

	/**
	 * @param {() => void} fn
	 */
	setDevStateUpdater (fn) {
		this._updateDevState = fn;
	}

	validate () {
		return this._ui?.validate() ?? {isValid: true, messages: []};
	}

	getFormData () {
		return MiscUtil.copyFast(this._buildState.speciesState);
	}
}
