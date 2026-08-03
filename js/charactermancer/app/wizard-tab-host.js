import {createDomainComponent, hasDomainComponent} from "../domain/domain-component-registry.js";
import {DomainTabFrame} from "./domain-tab-frame.js";

export class WizardTabHost extends BaseComponent {
	/**
	 * @param {{
	 *   visibleTabs: import("../core/contracts.js").WizardTabDefinition[],
	 *   buildState: import("../state/character-build-state.js").CharacterBuildState,
	 *   dataset: import("../core/contracts.js").UnifiedDataset,
	 *   getActiveTabId: () => string,
	 *   setActiveTabId: (id: string) => void,
	 * }} opts
	 */
	constructor ({visibleTabs, buildState, dataset, getActiveTabId, setActiveTabId}) {
		super();
		TabUiUtil.decorate(this, {isInitMeta: true});

		this._visibleTabs = visibleTabs;
		this._buildState = buildState;
		this._dataset = dataset;
		this._getActiveTabId = getActiveTabId;
		this._setActiveTabId = setActiveTabId;
		/** @type {Map<string, import("../core/contracts.js").DomainTabFrameMount>} */
		this._frameByTabId = new Map();
		/** @type {Map<string, import("../domain/base-domain-component.js").BaseDomainComponent>} */
		this._componentByTabId = new Map();
		/** @type {Array<{ tab: import("../core/contracts.js").WizardTabDefinition, btnTab: HTMLElementExtended, wrpTab: HTMLElementExtended }>} */
		this._tabMetasOut = [];
	}

	/**
	 * @param {HTMLElementExtended} eleParent
	 * @param {{ onTabsReady?: () => void }} [opts]
	 */
	async pRenderTabs ({eleParent, onTabsReady} = {}) {
		eleParent.empty();
		this._frameByTabId.clear();
		this._componentByTabId.forEach(c => c.destroy());
		this._componentByTabId.clear();
		this._tabMetasOut = [];

		const {propActive, _propProxy} = this._getTabProps({propProxy: "meta"});

		const activeId = this._getActiveTabId();
		let ixInitial = this._visibleTabs.findIndex(t => t.id === activeId);
		if (ixInitial < 0) ixInitial = 0;
		this._meta[propActive] = ixInitial;

		this._visibleTabs.forEach((tab, ix) => {
			const tabMeta = new TabUiUtil.TabMeta({
				name: tab.label,
				hasBorder: true,
				hasBackground: true,
			});

			const btnTab = this.__getBtnTab({tabMeta, _propProxy, propActive, ixTab: ix});
			btnTab.addClass("ve-btn-sm");

			const wrpTab = this.__getWrpTab({tabMeta});
			wrpTab
				.addClass("cmchr__tab-panel")
				.addClass("ve-ui-tab__wrp-tab-body")
				.addClass("ve-flex")
				.addClass("w-100")
				.addClass("h-100")
				.addClass("min-h-0");

			this._tabMetasOut.push({tab, btnTab, wrpTab});
		});

		const wrpHeads = ee`<div class="cmchr__tab-heads ve-flex w-100 no-shrink ve-ui-tab__wrp-tab-heads"></div>`;
		this._tabMetasOut.forEach(it => wrpHeads.append(it.btnTab));

		const wrpBodies = ee`<div class="cmchr__tab-bodies ve-flex flex-1 min-h-0 w-100"></div>`;

		for (const it of this._tabMetasOut) {
			const tab = it.tab;
			const omitStub = tab.domainComponentId ? hasDomainComponent(tab.domainComponentId) : false;
			const mount = DomainTabFrame.render({
				parent: it.wrpTab,
				tab,
				buildState: this._buildState,
				omitStub,
			});
			this._frameByTabId.set(tab.id, mount);

			const component = createDomainComponent({
				dataset: this._dataset,
				buildState: this._buildState,
				tab,
				frameMount: mount,
			});
			if (component) {
				await component.pLoad();
				component.render(mount);
				this._componentByTabId.set(tab.id, component);
			}

			wrpBodies.append(it.wrpTab);
		}

		ee`<div class="cmchr__tabs-inner ve-flex-col w-100 h-100 min-h-0">
			${wrpHeads}
			${wrpBodies}
		</div>`.appendTo(eleParent);

		const hkActiveTab = () => {
			const ixActive = this._meta[propActive];
			this._tabMetasOut.forEach((it, ix) => {
				const isActive = ix === ixActive;
				it.btnTab.toggleClass("active", isActive);
				it.wrpTab.toggleVe(isActive);
				if (isActive) this._setActiveTabId(it.tab.id);
			});
			if (onTabsReady) onTabsReady();
		};

		this._addHook("meta", propActive, hkActiveTab);
		hkActiveTab();
	}

	/** @deprecated use pRenderTabs */
	renderTabs (opts) {
		return this.pRenderTabs(opts);
	}

	setActiveTabById (tabId) {
		const ix = this._visibleTabs.findIndex(t => t.id === tabId);
		if (ix < 0) return;
		this._meta.ixActiveTab__default = ix;
	}

	getFrameMount (tabId) {
		return this._frameByTabId.get(tabId) || null;
	}

	getDomainComponent (tabId) {
		return this._componentByTabId.get(tabId) || null;
	}

	getActiveDomainComponent () {
		const tabId = this._getActiveTabId();
		return this.getDomainComponent(tabId);
	}

	/**
	 * @returns {import("../core/contracts.js").DomainComponentValidateResult}
	 */
	validateActiveTab () {
		const component = this.getActiveDomainComponent();
		if (!component) return {isValid: true, messages: []};
		return component.validate();
	}

	syncActiveTabFormData () {
		const tab = this._visibleTabs.find(t => t.id === this._getActiveTabId());
		const component = this.getActiveDomainComponent();
		if (!tab?.stateKey || !component) return;
		const data = component.getFormData();
		if (data && Object.keys(data).length) {
			this._buildState[tab.stateKey] = data;
		}
	}

	_hasPrevTab () {
		return this._meta.ixActiveTab__default > 0;
	}

	_hasNextTab () {
		return this._meta.ixActiveTab__default < this._visibleTabs.length - 1;
	}

	_doSwitchToPrevTab () {
		if (!this._hasPrevTab()) return;
		this.syncActiveTabFormData();
		this._meta.ixActiveTab__default -= 1;
	}

	/**
	 * @returns {boolean} true if navigation proceeded
	 */
	_trySwitchToNextTab () {
		if (!this._hasNextTab()) return true;

		const validation = this.validateActiveTab();
		if (!validation.isValid) {
			JqueryUtil.doToast({
				content: validation.messages.join(" ") || "Please complete this step before continuing.",
				type: "warning",
			});
			return false;
		}

		this.syncActiveTabFormData();
		this._meta.ixActiveTab__default += 1;
		return true;
	}

	_doSwitchToNextTab () {
		this._trySwitchToNextTab();
	}
}
