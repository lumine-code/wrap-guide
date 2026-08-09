const { CompositeDisposable } = require("lumine");
const WrapGuideElement = require("./wrap-guide-element");

module.exports = {
  activate() {
    this.subscriptions = new CompositeDisposable();
    this.wrapGuides = new Map();

    this.when = lumine.config.get("wrap-guide.showWrapGuide");
    this.subscriptions.add(
      lumine.config.onDidChange("wrap-guide.showWrapGuide", (args) => {
        this.when = args.newValue;
        lumine.workspace.getTextEditors().forEach(async (editor) => {
          await this.wrapGuides.get(editor).setWhen(this.when);
        });
      }),
    );

    this.subscriptions.add(
      lumine.workspace.observeTextEditors((editor) => {
        if (this.wrapGuides.has(editor)) return;
        const editorElement = lumine.views.getView(editor);
        const wrapGuideElement = new WrapGuideElement(editor, editorElement, this.when);

        this.wrapGuides.set(editor, wrapGuideElement);
        this.subscriptions.add(
          editor.onDidDestroy(() => {
            this.wrapGuides.get(editor).destroy();
            this.wrapGuides.delete(editor);
          }),
        );
      }),
    );
  },

  deactivate() {
    this.subscriptions.dispose();
    this.wrapGuides.forEach((wrapGuide, _editor) => wrapGuide.destroy());
    return this.wrapGuides.clear();
  },

  uniqueAscending(list) {
    return list.filter((item, index) => list.indexOf(item) === index).sort((a, b) => a - b);
  },
};
