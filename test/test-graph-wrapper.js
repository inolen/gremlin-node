'use strict';

var _ = require('underscore');
var assert = require('assert');
var fs = require('fs');
var sinon = require('sinon');
var tmp = require('tmp');
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

  test('addVertex(id)', function (done) {
    g.addVertex(null, function (err, v) {
      assert(!err && v instanceof VertexWrapper);
      done();
    });
  });

  test('addVertexP(id)', function (done) {
    g.addVertexP(null)
      .then(function (v) { assert(v instanceof VertexWrapper); })
      .nodeify(done);
  });

  test('getVertex(id)', function (done) {
    g.getVertex('1', function (err, v) {
      assert(!err && v instanceof VertexWrapper);
      v.getProperty('name', function (err, name) {
        assert(!err && name === 'marko');
        done();
      });
    });
  });

  test('getVertexP(id)', function (done) {
    g.getVertexP('1')
      .then(function (v) {
        assert(v instanceof VertexWrapper);
        return v.getPropertyP('name');
      })
      .then(function (name) {
        assert(name === 'marko');
      })
      .nodeify(done);
  });

  test('removeVertex(v)', function (done) {
    g.getVertex('1', function (err, v) {
      assert(!err && v);

      g.removeVertex(v, function (err) {
        assert(!err);

        g.getVertex('1', function (err, v) {
          assert(!err && !v);

          done();
        });
      });
    });
  });

  test('removeVertexP(v)', function (done) {
    g.getVertexP('1')
      .then(function (v) { assert(v instanceof VertexWrapper); return g.removeVertexP(v); })
      .then(function () { return g.getVertexP('1'); })
      .then(function (v) { assert(v === null); })
      .nodeify(done);
  });

  test('addEdge(id, v1, v2)', function (done) {
    g.v(1, 2, function (err, pipe) {
      assert(!err && pipe);

      pipe.next(function (err, v1) {
        assert(!err && v1);

        pipe.next(function (err, v2) {
          assert(!err && v2);

          g.addEdge(null, v1, v2, 'buddy', function (err, e) {
            assert(!err && e instanceof EdgeWrapper);
            assert(e.getId() === '0');
            assert(e.getLabel() === 'buddy');
            done();
          });
        });
      });
    });
  });

  test('getEdge(id)', function (done) {
    g.getEdge('7', function (err, e) {
      assert(!err && e instanceof EdgeWrapper);
      assert(e.getId() === '7');
      assert(e.getLabel() === 'knows');
      done();
    });
  });

  test('removeEdge(e)', function (done) {
    g.getEdge('7', function (err, e) {
      assert(!err && e);

      g.removeEdge(e, function (err) {
        assert(!err);

        g.getEdge('7', function (err, e) {
          assert(!err && !e);

          done();
        });
      });
    });
  });

  test('setProperty(key, value) / getProperty(key)', function (done) {
    g.getVertex('1', function (err, v) {
      assert(!err && v);
      v.setProperty('name', 'john', function (err) {
        assert(!err);
        v.getProperty('name', function (err, name) {
          assert(!err && name === 'john');
          done();
        });
      });
    });
  });

  test('setProperties(props) / getProperties(props)', function (done) {
    g.getVertex('1', function (err, v) {
      v.setProperties({
        'name': 'josh',
        'age': 45
      }, function (err) {
        assert(!err);
        v.getProperties(['name', 'age'], function (err, props) {
          assert(!err && props.name === 'josh' && props.age === 45);
          done();
        });
      });
    });
  });

  test('removeProperty(key)', function (done) {
    g.getVertex('1', function (err, v) {
      assert(!err && v);
      v.removeProperty('name', function (err, res) {
        assert(!err);
        v.getProperty('name', function (err, name) {
          assert(!err && name === null);
          done();
        });
      });
    });
  });

  test('removeProperties(props)', function (done) {
    g.getVertex('1', function (err, v) {
      assert(!err && v);
      v.removeProperties(['name', 'age'], function (err) {
        assert(!err);
        v.getProperties(['name', 'age'], function (err, props) {
          assert(!err && !props.name && !props.age);
          done();
        });
      });
    });
  });

  test('v(id) with single id', function (done) {
    g.v('2', function (err, v) {
      assert(!err && v.getId() === '2');
      done();
    });
  });

  test('v(id) with single id then toJSON', function (done) {
    g.v('2', function (err, v) {
      assert(!err && v.getId() === '2');
      v.toJSON(function (err, vjson) {
        var expected = [ { age: 27, name: 'vadas', _id: '2', _type: 'vertex' } ];
        assert.deepEqual(vjson, expected);
        done();
      });
    });
  });

  test('v(id...) with id list', function (done) {
    g.v('2', '4', function (err, pipe) {
      pipe.count(function (err, count) {
        assert(!err && count === 2);
        done();
      });
    });
  });

  test('v(id...) with id list then toJSON', function (done) {
    g.v('2', '4', function (err, pipe) {
      pipe.toJSON(function (err, json) {
        var expected = [
          { age: 27, name: 'vadas', _id: '2', _type: 'vertex' },
          { age: 32, name: 'josh', _id: '4', _type: 'vertex' }
        ];
        assert.deepEqual(json, expected);
        done();
      });
    });
  });

  test('v(id...) with id array', function (done) {
    g.v(['2', '4'], function (err, pipe) {
      assert(!err && pipe);
      pipe.count(function (err, count) {
        assert(!err && count === 2);
        done();
      });
    });
  });

  test('v(id) with invalid id', function (done) {
    g.v('99', function (err, v) {
      assert(!err && !v);
      done();
    });
  });

  test('g.toJSON()', function (done) {
    g.toJSON(function (err, json) {
      var expected = [ 'tinkergraph[vertices:6 edges:6]' ];
      assert.deepEqual(json, expected);
      done();
    });
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
