'use strict';

var _ = require('underscore');
var assert = require('assert');
var fs = require('fs');
var sinon = require('sinon');
var tmp = require('tmp');
var Q = require('q');
var Gremlin = require('../lib/gremlin');
var GraphWrapper = require('../lib/graph-wrapper');
var VertexWrapper = require('../lib/vertex-wrapper');
var EdgeWrapper = require('../lib/edge-wrapper');

suite('graph-wrapper', function () {
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

  test('Non ThreadedTransactionalGraph instances do not start unique transactions', function () {
    graph.newTransactionSync = sandbox.spy();
    g.addVertex(null, function () {});
    assert(!graph.newTransactionSync.called);
  });

  test('ThreadedTransactionalGraph starts unique transactions', function () {
    var fakeTxn = {
      addVertex: sandbox.stub()
    };
    var fakeGraph = {
      newTransactionSync: sandbox.stub().returns(fakeTxn)
    };
    var fakeGremlin = {
      isType: sandbox.stub()
        .withArgs(fakeGraph, 'com.tinkerpop.blueprints.ThreadedTransactionalGraph')
        .returns(true),
      toList: function () {},
      toListSync: function () {},
      toJSON: function () {},
      toJSONSync: function () {},
      extractArguments: sandbox.stub()
        .returns({ args: [ null ], callback: function () {} })
    };
    var g2 = new GraphWrapper(fakeGremlin, fakeGraph);

    // should start a new transaction
    g2.addVertex(null, function () {});

    // should re-use the existing transaction
    g2.addVertex(null, function () {});

    assert(fakeGremlin.isType.calledOnce);
    assert(fakeGraph.newTransactionSync.calledOnce);
    assert(fakeTxn.addVertex.calledTwice);
  });

  test('addVertex(id) using callback API', function (done) {
    g.addVertex(null, function (err, v) {
      assert.ifError(err);
      assert(v instanceof VertexWrapper);
      done();
    });
  });

  test('addVertex(id) using promise API', function (done) {
    g.addVertex(null)
      .then(function (v) { assert(v instanceof VertexWrapper); }, assert.ifError)
      .done(done);
  });

  test('getVertex(id) using callback API', function (done) {
    g.getVertex('1', function (err, v) {
      assert.ifError(err);
      assert(v instanceof VertexWrapper);
      v.getProperty('name', function (err, name) {
        assert.ifError(err);
        assert.strictEqual(name, 'marko');
        done();
      });
    });
  });

  test('getVertex(id) using promise API', function (done) {
    g.getVertex('1')
      .then(function (v) { assert(v instanceof VertexWrapper); return v.getProperty('name'); }, assert.ifError)
      .then(function (name) { assert.strictEqual(name, 'marko'); }, assert.ifError)
      .nodeify(done);
  });

  test('removeVertex(v) using callback API', function (done) {
    g.getVertex('1', function (err, v) {
      assert.ifError(err);
      assert(v instanceof VertexWrapper);

      g.removeVertex(v, function (err) {
        assert.ifError(err);

        g.getVertex('1', function (err, v) {
          assert.ifError(err);
          assert(!v);
          done();
        });
      });
    });
  });

  test('removeVertex(v) using promise API', function (done) {
    g.getVertex('1')
      .then(function (v) { assert(v instanceof VertexWrapper); return g.removeVertex(v); }, assert.ifError)
      .then(function () { return g.getVertex('1'); }, assert.ifError)
      .then(function (v) { assert.strictEqual(v, null); }, assert.ifError)
      .nodeify(done);
  });

  test('addEdge(id, v1, v2) using callback API', function (done) {
    g.v(1, 2, function (err, pipe) {
      assert.ifError(err);
      assert(pipe);

      pipe.next(function (err, v1) {
        assert.ifError(err);
        assert(v1 instanceof VertexWrapper);

        pipe.next(function (err, v2) {
          assert.ifError(err);
          assert(v2 instanceof VertexWrapper);

          g.addEdge(null, v1, v2, 'buddy', function (err, e) {
            assert.ifError(err);
            assert(e instanceof EdgeWrapper);
            assert.strictEqual(e.getId(), '0');
            assert.strictEqual(e.getLabel(), 'buddy');
            done();
          });
        });
      });
    });
  });

  test('addEdge(id, v1, v2) using promise API', function (done) {
    var pipe, v1;
    g.v(1, 2)
      .then(function (_pipe) { assert(_pipe); pipe = _pipe; return pipe.next(); }, assert.ifError)
      .then(function (_v1) { v1 = _v1; assert(v1 instanceof VertexWrapper); return pipe.next(); }, assert.ifError)
      .then(function (v2) {
        assert(v2 instanceof VertexWrapper);
        return g.addEdge(null, v1, v2, 'buddy');
      }, assert.ifError)
      .then(function (e) {
        assert(e instanceof EdgeWrapper);
        assert.strictEqual(e.getId(), '0');
        assert.strictEqual(e.getLabel(), 'buddy');
      }, assert.ifError)
      .done(done);
  });

  test('getEdge(id) using callback API', function (done) {
    g.getEdge('7', function (err, e) {
      assert.ifError(err);
      assert(e instanceof EdgeWrapper);
      assert.strictEqual(e.getId(), '7');
      assert.strictEqual(e.getLabel(), 'knows');
      e.getProperty('weight')
        .then(function (weight) {
          console.log('Edge(7) weight is:', weight);
          assert(weight > 0.0 && weight < 1.0);
        }, assert.ifError)
        .done(done);
    });
  });

  test('getEdge(id) using promise API', function (done) {
    g.getEdge('7')
      .then(function (e) {
        assert(e instanceof EdgeWrapper);
        assert.strictEqual(e.getId(), '7');
        assert.strictEqual(e.getLabel(), 'knows');
      }, assert.ifError)
      .done(done);
  });

  test('removeEdge(e) using callback API', function (done) {
    g.getEdge('7', function (err, e) {
      assert.ifError(err);
      assert(e instanceof EdgeWrapper);

      g.removeEdge(e, function (err) {
        assert.ifError(err);

        g.getEdge('7', function (err, e) {
          assert.ifError(err);
          assert(!e);
          done();
        });
      });
    });
  });

  test('removeEdge(e) using promise API', function (done) {
    g.getEdge('7')
      .then(function (e) {assert(e instanceof EdgeWrapper); return g.removeEdge(e); }, assert.ifError)
      .then(function () { return g.getEdge('7'); }, assert.ifError)
      .then(function (e) { assert(!e); }, assert.ifError)
      .done(done);
  });

  test('setProperty(key, value) / getProperty(key) using callback API', function (done) {
    g.getVertex('1', function (err, v) {
      assert.ifError(err);
      assert(v instanceof VertexWrapper);
      v.setProperty('name', 'john', function (err) {
        assert.ifError(err);
        v.getProperty('name', function (err, name) {
          assert.ifError(err);
          assert.strictEqual(name, 'john');
          done();
        });
      });
    });
  });

  test('setProperty(key, value) / getProperty(key) using promise API', function (done) {
    var v;
    g.getVertex('1')
      .then(function (_v) { v = _v; assert(v instanceof VertexWrapper); return v; }, assert.ifError)
      .then(function () { return v.getProperty('name'); }, assert.ifError)
      .then(function (name) { assert.strictEqual(name, 'marko'); return v; }, assert.ifError)
      .then(function () { return v.setProperty('name', 'john'); }, assert.ifError)
      .then(function () { return v.getProperty('name'); }, assert.ifError)
      .then(function (name) { assert.strictEqual(name, 'john'); }, assert.ifError)
      .done(done);
  });

  test('setProperties(props) / getProperties(props) using callback API', function (done) {
    g.getVertex('1', function (err, v) {
      var expectedProps = { 'name': 'josh', 'age': 45, 'foo': 23, 'bar': 42, 'xxx': 'yyy' };
      v.setProperties(expectedProps, function (err) {
        assert.ifError(err);
        v.getProperties(Object.keys(expectedProps), function (err, props) {
          assert.ifError(err);
          assert.deepEqual(props, expectedProps);
          done();
        });
      });
    });
  });

  test('setProperties(props) / getProperties(props) using promise API', function (done) {
    g.getVertex('1', function (err, v) {
      var expectedProps = { 'name': 'josh', 'age': 45, 'foo': 23, 'bar': 42, 'xxx': 'yyy' };
      v.setProperties(expectedProps)
        .then(function () { return v.getProperties(Object.keys(expectedProps)); }, assert.ifError)
        .then(function (props) { assert.deepEqual(props, expectedProps); }, assert.ifError)
        .done(done);
    });
  });

  test('removeProperty(key) using callback API', function (done) {
    g.getVertex('1', function (err, v) {
      assert.ifError(err);
      assert(v instanceof VertexWrapper);
      v.removeProperty('name', function (err, res) {
        assert.ifError(err);
        v.getProperty('name', function (err, name) {
          assert.ifError(err);
          assert.strictEqual(name, null);
          done();
        });
      });
    });
  });

  test('removeProperty(key) using promises API', function (done) {
    var v;
    g.getVertex('1')
      .then(function (_v) { v = _v; assert(v instanceof VertexWrapper); return v; }, assert.ifError)
      .then(function () { return v.removeProperty('name'); }, assert.ifError)
      .then(function () { return v.getProperty('name'); }, assert.ifError)
      .then(function (name) { assert.strictEqual(name, null); }, assert.ifError)
      .done(done);
  });

  test('removeProperties(props) using callback API', function (done) {
    g.getVertex('1', function (err, v) {
      assert.ifError(err);
      assert(v instanceof VertexWrapper);
      v.removeProperties(['name', 'age'], function (err) {
        assert.ifError(err);
        v.getProperties(['name', 'age'], function (err, props) {
          assert.ifError(err);
          assert.deepEqual(props, {name: null, age: null});
          done();
        });
      });
    });
  });

  test('removeProperties(props) using promises API', function (done) {
    var v;
    g.getVertex('1')
      .then(function (_v) { v = _v; assert(v instanceof VertexWrapper); return v; }, assert.ifError)
      .then(function () { return v.getProperties(['name', 'age']); }, assert.ifError)
      .then(function (props) { assert.deepEqual(props, {name: 'marko', age: 29}); }, assert.ifError)
      .then(function () { return v.removeProperties(['name', 'age']); }, assert.ifError)
      .then(function () { return v.getProperties(['name', 'age']); }, assert.ifError)
      .then(function (props) { assert.deepEqual(props, {name: null, age: null}); }, assert.ifError)
      .done(done);
  });

  test('v(id) with single id using callback API', function (done) {
    g.v('2', function (err, pipe) {
      assert.ifError(err);
      pipe.id().toJSON(function (err, ids) {
        assert.ifError(err);
        assert.deepEqual(ids, ['2']);
        done();
      });
    });
  });

  test('v(id) with single id using promise API', function (done) {
    var expected = ['2'];
    g.v('2')
      .then(function (pipe) { return pipe.id().toJSON(); }, assert.ifError)
      .then(function (json) { assert.deepEqual(json, expected); }, assert.ifError)
      .done(done);
  });

  test('v(id) with id list using callback API', function (done) {
    g.v('2', '4', function (err, pipe) {
      assert.ifError(err);
      pipe.id().toJSON(function (err, ids) {
        assert.ifError(err);
        assert.deepEqual(ids, ['2', '4']);
        done();
      });
    });
  });

  test('v(id...) with id list using promise API', function (done) {
    var expected = ['2', '4'];
    g.v('2', '4')
      .then(function (pipe) { return pipe.id().toJSON(); }, assert.ifError)
      .then(function (json) { assert.deepEqual(json, expected); }, assert.ifError)
      .done(done);
  });

  test('v(id...) with id array using promise API', function (done) {
    var expected = ['2', '4'];
    g.v(['2', '4'])
      .then(function (pipe) { return pipe.id().toJSON(); }, assert.ifError)
      .then(function (json) { assert.deepEqual(json, expected); }, assert.ifError)
      .done(done);
  });

  test('v(id) with invalid id using promise API', function (done) {
    g.v('99')
      .then(function (pipe) { return pipe.toJSON(); }, assert.ifError)
      .then(function (json) { assert.deepEqual(json, [ null ]); }, assert.ifError)
      .done(done);
  });

  test('g.toJSON() using callback API', function (done) {
    var expected = [ 'tinkergraph[vertices:6 edges:6]' ];
    g.toJSON(function (err, json) {
      assert.ifError(err);
      assert.deepEqual(json, expected);
      done();
    });
  });

  test('g.toJSON() using promise API', function (done) {
    var expected = [ 'tinkergraph[vertices:6 edges:6]' ];
    g.toJSON()
      .then(function (json) { assert.deepEqual(json, expected); }, assert.ifError)
      .done(done);
  });

  test('g.toJSONSync()', function (done) {
    var json = g.toJSONSync();
    var expected = [ 'tinkergraph[vertices:6 edges:6]' ];
    assert.deepEqual(json, expected);
    done();
  });

  test('g.saveAndLoadGraphML()', function (done) {
    tmp.tmpName(function (err, path) {
      if (err) {
        // A failure in tmpName is not a failure in gremlin-node.
        // If this ever fails, it is likely some environmental problem.
        throw err;
      }
      g.saveGraphMLSync(path);
      var TinkerGraph = gremlin.java.import('com.tinkerpop.blueprints.impls.tg.TinkerGraph');
      var h = gremlin.wrap(new TinkerGraph());
      var json = h.toJSONSync();
      var expected = [ 'tinkergraph[vertices:0 edges:0]' ];
      assert.deepEqual(json, expected);
      h.loadGraphMLSync(path);
      json = h.toJSONSync();
      expected = [ 'tinkergraph[vertices:6 edges:6]' ];
      assert.deepEqual(json, expected);
      fs.unlink(path, done);
    });
  });

  test('g.saveAndLoadGraphSON()', function (done) {
    tmp.tmpName(function (err, path) {
      if (err) {
        // A failure in tmpName is not a failure in gremlin-node.
        // If this ever fails, it is likely some environmental problem.
        throw err;
      }
      g.saveGraphSONSync(path);
      var TinkerGraph = gremlin.java.import('com.tinkerpop.blueprints.impls.tg.TinkerGraph');
      var h = gremlin.wrap(new TinkerGraph());
      var json = h.toJSONSync();
      var expected = [ 'tinkergraph[vertices:0 edges:0]' ];
      assert.deepEqual(json, expected);
      h.loadGraphSONSync(path);
      json = h.toJSONSync();
      expected = [ 'tinkergraph[vertices:6 edges:6]' ];
      assert.deepEqual(json, expected);
      fs.unlink(path, done);
    });
  });

});
