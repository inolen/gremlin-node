'use strict';

var assert = require('assert');
var path = require('path');
var Gremlin = require('../lib/gremlin');
var GraphWrapper = require('../lib/graph-wrapper');

suite('pipeline-wrapper', function() {
    var gremlin;
    var graph;
    var g;

    suiteSetup(function() {
        gremlin = new Gremlin();
    });

    setup(function() {
        var TinkerGraphFactory = gremlin.java.import('com.tinkerpop.blueprints.impls.tg.TinkerGraphFactory');
        graph = TinkerGraphFactory.createTinkerGraphSync();
        g = new GraphWrapper(gremlin, graph);
    });

    // TODO test all function signatures in GremlinPipeline.java to
    // make sure our bindings work 100%

    test('V(string, object)', function (done) {
        g.V('name', 'marko').next(function (err, v) {
            assert(!err);
            assert(v.getPropertySync('name') === 'marko');
            done();
        });
    });

    test('E(string, object)', function (done) {
        g.E('weight', gremlin.java.newFloat(0.5)).next(function (err, e) {
            assert(!err);
            assert(e.getPropertySync('weight') === 0.5);
            done();
        });
    });

    test('has(string, object)', function (done) {
        g.V().has('name', 'marko').next(function (err, v) {
            assert(!err);
            assert(v.getPropertySync('name') === 'marko');
            done();
        });
    });

    test('has(string, token, object)', function (done) {
        g.V().has('name', gremlin.Tokens.eq, 'marko').next(function (err, v) {
            assert(!err);
            assert(v.getPropertySync('name') === 'marko');
            done();
        });
    });

    test('has(string, predicate, object)', function (done) {
        g.V().has('name', gremlin.Compare.EQUAL, 'marko').next(function (err, v) {
            assert(!err);
            assert(v.getPropertySync('name') === 'marko');
            done();
        });
    });

    test('hasNot(string)', function (done) {
        g.V().hasNot('age').count(function (err, count) {
            assert(!err)
            assert(count.longValue === '2');
            done();
        });
    });

    test('g.hasNot(string, object)', function (done) {
        g.V().hasNot('age', 27).count(function (err, count) {
            assert(!err)
            assert(count.longValue === '5');
            done();
        });
    });
});
