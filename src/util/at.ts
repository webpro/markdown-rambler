if (!('at' in Array.prototype)) {
  Array.prototype.at = function (index) {
    if (index >= 0) return this[index];
    return this[this.length + index];
  };
}
