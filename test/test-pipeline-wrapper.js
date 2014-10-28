'use strict';

var _ = require('underscore');
var assert = require('assert');
var async = require('async');
var path = require('path');
var Gremlin = require('../lib/gremlin');
var GraphWrapper = require('../lib/graph-wrapper');

// For reference, see the java interface:
// https://github.com/tinkerpop/gremlin/blob/master/gremlin-java/src/main/java/com/tinkerpop/gremlin/java/GremlinFluentPipeline.java

function compareValues(aval, bval) {
  if (!_.isUndefined(aval) && !_.isUndefined(bval)) {
    if (aval === bval) return 0;
    if (aval < bval) return -1;
    return 1;
  }
  else if (_.isUndefined(aval) && _.isUndefined(bval)) {
    return 0;
  }
  else if (_.isUndefined(aval)) {
    return 1;
  }
  else {
    return -1;
  }
}

function compareBy(keys) {
  return function compare(a, b) {
    for (var i = 0; i < keys.length; ++i) {
      var key = keys[i];
      var comp = compareValues(a[key], b[key]);
      if (comp !== 0)
        return comp;
    }
    return 0;
  };
}

var compareNameAge = compareBy(['name', 'age']);

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
      assert.ifError(err);
      v.getProperty('name', function (err, name) {
        assert.ifError(err);
        assert.strictEqual(name, 'marko');
        done();
      });
    });
  });

  // We test map() here early and then use it in multiple tests below to construct expected values.
  // This makes the tests somewhat more complex, but serves the useful purpose of making the functions
  // more understandable to programmers learning gremlin.
  test('map()', function (done) {
    g.V().map().toArray(function (err, verts) {
      assert.ifError(err);
      var expected = [
        { name: 'josh', age: 32 },
        { name: 'lop', lang: 'java' },
        { name: 'marko', age: 29 },
        { name: 'peter', age: 35 },
        { name: 'ripple', lang: 'java' },
        { name: 'vadas', age: 27 }
      ];
      assert.deepEqual(verts.sort(compareNameAge), expected.sort(compareNameAge));
      done();
    });
  });

  test('E(string key, object value)', function (done) {
    g.E('weight', java.newFloat(0.5)).next(function (err, e) {
      assert.ifError(err);
      e.getProperty('weight', function (err, weight) {
        assert.ifError(err);
        assert.strictEqual(weight, 0.5);
        done();
      });
    });
  });

  test('has(string key, object value)', function (done) {
    g.V().has('name', 'marko').next(function (err, v) {
      assert.ifError(err);
      v.getProperty('name', function (err, name) {
        assert.ifError(err);
        assert.strictEqual(name, 'marko');
        done();
      });
    });
  });

  test('has(string key, token, object value)', function (done) {
    g.V().has('name', gremlin.Tokens.eq, 'marko').next(function (err, v) {
      assert.ifError(err);
      v.getProperty('name', function (err, name) {
        assert.ifError(err);
        assert.strictEqual(name, 'marko');
        done();
      });
    });
  });

  test('has(string key, predicate, object value)', function (done) {
    g.V().has('name', gremlin.Compare.EQUAL, 'marko').next(function (err, v) {
      assert.ifError(err);
      v.getProperty('name', function (err, name) {
        assert.ifError(err);
        assert.strictEqual(name, 'marko');
        done();
      });
    });
  });

  test('hasNot(string key, object value)', function (done) {
    g.V().hasNot('age').count(function (err, count) {
      assert.ifError(err);
      assert.strictEqual(count, 2);
      done();
    });
  });

  test('hasNot(string key, object value)', function (done) {
    g.V().hasNot('age', 27).count(function (err, count) {
      assert.ifError(err);
      assert.strictEqual(count, 5);
      done();
    });
  });

  test('interval(string key, object start, object end)', function (done) {
    var lower = 0.3;
    var upper = 0.9;

    g.E()
      .interval('weight', java.newFloat(lower), java.newFloat(upper))
      .toArray(function (err, edges) {
        assert.ifError(err);
        assert.strictEqual(edges.length, 3);
        async.each(edges, function (e, cb) {
          e.getProperty('weight', function (err, weight) {
            assert.ifError(err);
            assert(weight >= lower && weight <= upper);
            cb();
          });
        }, done);
      });
  });

  test('bothE(string... labels)', function (done) {
    g.V().bothE('knows', 'created').toArray(function (err, edges) {
      assert.ifError(err);
      assert.strictEqual(edges.length, 12);
      var counts = _.countBy(edges, function (e) { return e.getLabel(); });
      var expected = { created: 8, knows: 4 };
      assert.deepEqual(counts, expected);
      done();
    });
  });

  test('bothE(int branchFactor, string... labels)', function (done) {
    g.V().bothE(1, 'knows', 'created').toArray(function (err, edges) {
      assert.ifError(err);
      assert.strictEqual(edges.length, 6);
      var counts = _.countBy(edges, function (e) { return e.getLabel(); });
      var expected = { created: 3, knows: 3 };
      assert.deepEqual(counts, expected);
      done();
    });
  });

  test('both(string... labels)', function (done) {
    g.V().both('knows').dedup().map().toArray(function (err, verts) {
      assert.ifError(err);
      assert.strictEqual(verts.length, 3);
      var expected = [ { age: 29, name: 'marko' }, { age: 27, name: 'vadas' }, { age: 32, name: 'josh' } ];
      assert.deepEqual(verts.sort(compareNameAge), expected.sort(compareNameAge));
      done();
    });
  });

  test('both(int branchFactor, string... labels)', function (done) {
    g.V().both(1, 'knows').dedup().map().toArray(function (err, verts) {
      assert.ifError(err);
      assert.strictEqual(verts.length, 2);
      var expected = [ { age: 29, name: 'marko' }, { age: 27, name: 'vadas' } ];
      assert.deepEqual(verts.sort(compareNameAge), expected.sort(compareNameAge));
      done();
    });
  });

  test('bothV()', function (done) {
    g.E('id', '7').bothV().map().toArray(function (err, verts) {
      assert.ifError(err);
      assert.strictEqual(verts.length, 2);
      var expected = [ { age: 29, name: 'marko' }, { age: 27, name: 'vadas' } ];
      assert.deepEqual(verts.sort(compareNameAge), expected.sort(compareNameAge));
      done();
    });
  });

  test('inV()', function (done) {
    g.E('id', '7').inV().map().toArray(function (err, verts) {
      assert.ifError(err);
      assert.strictEqual(verts.length, 1);
      var expected = [ { age: 27, name: 'vadas' } ];
      assert.deepEqual(verts.sort(compareNameAge), expected.sort(compareNameAge));
      done();
    });
  });

  test('inE()', function (done) {
    g.V('name', 'lop').inE().map().toArray(function (err, edges) {
      assert.ifError(err);
      assert.strictEqual(edges.length, 3);
      done();
    });
  });

  // PipelineWrapper.prototype.in = function () {
  test('in()', function (done) {
    g.V('name', 'lop').in().map().toArray(function (err, edges) {
      assert.ifError(err);
      assert.strictEqual(edges.length, 3);
      done();
    });
  });

  test('outV()', function (done) {
    g.E('id', '7').outV().map().toArray(function (err, verts) {
      assert.ifError(err);
      assert.strictEqual(verts.length, 1);
      var expected = [ { age: 29, name: 'marko' } ];
      assert.deepEqual(verts.sort(compareNameAge), expected.sort(compareNameAge));
      done();
    });
  });

  test('outE()', function (done) {
    g.V('name', 'josh').outE().toArray(function (err, edges) {
      assert.ifError(err);
      assert.strictEqual(edges.length, 2);
      done();
    });
  });

  test('out()', function (done) {
    g.V('name', 'josh').out().toArray(function (err, edges) {
      assert.ifError(err);
      assert.strictEqual(edges.length, 2);
      done();
    });
  });

  test('id()', function (done) {
    g.V().id().toArray(function (err, ids) {
      assert.ifError(err);
      var expected = [ '1', '2', '3', '4', '5', '6' ];
      assert.deepEqual(ids.sort(), expected);
      g.E().id().toArray(function (err, ids) {
        assert.ifError(err);
        var expected = [ '10', '11', '12', '7', '8', '9' ];
        assert.deepEqual(ids.sort(), expected);
        done();
      });
    });
  });

  test('label()', function (done) {
    g.E().label().toArray(function (err, labels) {
      assert.ifError(err);
      var expected = [ 'created', 'knows', 'created', 'knows', 'created', 'created' ];
      assert.deepEqual(labels.sort(), expected.sort());
      done();
    });
  });

  test('property()', function (done) {
    g.V().property('name').toArray(function (err, names) {
      assert.ifError(err);
      var expected = [ 'lop', 'vadas', 'marko', 'peter', 'ripple', 'josh' ];
      assert.deepEqual(names.sort(), expected.sort());
      g.V().property('age').toArray(function (err, ages) {
        assert.ifError(err);
        var expected = [ null, 27, 29, 35, null, 32 ];
        assert.deepEqual(ages.sort(), expected.sort());
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
        assert.strictEqual(bothed.length, copied.length);
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
      assert.ifError(err);
      assert.strictEqual(recs.length, 1);
      done();
    });
  });
  test('dedup()', function (done) {
    g.v(3, 3, function (err, verts) {
      verts.dedup().toArray(function (err, res) {
        assert.ifError(err);
        assert.strictEqual(res.length, 1);
        done();
      });
    });
  });
  // PipelineWrapper.prototype.except = function () {
  test('filter()', function (done) {
    this.timeout(5000); // A longer timeout is required on Travis
    g.V().filter('{ it -> it.name == "lop" }').map().toArray(function (err, recs) {
      assert.ifError(err);
      assert.strictEqual(recs.length, 1);
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
      assert.ifError(err);
      assert.ok(v);
      assert.strictEqual(al.sizeSync(), 2);
      // al is an ArrayList<Vertex>
      done();
    });
  });
  // PipelineWrapper.prototype.optional = function () {
  // PipelineWrapper.prototype.groupBy = function (map, closure) {
  test('groupCount(map, closure)', function (done) {
    var m = new gremlin.HashMap();
    g.V().out().groupCount(m, '{ it -> it.id }').iterate(function (err, iterated) {
      assert.ifError(err);
      assert.strictEqual(iterated, null);
      assert.strictEqual(m.getSync('3').longValue, '3');
      assert.strictEqual(m.getSync('2').longValue, '1');
      assert.strictEqual(m.getSync('6'), null);
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
      assert.ifError(err);
      assert.ok(v);
      assert.strictEqual(al.sizeSync(), 1);
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
      assert.ifError(err);
      assert(map['1'] === 3);
      assert(map['4'] === 2);
      assert(map['6'] === 1);
      done();
    });
  });
  // PipelineWrapper.prototype.orderMap = function () {
  // PipelineWrapper.prototype.transform = function () {
});
