const helpers = {
  getWrapGuides() {
    const wrapGuides = [];
    for (const editor of lumine.workspace.getTextEditors()) {
      const guide = editor.getElement().querySelector(".wrap-guide");
      if (guide) wrapGuides.push(guide);
    }
    return wrapGuides;
  },

  getLeftPosition(element) {
    return parseInt(element.style.left);
  },
};

module.exports = helpers;
