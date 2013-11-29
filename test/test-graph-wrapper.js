'use strict';

var _ = require('underscore');
var assert = require('assert');
var sinon = require('sinon');
var Gremlin = require('../lib/gremlin');
var GraphWrapper = require('../lib/graph-wrapper');

suite('graph-wrapper', function() {
  var gremlin;
  var graph;
  var g;
  var sandbox;

  suiteSetup(function() {
    gremlin = new Gremlin();
  });

  setup(function() {
    var TinkerGraphFactory = gremlin.java.import('com.tinkerpop.blueprints.impls.tg.TinkerGraphFactory');
    graph = TinkerGraphFactory.createTinkerGraphSync();
    g = new GraphWrapper(gremlin, graph);
    sandbox = sinon.sandbox.create();
  });

  teardown(function() {
    sandbox.restore();
  });

  test('Non ThreadedTransactionalGraph instances do not start unique transactions', function() {
    graph.newTransactionSync = sandbox.spy();
    g.addVertex(null, function () {});
    assert(!graph.newTransactionSync.called);
  });

  test('ThreadedTransactionalGraph starts unique transactions', function() {
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
      VertexWrapper: function () {},
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
      assert(!err && v instanceof gremlin.VertexWrapper);
      done();
    });
  });

  test('getVertex(id)', function (done) {
    g.getVertex('1', function (err, v) {
      assert(!err && v instanceof gremlin.VertexWrapper);
      v.getProperty('name', function (err, name) {
        assert(!err && name === 'marko');
        done();
      });
    });
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

  test('addEdge(id, v1, v2)', function (done) {
    g.v(1, 2, function (err, pipe) {
      assert(!err && pipe);

      pipe.next(function (err, v1) {
        assert(!err && v1);

        pipe.next(function (err, v2) {
          assert(!err && v2);

          g.addEdge(null, v1, v2, 'buddy', function (err, e) {
            assert(!err && e instanceof gremlin.EdgeWrapper);
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
      assert(!err && e instanceof gremlin.EdgeWrapper);
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

  test('setProperty(key, value) / getProperty(key) / removeProperty(key)', function (done) {
    g.getVertex('1', function (err, v) {
      v.setProperty('name', 'john', function (err) {
        assert(!err);
        v.getProperty('name', function (err, name) {
          assert(!err && name === 'john');
          v.removeProperty('name', function (err, res) {
            assert(!err);
            v.getProperty('name', function (err, name) {
              assert(!err && name === null);
              done();
            });
          });
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

  test('getProperties()', function (done) {
    g.getVertex('1', function (err, v) {
      v.getProperties(function (err, props) {
        assert(!err && _.isEqual(props, { name: 'marko', age: 29 }));
        done();
      });
    });
  });

  test('v(id) with single id', function (done) {
    g.v('2', function (err, v) {
      assert(!err && v.getId() === '2');
      done();
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
});
