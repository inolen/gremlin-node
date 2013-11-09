/* jshint shadow: true */

'use strict';

var _ = require('underscore'),
    async = require('async'),
    fs = require('fs'),
    glob = require('glob'),
    path = require('path');

module.exports = function(opts) {

var java = require('java');

opts = opts || {};
opts.options = opts.options || [];
opts.classpath = opts.classpath || [];

//add default globbed lib/**/*.jar classpath
opts.classpath.push(path.join(__dirname, 'lib', '**', '*.jar'));

//add options
java.options.push('-Djava.awt.headless=true');
for (var i = 0; i < opts.options.length; i++) {
    java.options.push(opts.options[i]);
}

//add jar files
for (var i = 0; i < opts.classpath.length; i++) {
    var pattern = opts.classpath[i];
    var filenames = glob.sync(pattern);
    for (var j = 0; j < filenames.length; j++) {
        java.classpath.push(filenames[j]);
    }
}

var GremlinGroovyScriptEngine = java.import('com.tinkerpop.gremlin.groovy.jsr223.GremlinGroovyScriptEngine');
var GremlinPipeline = java.import('com.tinkerpop.gremlin.groovy.GremlinGroovyPipeline');

var JSONResultConverter = java.import('com.tinkerpop.rexster.gremlin.converter.JSONResultConverter');
var JSONObject = java.import('org.json.JSONObject');
var JSONArray = java.import('org.json.JSONArray');

var Class = java.import('java.lang.Class');
var ArrayList = java.import('java.util.ArrayList');
var HashMap = java.import('java.util.HashMap');
var Table = java.import('com.tinkerpop.pipes.util.structures.Table');
var Tree = java.import('com.tinkerpop.pipes.util.structures.Tree');

var Direction = java.import('com.tinkerpop.blueprints.Direction');
var Tokens = java.import('com.tinkerpop.gremlin.Tokens$T');
var Compare = java.import('com.tinkerpop.blueprints.Compare');
var Contains = java.import('com.tinkerpop.blueprints.Contains');

var ClassTypes = {
    'String': { 'class': Class.forNameSync('java.lang.String') },
    'Vertex': { 'class': java.getClassLoader().loadClassSync('com.tinkerpop.blueprints.Vertex') },
    'Edge': { 'class': java.getClassLoader().loadClassSync('com.tinkerpop.blueprints.Edge') },
    'Byte': { 'class': Class.forNameSync('java.lang.Byte') },
    'Character': { 'class': Class.forNameSync('java.lang.Character') },
    'Double': { 'class': Class.forNameSync('java.lang.Double') },
    'Float': { 'class': Class.forNameSync('java.lang.Float') },
    'Integer': { 'class': Class.forNameSync('java.lang.Integer') },
    'Long': { 'class': Class.forNameSync('java.lang.Long') },
    'Short': { 'class': Class.forNameSync('java.lang.Short') },
    'Number': { 'class': Class.forNameSync('java.lang.Number') },
    'BigDecimal': { 'class': Class.forNameSync('java.math.BigDecimal') },
    'BigInteger': { 'class': Class.forNameSync('java.math.BigInteger') }
};

var NULL = java.callStaticMethodSync('org.codehaus.groovy.runtime.NullObject', 'getNullObject');
var MAX_VALUE = java.newInstanceSync('java.lang.Long', 2147483647);
var MIN_VALUE = 0;
var _JSON = new JSONResultConverter(null, MIN_VALUE, MAX_VALUE, null);

///////////////
/// UTILITY ///
///////////////

var toString = Object.prototype.toString,
    slice = Array.prototype.slice;

var closureRegex = /^\{.*\}$/;
function _isClosure(val) {
    return _isString(val) && val.search(closureRegex) > -1;   
}

function _isFunction(o) {
    return toString.call(o) === '[object Function]';
}

function _isString(o) {
    return toString.call(o) === '[object String]';
}

function _isObject(o) {
    return toString.call(o) === '[object Object]';
}

function _isArray(o) {
    return toString.call(o) === '[object Array]';
}

function _isNull(o) {
    return toString.call(o) === '[object Null]' || toString.call(o) === '[object Undefined]';
}

function _ifIsNull(o) {
    return _isNull(o) ? NULL : o;
}

// there has to be a faster way to perform type checking. perhaps
// a instanceof operations should be added to node-java. currently,
// we cache both the classes that come back from loadClass, as well
// as the results of previous checks on the object itself
function _isType(o, typeName) {
    var clazz = _isType.cache[typeName];
    if (!clazz) {
        clazz = _isType.cache[typeName] = java.getClassLoader().loadClassSync(typeName);
    }
    if (!o._isType) {
        o._isType = {};
    }
    var res = o._isType[typeName];
    if (res === undefined) {
        try {
            res = clazz.isInstanceSync(o);
        } catch(err) {
            res = false;
        }
        o._isType[typeName] = res;
    }
    return res;
}
_isType.cache = {};

function _toList(obj, callback) {
    if (_isArray(obj)) {
        var list = new ArrayList();
        for (var i = 0; i < obj.length; i++) {
            list.addSync(obj[i]);
        }
        return callback(null, list);
    }
    if (obj.getClassSync().isArraySync()) {
        java.callStaticMethod('java.util.Arrays', 'asList', obj, callback);
        return;
    }
    java.callStaticMethod('com.google.common.collect.Lists', 'newArrayList', obj, callback);
}

function _toListSync(obj) {
    if (_isArray(obj)) {
        var list = new ArrayList();
        for (var i = 0; i < obj.length; i++) {
            list.addSync(obj[i]);
        }
        return list;
    }
    if (obj.getClassSync().isArraySync()) {
        return java.callStaticMethodSync('java.util.Arrays', 'asList', obj);
    }
    return java.callStaticMethodSync('com.google.common.collect.Lists', 'newArrayList', obj);
}

function _toJSON(obj, callback) {
    _JSON.convert(obj, function(err, json) {
        if (err) return callback(err);
        try {
            json = JSON.parse(json.toString());
        } catch (e) {
            return callback(e);
        }
        return callback(null, json);
    });
}

function _toJSONSync(obj) {
    var json = _JSON.convertSync(obj);
    json = JSON.parse(json.toString());
    return json;
}

function _getEngine() {
    if (_getEngine.engine) {
        return _getEngine.engine;
    }
    _getEngine.engine = new GremlinGroovyScriptEngine();
    return _getEngine.engine;
}

/////////////////////
/// GRAPH WRAPPER ///
/////////////////////

// exports shared by the graph wrapper / module
var sharedExports = {
    java: java,
    ClassTypes: ClassTypes,
    Tokens: Tokens,
    Compare: Compare,
    Contains: Contains,
    Direction: Direction,
    ArrayList: ArrayList,
    HashMap: HashMap,
    Table: Table,
    Tree: Tree,
    toList: _toList,
    toListSync: _toListSync,
    toJSON: _toJSON,
    toJSONSync: _toJSONSync,
    getEngine: _getEngine,
};

var GraphWrapper = function(graph) {
    this._graph = graph;
};

_.extend(GraphWrapper.prototype, sharedExports);

GraphWrapper.prototype._getTransaction = function() {
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
    if (this._graph.txn) {
        return this._graph.txn;
    }
    if (!_isType(this._graph, 'com.tinkerpop.blueprints.ThreadedTransactionalGraph')) {
        return this._graph;
    }
    this._graph.txn = this._graph.newTransactionSync();
    return this._graph.txn;
};

GraphWrapper.prototype._clearTransaction = function() {
    if (this._graph.txn) {
        this._graph.txn = null;
    }
};

// com.tinkerpop.blueprints.Graph interface
GraphWrapper.prototype.addVertex = function () {
    var args = slice.call(arguments);
    var txn = this._getTransaction();
    txn.addVertex.apply(txn, args);
};

GraphWrapper.prototype.addEdge = function () {
    var args = slice.call(arguments);
    var txn = this._getTransaction();
    txn.addEdge.apply(txn, args);
};

GraphWrapper.prototype.query = function() {
    var txn = this._getTransaction();
    return new QueryWrapper(txn.querySync());
};

// com.tinkerpop.blueprints.ThreadedTransactionalGraph interface
GraphWrapper.prototype.newTransaction = function() {
    if (!_isType(this._graph, 'com.tinkerpop.blueprints.ThreadedTransactionalGraph')) {
        throw new Error('Graph instance must implement com.tinkerpop.blueprints.ThreadedTransactionalGraph');
    }
    var txn = this._graph.newTransactionSync();
    return new GraphWrapper(txn);
};

// com.tinkerpop.blueprints.TransactionalGraph interface
GraphWrapper.prototype.commit = function(callback) {
    if (!_isType(this._graph, 'com.tinkerpop.blueprints.TransactionalGraph')) {
        throw new Error('Graph instance must implement com.tinkerpop.blueprints.TransactionalGraph');
    }
    var txn = this._getTransaction();
    this._clearTransaction();
    txn.commit(callback);
};

GraphWrapper.prototype.rollback = function(callback) {
    if (!_isType(this._graph, 'com.tinkerpop.blueprints.TransactionalGraph')) {
        throw new Error('Graph instance must implement com.tinkerpop.blueprints.TransactionalGraph');
    }
    var txn = this._getTransaction();
    this._clearTransaction();
    txn.rollback(callback);
};

GraphWrapper.prototype.shutdown = function(callback) {
    if (!_isType(this._graph, 'com.tinkerpop.blueprints.TransactionalGraph')) {
        throw new Error('Graph instance must implement com.tinkerpop.blueprints.TransactionalGraph');
    }
    var txn = this._getTransaction();
    this._clearTransaction();
    txn.shutdown(callback);
};

// gremlin shell extensions for the graph object
GraphWrapper.prototype._ = function() {
    var txn = this._getTransaction();
    var pipeline = new PipelineWrapper(txn);
    pipeline.pipeline._Sync();
    return pipeline;
};

GraphWrapper.prototype.start = function(obj) {
    var txn = this._getTransaction();
    var pipeline = new PipelineWrapper(txn);
    return pipeline.start(obj);
};

GraphWrapper.prototype.V = function() {
    var args = slice.call(arguments);
    var txn = this._getTransaction();
    var pipeline = new PipelineWrapper(txn);
    return pipeline.V.apply(pipeline, args);
};

GraphWrapper.prototype.E = function() {
    var args = slice.call(arguments);
    var txn = this._getTransaction();
    var pipeline = new PipelineWrapper(txn);
    return pipeline.E.apply(pipeline, args);
};

GraphWrapper.prototype.v = function() {
    var args = slice.call(arguments);
    var callback = args[args.length-1];
    args = _isArray(args[0]) ? args[0] : args.slice(0, -1);
    var txn = this._getTransaction();
    var list = new ArrayList();
    if (args.length === 1) {
        txn.getVertex(args[0], callback);
        return;
    } else {
        async.each(args, function(arg, cb) {
            txn.getVertex(arg, function(err, v) {
                if (err) return cb(err);
                list.addSync(v);
                cb(null);
            });
        }, function(err) {
            if (err) return callback(err);
            callback(null, new PipelineWrapper(list.iteratorSync()));
        });
    }
};

GraphWrapper.prototype.e = function() {
    var args = slice.call(arguments);
    var callback = args[args.length-1];
    args = _isArray(args[0]) ? args[0] : args.slice(0, -1);
    var txn = this._getTransaction();
    var list = new ArrayList();
    if (args.length === 1) {
        txn.getEdge(args[0], callback);
        return;
    } else {
        async.each(args, function(arg, cb) {
            txn.getEdge(arg, function(err, v) {
                if (err) return cb(err);
                list.addSync(v);
                cb(null);
            });
        }, function(err) {
            if (err) return callback(err);
            callback(null, new PipelineWrapper(list.iteratorSync()));
        });
    }
};

////////////////////////
/// PIPELINE WRAPPER ///
////////////////////////

function parseVarargs(args, type) {
    var va;
    if (_isArray(args[args.length-1])) {
        va = args.pop();
    } else {
        va = [];
        // HACK - instead of actually converting JS strings -> java.lang.String
        // instances as part of javify, we check the type with _isString
        var test = type === 'java.lang.String' ? _isString : function(o) {
            return _isType(o, type);
        };
        while (test(args[args.length-1])) {
            va.unshift(args.pop());
        }
    }
    args.push(java.newArray(type, va));
}

function convertPipe(o) {
    return o instanceof PipelineWrapper ? o.pipeline : o;
}

function convertClosure(o) {
    return _isClosure(o) ? _getEngine().evalSync(o) : o;
}

function javify(arg) {
    return convertPipe(convertClosure(arg));
}

var PipelineWrapper = function(start) {
    if (start && _isType(start, 'java.lang.Iterable')) {
        throw new Error('Resolve iterable instances asynchronously to iterators to avoid unexpected potential blocking (e.g. it.iterator())');
    }
    this.pipeline = start ? new GremlinPipeline(start) : new GremlinPipeline();
};

PipelineWrapper.prototype.add = function(type, args) {
    this.pipeline[type + 'Sync'].apply(this.pipeline, args);
    return this;
};

PipelineWrapper.prototype.V = function() {
    var args = slice.call(arguments);
    return this.add('V', args);
};

PipelineWrapper.prototype.E = function() {
    var args = slice.call(arguments);
    return this.add('E', args);
};

PipelineWrapper.prototype.has = function() {
    var args = slice.call(arguments).map(_ifIsNull);
    return this.add('has', args);
};

PipelineWrapper.prototype.hasNot = function() {
    var args = slice.call(arguments).map(_ifIsNull);
    return this.add('hasNot', args);
};

PipelineWrapper.prototype.interval = function() {
    var args = slice.call(arguments);
    return this.add('interval', args);
};

PipelineWrapper.prototype.bothE = function() {
    var args = slice.call(arguments);
    parseVarargs(args, 'java.lang.String');
    return this.add('bothE', args);
};

PipelineWrapper.prototype.both = function() {
    var args = slice.call(arguments);
    parseVarargs(args, 'java.lang.String');
    return this.add('both', args);
};

PipelineWrapper.prototype.bothV = function() {
    return this.add('bothV');
};

PipelineWrapper.prototype.idEdge = function() {
    var args = slice.call(arguments);
    return this.add('idEdge', args);
};

PipelineWrapper.prototype.id = function() {
    return this.add('id');
};

PipelineWrapper.prototype.idVertex = function() {
    var args = slice.call(arguments);
    return this.add('idVertex', args);
};

PipelineWrapper.prototype.inE = function() {
    var args = slice.call(arguments);
    parseVarargs(args, 'java.lang.String');
    return this.add('inE', args);
};

PipelineWrapper.prototype.in = function() {
    var args = slice.call(arguments);
    parseVarargs(args, 'java.lang.String');
    return this.add('in', args);
};

PipelineWrapper.prototype.inV = function() {
    return this.add('inV');
};

PipelineWrapper.prototype.label = function() {
    return this.add('label');
};

PipelineWrapper.prototype.outE = function() {
    var args = slice.call(arguments);
    parseVarargs(args, 'java.lang.String');
    return this.add('outE', args);
};

PipelineWrapper.prototype.out = function(){
    var args = slice.call(arguments);
    parseVarargs(args, 'java.lang.String');
    return this.add('out', args);
};

PipelineWrapper.prototype.outV = function(){
    return this.add('outV');
};

PipelineWrapper.prototype.map = function() {
    var args = slice.call(arguments);
    parseVarargs(args, 'java.lang.String');
    return this.add('map', args);
};

PipelineWrapper.prototype.property = function() {
    var args = slice.call(arguments);
    return this.add('property', args);
};

PipelineWrapper.prototype.step = function() {
    var args = slice.call(arguments).map(javify);
    return this.add('step', args);
};

////////////////////
/// BRANCH PIPES ///
////////////////////

PipelineWrapper.prototype.copySplit = function() {
    var args = slice.call(arguments).map(javify);
    parseVarargs(args, 'com.tinkerpop.pipes.Pipe');
    return this.add('copySplit', args);
};

PipelineWrapper.prototype.exhaustMerge = function() {
    return this.add('exhaustMerge');
};

PipelineWrapper.prototype.fairMerge = function() {
    return this.add('fairMerge');
};

PipelineWrapper.prototype.ifThenElse = function() {
    var args = slice.call(arguments).map(javify);
    return this.add('ifThenElse', args);
};

PipelineWrapper.prototype.loop = function() {
    var args = slice.call(arguments).map(javify);
    return this.add('loop', args);
};

////////////////////
/// FILTER PIPES ///
////////////////////

PipelineWrapper.prototype.and = function(/*final Pipe<E, ?>... pipes*/) {
    var args = slice.call(arguments).map(javify);
    parseVarargs(args, 'com.tinkerpop.pipes.Pipe');
    return this.add('and', args);
};

PipelineWrapper.prototype.back = function(step) {
    var args = slice.call(arguments);
    return this.add('back', args);
};

PipelineWrapper.prototype.dedup = function(closure) {
    var args = slice.call(arguments).map(javify);
    return this.add('dedup', args);
};

PipelineWrapper.prototype.except = function() {
    var args = slice.call(arguments);
    if (_isType(args[0], 'java.util.Collection')) {
        // assume except(final Collection<E> collection)
    } else if (_isArray(args[0])) {
        // assume except(final Collection<E> collection)
        args[0] = _toListSync(args[0]);
    } else {
        // assume except(final String... namedSteps)
        parseVarargs(args, 'java.lang.String');
    }
    return this.add('except', args);
};

PipelineWrapper.prototype.filter = function(closure) {
    var args = slice.call(arguments).map(javify);
    return this.add('filter', args);
};

PipelineWrapper.prototype.or = function(/*final Pipe<E, ?>... pipes*/) {
    var args = slice.call(arguments).map(javify);
    parseVarargs(args, 'com.tinkerpop.pipes.Pipe');
    return this.add('or', args);
};

PipelineWrapper.prototype.random = function() {
    var args = slice.call(arguments);
    return this.add('random', args);
};

PipelineWrapper.prototype.index = function(idx) {
    return this.add('range', [idx, idx]);
};

PipelineWrapper.prototype.range = function() {
    var args = slice.call(arguments);
    return this.add('range', args);
};

PipelineWrapper.prototype.retain = function(/*final Collection<E> collection*/) {
    var args = slice.call(arguments);
    if (_isType(args[0], 'java.util.Collection')) {
        // assume retain(final Collection<E> collection)
    } else if (_isArray(args[0])) {
        // assume retain(final Collection<E> collection)
        args[0] = _toListSync(args[0]);
    } else {
        // assume retain(final String... namedSteps)
        parseVarargs(args, 'java.lang.String');
    }
    return this.add('retain', args);
};

PipelineWrapper.prototype.simplePath = function() {
    return this.add('simplePath');
};

/////////////////////////
/// SIDE-EFFECT PIPES ///
/////////////////////////

PipelineWrapper.prototype.aggregate = function() {
    var args = slice.call(arguments).map(javify);
    if (_isArray(args[0])) {
        args[0] = _toListSync(args[0]);
    }
    return this.add('aggregate', args);
};

PipelineWrapper.prototype.optional = function() {
    var args = slice.call(arguments);
    return this.add('optional', args);
};

PipelineWrapper.prototype.groupBy = function(map, closure) {
    var args = slice.call(arguments).map(javify);
    return this.add('groupBy', args);
};

PipelineWrapper.prototype.groupCount = function() {
    var args = slice.call(arguments).map(javify);
    return this.add('groupCount', args);
};

PipelineWrapper.prototype.linkOut = function() {
    var args = slice.call(arguments);
    return this.add('linkOut', args);
};

PipelineWrapper.prototype.linkIn = function() {
    var args = slice.call(arguments);
    return this.add('linkIn', args);
};

PipelineWrapper.prototype.linkBoth = function() {
    var args = slice.call(arguments);
    return this.add('linkBoth', args);
};

PipelineWrapper.prototype.sideEffect = function() {
    var args = slice.call(arguments).map(javify);
    return this.add('sideEffect', args);
};

PipelineWrapper.prototype.store = function() {
    var args = slice.call(arguments).map(javify);
    if (_isArray(args[0])) {
        args[0] = _toListSync(args[0]);
    }
    return this.add('store', args);
};

PipelineWrapper.prototype.table = function() {
    var args = slice.call(arguments).map(javify);
    parseVarargs(args, 'groovy.lang.Closure');
    if (_isArray(args[1])) {
        args[1] = _toListSync(args[1]);
    }
    return this.add('table', args);
};

PipelineWrapper.prototype.tree = function() {
    var args = slice.call(arguments).map(javify);
    parseVarargs(args, 'groovy.lang.Closure');
    return this.add('tree', args);
};

///////////////////////
/// TRANSFORM PIPES ///
///////////////////////

PipelineWrapper.prototype.gather = function() {
    var args = slice.call(arguments).map(javify);
    return this.add('gather', args);
};

PipelineWrapper.prototype._ = function() {
    return this.add('_');
};

PipelineWrapper.prototype.memoize = function() {
    var args = slice.call(arguments);
    return this.add('memoize', args);
};

PipelineWrapper.prototype.order = function() {
    var args = slice.call(arguments).map(javify);
    return this.add('order', args);
};

PipelineWrapper.prototype.path = function() {
    var args = slice.call(arguments).map(javify);
    parseVarargs(args, 'groovy.lang.Closure');
    return this.add('path', args);
};

PipelineWrapper.prototype.scatter = function() {
    return this.add('scatter');
};

PipelineWrapper.prototype.select = function() {
    var args = slice.call(arguments).map(javify);
    parseVarargs(args, 'groovy.lang.Closure');
    if (_isArray(args[0])) {
        args[0] = _toListSync(args[0]);
    }
    return this.add('select', args);
};

PipelineWrapper.prototype.shuffle = function() {
    return this.add('shuffle');
};

PipelineWrapper.prototype.cap = function() {
    return this.add('cap');
};

PipelineWrapper.prototype.orderMap = function() {
    var args = slice.call(arguments).map(javify);
    return this.add('orderMap', args);
};

PipelineWrapper.prototype.transform = function() {
    var args = slice.call(arguments).map(javify);
    return this.add('transform', args);
};

//////////////////////
/// UTILITY PIPES ///
//////////////////////

PipelineWrapper.prototype.as = function() {
    var args = slice.call(arguments);
    return this.add('as', args);
};

PipelineWrapper.prototype.start = function(obj) {
    if (_isType(obj, 'java.lang.Iterable')) {
        throw new Error('Resolve iterable instances asynchronously to iterators to avoid unexpected potential blocking (e.g. it.iterator())');
    }
    return this.add('start', [obj]);
};

///////////////////////
/// UTILITY METHODS ///
///////////////////////

function pipeWrapSync(op) {
    return function() {
        var args = slice.call(arguments);
        return this.pipeline[op].apply(this.pipeline, args);
    };
}

PipelineWrapper.prototype.count = pipeWrapSync('count');
PipelineWrapper.prototype.iterate = pipeWrapSync('iterate');
PipelineWrapper.prototype.iterator = pipeWrapSync('iterator');
PipelineWrapper.prototype.hasNext = pipeWrapSync('hasNext');
PipelineWrapper.prototype.next = pipeWrapSync('next');
PipelineWrapper.prototype.fill = pipeWrapSync('fill');
PipelineWrapper.prototype.enablePath = pipeWrapSync('enablePath');
PipelineWrapper.prototype.optimize = pipeWrapSync('optimize');
PipelineWrapper.prototype.remove = pipeWrapSync('remove');
PipelineWrapper.prototype.reset = pipeWrapSync('reset');
PipelineWrapper.prototype.getCurrentPath = pipeWrapSync('getCurrentPath');
PipelineWrapper.prototype.getStarts = pipeWrapSync('getStarts');
PipelineWrapper.prototype.get = pipeWrapSync('get');
PipelineWrapper.prototype.equals = pipeWrapSync('equals');
PipelineWrapper.prototype.size = pipeWrapSync('size');
PipelineWrapper.prototype.toList = pipeWrapSync('toList');
PipelineWrapper.prototype.toArray = pipeWrapSync('toArray');

PipelineWrapper.prototype.toJSON = function(callback) {
    _toJSON(this.pipeline, callback);
};

PipelineWrapper.prototype.printPipe = function() {
    console.log(this.pipeline.toString());
};

PipelineWrapper.prototype.consoleOut = function() {
    console.log(this.pipeline.toListSync().toString());
};

////////////////////
// QUERY WRAPPER ///
////////////////////

function queryWrapSync(op) {
    return function() {
        var args = slice.call(arguments);
        this.query[op].apply(this.query, args);
        return this;
    };
}

var QueryWrapper = function(query) {
    this.query = query;
};

QueryWrapper.prototype.has = queryWrapSync('has');
QueryWrapper.prototype.hasNot = queryWrapSync('hasNot');
QueryWrapper.prototype.interval = queryWrapSync('interval');
QueryWrapper.prototype.limit = queryWrapSync('limit');
QueryWrapper.prototype.vertices = queryWrapSync('vertices');
QueryWrapper.prototype.edges = queryWrapSync('edges');

return _.extend({
    wrap: function(graph) {
        return new GraphWrapper(graph);
    },
    GraphWrapper: GraphWrapper,
    PipelineWrapper: PipelineWrapper,
    QueryWrapper: QueryWrapper
}, sharedExports);

};
