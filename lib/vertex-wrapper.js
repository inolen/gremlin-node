'use strict';

var async = require('async');

var VertexWrapper = module.exports = function (gremlin, v) {
  this.gremlin = gremlin;
  this.v = v;
};

VertexWrapper.prototype.unwrap = function () {
  return this.v;
};

VertexWrapper.prototype.getId = function () {
  return this.v.getIdSync();
};

VertexWrapper.prototype.getProperty = function (key, callback) {
  this.v.getProperty(key, callback);
};

VertexWrapper.prototype.getProperties = function (props, callback) {
  var v = this.v;

  async.each(props, function (key, cb) {
    v.getProperty(key, cb);
  }, callback);
};

VertexWrapper.prototype.setProperty = function (key, value, callback) {
  this.v.setProperty(key, callback);
};

VertexWrapper.prototype.setProperties = function (props, callback) {
  var v = this.v;

  async.each(Object.keys(props), function (key, cb) {
    v.setProperty(key, props[key], cb);
  }, callback);
};

VertexWrapper.prototype.removeProperty = function (key, callback) {
  this.v.removeProperty(key, callback);
};

VertexWrapper.prototype.remove = function (callback) {
  this.v.remove(callback);
};

VertexWrapper.prototype.toJSON = function () {
  return {
    id: this.getId()
  };
};

// public Iterable<Edge> getEdges(Direction direction, String... labels);
// public Iterable<Vertex> getVertices(Direction direction, String... labels);
// public VertexQuery query();
// public Edge addEdge(String label, Vertex inVertex);
