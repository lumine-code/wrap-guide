const { CompositeDisposable } = require("lumine");
const WrapGuideElement = require("./wrap-guide-element");

module.exports = {
  provideBackgroundTips() {
    return {
      packageName: "wrap-guide",
      tips: [
        "Wrap Guide marks the editor's preferred line length or its actual soft wrap boundary.",
      ],
    };
  },

  activate() {
    this.subscriptions = new CompositeDisposable();
    this.wrapGuides = new Map();

    this.when = lumine.config.get("wrap-guide.showWrapGuide");
    this.subscriptions.add(
      lumine.config.onDidChange("wrap-guide.showWrapGuide", (args) => {
        this.when = args.newValue;
        for (const guide of this.wrapGuides.values()) guide.setWhen(this.when);
      }),
    );

    this.subscriptions.add(
      lumine.workspace.observeTextEditors((editor) => {
        if (this.wrapGuides.has(editor)) return;
        const editorElement = lumine.views.getView(editor);
        const wrapGuideElement = new WrapGuideElement(editor, editorElement, this.when);

        this.wrapGuides.set(editor, wrapGuideElement);
        const owner = this.subscriptions;
        const guides = this.wrapGuides;
        const destroyed = editor.onDidDestroy(() => {
          wrapGuideElement.destroy();
          if (guides.get(editor) === wrapGuideElement) guides.delete(editor);
          owner.remove(destroyed);
          destroyed.dispose();
        });
        owner.add(destroyed);
      }),
    );
  },

  deactivate() {
    this.subscriptions?.dispose();
    this.wrapGuides?.forEach((wrapGuide, _editor) => wrapGuide.destroy());
    return this.wrapGuides?.clear();
  },
};
