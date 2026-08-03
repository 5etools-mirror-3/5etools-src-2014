import {hasDomainComponent} from "../domain/domain-component-registry.js";

export class DomainTabFrame {
	/**
	 * @param {{
	 *   parent: HTMLElementExtended,
	 *   tab: import("../core/contracts.js").WizardTabDefinition,
	 *   buildState: import("../state/character-build-state.js").CharacterBuildState,
	 *   omitStub?: boolean,
	 * }} opts
	 * @returns {import("../core/contracts.js").DomainTabFrameMount}
	 */
	static render ({parent, tab, buildState, omitStub}) {
		parent.empty();

		const shouldOmitStub = omitStub ?? (tab.domainComponentId ? hasDomainComponent(tab.domainComponentId) : false);

		if (tab.layout === "singleColumn") {
			return DomainTabFrame._renderSingleColumn({parent, tab, buildState, omitStub: shouldOmitStub});
		}
		return DomainTabFrame._renderTwoColumn({parent, tab, buildState, omitStub: shouldOmitStub});
	}

	/**
	 * @param {{
	 *   parent: HTMLElementExtended,
	 *   tab: import("../core/contracts.js").WizardTabDefinition,
	 *   buildState: import("../state/character-build-state.js").CharacterBuildState,
	 *   omitStub?: boolean,
	 * }} opts
	 * @returns {import("../core/contracts.js").DomainTabFrameMount}
	 */
	static _renderSingleColumn ({parent, tab, buildState, omitStub}) {
		const wrpRoot = ee`<div class="cmchr__domain cmchr__domain--single ve-flex-col w-100 h-100 min-h-0 p-2">
			<h5 class="mb-2">${tab.selectTitle}</h5>
			<div class="cmchr__single-body ve-flex-col flex-1 min-h-0 overflow-y-auto"></div>
		</div>`;

		parent.append(wrpRoot);

		const wrpBody = wrpRoot.find(".cmchr__single-body");
		if (!omitStub) {
			wrpRoot.prepend(ee`<p class="ve-muted mb-2">Domain component not implemented.</p>`);
			wrpBody.append(DomainTabFrame._getStubDevBlock({tab, buildState}));
		}

		return {wrpRoot, wrpLeft: null, wrpRight: wrpBody, wrpLeftMeta: null};
	}

	/**
	 * @param {{
	 *   parent: HTMLElementExtended,
	 *   tab: import("../core/contracts.js").WizardTabDefinition,
	 *   buildState: import("../state/character-build-state.js").CharacterBuildState,
	 *   omitStub?: boolean,
	 * }} opts
	 * @returns {import("../core/contracts.js").DomainTabFrameMount}
	 */
	static _renderTwoColumn ({parent, tab, buildState, omitStub}) {
		const useGlobalListFilter = tab.useGlobalListFilter !== false;

		const wrpRoot = ee`<div class="cmchr__domain cmchr__domain--two-col ve-flex-col w-100 h-100 min-h-0">
			<div class="cmchr__split-panel ve-flex flex-1 min-h-0 w-100">
				<div class="cmchr__lhs ve-col-6 ve-flex-col min-h-0 min-w-0" style="border-right: 1px solid var(--border-color);">
					<div class="cmchr__lhs-chrome ve-flex-v-baseline no-shrink px-2 pt-2 ${useGlobalListFilter ? "" : "ve-hidden"}">
						<h5 class="cmchr__lhs-title mb-0">${tab.selectTitle}</h5>
						<div class="cmchr__lhs-meta ml-auto ve-flex-v-center ve-hidden"></div>
					</div>
					<div class="cmchr__filter-bar px-2 ${useGlobalListFilter ? "" : "cmchr__filter-bar--mini-only"}"></div>
					<div class="cmchr__lhs-body ve-flex-col flex-1 min-h-0 px-2 pb-2"></div>
				</div>
				<div class="cmchr__rhs ve-col-6 ve-flex-col flex-1 min-h-0 min-w-0">
					<div class="cmchr__preview-pane flex-1 min-h-0 overflow-y-auto smooth-scroll">
						<div class="initial-message initial-message--med ve-flex-vh-center flex-1 min-h-0">Select an entry from the list to view it here</div>
					</div>
				</div>
			</div>
		</div>`;

		const searchPlaceholder = DomainTabFrame._getSearchPlaceholder(tab);
		const wrpFilter = wrpRoot.find(".cmchr__filter-bar");
		const btnFilter = ee`<button type="button" class="ve-btn ve-btn-default ve-btn-xs veapp__btn-filter" disabled>Filter</button>`;
		const iptSearch = ee`<input type="search" autocomplete="off" autocapitalize="off" spellcheck="false" class="h-100 search form-control lst__search lst__search--no-border-h" placeholder="${searchPlaceholder}" disabled>`;
		const btnReset = ee`<button type="button" class="ve-btn ve-btn-default ve-btn-xs veapp__btn-list-reset" disabled>Reset</button>`;
		const wrpMiniFilter = ee`<div class="fltr__mini-view ve-btn-group mb-1"></div>`;

		if (useGlobalListFilter) {
			wrpFilter.append(
				ee`<div class="ve-flex-v-stretch input-group input-group--top no-shrink mb-1">
					${btnFilter}
					<div class="w-100 relative">
						${iptSearch}
						<div class="lst__wrp-search-glass no-events ve-flex-vh-center"><span class="glyphicon glyphicon-search"></span></div>
					</div>
					${btnReset}
				</div>
				${wrpMiniFilter}`,
			);
		} else {
			wrpFilter.append(wrpMiniFilter);
		}

		const wrpLeft = wrpRoot.find(".cmchr__lhs-body");
		const wrpRight = wrpRoot.find(".cmchr__preview-pane");
		const wrpLeftMeta = wrpRoot.find(".cmchr__lhs-meta");

		if (!omitStub) {
			wrpLeft.append(DomainTabFrame._getStubDevBlock({tab, buildState, isCompact: true}));
		}

		parent.append(wrpRoot);

		/**
		 * @param {{ onFilterClick?: () => void|Promise<void>, onResetClick?: () => void, onSearchInput?: (query: string) => void }} [opts]
		 */
		const enableFilterChrome = (opts = {}) => {
			btnFilter.prop("disabled", false);
			iptSearch.prop("disabled", false);
			btnReset.prop("disabled", false);

			btnFilter.off("click").onn("click", () => opts.onFilterClick?.());
			btnReset.off("click").onn("click", () => {
				iptSearch.val("");
				opts.onResetClick?.();
				opts.onSearchInput?.("");
			});
			iptSearch.off("input").onn("input", () => opts.onSearchInput?.(String(iptSearch.val() || "").trim().toLowerCase()));
		};

		return {
			wrpRoot,
			wrpLeft,
			wrpRight,
			wrpLeftMeta,
			wrpFilterBar: wrpFilter,
			useGlobalListFilter,
			enableFilterChrome,
		};
	}

	static _getSearchPlaceholder (tab) {
		const title = tab.selectTitle || tab.label || "entries";
		return `Find ${title.replace(/^Select (a |an )?/i, "")}...`;
	}

	static _getStubDevBlock ({tab, buildState, isCompact = false}) {
		const stateSnapshot = tab.stateKey ? buildState[tab.stateKey] : null;
		const inner = ee`<div class="cmchr__domain-stub ve-small ve-muted ${isCompact ? "p-1" : "p-2"}">
			<p class="mb-1">Domain component not implemented.</p>
			<p class="mb-0"><code>${tab.id}</code></p>
		</div>`;
		if (!isCompact && stateSnapshot) {
			const pre = ee`<pre class="ve-small mt-2 mb-0" style="white-space: pre-wrap; max-height: 80px; overflow: auto;"></pre>`;
			pre.txt(JSON.stringify(stateSnapshot, null, 2));
			inner.append(pre);
		}
		return inner;
	}
}
