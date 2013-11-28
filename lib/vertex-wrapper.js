'use strict';

var util = require('util');
var ElementWrapper = require('./element-wrapper');

var VertexWrapper = module.exports = function (gremlin, el) {
  ElementWrapper.call(this, gremlin, el);
};

util.inherits(VertexWrapper, ElementWrapper);

// public Iterable<Edge> getEdges(Direction direction, String... labels);
// public Iterable<Vertex> getVertices(Direction direction, String... labels);
// public VertexQuery query();
// public Edge addEdge(String label, Vertex inVertex);
