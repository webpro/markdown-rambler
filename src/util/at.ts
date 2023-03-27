if (!('at' in Array.prototype)) {
  // @ts-expect-error Array.prototype.at from Node.js v16.6.0
  Array.prototype.at = function (index) {
    if (index >= 0) return this[index];
    return this[this.length + index];
  };
}
