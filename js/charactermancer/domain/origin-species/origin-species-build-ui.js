
import {RacePreviewRenderer} from "./race-preview-renderer.js";

export class OriginSpeciesBuildUi extends BaseComponent {
	/**
	 * @param {{
	 *   dataset: import("../../core/contracts.js").UnifiedDataset,
	 *   buildState: import("../../state/character-build-state.js").CharacterBuildState,
	 *   frameMount: import("../../core/contracts.js").DomainTabFrameMount,
	 *   headerMetaLabel?: string,
	 *   onStateChange?: () => void,
	 * }} opts
	 */
	constructor ({dataset, buildState, frameMount, headerMetaLabel, onStateChange}) {
		super();
		this._dataset = dataset;
		this._buildState = buildState;
		this._frameMount = frameMount;
		this._headerMetaLabel = headerMetaLabel || "Species";
		this._onStateChange = onStateChange;

		this._races = dataset.race || [];
		
		this._modalFilter = new ModalFilterRaces({
			namespace: "charactermancer.race",
			allData: this._races,
		});

		const entry = this._getEntry();
		const ixRace = this._getRaceIndex(entry);
		this._state.ixRace = ixRace >= 0 ? ixRace : null;
		
		this._searchQuery = "";
		this._isFilterReady = false;
	}

	async pInitFilters () {
		this._races.forEach(it => PageFilterRaces.mutateForFilters(it));

		const wrpMini = this._frameMount.wrpFilterBar?.find(".fltr__mini-view");
		if (wrpMini?.length) wrpMini.empty();

		await this._modalFilter._pInit();

		const pageFilter = this._modalFilter.pageFilter;
		await pageFilter.pInitFilterBox({
			namespace: "charactermancer.race",
			wrpMiniPills: wrpMini,
		});

		this._modalFilter.setHiddenWrapperAllData(this._races);
		pageFilter.filterBox.render();

		this._isFilterReady = true;
	}

	_getEntry () {
		return this._buildState.speciesState;
	}

	_getRaceIndex (entry) {
		if (!entry?.speciesRef) return null;
		const ix = this._races.findIndex(it => it.name === entry.speciesRef.name && it.source === entry.speciesRef.source);
		return ~ix ? ix : null;
	}

	_getActiveRace () {
		if (this._state.ixRace != null && this._state.ixRace >= 0) {
			return this._races[this._state.ixRace];
		}
		return null;
	}

	_notifyChange () {
		this._onStateChange?.();
	}

	_syncEntryFromState () {
		const entry = this._getEntry();
		const race = this._getActiveRace();
		
		entry.speciesRef = race ? {name: race.name, source: race.source} : null;

		this._notifyChange();
		this._renderPreview();
		this._renderDetailSections();
	}

	render () {
		const mount = this._frameMount;
		if (!mount.wrpLeft || !mount.wrpRight) return;

		mount.wrpLeft.empty();

		const wrpEntryBody = ee`<div class="cmchr__entry-body ve-flex-col ve-mt-2 flex-1 min-h-0"></div>`;
		const wrpSelBlock = ee`<div class="cmchr__entry-sel-block flex-shrink-0"></div>`;
		const wrpDetailsScroll = ee`<div class="cmchr__entry-details-scroll ve-flex-col flex-1 min-h-0"></div>`;
		wrpEntryBody.append(wrpSelBlock, wrpDetailsScroll);
		
		const wrpEntry = ee`<div class="cmchr__entry ve-flex-col flex-1 min-h-0">
			${wrpEntryBody}
		</div>`;

		mount.wrpLeft.append(wrpEntry);

		this._renderSelectionControls({wrpSelBlock});
		this._syncEntryFromState();

		if (mount.useGlobalListFilter !== false) {
			mount.enableFilterChrome?.({
				onFilterClick: () => {
					if (this._isFilterReady) this._modalFilter.handleHiddenOpenButtonClick();
					else this._pOpenFilterModal();
				},
				onResetClick: () => {
					if (this._isFilterReady) this._modalFilter.handleHiddenResetButtonClick();
					this._resetSearchFilter();
				},
				onSearchInput: q => this._applySearchFilter(q),
			});
		}

		this._renderPreview();
	}

	_resetSearchFilter () {
		this._searchQuery = "";
		this._applySelFilters();
	}

	_applySearchFilter (query) {
		this._searchQuery = query;
		this._applySelFilters();
	}

	_applySelFilters () {
		const filterBox = this._modalFilter.pageFilter?.filterBox;

		if (this._setFnFilterRace) {
			this._setFnFilterRace(ix => {
				const race = this._races[ix];
				if (!race) return false;
				if (this._searchQuery && !race.name.toLowerCase().includes(this._searchQuery)) return false;
				if (!filterBox) return true;
				const f = filterBox.getValues();
				return this._modalFilter.pageFilter.toDisplay(f, race);
			});
		}
	}

	_renderSelectionControls ({wrpSelBlock}) {
		const wrpSel = ee`<div class="cmchr__class-sel ve-flex-col ve-w-100"></div>`;
		wrpSelBlock.append(wrpSel);

		const {wrp: wrpRaceSel, setFnFilter: setFnFilterRace} = ComponentUiUtil.getSelSearchable(
			this,
			"ixRace",
			{
				values: this._races.map((_, i) => i),
				isAllowNull: true,
				fnDisplay: ix => OriginSpeciesBuildUi._getRaceDisplayName(this._races[ix]),
				asMeta: true,
			},
		);
		this._setFnFilterRace = setFnFilterRace;

		const btnFilterInline = ee`<button type="button" class="ve-btn ve-btn-xs ve-btn-default ve-h-100 ve-btr-0 ve-bbr-0 ve-pr-2"><span class="glyphicon glyphicon-filter"></span> Filter</button>`;

		this._addHookBase("ixRace", () => {
			this._syncEntryFromState();
		});

		const filterBox = this._modalFilter.pageFilter?.filterBox;
		if (filterBox) filterBox.on(FILTER_BOX_EVNT_VALCHANGE, () => this._applySelFilters());
		this._applySelFilters();

		btnFilterInline.onn("click", () => {
			if (this._isFilterReady) this._modalFilter.handleHiddenOpenButtonClick();
			else this._pOpenFilterModal();
		});

		wrpSel.append(
			ee`<div class="ve-flex ve-btn-group ve-w-100">
				<div class="ve-flex ve-no-shrink">${btnFilterInline}</div>
				<div class="ve-flex-col ve-w-100">${wrpRaceSel}</div>
			</div>`,
		);
	}

	async _pOpenFilterModal () {
		const race = this._getActiveRace();

		const out = await this._modalFilter.pGetUserSelection({
			selectedRace: race,
		});
		if (!out?.race) return;

		const ixRace = this._races.findIndex(it => it.name === out.race.name && it.source === out.race.source);
		if (!~ixRace) return;

		this._state.ixRace = ixRace;
		this._syncEntryFromState();
	}

	_renderPreview () {
		const race = this._getActiveRace();
		RacePreviewRenderer.render({
			wrpPreview: this._frameMount.wrpRight,
			race,
		});
	}

	_renderDetailSections ({wrpDetailsScroll} = {}) {
		if (!wrpDetailsScroll) {
			wrpDetailsScroll = this._frameMount.wrpLeft?.find(".cmchr__entry-details-scroll");
		}
		if (!wrpDetailsScroll) return;

		let stgDetails = wrpDetailsScroll.find(".cmchr__race-details");
		if (!stgDetails) {
			stgDetails = ee`<div class="cmchr__race-details ve-flex-col"></div>`;
			wrpDetailsScroll.append(stgDetails);
		} else {
			stgDetails.empty();
		}

		const race = this._getActiveRace();
		if (!race) {
			stgDetails.toggleVe(false);
			return;
		}
		stgDetails.toggleVe(true);

		// Simplified Tasha's Origin Customization toggle
		const lblTasha = ee`<label class="ve-flex-v-center ve-mt-2 ve-clickable">
			<input type="checkbox" class="ve-mr-2">
			<span>Allow Origin Customization (Tasha's)</span>
		</label>`;
		
		const cbTasha = lblTasha.find("input");
		cbTasha.prop("checked", !!this._state.isTashaOrigin);
		cbTasha.onn("change", () => {
			this._state.isTashaOrigin = cbTasha.prop("checked");
			this._notifyChange();
		});

		const wrpTashaRules = ee`<div class="ve-small ve-muted ve-ml-4 ve-mt-1 ve-hidden">
			<div>Customizing Your Origin rules allow you to reassign Ability Score Increases, Skill, Tool, and Language Proficiencies granted by your Species.</div>
		</div>`;
		
		const hkTasha = () => {
			wrpTashaRules.toggleVe(!!this._state.isTashaOrigin);
		};
		this._addHookBase("isTashaOrigin", hkTasha);
		hkTasha();

		stgDetails.append(
			ee`<hr class="ve-hr-2">
			<div class="ve-bold ve-mb-2">Optional Rules</div>
			${lblTasha}
			${wrpTashaRules}`
		);
	}

	static _getRaceDisplayName (race) {
		if (!race) return "(Unknown)";
		return `${race.name}${race.source !== Parser.SRC_PHB ? ` [${Parser.sourceJsonToAbv(race.source)}]` : ""}`;
	}

	validate () {
		const messages = [];
		const entry = this._getEntry();
		if (!entry.speciesRef) messages.push("Select a species.");
		return {isValid: !messages.length, messages};
	}
}
