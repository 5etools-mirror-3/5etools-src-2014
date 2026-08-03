import {patchLoadJson, unpatchLoadJson} from "../../../node/util.js";

import "../../../js/parser.js";
import "../../../js/utils.js";
import "../../../js/utils-ui.js";
import "../../../js/utils-brew.js";
import "../../../js/utils-dataloader.js";
import "../../../js/utils-config.js";
import "../../../js/hist.js";
import "../../../js/render.js";
import "../../../js/render-dice.js";
import "../../../js/render-markdown.js";

export function setupRenderer () {
	patchLoadJson();
	Renderer.get().baseUrl = "";
}

export function teardownRenderer () {
	unpatchLoadJson();
}
