'use strict';

var _ = require('underscore');

var PipelineWrapper = module.exports = function (gremlin, start) {
  if (start && gremlin.isType(start, 'java.lang.Iterable')) {
    throw new Error('Resolve iterable instances asynchronously to iterators to avoid unexpected potential blocking (e.g. it.iterator())');
  }
  this.gremlin = gremlin;
  this.pipeline = start ? new gremlin.GremlinPipeline(start) : new gremlin.GremlinPipeline();
};

PipelineWrapper.prototype._parseVarargs = function (args, type) {
  var va, self = this;
  if (_.isArray(args[args.length - 1])) {
    va = args.pop();
  } else {
    va = [];
    // HACK - instead of actually converting JS strings -> java.lang.String
    // instances as part of javify, we check the type with _isString
    var test = type === 'java.lang.String' ? _.isString : function (o) {
      return self.gremlin.isType(o, type);
    };
    while (test(args[args.length - 1])) {
      va.unshift(args.pop());
    }
  }
  args.push(this.gremlin.java.newArray(type, va));
};

PipelineWrapper.prototype._isClosure = function (val) {
  var closureRegex = /^\{.*\}$/;
  return _.isString(val) && val.search(closureRegex) > -1;
};

PipelineWrapper.prototype._javify = function (arg) {
  if (arg.unwrap) {
    return arg.unwrap();
  } else if (this._isClosure(arg)) {
    return this.gremlin.getEngine().evalSync(arg);
  }
  return arg;
};

PipelineWrapper.prototype._jsify = function (arg) {
  if (arg.longValue) {
    return parseInt(arg.longValue, 10);
  } else if (this.gremlin.isType(arg, 'com.tinkerpop.blueprints.Vertex')) {
    return this.gremlin.wrapVertex(arg);
  } else if (this.gremlin.isType(arg, 'com.tinkerpop.blueprints.Edge')) {
    return this.gremlin.wrapEdge(arg);
  } else if (this.gremlin.isType(arg, 'java.util.Map')) {
    // it seems this type of coercion could be ported to node-java
    // https://github.com/joeferner/node-java/issues/56
    var map = {};
    var it = arg.entrySetSync().iteratorSync();
    while (it.hasNextSync()) {
      var pair = it.nextSync();
      map[pair.getKeySync()] = this._jsify(pair.getValueSync());
    }
    return map;
  }
  return arg;
};

PipelineWrapper.prototype.unwrap = function () {
  return this.pipeline;
};

PipelineWrapper.prototype.add = function (type, args) {
  this.pipeline[type + 'Sync'].apply(this.pipeline, args);
  return this;
};

PipelineWrapper.prototype.V = function () {
  var args = Array.prototype.slice.call(arguments);
  return this.add('V', args);
};

PipelineWrapper.prototype.E = function () {
  var args = Array.prototype.slice.call(arguments);
  return this.add('E', args);
};

PipelineWrapper.prototype.has = function () {
  var args = Array.prototype.slice.call(arguments);
  return this.add('has', args);
};

PipelineWrapper.prototype.hasNot = function () {
  var args = Array.prototype.slice.call(arguments);
  return this.add('hasNot', args);
};

PipelineWrapper.prototype.interval = function () {
  var args = Array.prototype.slice.call(arguments);
  return this.add('interval', args);
};

PipelineWrapper.prototype.bothE = function () {
  var args = Array.prototype.slice.call(arguments);
  this._parseVarargs(args, 'java.lang.String');
  return this.add('bothE', args);
};

PipelineWrapper.prototype.both = function () {
  var args = Array.prototype.slice.call(arguments);
  this._parseVarargs(args, 'java.lang.String');
  return this.add('both', args);
};

PipelineWrapper.prototype.bothV = function () {
  return this.add('bothV');
};

PipelineWrapper.prototype.idEdge = function () {
  var args = Array.prototype.slice.call(arguments);
  return this.add('idEdge', args);
};

PipelineWrapper.prototype.id = function () {
  return this.add('id');
};

PipelineWrapper.prototype.idVertex = function () {
  var args = Array.prototype.slice.call(arguments);
  return this.add('idVertex', args);
};

PipelineWrapper.prototype.inE = function () {
  var args = Array.prototype.slice.call(arguments);
  this._parseVarargs(args, 'java.lang.String');
  return this.add('inE', args);
};

PipelineWrapper.prototype.in = function () {
  var args = Array.prototype.slice.call(arguments);
  this._parseVarargs(args, 'java.lang.String');
  return this.add('in', args);
};

PipelineWrapper.prototype.inV = function () {
  return this.add('inV');
};

PipelineWrapper.prototype.label = function () {
  return this.add('label');
};

PipelineWrapper.prototype.outE = function () {
  var args = Array.prototype.slice.call(arguments);
  this._parseVarargs(args, 'java.lang.String');
  return this.add('outE', args);
};

PipelineWrapper.prototype.out = function () {
  var args = Array.prototype.slice.call(arguments);
  this._parseVarargs(args, 'java.lang.String');
  return this.add('out', args);
};

PipelineWrapper.prototype.outV = function () {
  return this.add('outV');
};

PipelineWrapper.prototype.map = function () {
  var args = Array.prototype.slice.call(arguments);
  this._parseVarargs(args, 'java.lang.String');
  return this.add('map', args);
};

PipelineWrapper.prototype.property = function () {
  var args = Array.prototype.slice.call(arguments);
  return this.add('property', args);
};

PipelineWrapper.prototype.step = function () {
  var args = Array.prototype.slice.call(arguments).map(this._javify.bind(this));
  return this.add('step', args);
};

////////////////////
/// BRANCH PIPES ///
////////////////////

PipelineWrapper.prototype.copySplit = function () {
  var args = Array.prototype.slice.call(arguments).map(this._javify.bind(this));
  this._parseVarargs(args, 'com.tinkerpop.pipes.Pipe');
  return this.add('copySplit', args);
};

PipelineWrapper.prototype.exhaustMerge = function () {
  return this.add('exhaustMerge');
};

PipelineWrapper.prototype.fairMerge = function () {
  return this.add('fairMerge');
};

PipelineWrapper.prototype.ifThenElse = function () {
  var args = Array.prototype.slice.call(arguments).map(this._javify.bind(this));
  return this.add('ifThenElse', args);
};

PipelineWrapper.prototype.loop = function () {
  var args = Array.prototype.slice.call(arguments).map(this._javify.bind(this));
  return this.add('loop', args);
};

////////////////////
/// FILTER PIPES ///
////////////////////

PipelineWrapper.prototype.and = function (/*final Pipe<E, ?>... pipes*/) {
  var args = Array.prototype.slice.call(arguments).map(this._javify.bind(this));
  this._parseVarargs(args, 'com.tinkerpop.pipes.Pipe');
  return this.add('and', args);
};

PipelineWrapper.prototype.back = function (step) {
  var args = Array.prototype.slice.call(arguments);
  return this.add('back', args);
};

PipelineWrapper.prototype.dedup = function (closure) {
  var args = Array.prototype.slice.call(arguments).map(this._javify.bind(this));
  return this.add('dedup', args);
};

PipelineWrapper.prototype.except = function () {
  var args = Array.prototype.slice.call(arguments);
  if (this.gremlin.isType(args[0], 'java.util.Collection')) {
    // assume except(final Collection<E> collection)
  } else if (_.isArray(args[0])) {
    // assume except(final Collection<E> collection)
    args[0] = this.gremlin.toListSync(args[0]);
  } else {
    // assume except(final String... namedSteps)
    this._parseVarargs(args, 'java.lang.String');
  }
  return this.add('except', args);
};

PipelineWrapper.prototype.filter = function (closure) {
  var args = Array.prototype.slice.call(arguments).map(this._javify.bind(this));
  return this.add('filter', args);
};

PipelineWrapper.prototype.or = function (/*final Pipe<E, ?>... pipes*/) {
  var args = Array.prototype.slice.call(arguments).map(this._javify.bind(this));
  this._parseVarargs(args, 'com.tinkerpop.pipes.Pipe');
  return this.add('or', args);
};

PipelineWrapper.prototype.random = function () {
  var args = Array.prototype.slice.call(arguments);
  return this.add('random', args);
};

PipelineWrapper.prototype.index = function (idx) {
  return this.add('range', [idx, idx]);
};

PipelineWrapper.prototype.range = function () {
  var args = Array.prototype.slice.call(arguments);
  return this.add('range', args);
};

PipelineWrapper.prototype.retain = function (/*final Collection<E> collection*/) {
  var args = Array.prototype.slice.call(arguments);
  if (this.gremlin.isType(args[0], 'java.util.Collection')) {
    // assume retain(final Collection<E> collection)
  } else if (_.isArray(args[0])) {
    // assume retain(final Collection<E> collection)
    args[0] = this.gremlin.toListSync(args[0]);
  } else {
    // assume retain(final String... namedSteps)
    this._parseVarargs(args, 'java.lang.String');
  }
  return this.add('retain', args);
};

PipelineWrapper.prototype.simplePath = function () {
  return this.add('simplePath');
};

/////////////////////////
/// SIDE-EFFECT PIPES ///
/////////////////////////

PipelineWrapper.prototype.aggregate = function () {
  var args = Array.prototype.slice.call(arguments).map(this._javify.bind(this));
  if (_.isArray(args[0])) {
    args[0] = this.gremlin.toListSync(args[0]);
  }
  return this.add('aggregate', args);
};

PipelineWrapper.prototype.optional = function () {
  var args = Array.prototype.slice.call(arguments);
  return this.add('optional', args);
};

PipelineWrapper.prototype.groupBy = function (map, closure) {
  var args = Array.prototype.slice.call(arguments).map(this._javify.bind(this));
  return this.add('groupBy', args);
};

PipelineWrapper.prototype.groupCount = function () {
  var args = Array.prototype.slice.call(arguments).map(this._javify.bind(this));
  return this.add('groupCount', args);
};

PipelineWrapper.prototype.linkOut = function () {
  var args = Array.prototype.slice.call(arguments);
  return this.add('linkOut', args);
};

PipelineWrapper.prototype.linkIn = function () {
  var args = Array.prototype.slice.call(arguments);
  return this.add('linkIn', args);
};

PipelineWrapper.prototype.linkBoth = function () {
  var args = Array.prototype.slice.call(arguments);
  return this.add('linkBoth', args);
};

PipelineWrapper.prototype.sideEffect = function () {
  var args = Array.prototype.slice.call(arguments).map(this._javify.bind(this));
  return this.add('sideEffect', args);
};

PipelineWrapper.prototype.store = function () {
  var args = Array.prototype.slice.call(arguments).map(this._javify.bind(this));
  if (_.isArray(args[0])) {
    args[0] = this.gremlin.toListSync(args[0]);
  }
  return this.add('store', args);
};

PipelineWrapper.prototype.table = function () {
  var args = Array.prototype.slice.call(arguments).map(this._javify.bind(this));
  this._parseVarargs(args, 'groovy.lang.Closure');
  if (_.isArray(args[1])) {
    args[1] = this.gremlin.toListSync(args[1]);
  }
  return this.add('table', args);
};

PipelineWrapper.prototype.tree = function () {
  var args = Array.prototype.slice.call(arguments).map(this._javify.bind(this));
  this._parseVarargs(args, 'groovy.lang.Closure');
  return this.add('tree', args);
};

///////////////////////
/// TRANSFORM PIPES ///
///////////////////////

PipelineWrapper.prototype.gather = function () {
  var args = Array.prototype.slice.call(arguments).map(this._javify.bind(this));
  return this.add('gather', args);
};

PipelineWrapper.prototype._ = function () {
  return this.add('_');
};

PipelineWrapper.prototype.memoize = function () {
  var args = Array.prototype.slice.call(arguments);
  return this.add('memoize', args);
};

PipelineWrapper.prototype.order = function () {
  var args = Array.prototype.slice.call(arguments).map(this._javify.bind(this));
  return this.add('order', args);
};

PipelineWrapper.prototype.path = function () {
  var args = Array.prototype.slice.call(arguments).map(this._javify.bind(this));
  this._parseVarargs(args, 'groovy.lang.Closure');
  return this.add('path', args);
};

PipelineWrapper.prototype.scatter = function () {
  return this.add('scatter');
};

PipelineWrapper.prototype.select = function () {
  var args = Array.prototype.slice.call(arguments).map(this._javify.bind(this));
  this._parseVarargs(args, 'groovy.lang.Closure');
  if (_.isArray(args[0])) {
    args[0] = this.gremlin.toListSync(args[0]);
  }
  return this.add('select', args);
};

PipelineWrapper.prototype.shuffle = function () {
  return this.add('shuffle');
};

PipelineWrapper.prototype.cap = function () {
  return this.add('cap');
};

PipelineWrapper.prototype.orderMap = function () {
  var args = Array.prototype.slice.call(arguments).map(this._javify.bind(this));
  return this.add('orderMap', args);
};

PipelineWrapper.prototype.transform = function () {
  var args = Array.prototype.slice.call(arguments).map(this._javify.bind(this));
  return this.add('transform', args);
};

//////////////////////
/// UTILITY PIPES ///
//////////////////////

PipelineWrapper.prototype.as = function () {
  var args = Array.prototype.slice.call(arguments);
  return this.add('as', args);
};

PipelineWrapper.prototype.start = function (obj) {
  if (this.gremlin.isType(obj, 'java.lang.Iterable')) {
    throw new Error('Resolve iterable instances asynchronously to iterators to avoid unexpected potential blocking (e.g. it.iterator())');
  }
  return this.add('start', [obj]);
};

///////////////////////
/// UTILITY METHODS ///
///////////////////////

function pipeWrap(op) {
  return function () {
    var args = Array.prototype.slice.call(arguments);
    return this.pipeline[op].apply(this.pipeline, args);
  };
}

PipelineWrapper.prototype.count = function (callback) {
  var self = this;

  this.pipeline.count(function (err, res) {
    if (err) return callback(err);
    callback(null, self._jsify(res));
  });
};

PipelineWrapper.prototype.iterate = pipeWrap('iterate');
PipelineWrapper.prototype.iterator = pipeWrap('iterator');
PipelineWrapper.prototype.hasNext = pipeWrap('hasNext');

PipelineWrapper.prototype.next = function (callback) {
  var self = this;

  this.pipeline.next(function (err, res) {
    if (err) return callback(err);
    callback(null, self._jsify(res));
  });
};

PipelineWrapper.prototype.fill = pipeWrap('fill');
PipelineWrapper.prototype.enablePath = pipeWrap('enablePath');
PipelineWrapper.prototype.optimize = pipeWrap('optimize');
PipelineWrapper.prototype.remove = pipeWrap('remove');
PipelineWrapper.prototype.reset = pipeWrap('reset');
PipelineWrapper.prototype.getCurrentPath = pipeWrap('getCurrentPath');
PipelineWrapper.prototype.getStarts = pipeWrap('getStarts');
PipelineWrapper.prototype.get = pipeWrap('get');
PipelineWrapper.prototype.equals = pipeWrap('equals');
PipelineWrapper.prototype.size = pipeWrap('size');
PipelineWrapper.prototype.toList = pipeWrap('toList');

PipelineWrapper.prototype.toArray = function (callback) {
  var self = this;

  this.pipeline.toList(function (err, list) {
    if (err) return callback(err);

    var arr = [];
    for (var i = 0, l = list.sizeSync(); i < l; i++) {
      var it = list.getSync(i);
      arr.push(self._jsify(it));
    }

    return callback(null, arr);
  });
};

PipelineWrapper.prototype.toJSON = function (callback) {
  this.gremlin.toJSON(this.pipeline, callback);
};

PipelineWrapper.prototype.toJSONSync = function () {
  return this.gremlin.toJSONSync(this.pipeline);
};
