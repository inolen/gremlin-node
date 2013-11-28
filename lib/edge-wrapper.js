'use strict';

var util = require('util');
var ElementWrapper = require('./element-wrapper');

var EdgeWrapper = module.exports = function (gremlin, el) {
  ElementWrapper.call(this, gremlin, el);
};

util.inherits(EdgeWrapper, ElementWrapper);

// public Vertex getVertex(Direction direction) throws IllegalArgumentException;

EdgeWrapper.prototype.getLabel = function () {
  return this.el.getLabelSync();
};
