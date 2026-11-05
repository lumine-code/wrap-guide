describe("Wrap Guide column configuration ownership", () => {
  let editor, scope, selector;

  beforeEach(async () => {
    lumine.config.set("wrap-guide.columns", []);
    await lumine.packages.activatePackage("wrap-guide");
    editor = await lumine.workspace.open();
    scope = editor.getRootScopeDescriptor();
    selector = `.${editor.getGrammar().scopeName}`;
  });

  afterEach(async () => {
    editor.destroy();
    await lumine.packages.deactivatePackage("wrap-guide");
    lumine.config.unset("wrap-guide.columns", { scopeSelector: selector });
    lumine.config.unset("editor.preferredLineLength", { scopeSelector: selector });
    lumine.config.unset("wrap-guide.columns");
    lumine.config.unset("editor.preferredLineLength");
  });

  it("keeps a scoped column change out of global configuration", () => {
    lumine.config.set("wrap-guide.columns", [50, 90], { scopeSelector: selector });
    expect(lumine.config.get("wrap-guide.columns")).toEqual([]);
    expect(lumine.config.get("wrap-guide.columns", { scope })).toEqual([50, 90]);
  });

  it("normalizes duplicate or unordered columns in their existing scope", () => {
    lumine.config.set("wrap-guide.columns", [90, 50, 90], { scopeSelector: selector });
    expect(lumine.config.get("wrap-guide.columns")).toEqual([]);
    expect(lumine.config.get("wrap-guide.columns", { scope })).toEqual([50, 90]);
  });

  it("keeps global column normalization global", () => {
    lumine.config.set("wrap-guide.columns", [90, 50, 90]);
    expect(lumine.config.get("wrap-guide.columns")).toEqual([50, 90]);
    expect(
      lumine.config
        .getAll("wrap-guide.columns", { scope })
        .every((source) => source.scopeSelector === "*"),
    ).toBe(true);
  });

  it("keeps scoped visual columns independent of the preferred line length", () => {
    const preferredLineLength = editor.getPreferredLineLength();
    lumine.config.set("wrap-guide.columns", [40, 70], { scopeSelector: selector });
    expect(lumine.config.get("wrap-guide.columns")).toEqual([]);
    expect(editor.getPreferredLineLength()).toBe(preferredLineLength);
    expect(
      lumine.config
        .getAll("editor.preferredLineLength", { scope })
        .every((source) => source.scopeSelector === "*"),
    ).toBe(true);
  });

  it("preserves global inheritance across successive preferred length changes", () => {
    lumine.config.set("wrap-guide.columns", [72, 120]);
    lumine.config.set("editor.preferredLineLength", 100);
    lumine.config.set("editor.preferredLineLength", 90);

    expect(editor.getPreferredLineLength()).toBe(90);
    expect(lumine.config.get("wrap-guide.columns", { scope })).toEqual([72, 120]);
    for (const key of ["editor.preferredLineLength", "wrap-guide.columns"]) {
      expect(
        lumine.config.getAll(key, { scope }).every((source) => source.scopeSelector === "*"),
      ).toBe(true);
    }
  });

  it("does not write configuration in response to a preferred length change", () => {
    lumine.config.set("wrap-guide.columns", [72, 120]);
    spyOn(lumine.config, "set").and.callThrough();

    lumine.config.set("editor.preferredLineLength", 90);

    expect(lumine.config.set.calls.allArgs()).toEqual([["editor.preferredLineLength", 90]]);
    expect(lumine.config.get("wrap-guide.columns", { scope })).toEqual([72, 120]);
  });

  it("lets removal of the original scoped setting restore inherited columns", () => {
    lumine.config.set("wrap-guide.columns", [50, 90], { scopeSelector: selector });
    lumine.config.unset("wrap-guide.columns", { scopeSelector: selector });
    expect(lumine.config.get("wrap-guide.columns", { scope })).toEqual([]);
  });
});
