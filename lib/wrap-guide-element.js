const { CompositeDisposable } = require("lumine");

module.exports = class WrapGuideElement {
  #_when = null;
  #_shouldShow = null;
  constructor(editor, editorElement, when) {
    this.editor = editor;
    this.editorElement = editorElement;
    this.subscriptions = new CompositeDisposable();
    this.configSubscriptions = new CompositeDisposable();
    this.element = document.createElement("div");
    this.element.setAttribute("is", "wrap-guide");
    this.element.classList.add("wrap-guide-container");
    this.attachToLines();
    this.handleEvents();
    this.setWhen(when);

    this.element.updateGuide = (async () => await this.updateGuide()).bind(this);
    this.element.getDefaultColumn = this.getDefaultColumn.bind(this);
  }

  get shouldShow() {
    return this.#_shouldShow;
  }
  get when() {
    return this.#_when;
  }

  setWhen(when) {
    if (when == this.when) return;
    this.#_when = when;
    this.updateWhen();
  }

  async updateWhen() {
    switch (this.when) {
      case "atSoftWrapColumn":
        this.#_shouldShow =
          this.editor.isSoftWrapped() && Number.isFinite(this.editor.getSoftWrapColumn());
        break;
      case "wrapping":
        this.#_shouldShow = this.editor.isSoftWrapped();
        break;
      default: // "always"
        this.#_shouldShow = true;
        break;
    }
    await this.updateGuide();
  }

  attachToLines() {
    const scrollView = this.editorElement.querySelector(".scroll-view");
    return scrollView != null ? scrollView.appendChild(this.element) : undefined;
  }

  handleEvents() {
    const updateGuideCallback = async () => await this.updateGuide();

    this.handleConfigEvents();

    this.subscriptions.add(
      this.editor.onDidChangePreferredLineLength(updateGuideCallback),
      this.editor.onDidChangeSoftWrapped(async (_wrapped) => {
        if (this.when === null) return;
        await this.updateWhen();
      }),
      this.editor.onDidChangeSoftWrapColumn(async () => {
        if (this.when === "atSoftWrapColumn") await this.updateWhen();
      }),
    );

    this.subscriptions.add(
      lumine.config.onDidChange("editor.fontSize", async () => {
        // Wait for editor to finish updating before updating wrap guide
        await this.editorElement.getComponent().getNextUpdatePromise();
        updateGuideCallback();
      }),
    );

    this.subscriptions.add(this.editorElement.onDidChangeScrollLeft(updateGuideCallback));
    this.subscriptions.add(
      lumine.workspace.onDidChangeActiveTextEditor((activeEditor) => {
        if (activeEditor === this.editor) {
          this.scheduleGuideUpdate();
        }
      }),
    );
    this.subscriptions.add(
      this.editor.onDidChangeGrammar(async () => {
        this.configSubscriptions.dispose();
        this.configSubscriptions = new CompositeDisposable();
        this.handleConfigEvents();
        await this.updateWhen();
      }),
    );

    this.subscriptions.add(
      this.editor.onDidDestroy(() => {
        this.cancelGuideUpdate();
        this.subscriptions.dispose();
        this.configSubscriptions.dispose();
      }),
    );

    this.subscriptions.add(
      this.editorElement.onDidDetach(() => this.cancelGuideUpdate()),
      this.editorElement.onDidAttach(async () => {
        this.attachToLines();
        await updateGuideCallback();
      }),
    );
  }

  scheduleGuideUpdate() {
    this.cancelGuideUpdate();
    this.guideFrameWindow = this.editorElement.ownerDocument.defaultView;
    this.guideFrame = this.guideFrameWindow.requestAnimationFrame(() => {
      this.guideFrame = null;
      this.guideFrameWindow = null;
      if (!this.editor.isDestroyed()) void this.updateGuide();
    });
  }

  cancelGuideUpdate() {
    if (this.guideFrame != null) this.guideFrameWindow.cancelAnimationFrame(this.guideFrame);
    this.guideFrame = this.guideFrameWindow = null;
  }

  handleConfigEvents() {
    const updateGuideCallback = async () => await this.updateGuide();
    return this.configSubscriptions.add(
      lumine.config.onDidChange(
        "wrap-guide.enabled",
        { scope: this.editor.getRootScopeDescriptor() },
        updateGuideCallback,
      ),
    );
  }

  getDefaultColumn() {
    return this.editor.getPreferredLineLength();
  }

  isEnabled() {
    let left;
    return (left = lumine.config.get("wrap-guide.enabled", {
      scope: this.editor.getRootScopeDescriptor(),
    })) != null
      ? left
      : true;
  }

  hide() {
    return (this.element.style.display = "none");
  }

  show() {
    return (this.element.style.display = "block");
  }

  updateGuide() {
    if (this.isEnabled()) return this.updateGuides();
    else return this.hide();
  }

  updateGuides() {
    this.removeGuides();
    if (!this.shouldShow) return this.hide();
    const column =
      this.when === "atSoftWrapColumn" ? this.editor.getSoftWrapColumn() : this.getDefaultColumn();
    if (column < 0) return this.hide();
    this.appendGuide(column);
    return this.show();
  }

  destroy() {
    this.cancelGuideUpdate();
    this.element.remove();
    this.subscriptions.dispose();
    return this.configSubscriptions.dispose();
  }

  removeGuides() {
    this.element.replaceChildren();
  }

  appendGuide(column) {
    let columnWidth = this.editorElement.getDefaultCharacterWidth() * column;
    columnWidth -= this.editorElement.getScrollLeft();
    const guide = document.createElement("div");
    guide.classList.add("wrap-guide");
    guide.style.left = `${Math.round(columnWidth)}px`;
    return this.element.appendChild(guide);
  }
};
