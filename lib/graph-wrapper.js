'use strict';

var _ = require('underscore');
var async = require('async');

var GraphWrapper = module.exports = function (gremlin, graph) {
  this.gremlin = gremlin;
  this.graph = graph;

  // re-export some of gremlin's utility functions as
  // part of the graph wrapper instance
  this.java = gremlin.java;
  this.ClassTypes = gremlin.ClassTypes;
  this.Tokens = gremlin.Tokens;
  this.Compare = gremlin.Compare;
  this.Contains = gremlin.Contains;
  this.Direction = gremlin.Direction;
  this.ArrayList = gremlin.ArrayList;
  this.HashMap = gremlin.HashMap;
  this.Table = gremlin.Table;
  this.Tree = gremlin.Tree;
  this.isType = gremlin.isType.bind(gremlin);
  this.toList = gremlin.toList.bind(gremlin);
  this.toListSync = gremlin.toListSync.bind(gremlin);
  this.toJSON = gremlin.toJSON.bind(gremlin);
  this.toJSONSync = gremlin.toJSONSync.bind(gremlin);
};

GraphWrapper.prototype._getTransaction = function () {
  // Transactions in TransactionalGraph's are often, by default, bound against the
  // executing thread (e.g. as a ThreadLocal variable). This behavior is not very
  // helpful in JavaScript because while the main execution is in fact performed
  // on a single thread, often a pool of threads exist to service asynchronous tasks,
  // making our tasks often operate on an incorrect transaction instance.
  //
  // Due to this, we try and avoid this default thread-bound functionality and manage
  // our own life-cycle if the supplied graph instance provides the interface to create
  // a transaction independent of the executing thread.
  //
  if (this.graph.txn) {
    return this.graph.txn;
  }
  if (!this.isType(this.graph, 'com.tinkerpop.blueprints.ThreadedTransactionalGraph')) {
    return this.graph;
  }
  this.graph.txn = this.graph.newTransactionSync();
  return this.graph.txn;
};

GraphWrapper.prototype._clearTransaction = function () {
  if (this.graph.txn) {
    this.graph.txn = null;
  }
};

// com.tinkerpop.blueprints.Graph interface
GraphWrapper.prototype.addVertex = function () {
  var args = Array.prototype.slice.call(arguments);
  var txn = this._getTransaction();
  txn.addVertex.apply(txn, args);
};

GraphWrapper.prototype.getVertex = function () {
  var args = Array.prototype.slice.call(arguments);
  var txn = this._getTransaction();
  txn.getVertex.apply(txn, args);
};

GraphWrapper.prototype.removeVertex = function () {
  var args = Array.prototype.slice.call(arguments);
  var txn = this._getTransaction();
  txn.removeVertex.apply(txn, args);
};

GraphWrapper.prototype.addEdge = function (id, outVertex, inVertex, label, callback) {
  var txn = this._getTransaction();
  if (!(outVertex instanceof this.gremlin.VertexWrapper)) {
    throw new TypeError('outVertex must be an instance of VertexWrapper');
  }
  if (!(inVertex instanceof this.gremlin.VertexWrapper)) {
    throw new TypeError('inVertex must be an instance of VertexWrapper');
  }
  txn.addEdge(id, outVertex.unwrap(), inVertex.unwrap(), label, callback);
};

GraphWrapper.prototype.getEdge = function () {
  var args = Array.prototype.slice.call(arguments);
  var txn = this._getTransaction();
  txn.getEdge.apply(txn, args);
};

GraphWrapper.prototype.removeEdge = function () {
  var args = Array.prototype.slice.call(arguments);
  var txn = this._getTransaction();
  txn.removeEdge.apply(txn, args);
};

GraphWrapper.prototype.query = function () {
  var txn = this._getTransaction();
  return new this.gremlin.QueryWrapper(this.gremlin, txn.querySync());
};

// com.tinkerpop.blueprints.ThreadedTransactionalGraph interface
GraphWrapper.prototype.newTransaction = function () {
  if (!this.isType(this.graph, 'com.tinkerpop.blueprints.ThreadedTransactionalGraph')) {
    throw new Error('Graph instance must implement com.tinkerpop.blueprints.ThreadedTransactionalGraph');
  }
  var txn = this.graph.newTransactionSync();
  return new this.gremlin.GraphWrapper(this.gremlin, txn);
};

// com.tinkerpop.blueprints.TransactionalGraph interface
GraphWrapper.prototype.commit = function (callback) {
  if (!this.isType(this.graph, 'com.tinkerpop.blueprints.TransactionalGraph')) {
    throw new Error('Graph instance must implement com.tinkerpop.blueprints.TransactionalGraph');
  }
  var txn = this._getTransaction();
  this._clearTransaction();
  txn.commit(callback);
};

GraphWrapper.prototype.rollback = function (callback) {
  if (!this.isType(this.graph, 'com.tinkerpop.blueprints.TransactionalGraph')) {
    throw new Error('Graph instance must implement com.tinkerpop.blueprints.TransactionalGraph');
  }
  var txn = this._getTransaction();
  this._clearTransaction();
  txn.rollback(callback);
};

GraphWrapper.prototype.shutdown = function (callback) {
  if (!this.isType(this.graph, 'com.tinkerpop.blueprints.TransactionalGraph')) {
    throw new Error('Graph instance must implement com.tinkerpop.blueprints.TransactionalGraph');
  }
  var txn = this._getTransaction();
  this._clearTransaction();
  txn.shutdown(callback);
};

// gremlin shell extensions for the graph object
GraphWrapper.prototype._ = function () {
  var txn = this._getTransaction();
  var pipeline = new this.gremlin.PipelineWrapper(this.gremlin, txn);
  pipeline.pipeline._Sync();
  return pipeline;
};

GraphWrapper.prototype.start = function (obj) {
  var args = Array.prototype.slice.call(arguments);
  var txn = this._getTransaction();
  var pipeline = new this.gremlin.PipelineWrapper(this.gremlin, txn);
  return pipeline.start.apply(pipeline, args);
};

GraphWrapper.prototype.V = function () {
  var args = Array.prototype.slice.call(arguments);
  var txn = this._getTransaction();
  var pipeline = new this.gremlin.PipelineWrapper(this.gremlin, txn);
  return pipeline.V.apply(pipeline, args);
};

GraphWrapper.prototype.E = function () {
  var args = Array.prototype.slice.call(arguments);
  var txn = this._getTransaction();
  var pipeline = new this.gremlin.PipelineWrapper(this.gremlin, txn);
  return pipeline.E.apply(pipeline, args);
};

GraphWrapper.prototype.v = function () {
  var gremlin = this.gremlin;
  var args = Array.prototype.slice.call(arguments);
  var callback = args[args.length-1];
  args = _.isArray(args[0]) ? args[0] : args.slice(0, -1);

  if (!_.isFunction(callback)) {
    throw new TypeError('last argument must be a callback');
  }

  var txn = this._getTransaction();
  var list = new this.ArrayList();
  if (args.length === 1) {
    txn.getVertex(args[0], function (err, v) {
      if (err) return callback(err);
      callback(null, v ? new gremlin.VertexWrapper(gremlin, v) : null);
    });
    return;
  } else {
    async.each(args, function (arg, cb) {
      txn.getVertex(arg, function (err, v) {
        if (err) return cb(err);

        list.addSync(v);
        cb(null);
      });
    }, function (err) {
      if (err) return callback(err);
      callback(null, new gremlin.PipelineWrapper(gremlin, list.iteratorSync()));
    });
  }
};

GraphWrapper.prototype.e = function () {
  var self = this;
  var args = Array.prototype.slice.call(arguments);
  var callback = args[args.length-1];
  args = _.isArray(args[0]) ? args[0] : args.slice(0, -1);

  if (!_.isFunction(callback)) {
    throw new TypeError('last argument must be a callback');
  }

  var txn = this._getTransaction();
  var list = new this.ArrayList();
  if (args.length === 1) {
    txn.getEdge(args[0], callback);
    return;
  } else {
    async.each(args, function (arg, cb) {
      txn.getEdge(arg, function (err, v) {
        if (err) return cb(err);
        list.addSync(v);
        cb(null);
      });
    }, function (err) {
      if (err) return callback(err);
      callback(null, new self.gremlin.PipelineWrapper(self.gremlin, list.iteratorSync()));
    });
  }
};
