describe("Wrap Guide preferred line length", () => {
  let editor, guide, scope, selector;

  beforeEach(async () => {
    lumine.config.set("wrap-guide.showWrapGuide", "always");
    lumine.config.set("editor.preferredLineLength", 80);
    const pack = await lumine.packages.activatePackage("wrap-guide");
    editor = await lumine.workspace.open();
    scope = editor.getRootScopeDescriptor();
    selector = `.${editor.getGrammar().scopeName}`;
    jasmine.attachToDOM(lumine.workspace.getElement());
    guide = pack.mainModule.wrapGuides.get(editor);
    expect(guide).toBeDefined();
  });

  afterEach(async () => {
    editor?.destroy();
    await lumine.packages.deactivatePackage("wrap-guide");
  });

  function expectGuideAt(column) {
    expect(guide.element.querySelectorAll(".wrap-guide").length).toBe(1);
    expect(guide.element.firstElementChild.style.left).toBe(
      `${Math.round(editor.getElement().getDefaultCharacterWidth() * column)}px`,
    );
  }

  it("draws a single guide at the core preferred line length", () => {
    expectGuideAt(80);
    lumine.config.set("editor.preferredLineLength", 100);
    expectGuideAt(100);
  });

  it("ignores obsolete saved package column settings", () => {
    lumine.config.set("wrap-guide.columns", [20, 40]);
    lumine.config.set("wrap-guide.columns", [60, 120], { scopeSelector: selector });
    expectGuideAt(80);

    lumine.config.set("editor.preferredLineLength", 90);
    expectGuideAt(90);
  });

  it("keeps inheriting successive global changes without creating scoped overrides", () => {
    lumine.config.set("editor.preferredLineLength", 100);
    lumine.config.set("editor.preferredLineLength", 90);

    expect(editor.getPreferredLineLength()).toBe(90);
    expectGuideAt(90);
    expect(
      lumine.config
        .getAll("editor.preferredLineLength", { scope })
        .every((source) => source.scopeSelector === "*"),
    ).toBe(true);
  });

  it("restores the global width when a core language override is removed", () => {
    lumine.config.set("editor.preferredLineLength", 70, { scopeSelector: selector });
    expectGuideAt(70);

    lumine.config.unset("editor.preferredLineLength", { scopeSelector: selector });
    expectGuideAt(80);
  });

  it("does not write configuration in response to a core width change", () => {
    spyOn(lumine.config, "set").and.callThrough();

    lumine.config.set("editor.preferredLineLength", 90);

    expectGuideAt(90);
    expect(lumine.config.set.calls.allArgs()).toEqual([["editor.preferredLineLength", 90]]);
  });

  it("releases the model width subscription when the package deactivates", async () => {
    spyOn(guide, "updateGuide").and.callThrough();
    await lumine.packages.deactivatePackage("wrap-guide");

    await editor.update({ preferredLineLength: 100 });

    expect(guide.element.isConnected).toBe(false);
    expect(guide.updateGuide).not.toHaveBeenCalled();
  });
});
