const chapter = (index, catalogName, rootId) => ({index, catalogName, rootId});

export const CORPUS_MANIFEST = [
	{kind: "book", id: "SCAG", mode: "full", region: "Costa da Espada e o Norte"},
	{kind: "book", id: "AI", mode: "full", region: "Costa da Espada e o Norte"},
	{kind: "book", id: "MaBJoV", mode: "full", region: "Baldur's Gate, Candlekeep e organizações regionais"},

	{kind: "adventure", id: "LMoP", mode: "full", region: "Phandalin e Neverwinter"},
	{kind: "adventure", id: "PaBTSO", mode: "full", region: "Phandalin e o Norte"},
	{kind: "adventure", id: "DIP", mode: "full", region: "Phandalin e Neverwinter"},
	{kind: "adventure", id: "SLW", mode: "full", region: "Leilon"},
	{kind: "adventure", id: "SDW", mode: "full", region: "Leilon e a costa norte"},
	{kind: "adventure", id: "DC", mode: "full", region: "Leilon e Neverwinter"},
	{kind: "adventure", id: "WDH", mode: "full", region: "Waterdeep"},
	{kind: "adventure", id: "WDMM", mode: "full", region: "Waterdeep e Undermountain"},
	{kind: "adventure", id: "SKT", mode: "full", region: "Savage Frontier e o Norte"},
	{kind: "adventure", id: "HotDQ", mode: "full", region: "Costa da Espada"},
	{kind: "adventure", id: "RoT", mode: "full", region: "Waterdeep e o Norte"},
	{kind: "adventure", id: "DoSI", mode: "full", region: "Stormwreck Isle e Neverwinter"},

	{
		kind: "adventure",
		id: "PotA",
		mode: "chapters",
		region: "Vale Dessarin",
		selections: [chapter(1, "The Dessarin Valley", "047")],
	},
	{
		kind: "adventure",
		id: "CM",
		mode: "mixed",
		region: "Candlekeep e rota para Baldur's Gate",
		selections: [
			chapter(1, "Candlekeep", "008"),
			{index: 3, catalogName: "Mazfroth's Mighty Digressions", rootId: "084", subtreeName: "Journey to Baldur's Gate", subtreeId: "090"},
		],
	},
	{
		kind: "adventure",
		id: "BGDIA",
		mode: "chapters",
		region: "Baldur's Gate",
		selections: [
			chapter(1, "A Tale of Two Cities", "014"),
			chapter(9, "Baldur's Gate Gazetteer", "348"),
		],
	},
	{
		kind: "adventure",
		id: "IDRotF",
		mode: "chapters",
		region: "Ten-Towns e Icewind Dale",
		selections: [
			chapter(1, "Ten-Towns", "040"),
			chapter(2, "Bremen", "06f"),
			chapter(3, "Bryn Shander", "090"),
			chapter(4, "Caer-Dineval", "0b0"),
			chapter(5, "Caer-Konig", "0fa"),
			chapter(6, "Dougan's Hole", "130"),
			chapter(7, "Easthaven", "158"),
			chapter(8, "Good Mead", "1ac"),
			chapter(9, "Lonelywood", "1e0"),
			chapter(10, "Targos", "211"),
			chapter(11, "Termalaine", "23e"),
			chapter(12, "Icewind Dale", "27c"),
		],
	},
	{
		kind: "adventure",
		id: "OotA",
		mode: "chapters",
		region: "Gauntlgrym e Underdark do Norte",
		selections: [
			chapter(7, "Audience in Gauntlgrym", "323"),
			chapter(8, "Mantol-Derith", "34e"),
		],
	},
	{
		kind: "adventure",
		id: "OoW",
		mode: "chapters",
		region: "Phandalin e Neverwinter",
		selections: [
			chapter(2, "Fun in Phandalin", "076"),
			chapter(3, "Darkness at the Lighthouse", "121"),
		],
	},
	{
		kind: "adventure",
		id: "VEoR",
		mode: "chapters",
		region: "Neverwinter e Neverdeath",
		selections: [chapter(1, "Return from Neverdeath Graveyard", "02e")],
	},
];

export const COMPANION_SOURCE_IDS = [...new Set(CORPUS_MANIFEST.map(it => it.id))];

export const ORGANIZATION_EXCERPTS = [
	{kind: "book", id: "AI", name: "Factions and Rivals", entryId: "165"},
	{kind: "book", id: "MaBJoV", name: "Group Patrons", entryId: "090"},
];
