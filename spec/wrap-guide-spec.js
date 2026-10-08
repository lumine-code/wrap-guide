const { getWrapGuides, getLeftPosition } = require("./helpers");

describe("Wrap Guide", () => {
  let editor,
    editorElement,
    wrapGuide = [];

  beforeEach(async () => {
    await lumine.packages.activatePackage("wrap-guide");
    lumine.config.set("wrap-guide.showWrapGuide", "always");

    editor = await lumine.workspace.open("sample.js");
    editorElement = editor.getElement();
    wrapGuide = editorElement.querySelector(".wrap-guide-container");

    jasmine.attachToDOM(lumine.views.getView(lumine.workspace));
  });

  describe("package activation", () => {
    it("releases editor listener handles after repeated editor closure", async () => {
      const main = lumine.packages.getActivePackage("wrap-guide").mainModule;
      const initialSize = main.subscriptions.disposables.size;
      for (let index = 0; index < 8; index++) {
        const temporary = await lumine.workspace.open();
        expect(main.wrapGuides.has(temporary)).toBe(true);
        expect(main.subscriptions.disposables.size).toBe(initialSize + 1);
        temporary.destroy();
        expect(main.wrapGuides.has(temporary)).toBe(false);
        expect(main.subscriptions.disposables.size).toBe(initialSize);
      }
    });

    it("appends a wrap guide to all existing and new editors", () => {
      expect(lumine.workspace.getTextEditors().length).toBe(1);
      expect(getWrapGuides().length).toBe(1);
      expect(getLeftPosition(getWrapGuides()[0])).toBeGreaterThan(0);

      lumine.workspace.getActivePane().splitRight({ copyActiveItem: true });
      expect(lumine.workspace.getTextEditors().length).toBe(2);
      expect(getWrapGuides().length).toBe(2);
      expect(getLeftPosition(getWrapGuides()[0])).toBeGreaterThan(0);
      expect(getLeftPosition(getWrapGuides()[1])).toBeGreaterThan(0);
    });

    it("positions the guide at the configured column", () => {
      const width = editor.getDefaultCharWidth() * wrapGuide.getDefaultColumn();
      expect(width).toBeGreaterThan(0);
      expect(Math.abs(getLeftPosition(wrapGuide.firstChild) - width)).toBeLessThan(1);
      expect(wrapGuide.firstChild).toBeVisible();
    });
  });

  describe("package deactivation", () => {
    beforeEach(async () => {
      await lumine.packages.deactivatePackage("wrap-guide");
    });

    it("disposes of all wrap guides", () => {
      expect(getWrapGuides().length).toBe(0);
    });
  });
});
