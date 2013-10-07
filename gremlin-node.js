async = require('async');

(function (definition) {

    definition(exports);

})(function (exports) {

    var java = require("java"),
        fs = require('fs'),
        path = require('path');

    java.options.push('-Djava.awt.headless=true');

    function isJarFile(element, index, array){
        return element.split('.').slice(-1) == 'jar';
    }

    function readdirSyncRecursive (baseDir) {
        baseDir = baseDir.replace(/\/$/, '');
     
        var readdirSyncRecursive = function(baseDir) {
            var files = [],
                curFiles,
                nextDirs,
                isDir = function(fname){
                    return fs.lstatSync(path.join(baseDir, fname) ).isDirectory();
                },
                prependBaseDir = function(fname){
                    return path.join(baseDir, fname);
                };
     
            curFiles = fs.readdirSync(baseDir);
            nextDirs = curFiles.filter(isDir);
            curFiles = curFiles.map(prependBaseDir);
     
            files = files.concat( curFiles );
     
            while (nextDirs.length) {
                files = files.concat( readdirSyncRecursive(path.join(baseDir, nextDirs.shift()) ) );
            }
     
            return files;
        };
     
        // convert absolute paths to relative
        var fileList = readdirSyncRecursive(baseDir).map(function(val){
            return path.relative(baseDir, val);
        });
     
        return fileList.filter(isJarFile);
    };

    //default lib dir
    java.classpath.push(path.join(__dirname , "lib"));
    
    //add jar files
    var jar = readdirSyncRecursive(__dirname);
    for(var i=0,l=jar.length; i<l; i++){
        java.classpath.push(path.join(__dirname, jar[i]));
    }

    var GremlinGroovyScriptEngine = java.import("com.tinkerpop.gremlin.groovy.jsr223.GremlinGroovyScriptEngine");
    var GremlinPipeline = java.import("com.entrendipity.gremlin.javascript.GremlinJSPipeline");

    var JSONResultConverter = java.import("com.tinkerpop.rexster.gremlin.converter.JSONResultConverter");
    var JSONObject = java.import('org.json.JSONObject');
    var JSONArray = java.import('org.json.JSONArray');

    var Class = java.import("java.lang.Class");
    var ArrayList = java.import('java.util.ArrayList');
    var HashMap = java.import('java.util.HashMap');
    var Table = java.import("com.tinkerpop.pipes.util.structures.Table");
    var Tree = java.import("com.tinkerpop.pipes.util.structures.Tree");

    var Direction = java.import("com.tinkerpop.blueprints.Direction");
    var Tokens = java.import("com.tinkerpop.gremlin.Tokens$T");
    var Compare = java.import("com.tinkerpop.blueprints.Query$Compare");

    var toString = Object.prototype.toString,
        push = Array.prototype.push,
        slice = Array.prototype.slice;

    var closureRegex = /^\{.*\}$/;

    var ClassTypes = {
        'String': { 'class': Class.forNameSync("java.lang.String") },
        'Vertex': { 'class': GremlinPipeline.getVertexTypeClassSync() },
        'Edge': { 'class': GremlinPipeline.getEdgeTypeClassSync() },
        'Byte': { 'class': Class.forNameSync("java.lang.Byte") },
        'Character': { 'class': Class.forNameSync("java.lang.Character") },
        'Double': { 'class': Class.forNameSync("java.lang.Double") },
        'Float': { 'class': Class.forNameSync("java.lang.Float") },
        'Integer': { 'class': Class.forNameSync("java.lang.Integer") },
        'Long': { 'class': Class.forNameSync("java.lang.Long") },
        'Short': { 'class': Class.forNameSync("java.lang.Short") },
        'Number': { 'class': Class.forNameSync("java.lang.Number") },
        'BigDecimal': { 'class': Class.forNameSync("java.math.BigDecimal") },
        'BigInteger': { 'class': Class.forNameSync("java.math.BigInteger") }
    }

    var tempmap = new HashMap();
    tempmap.constructor.prototype.toJSON = function() {
        this.removeSync(null);
        return JSON.parse(JSONObject(this).toStringSync());
    };
    tempmap.constructor.prototype.toJSONSafe = function() {
        return this.cloneSync().toJSON();
    };
    var temparray = new ArrayList();
    temparray.constructor.prototype.toJSON = function() {
        return JSON.parse(JSONArray(this).toStringSync());
    };


    var ENGINE = new GremlinGroovyScriptEngine();
    var CONTEXT = java.getStaticFieldValue("javax.script.ScriptContext", "ENGINE_SCOPE");
    var NULL = java.callStaticMethodSync("org.codehaus.groovy.runtime.NullObject","getNullObject");

    var MAX_VALUE = java.newInstanceSync("java.lang.Long", 2147483647);
    var MIN_VALUE = 0;

    var _JSON = new JSONResultConverter(null,MIN_VALUE,MAX_VALUE, null);

    var _db;

    function _isClosure(val) {
        return _isString(val) && val.search(closureRegex) > -1;   
    }

    function _isFunction(o) {
        return toString.call(o) === '[object Function]';
    };

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
    };

    function _isType(o, typeName){
        var type;
        try {
                type = o.getClassSync().toString().split('.').slice(-1)[0];
            } catch(err) {
                return false;
            }
            return type === typeName;
    }

    function GremlinJSPipeline(_db) {
        var TinkerGraphFactory;
        if(!_db){
            console.log('No database set. Using mock TinkerGraph.');
            TinkerGraphFactory = java.import("com.tinkerpop.blueprints.impls.tg.TinkerGraphFactory");
            this.graph = TinkerGraphFactory.createTinkerGraphSync(); 
        } else {
            this.graph = _db;
        }
        this.engine = ENGINE;
        this.ctx = CONTEXT;
        this.engine.getBindingsSync(this.ctx).putSync("g", this.graph);

        this.gremlinPipeline = {};
        this.Type = 'GremlinJSPipeline';
    }

    /********************** BLUEPRINT GRAPHS ******************************************/

    exports.java = java;
    exports.GremlinJSPipeline = GremlinJSPipeline;
    exports.ClassTypes = ClassTypes;
    exports.Tokens = Tokens;
    exports.Compare = Compare;
    exports.Direction = Direction;
    exports.ArrayList = ArrayList;
    exports.HashMap = HashMap;
    exports.Table = Table;
    exports.Tree = Tree;

    exports.setGraph = function(db) {
        _db = db;
    };

    exports.newTransaction = function() {
        return new Transaction(_db.newTransactionSync());
    }

    var Transaction = function(_db) {
        this._db = _db;
    }

    Transaction.prototype.addVertex = function(id, callback) {
        this._db.addVertex(id, callback);
    };

    Transaction.prototype.addEdge = function(id, from, to, label, callback) {
        this._db.addEdge(id, from, to, label, callback);
    };

    Transaction.prototype.v = function(_, callback){
        var gremlin = new GremlinJSPipeline(this._db),
            list = new ArrayList(),
            args = [],
            k,
            cb;

        if (_isArray(arguments[0])) {
            args = arguments[0];
            cb = callback;
        } else {
            for (k in arguments) {
                args.push(arguments[k]);
            }
            cb = args.pop()
        }
        async.eachSeries(
            args,
            function(item, callback) {
                if (typeof item === 'string' && item.substring(0, 2) === 'v[') {
                    item = item.substring(2, item.length - 1);
                }
                gremlin.graph.getVertex(item, function(err, vertex) {
                    if (err) {
                        return callback(err);
                    }
                    list.addSync(vertex);
                    return callback();
                });
            },
            function(err) {
                gremlin.gremlinPipeline = new GremlinPipeline(list);
                return cb(err, gremlin);
            }
        );
    }

    Transaction.prototype.e = function(_, callback){
        var gremlin = new GremlinJSPipeline(this._db),
            list = new ArrayList(),
            args = [],
            k,
            cb;
        if (_isArray(arguments[0])) {
            args = arguments[0];
            cb = callback;
        } else {
            for (k in arguments) {
                args.push(arguments[k]);
            }
            cb = args.pop()
        }
        async.eachSeries(
            args,
            function(item, callback) {
                gremlin.graph.getEdge(item, function(err, edge) {
                    if (err) {
                        return callback(err);
                    }
                    list.addSync(edge);
                    callback();
                });
            },
            function(err) {
                gremlin.gremlinPipeline = new GremlinPipeline(list);
                cb(err, gremlin);
            }
        );
    }

    Transaction.prototype.V = function(key, value, callback){
        var gremlin = new GremlinJSPipeline(this._db),
            args = [],
            callback,
            value,
            key,
            k,
            o = {};
        for (k in arguments) {
            args.push(arguments[k]);
        }
        callback = args.pop();
        value = args.pop();
        key = args.pop();
        if (key && _isObject(key)) {
            o = key;
            key = null;
            for (k in o) {
                if (key.hasOwnProperty(k)) {
                    key = k;
                    value = o[k];
                    break;
                }
            }
        }
        if (!key) {
            gremlin.graph.querySync().vertices(function(err, vertices) {
                if (err) {
                    return callback(err);
                }
                gremlin.gremlinPipeline = new GremlinPipeline(vertices);
                return callback(null, gremlin);
            });
        } else {
            gremlin.graph.querySync().hasSync(key, value).vertices(function(err, vertices) {
                if (err) {
                    return callback(err);
                }
                gremlin.gremlinPipeline = new GremlinPipeline(vertices);
                return callback(null, gremlin);
            });
        }
    }

    Transaction.prototype.E = function(key, value, callback){
        var gremlin = new GremlinJSPipeline(this._db),
            args = [],
            callback,
            value,
            key,
            k,
            o = {};
        for (k in arguments) {
            args.push(arguments[k]);
        }
        callback = args.pop();
        value = args.pop();
        key = args.pop();
        if (key && _isObject(key)) {
            o = key;
            key = null;
            for (k in o){
                if (key.hasOwnProperty(k)) {
                    key = k;
                    value = o[k];
                    break;
                }
            }
        }
        if (!key) {
            gremlin.graph.querySync().edges(function(err, edges) {
                if (err) {
                    return callback(err);
                }
                gremlin.gremlinPipeline = new GremlinPipeline(edges);
                return callback(null, gremlin);
            });
        } else {
            gremlin.graph.getEdges(key, value, function(err, edges) {
                if (err) {
                    return callback(err);
                }
                gremlin.gremlinPipeline = new GremlinPipeline(edges);
                return callback(err, gremlin);
            });
        }
    }

    Transaction.prototype.rollback = function(callback) {
        this._db.rollback(callback);
    }

    Transaction.prototype.commit = function(callback) {
        this._db.commit(callback);
    }

    ///////////////////////
    /// TRANSFORM PIPES ///
    ///////////////////////
    Transaction.prototype._ = function() {
        var gremlin = new GremlinJSPipeline(this._db);
        gremlin.gremlinPipeline = new GremlinPipeline();
        gremlin.gremlinPipeline._Sync();
        return gremlin;

    }

    Transaction.prototype.start = function(obj) {
        var gremlin = new GremlinJSPipeline(this._db);
        gremlin.gremlinPipeline = new GremlinPipeline(obj);
        return gremlin;
    }

    GremlinJSPipeline.prototype.printPipe = function(){
      console.log(this.gremlinPipeline.toString())
      return this;
    }

    GremlinJSPipeline.prototype.step = function(closure) {
        if(_isClosure(closure)){
            this.engine.getBindingsSync(this.ctx).putSync("V", this.gremlinPipeline);
            this.gremlinPipeline = this.engine.evalSync("V.step" + closure);
        } else {
            this.gremlinPipeline.stepSync(java.newInstanceSync("com.tinkerpop.pipes.Pipe", closure.pipe()));
        }
        return this;
    }

    GremlinJSPipeline.prototype.both = function() {
        var args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments);
        this.gremlinPipeline.bothSync(java.newArray("java.lang.String", args));
        return this;
    }
    
    GremlinJSPipeline.prototype.bothE = function() {
        var args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments);
        this.gremlinPipeline.bothESync(java.newArray("java.lang.String", args));
        return this;
    }

    GremlinJSPipeline.prototype.bothV = function() {
        this.gremlinPipeline.bothVSync();
        return this;
    }

    GremlinJSPipeline.prototype.cap = function() {
        this.gremlinPipeline.capSync();
        return this;
    }

    GremlinJSPipeline.prototype.gather = function (closure) {
        if (_isClosure(closure)) {
            this.engine.getBindingsSync(this.ctx).putSync("V", this.gremlinPipeline);
            this.gremlinPipeline = this.engine.evalSync('V.gather' + closure );
        } else {
            this.gremlinPipeline.gatherSync();
        }
        return this;
    }

    GremlinJSPipeline.prototype.id = function() {
        this.gremlinPipeline.idSync();
        return this;
    }

    GremlinJSPipeline.prototype.in = function() {
        var args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments);
        this.gremlinPipeline.inSync(java.newArray("java.lang.String", args));
        return this;
    }

    GremlinJSPipeline.prototype.inE = function() {
        var args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments);
        this.gremlinPipeline.inESync(java.newArray("java.lang.String", args));
        return this;
    }

    GremlinJSPipeline.prototype.inV = function() {
        this.gremlinPipeline.inVSync();
        return this;
    }

    GremlinJSPipeline.prototype.property = function (key) {
        this.gremlinPipeline.propertySync(key);
        return this;
    }

    GremlinJSPipeline.prototype.label = function() {
        this.gremlinPipeline.labelSync();
        return this;
    }

    GremlinJSPipeline.prototype.linkBoth = function(label, other) {
        this.gremlinPipeline.linkBothSync(label, other);
        return this;
    }

    GremlinJSPipeline.prototype.linkIn = function(label, other) {
        this.gremlinPipeline.linkInSync(label, other);
        return this;
    }

    GremlinJSPipeline.prototype.linkOut = function(label, other) {
        this.gremlinPipeline.linkOutSync(label, other);
        return this;
    }

    GremlinJSPipeline.prototype.map = function() {
        var args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments);
        this.gremlinPipeline.mapSync(java.newArray("java.lang.String", args));
        return this;
    }

    GremlinJSPipeline.prototype.memoize = function() {
        var arg = slice.call(arguments);
        if (arg.length > 1) {
            this.gremlinPipeline.memoizeSync(arg[0], arg[1]);
        } else {
            this.gremlinPipeline.memoizeSync(arg[0]);
        }
        return this;
    }

    GremlinJSPipeline.prototype.order = function(closure) {
        if (_isClosure(closure)) {
            this.engine.getBindingsSync(this.ctx).putSync("V", this.gremlinPipeline);
            this.gremlinPipeline = this.engine.evalSync("V.order" + closure);
        } else {
            this.gremlinPipeline.orderSync();
        }
        return this;
    }

    GremlinJSPipeline.prototype.out = function (){
        var args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments);
        this.gremlinPipeline.outSync(java.newArray("java.lang.String", args));
        return this;
    }

    GremlinJSPipeline.prototype.outE = function() {
        var args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments);
        this.gremlinPipeline.outESync(java.newArray("java.lang.String", args));
        return this;
    }

    GremlinJSPipeline.prototype.outV = function (){
        this.gremlinPipeline.outVSync();
        return this;
    }

    GremlinJSPipeline.prototype.path = function() {
        closure = slice.call(arguments);
        this.engine.getBindingsSync(this.ctx).putSync("V", this.gremlinPipeline);
        this.gremlinPipeline = this.engine.evalSync("V.path" + closure);
        return this;
    }

    GremlinJSPipeline.prototype.scatter = function() {
        this.gremlinPipeline.scatterSync();
        return this;
    }

    GremlinJSPipeline.prototype.select = function () {
        var len = 0,
            params = '',
            rest = 0,
            closure;

        if (arguments.length == 0) {
            this.gremlinPipeline.selectSync();
        } else if (!_isClosure(arguments[0])) {
            len = arguments[0].length;
            rest = 1;
            if(!len){
                params += "(["
                for (var i=0;i<len;i++){
                    params += '"'+arguments[0][i]+'",';
                }
                params = params.substr(0, params.length - 1);
                params += "])"
            }
        }
        closure = slice.call(arguments, rest);
        this.engine.getBindingsSync(this.ctx).putSync("V", this.gremlinPipeline);
        this.gremlinPipeline = this.engine.evalSync("V.select"+ params + closure);         
        return this;
    }

    GremlinJSPipeline.prototype.shuffle = function() {
        this.gremlinPipeline.shuffleSync();
        return this;
    }

    GremlinJSPipeline.prototype.transform = function(closure) {
        this.engine.getBindingsSync(this.ctx).putSync("V", this.gremlinPipeline);
        this.gremlinPipeline = this.engine.evalSync("V.transform" + closure);
        return this;
    }    

    ////////////////////
    /// FILTER PIPES ///
    ////////////////////

    GremlinJSPipeline.prototype.index = function(idx) {
        this.gremlinPipeline.rangeSync(idx, idx);
        return this;
    }

    GremlinJSPipeline.prototype.range = function(low, high) {
        this.gremlinPipeline.rangeSync(low, high);
        return this;
    }

    GremlinJSPipeline.prototype.and = function(/*final Pipe<E, ?>... pipes*/) {
        var args = slice.call(arguments),
            argsLen = args.length,
            pipes = [];
        for (var i = 0; i < argsLen; i++) {
            push.call(pipes, args[i].pipe());
        };
        this.gremlinPipeline.andSync(java.newArray("com.tinkerpop.pipes.Pipe", pipes));
        return this;
    }

    GremlinJSPipeline.prototype.back = function(step) {
        this.gremlinPipeline.backSync(step);
        return this;
    }

    GremlinJSPipeline.prototype.dedup = function(closure) {
        if (_isClosure(closure)) {
            this.engine.getBindingsSync(this.ctx).putSync("V", this.gremlinPipeline);
            this.gremlinPipeline = this.engine.evalSync("V.dedup" + closure);
        } else {
            this.gremlinPipeline.dedupSync();
        }
        return this;
    }

    GremlinJSPipeline.prototype.except = function() {
        var args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments),
            argsLen = args.length,
            list;

        if(_isType(args[0], 'ArrayList')){
            this.gremlinPipeline.exceptSync(args[0]);
        } else {
            list = new ArrayList();
            for (var i = 0; i < argsLen; i++) {
                list.addSync(args[i].next());
            };
            this.gremlinPipeline.exceptSync(list);
        }
        return this;
    }

    GremlinJSPipeline.prototype.filter = function(closure) {
        this.engine.getBindingsSync(this.ctx).putSync("V", this.gremlinPipeline);
        this.gremlinPipeline = this.engine.evalSync("V.filter" + closure);
        return this;
    }

    GremlinJSPipeline.prototype.has = function() {
        var args = slice.call(arguments);

        if(args.length == 2){
            this.gremlinPipeline.hasSync(args[0], _ifIsNull(args[1]));    
        } else {
            this.gremlinPipeline.hasSync(args[0], args[1], args[2]);
        }
        return this;
    }

    GremlinJSPipeline.prototype.hasNot = function() {
        var args = slice.call(arguments)

        if(args.length == 2){
            this.gremlinPipeline.hasNotSync(args[0], _ifIsNull(args[1]));    
        } else {
            this.gremlinPipeline.hasNotSync(args[0], args[1], args[2]);
        }
        return this;
    }

    GremlinJSPipeline.prototype.interval = function(key, startValue, endValue) {
        this.gremlinPipeline.intervalSync(key, startValue, endValue);
        return this;
    }

    GremlinJSPipeline.prototype.or = function(/*final Pipe<E, ?>... pipes*/) {
        var args = slice.call(arguments),
            argsLen = args.length,
            pipes = [];
        for (var i = 0; i < argsLen; i++) {
            push.call(pipes, args[i].pipe());
        };
        this.gremlinPipeline.orSync(java.newArray("com.tinkerpop.pipes.Pipe", pipes));
        return this;
    }

    GremlinJSPipeline.prototype.random = function(prob) {
        this.gremlinPipeline.randomSync(prob);
        return this;
    }

    GremlinJSPipeline.prototype.retain = function(/*final Collection<E> collection*/) {
        var args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments),
            argsLen = args.length,
            list;

        if(_isType(args[0], 'ArrayList')){
            this.gremlinPipeline.retainSync(args[0]);
        } else {
            list = new ArrayList();
            for (var i = 0; i < argsLen; i++) {
                list.addSync(args[i].next());
            };
            this.gremlinPipeline.retainSync(list);
        }
        return this;
    }

    GremlinJSPipeline.prototype.retainStep = function (step) {
        this.gremlinPipeline.retainStepSync(step);
        return this;
    }

    GremlinJSPipeline.prototype.simplePath = function() {
        this.gremlinPipeline.simplePathSync();
        return this;
    }

    /////////////////////////
    /// SIDE EFFECT PIPES ///
    /////////////////////////

    GremlinJSPipeline.prototype.aggregate = function(collection, closure) {
        var param = '';

        if (!collection){
            this.gremlinPipeline.aggregateSync();
            return this; 
        }
        if (!closure && !_isClosure(collection)) {
            this.gremlinPipeline.aggregateSync(collection);
            return this;
        }

        this.engine.getBindingsSync(this.ctx).putSync("V", this.gremlinPipeline);
        if(_isClosure(collection)){
            closure = collection;
        } else {
            this.engine.getBindingsSync(this.ctx).putSync("coll", collection);
            param += "(coll)"
        }
        this.gremlinPipeline = this.engine.evalSync("V.aggregate" + param + closure);
        return this;
    }

    GremlinJSPipeline.prototype.as = function(name) {
        this.gremlinPipeline.asSync(name);
        return this;
    }

    GremlinJSPipeline.prototype.groupBy = function (map, closure) {
        var param = '';

        if (!map){
            throw "missing arguments";
            return this; 
        }
        if (!closure && !_isClosure(map)) {
            this.gremlinPipeline.groupBySync(map);
            return this;
        }

        this.engine.getBindingsSync(this.ctx).putSync("V", this.gremlinPipeline);
        if(_isClosure(map)){
            closure = map;
        } else {
            this.engine.getBindingsSync(this.ctx).putSync("map", map);
            param += "(map)"
        }
        this.gremlinPipeline = this.engine.evalSync("V.groupBy" + param + closure);
        return this;
    }

    GremlinJSPipeline.prototype.groupCount = function() {
        var rest = 0,
            param = '',
            closure;

        if(!_isClosure(arguments[0])){
            rest = 1;
            this.engine.getBindingsSync(this.ctx).put("map", arguments[0]);
            param += "(map)"
        } 

        closure = slice.call(arguments, rest);
        this.engine.getBindingsSync(this.ctx).putSync("V", this.gremlinPipeline);
        this.gremlinPipeline = this.engine.evalSync("V.groupCount" + param + closure);   
        return this;
    }

    GremlinJSPipeline.prototype.optional = function(step) {
        this.gremlinPipeline.optionalSync(step);
        return this;
    }

    GremlinJSPipeline.prototype.sideEffect = function(closure) {
        this.engine.getBindingsSync(this.ctx).putSync("V", this.gremlinPipeline);
        this.gremlinPipeline = this.engine.evalSync("V.sideEffect" + closure);
        return this;
    }

    GremlinJSPipeline.prototype.store = function(collection, closure) {
        var param = '';

        if (!collection){
            this.gremlinPipeline.storeSync();
            return this; 
        }
        if (!closure && !_isClosure(collection)) {
            this.gremlinPipeline.storeSync(collection);
            return this;
        }

        this.engine.getBindingsSync(this.ctx).putSync("V", this.gremlinPipeline);
        if(_isClosure(collection)){
            closure = collection;
        } else {
            this.engine.getBindingsSync(this.ctx).putSync("coll", collection);
            param += "(coll)"
        }
        this.gremlinPipeline = this.engine.evalSync("V.store" + param + closure);
        return this;
    }

    GremlinJSPipeline.prototype.table = function() {
        var argsLen = arguments.length,
            table = argsLen > 0 ? !_isClosure(arguments[0]) : false,
            collection = argsLen > 1 ? !_isClosure(arguments[1]) : false,
            param = '',
            closure;


        if (argsLen == 0){
            this.gremlinPipeline.tableSync(); 
            return this;
        }
        if (argsLen == 1 && table) {
            this.gremlinPipeline.tableSync(arguments[0]);       
            return this;
        }

        this.engine.getBindingsSync(this.ctx).putSync("V", this.gremlinPipeline);
        if(collection){
            this.engine.getBindingsSync(this.ctx).put("tbl", arguments[0]);
            this.engine.getBindingsSync(this.ctx).put("coll", arguments[1]);
            param += "(tbl,coll)";
            closure = slice.call(arguments, 2);
        } else if (table) {
            this.engine.getBindingsSync(this.ctx).put("tbl", arguments[0]);
            param += "(tbl)";
            closure = slice.call(arguments, 1);
        } else {
            closure = slice.call(arguments);
        }
        this.gremlinPipeline = this.engine.evalSync("V.table" + param + closure); 
        return this;
    }

    GremlinJSPipeline.prototype.tree = function(tree, closure) {
        var param = '';

        this.engine.getBindingsSync(this.ctx).putSync("V", this.gremlinPipeline);
        if(!closure){
            closure = tree;
            tree = '';

        } else {
            engine.getBindingsSync(this.ctx).put("tree", arguments[0]);
            param += "(tree)";
        }
        return this;    
    }

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
        this.gremlinPipeline.copySplitSync(java.newArray("com.tinkerpop.pipes.Pipe", pipes));
        return this;
    }

    GremlinJSPipeline.prototype.exhaustMerge = function() {
        this.gremlinPipeline.exhaustMergeSync();
        return this;
    }

    GremlinJSPipeline.prototype.fairMerge = function() {
        this.gremlinPipeline.fairMergeSync();
        return this;
    }

    GremlinJSPipeline.prototype.ifThenElse = function(ifClosure, thenClosure, elseClosure) {
        thenClosure = thenClosure || '';
        elseClosure = elseClosure || '';
        
        this.engine.getBindingsSync(this.ctx).putSync("V", this.gremlinPipeline);
        this.gremlinPipeline = this.engine.evalSync("V.ifThenElse" + ifClosure + thenClosure + elseClosure);
        return this;
    }

    GremlinJSPipeline.prototype.loop = function(/*step, whileFunction, emitFunction*/) {
        var args = slice.call(arguments),
            rest = 0,
            param = '',
            closureArgs;

        if(!_isClosure(arguments[0])){
            rest = 1;
            param += "(" + arguments[0] + ")"
        } 
        closureArgs = slice.call(arguments, rest).toString().replace(',','');
        this.engine.getBindingsSync(this.ctx).putSync("V", this.gremlinPipeline);
        this.gremlinPipeline = this.engine.evalSync("V.loop" + param + closureArgs);
        return this;
    }

    GremlinJSPipeline.prototype.count = function(callback) {
        this.gremlinPipeline.count(callback);
    }

    GremlinJSPipeline.prototype.toJSON = function(callback) {
        _JSON.convert(this.gremlinPipeline, function(err, data) {
            if (err) {
                return callback(err);
            }
            callback(null, JSON.parse(data.toString()));
        });
    }
    
    GremlinJSPipeline.prototype.iterate = function() {
        this.gremlinPipeline.iterateSync();
    }

    GremlinJSPipeline.prototype.iterator = function() {
        return this.gremlinPipeline;
    }

    GremlinJSPipeline.prototype.pipe = function() {
        return this.gremlinPipeline;
    }

    GremlinJSPipeline.prototype.next = function(number, callback){
        if(callback){
            return this.gremlinPipeline.next(number, callback);
        } else {
            // first parameter is callback
            callback = number;
            return this.gremlinPipeline.next(callback);
        }
    }

    GremlinJSPipeline.prototype.toList = function(callback){
        this.gremlinPipeline.toList(callback);
    }

    GremlinJSPipeline.prototype.toArray = function(callback){
        this.gremlinPipeline.toList(function(err, data) {
            if (err) {
                return callback(err);
            }
            data.toArray(callback);
        });
    }

    GremlinJSPipeline.prototype.consoleOut = function(){
        return console.log(this.gremlinPipeline.toListSync().toString());
    }
    
    GremlinJSPipeline.prototype.fill = function(collection, callback) {
        this.gremlinPipeline.fill(collection, function(err, data) {
            callback(err, collection); // or maybe data should be returned?
        });
    }

    GremlinJSPipeline.prototype.enablePath = function() {
        this.gremlinPipeline.enablePathSync();
        return this;
    }

    GremlinJSPipeline.prototype.optimize = function(optimize) {
        this.gremlinPipeline.optimizeSync(optimize);
        return this;
    }

    GremlinJSPipeline.prototype.size = function(callback) {
        this.gremlinPipeline.size(callback);
    }

    GremlinJSPipeline.prototype.reset = function(callback) {
        this.gremlinPipeline.reset(callback);
    }
    
    GremlinJSPipeline.prototype.hasNext = function(callback) {
        this.gremlinPipeline.hasNext(callback);
    }

    GremlinJSPipeline.prototype.getCurrentPath = function(callback) {
        this.gremlinPipeline.getCurrentPath(callback);
    }

    GremlinJSPipeline.prototype.getPipes = function(callback) {
        this.gremlinPipeline.getPipes(callback);
    }

    GremlinJSPipeline.prototype.getStarts = function(callback) {
        this.gremlinPipeline.getStarts(callback);
    }

    GremlinJSPipeline.prototype.remove = function(index, callback) {
        if(callback){
            return this.gremlinPipeline.remove(index, callback);
        } else {
            // first param is callback
            callback = index;
            return this.gremlinPipeline.remove(callback);
        }
    }

    GremlinJSPipeline.prototype.get = function(index, callback) {
        this.gremlinPipeline.get(index, callback);
    }

    GremlinJSPipeline.prototype.equals = function(object, callback) {
        this.gremlinPipeline.equals(object, callback);
    }
});
