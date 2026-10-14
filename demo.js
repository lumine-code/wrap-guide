// Authentic package usage. Run with lumine/script/demo.js; fixtures stay in demo/.
module.exports = {
  version: 1,
  dependencies: ["language-javascript", "tree-view"],
  viewport: { width: 1200, height: 760 },
  async before() {},
  async prepare(context) {
    const { lumine, state, fixture, open } = context;
    state.editor = await open("Signal Lab/src/signal.js");
    await lumine.project.setPaths([fixture("Signal Lab")]);
  },
  scenes: [
    {
      id: "scene-1",
      file: "demo.png",
      caption: "Keep source lines within visible column guides.",
      timeout: 60000,
      async run(context) {
        const { lumine } = context;
        {
          lumine.config.set("wrap-guide.columns", [80]);
        }
      },
      ready() {
        return Boolean(document.querySelector("wrap-guide, .wrap-guide"));
      },
    },
  ],
  async cleanup(context) {
    const { lumine } = context;
    lumine.config.unset("wrap-guide.columns");
    lumine.config.unset("editor.preferredLineLength");
  },
};
