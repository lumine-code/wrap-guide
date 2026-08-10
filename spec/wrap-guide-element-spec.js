/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const { getLeftPosition, getLeftPositions } = require("./helpers");
const { uniqueAscending } = require("../lib/main");

async function waitForCondition(condition, description) {
  const startTime = performance.now();

  while (true) {
    if (condition()) return;

    if (performance.now() - startTime > 4500) {
      throw new Error(`Timed out waiting for ${description}`);
    }

    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
}

describe("WrapGuideElement", function () {
  let [editor, editorElement, wrapGuide, workspaceElement] = [];

  describe("When always shown", function () {
    beforeEach(async () => {
      lumine.config.set("wrap-guide.showWrapGuide", "always");
      workspaceElement = lumine.views.getView(lumine.workspace);
      workspaceElement.style.height = "200px";
      workspaceElement.style.width = "1500px";

      jasmine.attachToDOM(workspaceElement);

      await lumine.packages.activatePackage("wrap-guide");

      await lumine.packages.activatePackage("language-javascript");

      await lumine.packages.activatePackage("language-coffee-script");

      await lumine.workspace.open("sample.js");

      editor = lumine.workspace.getActiveTextEditor();
      editorElement = editor.getElement();
      wrapGuide = editorElement.querySelector(".wrap-guide-container");
    });

    describe(".activate", function () {
      const getWrapGuides = function () {
        const wrapGuides = [];
        lumine.workspace.getTextEditors().forEach(function (editor) {
          const guides = editor.getElement().querySelectorAll(".wrap-guide");
          if (guides) {
            return wrapGuides.push(guides);
          }
        });
        return wrapGuides;
      };

      it("appends a wrap guide to all existing and new editors", function () {
        expect(lumine.workspace.getTextEditors().length).toBe(1);

        expect(getWrapGuides().length).toBe(1);
        expect(getLeftPosition(getWrapGuides()[0][0])).toBeGreaterThan(0);

        lumine.workspace.getActivePane().splitRight({ copyActiveItem: true });
        expect(lumine.workspace.getTextEditors().length).toBe(2);
        expect(getWrapGuides().length).toBe(2);
        expect(getLeftPosition(getWrapGuides()[0][0])).toBeGreaterThan(0);
        expect(getLeftPosition(getWrapGuides()[1][0])).toBeGreaterThan(0);
      });

      it("positions the guide at the configured column", function () {
        const width = editor.getDefaultCharWidth() * wrapGuide.getDefaultColumn();
        expect(width).toBeGreaterThan(0);
        expect(Math.abs(getLeftPosition(wrapGuide.firstChild) - width)).toBeLessThan(1);
        expect(wrapGuide).toBeVisible();
      });

      it("appends multiple wrap guides to all existing and new editors", async () => {
        const columns = [10, 20, 30];
        lumine.config.set("wrap-guide.columns", columns);

        await editorElement.getComponent().getNextUpdatePromise();

        expect(lumine.workspace.getTextEditors().length).toBe(1);
        expect(getWrapGuides().length).toBe(1);
        const positions = getLeftPositions(getWrapGuides()[0]);
        expect(positions.length).toBe(columns.length);
        expect(positions[0]).toBeGreaterThan(0);
        expect(positions[1]).toBeGreaterThan(positions[0]);
        expect(positions[2]).toBeGreaterThan(positions[1]);

        lumine.workspace.getActivePane().splitRight({ copyActiveItem: true });
        expect(lumine.workspace.getTextEditors().length).toBe(2);
        expect(getWrapGuides().length).toBe(2);
        const pane1_positions = getLeftPositions(getWrapGuides()[0]);
        expect(pane1_positions.length).toBe(columns.length);
        expect(pane1_positions[0]).toBeGreaterThan(0);
        expect(pane1_positions[1]).toBeGreaterThan(pane1_positions[0]);
        expect(pane1_positions[2]).toBeGreaterThan(pane1_positions[1]);
        const pane2_positions = getLeftPositions(getWrapGuides()[1]);
        expect(pane2_positions.length).toBe(pane1_positions.length);
        expect(pane2_positions[0]).toBe(pane1_positions[0]);
        expect(pane2_positions[1]).toBe(pane1_positions[1]);
        expect(pane2_positions[2]).toBe(pane1_positions[2]);
      });

      it("positions multiple guides at the configured columns", async () => {
        // Previously used CoffeeScript below:
        /**
         * columnCount = 5
         * columns = (c * 10 for c in [1..columnCount])
         */
        const columnCount = 5;
        let columns = [];

        for (let i = 0; i < columnCount; i++) {
          columns.push(i * 10);
        }

        lumine.config.set("wrap-guide.columns", columns);
        await editorElement.getComponent().getNextUpdatePromise();

        const positions = getLeftPositions(getWrapGuides()[0]);
        expect(positions.length).toBe(columnCount);
        expect(wrapGuide.children.length).toBe(columnCount);

        for (let i of Array.from(columnCount - 1)) {
          const width = editor.getDefaultCharWidth() * columns[i];
          expect(width).toBeGreaterThan(0);
          expect(Math.abs(getLeftPosition(wrapGuide.children[i]) - width)).toBeLessThan(1);
        }
        expect(wrapGuide).toBeVisible();
      });
    });

    describe("when the font size changes", function () {
      it("updates the wrap guide position", async () => {
        const initial = getLeftPosition(wrapGuide.firstChild);
        expect(initial).toBeGreaterThan(0);
        const fontSize = lumine.config.get("editor.fontSize");
        lumine.config.set("editor.fontSize", fontSize + 10);

        await editorElement.getComponent().getNextUpdatePromise();

        expect(getLeftPosition(wrapGuide.firstChild)).toBeGreaterThan(initial);
        expect(wrapGuide.firstChild).toBeVisible();
      });

      it("updates the wrap guide position for hidden editors when they become visible", async function () {
        const initial = getLeftPosition(wrapGuide.firstChild);
        expect(initial).toBeGreaterThan(0);

        await lumine.workspace.open();

        const fontSize = lumine.config.get("editor.fontSize");
        lumine.config.set("editor.fontSize", fontSize + 10);
        lumine.workspace.getActivePane().activatePreviousItem();

        await waitForCondition(
          () => getLeftPosition(wrapGuide.firstChild) > initial,
          "wrap guide position to update",
        );

        expect(wrapGuide.firstChild).toBeVisible();
      });
    });

    describe("when the column config changes", () =>
      it("updates the wrap guide position", function () {
        const initial = getLeftPosition(wrapGuide.firstChild);
        expect(initial).toBeGreaterThan(0);
        const column = lumine.config.get("language.preferredLineLength");
        lumine.config.set("language.preferredLineLength", column + 10);
        expect(getLeftPosition(wrapGuide.firstChild)).toBeGreaterThan(initial);
        expect(wrapGuide).toBeVisible();
      }));

    describe("when the preferredLineLength changes", () =>
      it("updates the wrap guide positions", async function () {
        const initial = [10, 15, 20, 30];
        lumine.config.set("wrap-guide.columns", initial, {
          scopeSelector: `.${editor.getGrammar().scopeName}`,
        });

        await waitForCondition(() => wrapGuide.children.length === initial.length, "wrap guides");

        lumine.config.set("language.preferredLineLength", 15, {
          scopeSelector: `.${editor.getGrammar().scopeName}`,
        });

        await waitForCondition(() => {
          const columns = lumine.config.get("wrap-guide.columns", {
            scope: editor.getRootScopeDescriptor(),
          });
          return columns != null && columns.length === 2 && columns[0] === 10 && columns[1] === 15;
        }, "wrap guide columns to follow preferredLineLength");
      }));

    describe("when the columns config changes", function () {
      it("updates the wrap guide positions", async () => {
        const initial = getLeftPositions(wrapGuide.children);
        expect(initial.length).toBe(1);
        expect(initial[0]).toBeGreaterThan(0);

        const columns = [10, 20, 30];
        lumine.config.set("wrap-guide.columns", columns);
        await editorElement.getComponent().getNextUpdatePromise();

        const positions = getLeftPositions(wrapGuide.children);
        expect(positions.length).toBe(columns.length);
        expect(positions[0]).toBeGreaterThan(0);
        expect(positions[1]).toBeGreaterThan(positions[0]);
        expect(positions[2]).toBeGreaterThan(positions[1]);
        expect(wrapGuide).toBeVisible();
      });

      it("updates the preferredLineLength", async () => {
        const initial = lumine.config.get("language.preferredLineLength", {
          scope: editor.getRootScopeDescriptor(),
        });
        lumine.config.set("wrap-guide.columns", [initial, initial + 10]);
        await editorElement.getComponent().getNextUpdatePromise();

        const length = lumine.config.get("language.preferredLineLength", {
          scope: editor.getRootScopeDescriptor(),
        });
        expect(length).toBe(initial + 10);
      });

      it("keeps guide positions unique and in ascending order", async () => {
        const initial = getLeftPositions(wrapGuide.children);
        expect(initial.length).toBe(1);
        expect(initial[0]).toBeGreaterThan(0);

        const reverseColumns = [30, 20, 10];
        const columns = [
          reverseColumns[reverseColumns.length - 1],
          ...reverseColumns,
          reverseColumns[0],
        ];
        const uniqueColumns = uniqueAscending(columns);
        expect(uniqueColumns.length).toBe(3);
        expect(uniqueColumns[0]).toBeGreaterThan(0);
        expect(uniqueColumns[1]).toBeGreaterThan(uniqueColumns[0]);
        expect(uniqueColumns[2]).toBeGreaterThan(uniqueColumns[1]);

        lumine.config.set("wrap-guide.columns", columns);
        await editorElement.getComponent().getNextUpdatePromise();

        const positions = getLeftPositions(wrapGuide.children);
        expect(positions.length).toBe(uniqueColumns.length);
        expect(positions[0]).toBeGreaterThan(0);
        expect(positions[1]).toBeGreaterThan(positions[0]);
        expect(positions[2]).toBeGreaterThan(positions[1]);
        expect(wrapGuide).toBeVisible();
      });

      it("leaves alone preferredLineLength if modifyPreferredLineLength is false", async () => {
        const initial = lumine.config.get("language.preferredLineLength", {
          scope: editor.getRootScopeDescriptor(),
        });
        lumine.config.set("wrap-guide.modifyPreferredLineLength", false);

        lumine.config.set("wrap-guide.columns", [initial, initial + 10]);
        await editorElement.getComponent().getNextUpdatePromise();

        const length = lumine.config.get("language.preferredLineLength", {
          scope: editor.getRootScopeDescriptor(),
        });
        expect(length).toBe(initial);
      });
    });

    describe("when the editor's scroll left changes", () =>
      it("updates the wrap guide position to a relative position on screen", async () => {
        editor.setText("a long line which causes the editor to scroll");
        editorElement.style.width = "100px";

        await conditionPromise(() => editorElement.component.getMaxScrollLeft() > 10);

        const initial = getLeftPosition(wrapGuide.firstChild);
        expect(initial).toBeGreaterThan(0);
        editorElement.setScrollLeft(10);
        expect(getLeftPosition(wrapGuide.firstChild)).toBe(initial - 10);
        expect(wrapGuide.firstChild).toBeVisible();
      }));

    describe("when the editor's grammar changes", function () {
      it("updates the wrap guide position", function () {
        lumine.config.set("language.preferredLineLength", 20, { scopeSelector: ".source.js" });
        const initial = getLeftPosition(wrapGuide.firstChild);
        expect(initial).toBeGreaterThan(0);
        expect(wrapGuide).toBeVisible();

        editor.setGrammar(lumine.grammars.grammarForScopeName("text.plain.null-grammar"));
        expect(getLeftPosition(wrapGuide.firstChild)).toBeGreaterThan(initial);
        expect(wrapGuide).toBeVisible();
      });

      it("listens for preferredLineLength updates for the new grammar", function () {
        editor.setGrammar(lumine.grammars.grammarForScopeName("source.coffee"));
        const initial = getLeftPosition(wrapGuide.firstChild);
        lumine.config.set("language.preferredLineLength", 20, { scopeSelector: ".source.coffee" });
        expect(getLeftPosition(wrapGuide.firstChild)).toBeLessThan(initial);
      });

      it("listens for wrap-guide.enabled updates for the new grammar", function () {
        editor.setGrammar(lumine.grammars.grammarForScopeName("source.coffee"));
        expect(wrapGuide).toBeVisible();
        lumine.config.set("wrap-guide.enabled", false, { scopeSelector: ".source.coffee" });
        expect(wrapGuide).not.toBeVisible();
      });
    });

    describe("scoped config", function () {
      it("::getDefaultColumn returns the scope-specific column value", function () {
        lumine.config.set("language.preferredLineLength", 132, { scopeSelector: ".source.js" });

        expect(wrapGuide.getDefaultColumn()).toBe(132);
      });

      it("updates the guide when the scope-specific column changes", function () {
        const initial = getLeftPosition(wrapGuide.firstChild);
        const column = lumine.config.get("language.preferredLineLength", {
          scope: editor.getRootScopeDescriptor(),
        });
        lumine.config.set("language.preferredLineLength", column + 10, { scope: ".source.js" });
        expect(getLeftPosition(wrapGuide.firstChild)).toBeGreaterThan(initial);
      });

      it("updates the guide when wrap-guide.enabled is set to false", function () {
        expect(wrapGuide).toBeVisible();

        lumine.config.set("wrap-guide.enabled", false, { scopeSelector: ".source.js" });

        expect(wrapGuide).not.toBeVisible();
      });
    });
  });

  describe("When only shown if wrapping at preferred line length", () => {
    beforeEach(async () => {
      lumine.config.set("wrap-guide.showWrapGuide", "atPreferredLineLength");

      await lumine.packages.activatePackage("wrap-guide");

      await lumine.packages.activatePackage("language-javascript");

      await lumine.packages.activatePackage("language-coffee-script");

      await lumine.workspace.open("sample.txt");
      await lumine.workspace.open("sample.js");
    });

    describe("while the wrapping at preferred line length is active", () => {
      beforeEach(async () => {
        lumine.config.set("language.softWrap", true);
        lumine.config.set("language.softWrapAtPreferredLineLength", true);
        workspaceElement = lumine.views.getView(lumine.workspace);
        workspaceElement.style.height = "200px";
        workspaceElement.style.width = "1500px";

        jasmine.attachToDOM(workspaceElement);

        editor = lumine.workspace.getActiveTextEditor();
        editorElement = editor.getElement();
        wrapGuide = editorElement.querySelector(".wrap-guide-container");
      });

      it("should generate wrap-guides as usual until either wrappings are deactivated", () => {
        expect(lumine.workspace.getTextEditors().length).toBe(2);
        function getWrapGuides() {
          const wrapGuides = [];
          lumine.workspace.getTextEditors().forEach((editor) => {
            const guides = editor.getElement().querySelectorAll(".wrap-guide");
            if (guides && guides.length > 0) {
              return wrapGuides.push(guides);
            }
          });
          return wrapGuides;
        }
        const scopeDescriptor = editor.getRootScopeDescriptor();

        expect([
          lumine.config.get("language.softWrap"),
          lumine.config.get("language.softWrapAtPreferredLineLength"),
        ]).toEqual([true, true]);
        expect(getWrapGuides().length).toBe(2);

        lumine.config.set("language.softWrap", false, {
          scopeSelector: `.${editor.getGrammar().scopeName}`,
        });

        expect([
          lumine.config.get("language.softWrap"),
          lumine.config.get("language.softWrap", { scope: scopeDescriptor }),
        ]).toEqual([true, false]);

        expect(getWrapGuides().length).toBe(1);

        lumine.config.set("language.softWrap", true, {
          scopeSelector: `.${editor.getGrammar().scopeName}`,
        });

        expect(lumine.config.get("language.softWrap", { scope: scopeDescriptor })).toBe(true);
        expect(getWrapGuides().length).toBe(2);

        lumine.config.set("language.softWrapAtPreferredLineLength", false, {
          scopeSelector: `.${editor.getGrammar().scopeName}`,
        });

        expect([
          lumine.config.get("language.softWrapAtPreferredLineLength"),
          lumine.config.get("language.softWrapAtPreferredLineLength", { scope: scopeDescriptor }),
        ]).toEqual([true, false]);

        expect(getWrapGuides().length).toBe(1);

        lumine.config.unset("language.softWrapAtPreferredLineLength", {
          scopeSelector: `.${editor.getGrammar().scopeName}`,
        });

        expect(
          lumine.config.get("language.softWrapAtPreferredLineLength", { scope: scopeDescriptor }),
        ).toBe(true);

        expect(getWrapGuides().length).toBe(2);

        lumine.config.set("language.softWrapAtPreferredLineLength", false);

        expect([
          lumine.config.get("language.softWrapAtPreferredLineLength"),
          lumine.config.get("language.softWrapAtPreferredLineLength", { scope: scopeDescriptor }),
        ]).toEqual([false, false]);

        expect(getWrapGuides().length).toBe(0);
      });

      it("should adapt when changing the grammar", () => {
        expect(lumine.workspace.getTextEditors().length).toBe(2);
        function getWrapGuides() {
          const wrapGuides = [];
          lumine.workspace.getTextEditors().forEach((editor) => {
            const guides = editor.getElement().querySelectorAll(".wrap-guide");
            if (guides && guides.length > 0) {
              return wrapGuides.push(guides);
            }
          });
          return wrapGuides;
        }
        const scopeDescriptor = editor.getRootScopeDescriptor();

        expect([
          lumine.config.get("language.softWrap"),
          lumine.config.get("language.softWrapAtPreferredLineLength"),
        ]).toEqual([true, true]);
        expect(getWrapGuides().length).toBe(2);

        lumine.config.set("language.softWrapAtPreferredLineLength", false, {
          scopeSelector: `.${editor.getGrammar().scopeName}`,
        });

        expect([
          lumine.config.get("language.softWrapAtPreferredLineLength"),
          lumine.config.get("language.softWrapAtPreferredLineLength", { scope: scopeDescriptor }),
        ]).toEqual([true, false]);

        expect(getWrapGuides().length).toBe(1);

        editor.setGrammar(lumine.grammars.grammarForScopeName("source.coffee"));
        const new_scopeDescriptor = editor.getRootScopeDescriptor();

        expect([
          scopeDescriptor != new_scopeDescriptor,
          lumine.config.get("language.softWrapAtPreferredLineLength", {
            scope: new_scopeDescriptor,
          }),
        ]).toEqual([true, true]);

        expect(getWrapGuides().length).toBe(2);

        lumine.config.set("language.softWrapAtPreferredLineLength", false, {
          scopeSelector: `.${editor.getGrammar().scopeName}`,
        });

        expect(getWrapGuides().length).toBe(1);
      });
    });

    describe("while the wrapping is inactive", () => {
      beforeEach(async () => {
        lumine.config.set("language.softWrap", false);
        lumine.config.set("language.softWrapAtPreferredLineLength", false);
        workspaceElement = lumine.views.getView(lumine.workspace);
        workspaceElement.style.height = "200px";
        workspaceElement.style.width = "1500px";

        jasmine.attachToDOM(workspaceElement);

        editor = lumine.workspace.getActiveTextEditor();
        editorElement = editor.getElement();
        wrapGuide = editorElement.querySelector(".wrap-guide-container");
      });

      it("should not generate wrap-guides until wrapping at preferred line length is reactivated", () => {
        expect(lumine.workspace.getTextEditors().length).toBe(2);
        function getWrapGuides() {
          const wrapGuides = [];
          lumine.workspace.getTextEditors().forEach((editor) => {
            const guides = editor.getElement().querySelectorAll(".wrap-guide");
            if (guides && guides.length > 0) {
              return wrapGuides.push(guides);
            }
          });
          return wrapGuides;
        }
        const scopeDescriptor = editor.getRootScopeDescriptor();

        expect([
          lumine.config.get("language.softWrap"),
          lumine.config.get("language.softWrapAtPreferredLineLength"),
        ]).toEqual([false, false]);
        expect(getWrapGuides().length).toBe(0);

        lumine.config.set("language.softWrap", true, {
          scopeSelector: `.${editor.getGrammar().scopeName}`,
        });

        expect([
          lumine.config.get("language.softWrap"),
          lumine.config.get("language.softWrap", { scope: scopeDescriptor }),
        ]).toEqual([false, true]);

        expect(getWrapGuides().length).toBe(0);

        lumine.config.set("language.softWrapAtPreferredLineLength", true, {
          scopeSelector: `.${editor.getGrammar().scopeName}`,
        });

        expect([
          lumine.config.get("language.softWrapAtPreferredLineLength"),
          lumine.config.get("language.softWrapAtPreferredLineLength", { scope: scopeDescriptor }),
        ]).toEqual([false, true]);

        expect(getWrapGuides().length).toBe(1);
      });

      it("should adapt when changing to another mod", () => {
        expect(lumine.workspace.getTextEditors().length).toBe(2);
        function getWrapGuides() {
          const wrapGuides = [];
          lumine.workspace.getTextEditors().forEach((editor) => {
            const guides = editor.getElement().querySelectorAll(".wrap-guide");
            if (guides && guides.length > 0) {
              return wrapGuides.push(guides);
            }
          });
          return wrapGuides;
        }

        expect([
          lumine.config.get("language.softWrap"),
          lumine.config.get("language.softWrapAtPreferredLineLength"),
        ]).toEqual([false, false]);
        expect(getWrapGuides().length).toBe(0);

        lumine.config.set("language.softWrap", true, {
          scopeSelector: `.${editor.getGrammar().scopeName}`,
        });

        expect(getWrapGuides().length).toBe(0);

        lumine.config.set("wrap-guide.showWrapGuide", "wrapping");

        expect(getWrapGuides().length).toBe(1);
      });
    });
  });

  describe("When only shown if wrapping", () => {
    beforeEach(async () => {
      lumine.config.set("wrap-guide.showWrapGuide", "wrapping");

      await lumine.packages.activatePackage("wrap-guide");

      await lumine.packages.activatePackage("language-javascript");

      await lumine.packages.activatePackage("language-coffee-script");

      await lumine.workspace.open("sample.txt");
      await lumine.workspace.open("sample.js");
    });

    describe("while the wrapping is active", () => {
      beforeEach(async () => {
        lumine.config.set("language.softWrap", true);
        workspaceElement = lumine.views.getView(lumine.workspace);
        workspaceElement.style.height = "200px";
        workspaceElement.style.width = "1500px";

        jasmine.attachToDOM(workspaceElement);

        editor = lumine.workspace.getActiveTextEditor();
        editorElement = editor.getElement();
        wrapGuide = editorElement.querySelector(".wrap-guide-container");
      });

      it("should generate wrap-guides as usual until wrapping is deactivated", () => {
        expect(lumine.workspace.getTextEditors().length).toBe(2);
        function getWrapGuides() {
          const wrapGuides = [];
          lumine.workspace.getTextEditors().forEach((editor) => {
            const guides = editor.getElement().querySelectorAll(".wrap-guide");
            if (guides && guides.length > 0) {
              return wrapGuides.push(guides);
            }
          });
          return wrapGuides;
        }

        expect(lumine.config.get("language.softWrap")).toBe(true);
        expect(getWrapGuides().length).toBe(2);

        lumine.config.set("language.softWrap", false, {
          scopeSelector: `.${editor.getGrammar().scopeName}`,
        });

        expect([
          lumine.config.get("language.softWrap"),
          lumine.config.get("language.softWrap", { scope: editor.getRootScopeDescriptor() }),
        ]).toEqual([true, false]);

        expect(getWrapGuides().length).toBe(1);
      });
    });

    describe("while the wrapping is inactive", () => {
      beforeEach(async () => {
        lumine.config.set("language.softWrap", false);
        workspaceElement = lumine.views.getView(lumine.workspace);
        workspaceElement.style.height = "200px";
        workspaceElement.style.width = "1500px";

        jasmine.attachToDOM(workspaceElement);

        editor = lumine.workspace.getActiveTextEditor();
        editorElement = editor.getElement();
        wrapGuide = editorElement.querySelector(".wrap-guide-container");
      });

      it("should not generate wrap-guides until wrapping is reactivated", () => {
        expect(lumine.workspace.getTextEditors().length).toBe(2);
        function getWrapGuides() {
          const wrapGuides = [];
          lumine.workspace.getTextEditors().forEach((editor) => {
            const guides = editor.getElement().querySelectorAll(".wrap-guide");
            if (guides && guides.length > 0) {
              return wrapGuides.push(guides);
            }
          });
          return wrapGuides;
        }

        expect(lumine.config.get("language.softWrap")).toBe(false);
        expect(getWrapGuides().length).toBe(0);

        lumine.config.set("language.softWrap", true, {
          scopeSelector: `.${editor.getGrammar().scopeName}`,
        });

        expect([
          lumine.config.get("language.softWrap"),
          lumine.config.get("language.softWrap", { scope: editor.getRootScopeDescriptor() }),
        ]).toEqual([false, true]);

        expect(getWrapGuides().length).toBe(1);
      });
    });
  });
});

function __range__(left, right, inclusive) {
  let range = [];
  let ascending = left < right;
  let end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}
