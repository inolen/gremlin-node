'use strict';

var _ = require('underscore');
var assert = require('assert');
var sinon = require('sinon');
var Gremlin = require('../lib/gremlin');
var GraphWrapper = require('../lib/graph-wrapper');

suite('gremlin', function () {
  var gremlin;
  var graph;
  var g;
  var sandbox;

  suiteSetup(function () {
    gremlin = new Gremlin();
  });

  setup(function () {
    var TinkerGraphFactory = gremlin.java.import('com.tinkerpop.blueprints.impls.tg.TinkerGraphFactory');
    graph = TinkerGraphFactory.createTinkerGraphSync();
    g = new GraphWrapper(gremlin, graph);
    sandbox = sinon.sandbox.create();
  });

  teardown(function () {
    sandbox.restore();
  });

  test('Wrapped objects can be converted to JS objects using gremlin.toJSON', function (done) {
    g.v('2', function (err, res) {
      gremlin.toJSON(res, function (err, json) {
        assert(!err && json[0]._id === '2');
        done();
      });
    });
  });

  test('Unwrapped objects can be converted to JS objects using gremlin.toJSON', function (done) {
    g.v('2', function (err, res) {
      gremlin.toJSON(res.el, function (err, json) {
        assert(!err && json[0]._id === '2');
        done();
      });
    });
  });

  test('gremlin.toJSON throws error but does not crash when passed null', function (done) {
    gremlin.toJSON(null, function (err, json) {
      assert(err);
      done();
    });
  });

  test('gremlin.toJSON throws error but does not crash when passed undefined', function (done) {
    gremlin.toJSON(undefined, function (err, json) {
      assert(err);
      done();
    });
  });
});
