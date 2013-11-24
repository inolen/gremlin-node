'use strict';

var _ = require('underscore');
var assert = require('assert');
var path = require('path');
var Gremlin = require('../lib/gremlin');
var GraphWrapper = require('../lib/graph-wrapper');

suite('pipeline-wrapper', function() {
  var gremlin;
  var java;
  var graph;
  var g;

  suiteSetup(function() {
    gremlin = new Gremlin();
    java = gremlin.java;
  });

  setup(function() {
    var TinkerGraphFactory = java.import('com.tinkerpop.blueprints.impls.tg.TinkerGraphFactory');
    graph = TinkerGraphFactory.createTinkerGraphSync();
    g = new GraphWrapper(gremlin, graph);
  });

  test('V(string key, object value)', function (done) {
    g.V('name', 'marko').next(function (err, v) {
      assert(!err && v.getPropertySync('name') === 'marko');
      done();
    });
  });

  test('E(string key, object value)', function (done) {
    g.E('weight', java.newFloat(0.5)).next(function (err, e) {
      assert(!err && e.getPropertySync('weight') === 0.5);
      done();
    });
  });

  test('has(string key, object value)', function (done) {
    g.V().has('name', 'marko').next(function (err, v) {
      assert(!err && v.getPropertySync('name') === 'marko');
      done();
    });
  });

  test('has(string key, token, object value)', function (done) {
    g.V().has('name', gremlin.Tokens.eq, 'marko').next(function (err, v) {
      assert(!err && v.getPropertySync('name') === 'marko');
      done();
    });
  });

  test('has(string key, predicate, object value)', function (done) {
    g.V().has('name', gremlin.Compare.EQUAL, 'marko').next(function (err, v) {
      assert(!err && v.getPropertySync('name') === 'marko');
      done();
    });
  });

  test('hasNot(string key, object value)', function (done) {
    g.V().hasNot('age').count(function (err, count) {
      assert(!err && count.longValue === '2');
      done();
    });
  });

  test('hasNot(string key, object value)', function (done) {
    g.V().hasNot('age', 27).count(function (err, count) {
      assert(!err && count.longValue === '5');
      done();
    });
  });

  test('interval(string key, object start, object end)', function (done) {
    var lower = 0.3;
    var upper = 0.9;
    
    g.E()
      .interval('weight', java.newFloat(lower), java.newFloat(upper))
      .toJSON(function (err, edges) {
        assert(!err && edges.length === 3);
        edges.forEach(function (e) {
          assert(e.weight >= lower && e.weight <= upper);
        });
        done();
      });
  });

  test('bothE(string... labels)', function (done) {
    g.V().bothE('knows', 'created').toJSON(function (err, edges) {
      assert(!err && edges.length === 12);
      var counts = _.countBy(edges, function (e) { return e._label; });
      assert(counts.knows === 4);
      assert(counts.created === 8);
      done();
    });
  });

  test('bothE(int branchFactor, string... labels)', function (done) {
    g.V().bothE(1, 'knows', 'created').toJSON(function (err, edges) {
      assert(!err && edges.length === 6);
      var counts = _.countBy(edges, function (e) { return e._label; });
      assert(counts.knows === 3);
      assert(counts.created === 3);
      done();
    });
  });

  test('both(string... labels)', function (done) {
    g.V().both('knows').dedup().toJSON(function (err, verts) {
      assert(!err && verts.length === 3);
      done();
    });
  });

  test('both(int branchFactor, string... labels)', function (done) {
    g.V().both(1, 'knows').dedup().toJSON(function (err, verts) {
      assert(!err && verts.length === 2);
      done();
    });
  });

  test('bothV()', function (done) {
    g.E('id', '7').bothV().toJSON(function (err, verts) {
      assert(!err && verts.length === 2);
      done();
    });
  });

  // TODO
  // PipelineWrapper.prototype.idEdge = function() {
  // PipelineWrapper.prototype.id = function() {
  // PipelineWrapper.prototype.idVertex = function() {
  // PipelineWrapper.prototype.inE = function() {
  // PipelineWrapper.prototype.in = function() {
  // PipelineWrapper.prototype.inV = function() {
  // PipelineWrapper.prototype.label = function() {
  // PipelineWrapper.prototype.outE = function() {
  // PipelineWrapper.prototype.out = function(){
  // PipelineWrapper.prototype.outV = function(){
  // PipelineWrapper.prototype.map = function() {
  // PipelineWrapper.prototype.property = function() {
  // PipelineWrapper.prototype.step = function() {
  test('copySplit(), _(), and fairMerge()', function (done) {
    g.V().both().toJSON(function (err, bothed) {
      g.V().copySplit(g._().in(), g._().out()).fairMerge().toJSON(function (err, copied) {
        assert(bothed.length === copied.length);
        done();
      });
    });
  });
  // PipelineWrapper.prototype.exhaustMerge = function() {
  // PipelineWrapper.prototype.fairMerge = function() {
  // PipelineWrapper.prototype.ifThenElse = function() {
  // PipelineWrapper.prototype.loop = function() {
  // PipelineWrapper.prototype.and = function(/*final Pipe<E, ?>... pipes*/) {
  // PipelineWrapper.prototype.back = function(step) {
  test('dedup()', function (done) {
    g.v(3, 3, function (err, verts) {
      verts.dedup().toJSON(function (err, res) {
        assert(!err && res.length === 1);
        done();
      });
    });
  });
  // PipelineWrapper.prototype.except = function() {
  test('filter()', function (done) {
    g.V().filter("{it->it.name == 'lop'}").toJSON(function (err, recs) {
      assert(!err && recs.length === 1);
      done();
    });
  });
  // PipelineWrapper.prototype.or = function(/*final Pipe<E, ?>... pipes*/) {
  // PipelineWrapper.prototype.random = function() {
  // PipelineWrapper.prototype.index = function(idx) {
  // PipelineWrapper.prototype.range = function() {
  // PipelineWrapper.prototype.retain = function(/*final Collection<E> collection*/) {
  // PipelineWrapper.prototype.simplePath = function() {
  // PipelineWrapper.prototype.aggregate = function() {
  // PipelineWrapper.prototype.optional = function() {
  // PipelineWrapper.prototype.groupBy = function(map, closure) {
  test('groupCount(map, closure)', function (done) {
    var m = new gremlin.HashMap();
    g.V().out().groupCount(m, '{it->it.id}').iterate(function (err, iterated) {
        assert(!err && iterated === null);
        gremlin.toJSON(m, function (err, res) {
          res = res[0]; // Rexster encloses all objects in arrays. Go figure.
          assert(!err);
          assert(res['3'] === 3 && res['2'] === 1 && typeof res['6'] === 'undefined');
          done();
        });
    });
  });
  // PipelineWrapper.prototype.linkOut = function() {
  // PipelineWrapper.prototype.linkIn = function() {
  // PipelineWrapper.prototype.linkBoth = function() {
  // PipelineWrapper.prototype.sideEffect = function() {
  // PipelineWrapper.prototype.store = function() {
  // PipelineWrapper.prototype.table = function() {
  // PipelineWrapper.prototype.tree = function() {
  // PipelineWrapper.prototype.gather = function() {
  // PipelineWrapper.prototype._ = function() {
  // PipelineWrapper.prototype.memoize = function() {
  // PipelineWrapper.prototype.order = function() {
  // PipelineWrapper.prototype.path = function() {
  // PipelineWrapper.prototype.scatter = function() {
  // PipelineWrapper.prototype.select = function() {
  // PipelineWrapper.prototype.shuffle = function() {
  // PipelineWrapper.prototype.cap = function() {
  // PipelineWrapper.prototype.orderMap = function() {
  // PipelineWrapper.prototype.transform = function() {
});
