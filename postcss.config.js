const purgecss = require("@fullhuman/postcss-purgecss")({
	content: ["./hugo_stats.json"],
	defaultExtractor: (content) => {
		let els = JSON.parse(content).htmlElements;
		return els.tags.concat(els.classes, els.ids);
	},
	whitelist: [
		"transition",
		"bg-blue-500"
	],
});
module.exports = {
	plugins: [
		require("postcss-import")({
			path: ["assets/css"],
		}),
		require("tailwindcss")("./assets/css/tailwind.config.js"),
		require("autoprefixer"),
		...(process.env.HUGO_ENV !== "development" ? [purgecss] : []),
	],
};
