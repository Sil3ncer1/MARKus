class StateManager {
    constructor(targetElement) {
      this.targetElement = targetElement;
      this.stateHistory = [];
      this.currentStateIndex = -1;
    }
  
    pushState(content) {
      this.stateHistory = this.stateHistory.slice(0, this.currentStateIndex + 1);
      this.stateHistory.push(content);
      this.currentStateIndex = this.stateHistory.length - 1;
    }
  
    undo() {
        if (this.currentStateIndex > 0) {
            this.currentStateIndex--;
            return this.stateHistory[this.currentStateIndex];
        }
        return null;
    }
  
    redo() {
        if (this.currentStateIndex < this.stateHistory.length - 1) {
            this.currentStateIndex++;
            return this.stateHistory[this.currentStateIndex];
        }
        return null;
    }
}

var stateManager = null;

document.addEventListener('DOMContentLoaded', function () {
    const doc = document.getElementById('document-doc');
    stateManager = new StateManager(doc);
});