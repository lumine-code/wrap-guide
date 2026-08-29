const { TextEditor } = require("lumine");
const WrapGuideElement = require("../lib/wrap-guide-element");

describe("WrapGuideElement window surfaces", () => {
  let editor, editorElement, guide, frame;

  beforeEach(async () => {
    editor = new TextEditor();
    editorElement = editor.getElement();
    document.body.appendChild(editorElement);
    editorElement.getComponent().updateSync();
    guide = new WrapGuideElement(editor, editorElement, "always");
    await guide.updateGuide();
  });

  afterEach(() => {
    guide?.destroy();
    editor?.destroy();
    frame?.remove();
  });

  it("recreates guide nodes in the adopted editor document", async () => {
    const context = Object.freeze({
      id: "wrap-guide-detach",
      reason: "detach",
      item: editor,
      from: null,
      to: null,
      signal: new AbortController().signal,
    });
    const participant = guide.beginWindowSurfaceTransition(context);
    frame = document.createElement("iframe");
    document.body.appendChild(frame);
    frame.contentDocument.body.appendChild(editorElement);
    await participant.commit(context);

    expect(guide.element.ownerDocument).toBe(frame.contentDocument);
    expect(
      Array.from(guide.element.children).every(
        (node) => node.ownerDocument === frame.contentDocument,
      ),
    ).toBe(true);
  });
});
