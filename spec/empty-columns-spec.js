describe("Wrap Guide column fallback", () => {
  let editor, guide;
  beforeEach(async () => {
    for (const method of ["openPath", "openExternal", "openApplication", "showItemInFolder"])
      spyOn(lumine.shell, method).and.resolveTo();
    spyOn(lumine.application, "openWindow").and.resolveTo();
    lumine.config.set("wrap-guide.modifyPreferredLineLength", false);
    lumine.config.set("wrap-guide.showWrapGuide", "always");
    lumine.config.set("editor.preferredLineLength", 80);
    lumine.config.set("wrap-guide.columns", [20, 40]);
    const pack = await lumine.packages.activatePackage("wrap-guide");
    editor = await lumine.workspace.open();
    jasmine.attachToDOM(lumine.workspace.getElement());
    guide = pack.mainModule.wrapGuides.get(editor);
    expect(guide).toBeDefined();
    expect(guide.element.querySelectorAll(".wrap-guide").length).toBe(2);
  });
  afterEach(async () => {
    editor?.destroy();
    await lumine.packages.deactivatePackage("wrap-guide");
  });
  it("refreshes to its preferred-column fallback when the custom list is cleared", () => {
    lumine.config.set("wrap-guide.columns", []);
    expect(guide.getGuidesColumns()).toEqual([80]);
    expect(guide.element.querySelectorAll(".wrap-guide").length).toBe(1);
    expect(guide.element.firstElementChild.style.left).toBe(
      `${Math.round(lumine.views.getView(editor).getDefaultCharacterWidth() * 80)}px`,
    );
  });
  it("retains immediate refresh and numeric order for another nonempty list", () => {
    lumine.config.set("wrap-guide.columns", [60, 10, 60]);
    expect(guide.getGuidesColumns()).toEqual([10, 60]);
    expect(guide.element.querySelectorAll(".wrap-guide").length).toBe(2);
  });
});
