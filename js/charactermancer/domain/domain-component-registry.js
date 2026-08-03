import {ClassDomainComponent} from "./class/class-domain-component.js";

import {OriginSpeciesDomainComponent} from "./origin-species/origin-species-domain-component.js";
import {OriginBackgroundDomainComponent} from "./origin-background/origin-background-domain-component.js";

/** @type {Map<string, (ctx: import("../core/contracts.js").DomainComponentFactoryContext) => import("./base-domain-component.js").BaseDomainComponent>} */
const _REGISTRY = new Map([
	["class", ctx => new ClassDomainComponent(ctx)],
	["origin-species", ctx => new OriginSpeciesDomainComponent(ctx)],
	["origin-background", ctx => new OriginBackgroundDomainComponent(ctx)],
]);

/**
 * @param {string} domainComponentId
 * @returns {boolean}
 */
export function hasDomainComponent (domainComponentId) {
	return _REGISTRY.has(domainComponentId);
}

/**
 * @param {import("../core/contracts.js").DomainComponentFactoryContext} ctx
 * @returns {import("./base-domain-component.js").BaseDomainComponent|null}
 */
export function createDomainComponent (ctx) {
	const id = ctx.tab.domainComponentId;
	if (!id) return null;
	const factory = _REGISTRY.get(id);
	return factory ? factory(ctx) : null;
}
