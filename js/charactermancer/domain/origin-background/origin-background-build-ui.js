
import {BackgroundPreviewRenderer} from "./background-preview-renderer.js";

export class OriginBackgroundBuildUi extends BaseComponent {
	constructor ({dataset, buildState, frameMount, headerMetaLabel, onStateChange}) {
		super();
		this._dataset = dataset;
		this._buildState = buildState;
		this._frameMount = frameMount;
		this._headerMetaLabel = headerMetaLabel || "Background";
		this._onStateChange = onStateChange;

		this._backgrounds = dataset.background || [];
		
		this._modalFilter = new ModalFilterBackgrounds({
			namespace: "charactermancer.background",
			allData: this._backgrounds,
		});

		const entry = this._getEntry();
		const ixBackground = this._getBackgroundIndex(entry);
		this._state.ixBackground = ixBackground >= 0 ? ixBackground : null;
		
		this._searchQuery = "";
		this._isFilterReady = false;
	}

	async pInitFilters () {
		this._backgrounds.forEach(it => PageFilterBackgrounds.mutateForFilters(it));

		const wrpMini = this._frameMount.wrpFilterBar?.find(".fltr__mini-view");
		if (wrpMini?.length) wrpMini.empty();

		await this._modalFilter._pInit();

		const pageFilter = this._modalFilter.pageFilter;
		await pageFilter.pInitFilterBox({
			namespace: "charactermancer.background",
			wrpMiniPills: wrpMini,
		});

		this._modalFilter.setHiddenWrapperAllData(this._backgrounds);
		pageFilter.filterBox.render();

		this._isFilterReady = true;
	}

	_getEntry () {
		return this._buildState.backgroundState;
	}

	_getBackgroundIndex (entry) {
		if (!entry?.backgroundRef) return null;
		const ix = this._backgrounds.findIndex(it => it.name === entry.backgroundRef.name && it.source === entry.backgroundRef.source);
		return ~ix ? ix : null;
	}

	_getActiveBackground () {
		if (this._state.ixBackground != null && this._state.ixBackground >= 0) {
			return this._backgrounds[this._state.ixBackground];
		}
		return null;
	}

	_notifyChange () {
		this._onStateChange?.();
	}

	_syncEntryFromState () {
		const entry = this._getEntry();
		const bg = this._getActiveBackground();
		
		entry.backgroundRef = bg ? {name: bg.name, source: bg.source} : null;

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

		if (this._setFnFilterBackground) {
			this._setFnFilterBackground(ix => {
				const bg = this._backgrounds[ix];
				if (!bg) return false;
				if (this._searchQuery && !bg.name.toLowerCase().includes(this._searchQuery)) return false;
				if (!filterBox) return true;
				const f = filterBox.getValues();
				return this._modalFilter.pageFilter.toDisplay(f, bg);
			});
		}
	}

	_renderSelectionControls ({wrpSelBlock}) {
		const wrpSel = ee`<div class="cmchr__class-sel ve-flex-col ve-w-100"></div>`;
		wrpSelBlock.append(wrpSel);

		const {wrp: wrpBgSel, setFnFilter: setFnFilterBackground} = ComponentUiUtil.getSelSearchable(
			this,
			"ixBackground",
			{
				values: this._backgrounds.map((_, i) => i),
				isAllowNull: true,
				fnDisplay: ix => OriginBackgroundBuildUi._getBackgroundDisplayName(this._backgrounds[ix]),
				asMeta: true,
			},
		);
		this._setFnFilterBackground = setFnFilterBackground;

		const btnFilterInline = ee`<button type="button" class="ve-btn ve-btn-xs ve-btn-default ve-h-100 ve-btr-0 ve-bbr-0 ve-pr-2"><span class="glyphicon glyphicon-filter"></span> Filter</button>`;

		this._addHookBase("ixBackground", () => {
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
				<div class="ve-flex-col ve-w-100">${wrpBgSel}</div>
			</div>`,
		);
	}

	async _pOpenFilterModal () {
		const bg = this._getActiveBackground();

		const out = await this._modalFilter.pGetUserSelection({
			selectedBackground: bg,
		});
		if (!out?.background) return;

		const ixBackground = this._backgrounds.findIndex(it => it.name === out.background.name && it.source === out.background.source);
		if (!~ixBackground) return;

		this._state.ixBackground = ixBackground;
		this._syncEntryFromState();
	}

	_renderPreview () {
		const bg = this._getActiveBackground();
		BackgroundPreviewRenderer.render({
			wrpPreview: this._frameMount.wrpRight,
			background: bg,
		});
	}

	_renderDetailSections ({wrpDetailsScroll} = {}) {
		if (!wrpDetailsScroll) {
			wrpDetailsScroll = this._frameMount.wrpLeft?.find(".cmchr__entry-details-scroll");
		}
		if (!wrpDetailsScroll) return;

		let stgDetails = wrpDetailsScroll.find(".cmchr__bg-details");
		if (!stgDetails) {
			stgDetails = ee`<div class="cmchr__bg-details ve-flex-col"></div>`;
			wrpDetailsScroll.append(stgDetails);
		} else {
			stgDetails.empty();
		}

		const bg = this._getActiveBackground();
		if (!bg) {
			stgDetails.toggleVe(false);
			return;
		}
		stgDetails.toggleVe(true);

		const wrpTraits = ee`<div class="ve-flex-col"></div>`;
		
		const createTextArea = (label, prop) => {
			const txt = ee`<textarea class="form-control ve-mb-2" rows="3" placeholder="Enter ${label.toLowerCase()}..."></textarea>`;
			txt.val(this._state[prop] || "");
			txt.onn("input", () => {
				this._state[prop] = txt.val();
				this._notifyChange();
			});
			
			const btnTable = ee`<button class="ve-btn ve-btn-xxs ve-btn-default ve-ml-2 ve-muted" title="View Table">[+] View Table</button>`;
			const wrpTable = ee`<div class="ve-hidden ve-mb-2 ve-small ve-muted">Table data will be rendered here.</div>`;
			
			btnTable.onn("click", () => {
				const isHidden = !wrpTable.hasClass("ve-hidden");
				wrpTable.toggleVe(!isHidden);
				btnTable.txt(isHidden ? "[+] View Table" : "[-] Hide Table");
			});

			return ee`<div class="ve-flex-col">
				<div class="ve-flex-v-center ve-mb-1"><div class="ve-bold">${label}</div>${btnTable}</div>
				${wrpTable}
				${txt}
			</div>`;
		};

		wrpTraits.append(
			createTextArea("Personality Traits", "personalityTraits"),
			createTextArea("Ideals", "ideals"),
			createTextArea("Bonds", "bonds"),
			createTextArea("Flaws", "flaws")
		);

		stgDetails.append(
			ee`<hr class="ve-hr-2">
			<div class="ve-bold ve-mb-2">Characteristics</div>
			${wrpTraits}`
		);
	}

	static _getBackgroundDisplayName (bg) {
		if (!bg) return "(Unknown)";
		return `${bg.name}${bg.source !== Parser.SRC_PHB ? ` [${Parser.sourceJsonToAbv(bg.source)}]` : ""}`;
	}

	validate () {
		const messages = [];
		const entry = this._getEntry();
		if (!entry.backgroundRef) messages.push("Select a background.");
		return {isValid: !messages.length, messages};
	}
}
