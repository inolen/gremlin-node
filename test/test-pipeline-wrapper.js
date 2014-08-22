'use strict';

var _ = require('underscore');
var assert = require('assert');
var async = require('async');
var path = require('path');
var Gremlin = require('../lib/gremlin');
var GraphWrapper = require('../lib/graph-wrapper');

// For reference, see the java interface:
// https://github.com/tinkerpop/gremlin/blob/master/gremlin-java/src/main/java/com/tinkerpop/gremlin/java/GremlinFluentPipeline.java

suite('pipeline-wrapper', function () {
  var gremlin;
  var java;
  var graph;
  var g;

  suiteSetup(function () {
    gremlin = new Gremlin();
    java = gremlin.java;
  });

  setup(function () {
    var TinkerGraphFactory = java.import('com.tinkerpop.blueprints.impls.tg.TinkerGraphFactory');
    graph = TinkerGraphFactory.createTinkerGraphSync();
    g = new GraphWrapper(gremlin, graph);
  });

  test('V(string key, object value)', function (done) {
    g.V('name', 'marko').next(function (err, v) {
      assert(!err);
      v.getProperty('name', function (err, name) {
        assert(!err && name === 'marko');
        done();
      });
    });
  });

  // We test map() here early and then use it in multiple tests below to construct expected values.
  // This makes the tests somewhat more complex, but serves the useful purpose of making the functions
  // more understandable to programmers learning gremlin.
  test('map()', function (done) {
    g.V().map().toArray(function (err, verts) {
      assert(!err);
      var expected = [
        { name: 'lop', lang: 'java' },
        { age: 27, name: 'vadas' },
        { age: 29, name: 'marko' },
        { age: 35, name: 'peter' },
        { name: 'ripple', lang: 'java' },
        { age: 32, name: 'josh' }
      ];
      assert.deepEqual(verts, expected);
      done();
    });
  });

  test('E(string key, object value)', function (done) {
    g.E('weight', java.newFloat(0.5)).next(function (err, e) {
      assert(!err);
      e.getProperty('weight', function (err, weight) {
        assert(!err && weight === 0.5);
        done();
      });
    });
  });

  test('has(string key, object value)', function (done) {
    g.V().has('name', 'marko').next(function (err, v) {
      assert(!err);
      v.getProperty('name', function (err, name) {
        assert(!err && name === 'marko');
        done();
      });
    });
  });

  test('has(string key, token, object value)', function (done) {
    g.V().has('name', gremlin.Tokens.eq, 'marko').next(function (err, v) {
      assert(!err);
      v.getProperty('name', function (err, name) {
        assert(!err && name === 'marko');
        done();
      });
    });
  });

  test('has(string key, predicate, object value)', function (done) {
    g.V().has('name', gremlin.Compare.EQUAL, 'marko').next(function (err, v) {
      assert(!err);
      v.getProperty('name', function (err, name) {
        assert(!err && name === 'marko');
        done();
      });
    });
  });

  test('hasNot(string key, object value)', function (done) {
    g.V().hasNot('age').count(function (err, count) {
      assert(!err && count === 2);
      done();
    });
  });

  test('hasNot(string key, object value)', function (done) {
    g.V().hasNot('age', 27).count(function (err, count) {
      assert(!err && count === 5);
      done();
    });
  });

  test('interval(string key, object start, object end)', function (done) {
    var lower = 0.3;
    var upper = 0.9;

    g.E()
      .interval('weight', java.newFloat(lower), java.newFloat(upper))
      .toArray(function (err, edges) {
        assert(!err && edges.length === 3);
        async.each(edges, function (e, cb) {
          e.getProperty('weight', function (err, weight) {
            assert(!err && weight >= lower && weight <= upper);
            cb();
          });
        }, done);
      });
  });

  test('bothE(string... labels)', function (done) {
    g.V().bothE('knows', 'created').toArray(function (err, edges) {
      assert(!err && edges.length === 12);
      var counts = _.countBy(edges, function (e) { return e.getLabel(); });
      var expected = { created: 8, knows: 4 };
      assert.deepEqual(counts, expected);
      done();
    });
  });

  test('bothE(int branchFactor, string... labels)', function (done) {
    g.V().bothE(1, 'knows', 'created').toArray(function (err, edges) {
      assert(!err && edges.length === 6);
      var counts = _.countBy(edges, function (e) { return e.getLabel(); });
      var expected = { created: 3, knows: 3 };
      assert.deepEqual(counts, expected);
      done();
    });
  });

  test('both(string... labels)', function (done) {
    g.V().both('knows').dedup().map().toArray(function (err, verts) {
      assert(!err && verts.length === 3);
      var expected = [ { age: 29, name: 'marko' }, { age: 27, name: 'vadas' }, { age: 32, name: 'josh' } ];
      assert.deepEqual(verts, expected);
      done();
    });
  });

  test('both(int branchFactor, string... labels)', function (done) {
    g.V().both(1, 'knows').dedup().map().toArray(function (err, verts) {
      assert(!err && verts.length === 2);
      var expected = [ { age: 29, name: 'marko' }, { age: 27, name: 'vadas' } ];
      assert.deepEqual(verts, expected);
      done();
    });
  });

  test('bothV()', function (done) {
    g.E('id', '7').bothV().map().toArray(function (err, verts) {
      assert(!err && verts.length === 2);
      var expected = [ { age: 29, name: 'marko' }, { age: 27, name: 'vadas' } ];
      assert.deepEqual(verts, expected);
      done();
    });
  });

  test('inV()', function (done) {
    g.E('id', '7').inV().map().toArray(function (err, verts) {
      assert(!err && verts.length === 1);
      var expected = [ { age: 27, name: 'vadas' } ];
      assert.deepEqual(verts, expected);
      done();
    });
  });

  test('inE()', function (done) {
    g.V('name', 'lop').inE().map().toArray(function (err, edges) {
      assert(!err && edges.length === 3);
      done();
    });
  });

  // PipelineWrapper.prototype.in = function () {
  test('in()', function (done) {
    g.V('name', 'lop').in().map().toArray(function (err, edges) {
      assert(!err && edges.length === 3);
      done();
    });
  });

  test('outV()', function (done) {
    g.E('id', '7').outV().map().toArray(function (err, verts) {
      assert(!err && verts.length === 1);
      var expected = [ { age: 29, name: 'marko' } ];
      assert.deepEqual(verts, expected);
      done();
    });
  });

  test('outE()', function (done) {
    g.V('name', 'josh').outE().toArray(function (err, edges) {
      assert(!err && edges.length === 2);
      done();
    });
  });

  test('out()', function (done) {
    g.V('name', 'josh').out().toArray(function (err, edges) {
      assert(!err && edges.length === 2);
      done();
    });
  });

  test('id()', function (done) {
    g.V().id().toArray(function (err, ids) {
      assert(!err);
      var expected = [ '3', '2', '1', '6', '5', '4' ];
      assert.deepEqual(ids, expected);
      g.E().id().toArray(function (err, ids) {
        assert(!err);
        var expected = [ '10', '7', '9', '8', '11', '12' ];
        assert.deepEqual(ids, expected);
        done();
      });
    });
  });

  test('label()', function (done) {
    g.E().label().toArray(function (err, labels) {
      assert(!err);
      var expected = [ 'created', 'knows', 'created', 'knows', 'created', 'created' ];
      assert.deepEqual(labels, expected);
      done();
    });
  });

  test('property()', function (done) {
    g.V().property('name').toArray(function (err, names) {
      assert(!err);
      var expected = [ 'lop', 'vadas', 'marko', 'peter', 'ripple', 'josh' ];
      assert.deepEqual(names, expected);
      g.V().property('age').toArray(function (err, ages) {
        assert(!err);
        var expected = [ null, 27, 29, 35, null, 32 ];
        assert.deepEqual(ages, expected);
        done();
      });
    });
  });

  // TODO
  // PipelineWrapper.prototype.idEdge = function () {
  // PipelineWrapper.prototype.id = function () {
  // PipelineWrapper.prototype.idVertex = function () {
  // PipelineWrapper.prototype.step = function () {
  test('copySplit(), _(), and fairMerge()', function (done) {
    g.V().both().toArray(function (err, bothed) {
      g.V().copySplit(g._().in(), g._().out()).fairMerge().toArray(function (err, copied) {
        assert(bothed.length === copied.length);
        done();
      });
    });
  });
  // PipelineWrapper.prototype.exhaustMerge = function () {
  // PipelineWrapper.prototype.fairMerge = function () {
  // PipelineWrapper.prototype.ifThenElse = function () {
  // PipelineWrapper.prototype.loop = function () {
  // PipelineWrapper.prototype.and = function (/*final Pipe<E, ?>... pipes*/) {
  test('as() and back()', function (done) {
    g.V().as('test').out('knows').back('test').toArray(function (err, recs) {
      assert(!err && recs.length === 1);
      done();
    });
  });
  test('dedup()', function (done) {
    g.v(3, 3, function (err, verts) {
      verts.dedup().toArray(function (err, res) {
        assert(!err && res.length === 1);
        done();
      });
    });
  });
  // PipelineWrapper.prototype.except = function () {
  test('filter()', function (done) {
    g.V().filter('{ it -> it.name == "lop" }').map().toArray(function (err, recs) {
      assert(!err && recs.length === 1);
      var expected = [ { name: 'lop', lang: 'java' } ];
      assert.deepEqual(recs, expected);
      done();
    });
  });
  // PipelineWrapper.prototype.or = function (/*final Pipe<E, ?>... pipes*/) {
  // PipelineWrapper.prototype.random = function () {
  // PipelineWrapper.prototype.index = function (idx) {
  // PipelineWrapper.prototype.range = function () {
  // PipelineWrapper.prototype.retain = function (/*final Collection<E> collection*/) {
  // PipelineWrapper.prototype.simplePath = function () {
  test('aggregate()', function (done) {
    var al = new gremlin.ArrayList();
    g.V().has('lang', 'java').aggregate(al).next(function (err, v) {
      assert(!err && v && al.sizeSync() === 2);
      // al is an ArrayList<Vertex>
      done();
    });
  });
  // PipelineWrapper.prototype.optional = function () {
  // PipelineWrapper.prototype.groupBy = function (map, closure) {
  test('groupCount(map, closure)', function (done) {
    var m = new gremlin.HashMap();
    g.V().out().groupCount(m, '{ it -> it.id }').iterate(function (err, iterated) {
      assert(!err && iterated === null);
      assert(m.getSync('3').longValue === '3');
      assert(m.getSync('2').longValue === '1');
      assert(m.getSync('6') === null);
      done();
    });
  });
  // PipelineWrapper.prototype.linkOut = function () {
  // PipelineWrapper.prototype.linkIn = function () {
  // PipelineWrapper.prototype.linkBoth = function () {
  // PipelineWrapper.prototype.sideEffect = function () {
  test('store()', function (done) {
    var al = new gremlin.ArrayList();
    g.V().has('lang', 'java').store(al).next(function (err, v) {
      assert(!err && v && al.sizeSync() === 1);
      done();
    });
  });
  // PipelineWrapper.prototype.table = function () {
  // PipelineWrapper.prototype.tree = function () {
  // PipelineWrapper.prototype.gather = function () {
  // PipelineWrapper.prototype._ = function () {
  // PipelineWrapper.prototype.memoize = function () {
  // PipelineWrapper.prototype.order = function () {
  // PipelineWrapper.prototype.path = function () {
  // PipelineWrapper.prototype.scatter = function () {
  // PipelineWrapper.prototype.select = function () {
  // PipelineWrapper.prototype.shuffle = function () {
  test('groupCount() and cap()', function (done) {
    g.V().in().id().groupCount().cap().next(function (err, map) {
      assert(!err && map['1'] === 3 && map['4'] === 2 && map['6'] === 1);
      done();
    });
  });
  // PipelineWrapper.prototype.orderMap = function () {
  // PipelineWrapper.prototype.transform = function () {
});
