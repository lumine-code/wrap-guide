describe("Wrap Guide column configuration ownership", () => {
  let editor, scope, selector;

  beforeEach(async () => {
    lumine.config.set("wrap-guide.columns", []);
    lumine.config.set("wrap-guide.modifyPreferredLineLength", false);
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
    lumine.config.unset("wrap-guide.modifyPreferredLineLength");
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

  it("retains rightmost-column preferred length synchronization for a scoped setting", () => {
    lumine.config.set("wrap-guide.modifyPreferredLineLength", true);
    lumine.config.set("wrap-guide.columns", [40, 70], { scopeSelector: selector });
    expect(lumine.config.get("wrap-guide.columns")).toEqual([]);
    expect(lumine.config.get("editor.preferredLineLength", { scope })).toBe(70);
  });

  it("lets removal of the original scoped setting restore inherited columns", () => {
    lumine.config.set("wrap-guide.columns", [50, 90], { scopeSelector: selector });
    lumine.config.unset("wrap-guide.columns", { scopeSelector: selector });
    expect(lumine.config.get("wrap-guide.columns", { scope })).toEqual([]);
  });
});
