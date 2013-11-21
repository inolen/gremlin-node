'use strict';

function queryWrapSync(op) {
  return function () {
    var args = Array.prototype.slice.call(arguments);
    this.query[op].apply(this._query, args);
    return this;
  };
}

var QueryWrapper = module.exports = function (gremlin, query) {
  this.gremlin = gremlin;
  this.query = query;
};

QueryWrapper.prototype.has = queryWrapSync('has');
QueryWrapper.prototype.hasNot = queryWrapSync('hasNot');
QueryWrapper.prototype.interval = queryWrapSync('interval');
QueryWrapper.prototype.limit = queryWrapSync('limit');
QueryWrapper.prototype.vertices = queryWrapSync('vertices');
QueryWrapper.prototype.edges = queryWrapSync('edges');
