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

  suiteSetup(function () {
    gremlin = new Gremlin();
  });

  setup(function () {
    var TinkerGraphFactory = gremlin.java.import('com.tinkerpop.blueprints.impls.tg.TinkerGraphFactory');
    graph = TinkerGraphFactory.createTinkerGraphSync();
    g = new GraphWrapper(gremlin, graph);
  });

  test('Wrapped objects can be converted to JS objects using gremlin.toJSON', function (done) {
    g.v('2', function (err, res) {
      gremlin.toJSON(res, function (err, json) {
        assert.ifError(err);
        assert.strictEqual(json[0]._id, '2');
        done();
      });
    });
  });

  test('Unwrapped objects can be converted to JS objects using gremlin.toJSON', function (done) {
    g.getVertex('2', function (err, res) {
      gremlin.toJSON(res.el, function (err, json) {
        assert.ifError(err);
        assert.strictEqual(json[0]._id, '2');
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

  test('gremlin.toList(jsarray) using callback API', function (done) {
    gremlin.toList(['a', 'b', 'c'], function (err, list) {
      assert.ifError(err);
      assert(gremlin.isType(list, 'java.util.Collection'));
      done();
    });
  });

  test('gremlin.toList(jsarray) using promise API', function (done) {
    gremlin.toList(['a', 'b', 'c'])
      .then(function (list) { assert(gremlin.isType(list, 'java.util.Collection')); }, assert.ifError)
      .done(done);
  });

});
