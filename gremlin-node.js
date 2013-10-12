var fs = require('fs'),
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
var GremlinPipeline = java.import('com.entrendipity.gremlin.javascript.GremlinJSPipeline');

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
}

var ENGINE = new GremlinGroovyScriptEngine();
var NULL = java.callStaticMethodSync('org.codehaus.groovy.runtime.NullObject', 'getNullObject');
var MAX_VALUE = java.newInstanceSync('java.lang.Long', 2147483647);
var MIN_VALUE = 0;
var _JSON = new JSONResultConverter(null, MIN_VALUE, MAX_VALUE, null);

///////////////
/// UTILITY ///
///////////////

var toString = Object.prototype.toString,
    push = Array.prototype.push,
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
};

function _ifIsNull(o) {
    return _isNull(o) ? NULL : o;
}

function _isType(o, typeName){
    var clazz = java.getClassLoader().loadClassSync(typeName);
    try {
        return clazz.isInstanceSync(o);
    } catch(err) {
        return false;
    }
}

function _toList(iterable, callback) {
    iterable.iterator(function (err, it) {
        if (err) return callback(err);
        var list = new ArrayList();
        while (it.hasNextSync()) {
            list.addSync(it.nextSync());
        }
        callback(null, list);
    });
}

function _toListSync(iterable) {
    var it = iterable.iteratorSync();
    var list = new ArrayList();
    while (it.hasNextSync()) {
        list.addSync(it.nextSync());
    }
    return list;
}

function _toJSON(obj, callback) {
    _JSON.convert(obj, function (err, json) {
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

/////////////////////
/// GRAPH WRAPPER ///
/////////////////////

var GraphWrapper = function(graph) {
    this.graph = graph;
};

GraphWrapper.prototype._ = function() {
    var pipeline = new GremlinJSPipeline(this.graph);
    pipeline.pipeline._Sync();
    return pipeline;
};

GraphWrapper.prototype.start = function(obj) {
    var pipeline = new GremlinJSPipeline(this.graph);
    return pipeline.start(obj);
};

GraphWrapper.prototype.query = function() {
    return new QueryWrapper(this.graph.querySync());
};

GraphWrapper.prototype.V = function() {
    var args = slice.call(arguments);
    var pipeline = new GremlinJSPipeline(this.graph);
    return pipeline.V.apply(pipeline, args);
};

GraphWrapper.prototype.E = function() {
    var args = slice.call(arguments);
    var pipeline = new GremlinJSPipeline(this.graph);
    return pipeline.E.apply(pipeline, args);
};

GraphWrapper.prototype.v = function() {
    throw new Error('TODO');
};

GraphWrapper.prototype.vSync = function() {
    var args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments),
        argsLen = args.length,
        list = new ArrayList();
    for (var i = 0; i < argsLen; i++) {
        if (typeof args[i] === 'string' && args[i].substring(0, 2) === 'v[') {
            args[i] = args[i].substring(2, args[i].length - 1);
        }
        list.addSync(this.graph.getVertexSync(args[i]));
    };
    return new GremlinJSPipeline(list);
};

GraphWrapper.prototype.e = function() {
    throw new Error('TODO');
};

GraphWrapper.prototype.eSync = function() {
    var args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments),
        argsLen = args.length,
        list = new ArrayList();
    for (var i = 0; i < argsLen; i++) {
        list.addSync(this.graph.getEdgeSync(args[i]));
    };
    return new GremlinJSPipeline(list);
};


///////////////////////////
/// JS PIPELINE WRAPPER ///
///////////////////////////

var GremlinJSPipeline = function(start) {
    this.bindings = ENGINE.createBindingsSync();
    if (_isType(start, 'com.tinkerpop.blueprints.Graph')){
        this.bindings.putSync('g', start);
    }
    this.pipeline = new GremlinPipeline(start);
    this.Type = 'GremlinJSPipeline';
};

GremlinJSPipeline.prototype.printPipe = function(){
  console.log(this.pipeline.toString())
  return this;
};

GremlinJSPipeline.prototype.step = function(closure) {
    if(_isClosure(closure)){
        this.bindings.putSync('V', this.pipeline);
        this.pipeline = ENGINE.evalSync('V.step' + closure, this.bindings);
    } else {
        this.pipeline.stepSync(java.newInstanceSync('com.tinkerpop.pipes.Pipe', closure.pipe()));
    }
    return this;
};

GremlinJSPipeline.prototype.both = function() {
    var args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments);
    this.pipeline.bothSync(java.newArray('java.lang.String', args));
    return this;
};

GremlinJSPipeline.prototype.bothE = function() {
    var args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments);
    this.pipeline.bothESync(java.newArray('java.lang.String', args));
    return this;
};

GremlinJSPipeline.prototype.bothV = function() {
    this.pipeline.bothVSync();
    return this;
};

GremlinJSPipeline.prototype.cap = function() {
    this.pipeline.capSync();
    return this;
};

GremlinJSPipeline.prototype.gather = function(closure) {
    if (_isClosure(closure)) {
        this.bindings.putSync('V', this.pipeline);
        this.pipeline = ENGINE.evalSync('V.gather' + closure , this.bindings);
    } else {
        this.pipeline.gatherSync();
    }
    return this;
};

GremlinJSPipeline.prototype.id = function() {
    this.pipeline.idSync();
    return this;
};

GremlinJSPipeline.prototype.in = function() {
    var args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments);
    this.pipeline.inSync(java.newArray('java.lang.String', args));
    return this;
};

GremlinJSPipeline.prototype.inE = function() {
    var args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments);
    this.pipeline.inESync(java.newArray('java.lang.String', args));
    return this;
};

GremlinJSPipeline.prototype.inV = function() {
    this.pipeline.inVSync();
    return this;
};

GremlinJSPipeline.prototype.property = function(key) {
    this.pipeline.propertySync(key);
    return this;
};

GremlinJSPipeline.prototype.label = function() {
    this.pipeline.labelSync();
    return this;
};

GremlinJSPipeline.prototype.linkBoth = function(label, other) {
    this.pipeline.linkBothSync(label, other);
    return this;
};

GremlinJSPipeline.prototype.linkIn = function(label, other) {
    this.pipeline.linkInSync(label, other);
    return this;
};

GremlinJSPipeline.prototype.linkOut = function(label, other) {
    this.pipeline.linkOutSync(label, other);
    return this;
};

GremlinJSPipeline.prototype.map = function() {
    var args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments);
    this.pipeline.mapSync(java.newArray('java.lang.String', args));
    return this;
};

GremlinJSPipeline.prototype.memoize = function() {
    var arg = slice.call(arguments);
    if (arg.length > 1) {
        this.pipeline.memoizeSync(arg[0], arg[1]);
    } else {
        this.pipeline.memoizeSync(arg[0]);
    }
    return this;
};

GremlinJSPipeline.prototype.order = function(closure) {
    if (_isClosure(closure)) {
        this.bindings.putSync('V', this.pipeline);
        this.pipeline = ENGINE.evalSync('V.order' + closure, this.bindings);
    } else {
        this.pipeline.orderSync();
    }
    return this;
};

GremlinJSPipeline.prototype.out = function(){
    var args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments);
    this.pipeline.outSync(java.newArray('java.lang.String', args));
    return this;
};

GremlinJSPipeline.prototype.outE = function() {
    var args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments);
    this.pipeline.outESync(java.newArray('java.lang.String', args));
    return this;
};

GremlinJSPipeline.prototype.outV = function(){
    this.pipeline.outVSync();
    return this;
};

GremlinJSPipeline.prototype.path = function() {
    closure = slice.call(arguments);
    this.bindings.putSync('V', this.pipeline);
    this.pipeline = ENGINE.evalSync('V.path' + closure, this.bindings);
    return this;
};

GremlinJSPipeline.prototype.scatter = function() {
    this.pipeline.scatterSync();
    return this;
};

GremlinJSPipeline.prototype.select = function() {
    var len = 0,
        params = '',
        rest = 0,
        closure;

    if (arguments.length == 0) {
        this.pipeline.selectSync();
    } else if (!_isClosure(arguments[0])) {
        len = arguments[0].length;
        rest = 1;
        if(!len){
            params += '(['
            for (var i=0;i<len;i++){
                params += '"'+arguments[0][i]+'",';
            }
            params = params.substr(0, params.length - 1);
            params += '])'
        }
    }
    closure = slice.call(arguments, rest);
    this.bindings.putSync('V', this.pipeline);
    this.pipeline = ENGINE.evalSync('V.select'+ params + closure, this.bindings);         
    return this;
};

GremlinJSPipeline.prototype.shuffle = function() {
    this.pipeline.shuffleSync();
    return this;
};

GremlinJSPipeline.prototype.transform = function(closure) {
    this.bindings.putSync('V', this.pipeline);
    this.pipeline = ENGINE.evalSync('V.transform' + closure, this.bindings);
    return this;
};

////////////////////
/// FILTER PIPES ///
////////////////////

GremlinJSPipeline.prototype.index = function(idx) {
    this.pipeline.rangeSync(idx, idx);
    return this;
};

GremlinJSPipeline.prototype.range = function(low, high) {
    this.pipeline.rangeSync(low, high);
    return this;
};

GremlinJSPipeline.prototype.and = function(/*final Pipe<E, ?>... pipes*/) {
    var args = slice.call(arguments),
        argsLen = args.length,
        pipes = [];
    for (var i = 0; i < argsLen; i++) {
        push.call(pipes, args[i].pipe());
    };
    this.pipeline.andSync(java.newArray('com.tinkerpop.pipes.Pipe', pipes));
    return this;
};

GremlinJSPipeline.prototype.back = function(step) {
    this.pipeline.backSync(step);
    return this;
};

GremlinJSPipeline.prototype.dedup = function(closure) {
    if (_isClosure(closure)) {
        this.bindings.putSync('V', this.pipeline);
        this.pipeline = ENGINE.evalSync('V.dedup' + closure, this.bindings);
    } else {
        this.pipeline.dedupSync();
    }
    return this;
};

GremlinJSPipeline.prototype.except = function() {
    var args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments),
        argsLen = args.length,
        list;

    if(_isType(args[0], 'java.util.Collection')){
        this.pipeline.exceptSync(args[0]);
    } else {
        list = new ArrayList();
        for (var i = 0; i < argsLen; i++) {
            list.addSync(args[i].next());
        };
        this.pipeline.exceptSync(list);
    }
    return this;
};

GremlinJSPipeline.prototype.filter = function(closure) {
    this.bindings.putSync('V', this.pipeline);
    this.pipeline = ENGINE.evalSync('V.filter' + closure, this.bindings);
    return this;
};

GremlinJSPipeline.prototype.V = function() {
    var args = slice.call(arguments);
    this.pipeline.VSync.apply(this.pipeline, args);
    return this;
};

GremlinJSPipeline.prototype.E = function() {
    var args = slice.call(arguments);
    this.pipeline.ESync.apply(this.pipeline, args);
    return this;
};

GremlinJSPipeline.prototype.has = function() {
    var args = slice.call(arguments);
    if(args.length == 2){
        this.pipeline.hasSync(args[0], _ifIsNull(args[1]));
    } else {
        this.pipeline.hasSync(args[0], args[1], args[2]);
    }
    return this;
};

GremlinJSPipeline.prototype.hasNot = function() {
    var args = slice.call(arguments)

    if(args.length == 2){
        this.pipeline.hasNotSync(args[0], _ifIsNull(args[1]));
    } else {
        this.pipeline.hasNotSync(args[0], args[1], args[2]);
    }
    return this;
};

GremlinJSPipeline.prototype.interval = function(key, startValue, endValue) {
    this.pipeline.intervalSync(key, startValue, endValue);
    return this;
};

GremlinJSPipeline.prototype.or = function(/*final Pipe<E, ?>... pipes*/) {
    var args = slice.call(arguments),
        argsLen = args.length,
        pipes = [];
    for (var i = 0; i < argsLen; i++) {
        push.call(pipes, args[i].pipe());
    };
    this.pipeline.orSync(java.newArray('com.tinkerpop.pipes.Pipe', pipes));
    return this;
};

GremlinJSPipeline.prototype.random = function(prob) {
    this.pipeline.randomSync(prob);
    return this;
};

GremlinJSPipeline.prototype.retain = function(/*final Collection<E> collection*/) {
    var args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments),
        argsLen = args.length,
        list;

    if(_isType(args[0], 'ArrayList')){
        this.pipeline.retainSync(args[0]);
    } else {
        list = new ArrayList();
        for (var i = 0; i < argsLen; i++) {
            list.addSync(args[i].next());
        };
        this.pipeline.retainSync(list);
    }
    return this;
};

GremlinJSPipeline.prototype.retainStep = function(step) {
    this.pipeline.retainStepSync(step);
    return this;
};

GremlinJSPipeline.prototype.simplePath = function() {
    this.pipeline.simplePathSync();
    return this;
};

/////////////////////////
/// SIDE EFFECT PIPES ///
/////////////////////////

GremlinJSPipeline.prototype.aggregate = function(collection, closure) {
    var param = '';

    if (!collection){
        this.pipeline.aggregateSync();
        return this; 
    }
    if (!closure && !_isClosure(collection)) {
        this.pipeline.aggregateSync(collection);
        return this;
    }

    this.bindings.putSync('V', this.pipeline);
    if(_isClosure(collection)){
        closure = collection;
    } else {
        this.bindings.putSync('coll', collection);
        param += '(coll)';
    }
    this.pipeline = ENGINE.evalSync('V.aggregate' + param + closure, this.bindings);
    return this;
};

GremlinJSPipeline.prototype.as = function(name) {
    this.pipeline.asSync(name);
    return this;
};

GremlinJSPipeline.prototype.start = function(obj) {
    this.pipeline.startSync(obj);
    return this;
};

GremlinJSPipeline.prototype.groupBy = function(map, closure) {
    var param = '';

    if (!map){
        throw 'missing arguments';
        return this; 
    }
    if (!closure && !_isClosure(map)) {
        this.pipeline.groupBySync(map);
        return this;
    }

    this.bindings.putSync('V', this.pipeline);
    if(_isClosure(map)){
        closure = map;
    } else {
        this.bindings.putSync('map', map);
        param += '(map)'
    }
    this.pipeline = ENGINE.evalSync('V.groupBy' + param + closure, this.bindings);
    return this;
};

GremlinJSPipeline.prototype.groupCount = function() {
    var rest = 0,
        param = '',
        closure;

    if(!_isClosure(arguments[0])){
        rest = 1;
        this.bindings.put('map', arguments[0]);
        param += '(map)'
    } 

    closure = slice.call(arguments, rest);
    this.bindings.putSync('V', this.pipeline);
    this.pipeline = ENGINE.evalSync('V.groupCount' + param + closure, this.bindings);   
    return this;
};

GremlinJSPipeline.prototype.optional = function(step) {
    this.pipeline.optionalSync(step);
    return this;
};

GremlinJSPipeline.prototype.sideEffect = function(closure) {
    this.bindings.putSync('V', this.pipeline);
    this.pipeline = ENGINE.evalSync('V.sideEffect' + closure, this.bindings);
    return this;
};

GremlinJSPipeline.prototype.store = function(collection, closure) {
    var param = '';

    if (!collection){
        this.pipeline.storeSync();
        return this; 
    }
    if (!closure && !_isClosure(collection)) {
        this.pipeline.storeSync(collection);
        return this;
    }

    this.bindings.putSync('V', this.pipeline);
    if(_isClosure(collection)){
        closure = collection;
    } else {
        this.bindings.putSync('coll', collection);
        param += '(coll)'
    }
    this.pipeline = ENGINE.evalSync('V.store' + param + closure, this.bindings);
    return this;
};

GremlinJSPipeline.prototype.table = function() {
    var argsLen = arguments.length,
        table = argsLen > 0 ? !_isClosure(arguments[0]) : false,
        collection = argsLen > 1 ? !_isClosure(arguments[1]) : false,
        param = '',
        closure;


    if (argsLen == 0){
        this.pipeline.tableSync(); 
        return this;
    }
    if (argsLen == 1 && table) {
        this.pipeline.tableSync(arguments[0]);       
        return this;
    }

    this.bindings.putSync('V', this.pipeline);
    if(collection){
        this.bindings.put('tbl', arguments[0]);
        this.bindings.put('coll', arguments[1]);
        param += '(tbl,coll)';
        closure = slice.call(arguments, 2);
    } else if (table) {
        this.bindings.put('tbl', arguments[0]);
        param += '(tbl)';
        closure = slice.call(arguments, 1);
    } else {
        closure = slice.call(arguments);
    }
    this.pipeline = ENGINE.evalSync('V.table' + param + closure, this.bindings); 
    return this;
};

GremlinJSPipeline.prototype.tree = function(tree, closure) {
    var param = '';

    this.bindings.putSync('V', this.pipeline);
    if(!closure){
        closure = tree;
        tree = '';

    } else {
        engine.getBindingsSync(CONTEXT).put('tree', arguments[0]);
        param += '(tree)';
    }
    return this;
};

//////////////
/// BRANCH ///
//////////////

GremlinJSPipeline.prototype.copySplit = function(/*final Pipe<E, ?>... pipes*/) {
    var args = slice.call(arguments),
        argsLen = args.length,
        pipes = [];
    for (var i = 0; i < argsLen; i++) {
        push.call(pipes, args[i].pipe());
    };
    this.pipeline.copySplitSync(java.newArray('com.tinkerpop.pipes.Pipe', pipes));
    return this;
};

GremlinJSPipeline.prototype.exhaustMerge = function() {
    this.pipeline.exhaustMergeSync();
    return this;
};

GremlinJSPipeline.prototype.fairMerge = function() {
    this.pipeline.fairMergeSync();
    return this;
};

GremlinJSPipeline.prototype.ifThenElse = function(ifClosure, thenClosure, elseClosure) {
    thenClosure = thenClosure || '';
    elseClosure = elseClosure || '';
    
    this.bindings.putSync('V', this.pipeline);
    this.pipeline = ENGINE.evalSync('V.ifThenElse' + ifClosure + thenClosure + elseClosure, this.bindings);
    return this;
};

GremlinJSPipeline.prototype.loop = function(/*step, whileFunction, emitFunction*/) {
    var args = slice.call(arguments),
        rest = 0,
        param = '',
        closureArgs;

    if(!_isClosure(arguments[0])){
        rest = 1;
        param += '(' + arguments[0] + ')'
    } 
    closureArgs = slice.call(arguments, rest).toString().replace(',','');
    this.bindings.putSync('V', this.pipeline);
    this.pipeline = ENGINE.evalSync('V.loop' + param + closureArgs, this.bindings);
    return this;
};

GremlinJSPipeline.prototype.count = function() {
    return this.pipeline.countSync();
};

GremlinJSPipeline.prototype.toJSON = function(callback) {
    _toJSON(this.pipeline, callback);
};

GremlinJSPipeline.prototype.toJSONSync = function() {
    return _toJSONSync(this.pipeline);
};

GremlinJSPipeline.prototype.iterate = function() {
    this.pipeline.iterateSync();
};

GremlinJSPipeline.prototype.iterator = function() {
    return this.pipeline;
};

GremlinJSPipeline.prototype.pipe = function() {
    return this.pipeline;
};

GremlinJSPipeline.prototype.hasNext = function() {
    var args = slice.call(arguments);
    return this.pipeline.hasNextSync.apply(this.pipeline, args);
};

GremlinJSPipeline.prototype.hasNextSync = function() {
    return this.pipeline.hasNextSync();
};

GremlinJSPipeline.prototype.next = function() {
    var args = slice.call(arguments);
    return this.pipeline.next.apply(this.pipeline, args);
};

GremlinJSPipeline.prototype.nextSync = function() {
    var args = slice.call(arguments);
    return this.pipeline.nextSync.apply(this.pipeline, args);
};

GremlinJSPipeline.prototype.toList = function() {
    return this.pipeline.toListSync();
};

GremlinJSPipeline.prototype.toArray = function() {
    return this.pipeline.toListSync().toArraySync();
};

GremlinJSPipeline.prototype.consoleOut = function() {
    return console.log(this.pipeline.toListSync().toString());
};

//Need to look at fill and make Async ???
GremlinJSPipeline.prototype.fill = function(collection) {
    this.pipeline.fillSync(collection);
    return collection;
};

GremlinJSPipeline.prototype.enablePath = function() {
    this.pipeline.enablePathSync();
    return this;
};

GremlinJSPipeline.prototype.optimize = function(optimize) {
    this.pipeline.optimizeSync(optimize);
    return this;
};

GremlinJSPipeline.prototype.size = function() {
    return this.pipeline.sizeSync();
};

GremlinJSPipeline.prototype.reset = function() {
    this.pipeline.resetSync();
};

GremlinJSPipeline.prototype.getCurrentPath = function() {
    return this.pipeline.getCurrentPathSync();
};

GremlinJSPipeline.prototype.getPipes = function() {
    return this.pipeline.getPipesSync();
};

GremlinJSPipeline.prototype.getStarts = function() {
    return this.pipeline.getStartsSync();
};

GremlinJSPipeline.prototype.remove = function(index) {
    if(index){
        return this.pipeline.removeSync(index);
    }
    return this.pipeline.removeSync();
};

GremlinJSPipeline.prototype.get = function(index) {
    return this.pipeline.getSync(index);
};

GremlinJSPipeline.prototype.equals = function(object) {
    return this.pipeline.equalsSync(object);
};


///////////////////////
// JS QUERY WRAPPER ///
///////////////////////

var QueryWrapper = function(query) {
    this.query = query;
};

QueryWrapper.prototype.has = function() {
    var args = slice.call(arguments);
    this.query.hasSync.apply(this.query, args);
    return this;
};

QueryWrapper.prototype.hasNot = function() {
    var args = slice.call(arguments);
    this.query.hasNotSync.apply(this.query, args);
    return this;
};

QueryWrapper.prototype.interval = function() {
    var args = slice.call(arguments);
    this.query.intervalSync.apply(this.query, args);
    return this;
};

QueryWrapper.prototype.limit = function() {
    var args = slice.call(arguments);
    this.query.limitSync.apply(this.query, args);
    return this;
};

QueryWrapper.prototype.vertices = function() {
    var args = slice.call(arguments);
    return this.query.verticesSync.apply(this.query, args);
};

QueryWrapper.prototype.edges = function() {
    var args = slice.call(arguments);
    return this.query.edgesSync.apply(this.query, args);
};

return {
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
    wrap: function(graph) {
        return new GraphWrapper(graph);
    }
};

}
