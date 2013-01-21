(function (definition) {

    definition(exports);

})(function (exports) {

    var java = require("java");
    java.classpath.push("./lib/antlr-2.7.7.jar");
    java.classpath.push("./lib/asm-3.2.jar");
    java.classpath.push("./lib/asm-analysis-3.2.jar");
    java.classpath.push("./lib/asm-commons-3.2.jar");
    java.classpath.push("./lib/asm-tree-3.2.jar");
    java.classpath.push("./lib/asm-util-3.2.jar");
    java.classpath.push("./lib/gremlin-groovy-2.3.0-SNAPSHOT.jar");
    java.classpath.push("./lib/groovy-1.8.8.jar");
    java.classpath.push("./lib/gremlin-java-2.3.0-SNAPSHOT.jar");
    java.classpath.push("./lib/blueprints-core-2.3.0-SNAPSHOT.jar");
    java.classpath.push("./lib/pipes-2.3.0-SNAPSHOT.jar");
    java.classpath.push("./lib");






    /*
        I think I will have a JSON config to set up what and where the database is.
    */
    /*OrientDB*/
    if(true){
        java.classpath.push("./lib/orientdb/orient-commons-1.4.0-SNAPSHOT.jar");
        java.classpath.push("./lib/orientdb/orientdb-client-1.4.0-SNAPSHOT.jar");
        java.classpath.push("./lib/orientdb/orientdb-core-1.4.0-SNAPSHOT.jar");
        java.classpath.push("./lib/orientdb/orientdb-distributed-1.4.0-SNAPSHOT.jar");
        java.classpath.push("./lib/orientdb/orientdb-enterprise-1.4.0-SNAPSHOT.jar");
        java.classpath.push("./lib/orientdb/orientdb-graphdb-1.4.0-SNAPSHOT.jar");
        java.classpath.push("./lib/orientdb/orientdb-nativeos-1.4.0-SNAPSHOT.jar");
        java.classpath.push("./lib/orientdb/orientdb-object-1.4.0-SNAPSHOT.jar");
        java.classpath.push("./lib/orientdb/orientdb-server-1.4.0-SNAPSHOT.jar");
        java.classpath.push("./lib/orientdb/orientdb-tools-1.4.0-SNAPSHOT.jar");
        java.classpath.push("./lib/orientdb/blueprints-orient-graph-2.3.0-SNAPSHOT.jar");
        java.classpath.push("./lib/orientdb/activation-1.1.jar");
        java.classpath.push("./lib/orientdb/hibernate-jpa-2.0-api-1.0.0.Final.jar");
        java.classpath.push("./lib/orientdb/javassist-3.16.1-GA.jar");
        java.classpath.push("./lib/orientdb/jna-3.4.0.jar");
        java.classpath.push("./lib/orientdb/mail-1.4.jar");
        java.classpath.push("./lib/orientdb/platform-3.4.0.jar");
        var OrientGraph = java.import("com.tinkerpop.blueprints.impls.orient.OrientGraph");

    }

    var TinkerGraph = java.import("com.tinkerpop.blueprints.impls.tg.TinkerGraph");
    var TinkerGraphFactory = java.import("com.tinkerpop.blueprints.impls.tg.TinkerGraphFactory");

    var GremlinGroovyScriptEngine = java.import("com.tinkerpop.gremlin.groovy.jsr223.GremlinGroovyScriptEngine");
    var GremlinPipeline = java.import("com.entrendipity.gremlin.javascript.GremlinJSPipeline");
    
    
    var ArrayList = java.import('java.util.ArrayList');
    var HashMap = java.import('java.util.HashMap');
    var Table = java.import("com.tinkerpop.pipes.util.structures.Table");
    var Tree = java.import("com.tinkerpop.pipes.util.structures.Tree");

    var toString = Object.prototype.toString,
        push = Array.prototype.push,
        slice = Array.prototype.slice;


    var closureRegex = /^\{\[?\s*(\bit\.(\w|\W)*|\bit)\s*\]?\}$/;

    var Tokens = {
        'T.gt': 'gt',
        'T.lt': 'lt',
        'T.eq': 'eq',
        'T.gte': 'gte',
        'T.lte': 'lte',
        'T.neq': 'neq'
    }        

    exports.ArrayList = ArrayList;
    exports.HashMap = HashMap;
    exports.Table = Table;
    exports.Tree = Tree;

    //var ScriptEngineFactory = new GremlinGroovyScriptEngineFactory();
    var ENGINE = new GremlinGroovyScriptEngine();// ScriptEngineFactory.getScriptEngineSync();
    var CONTEXT = java.getStaticFieldValue("javax.script.ScriptContext", "ENGINE_SCOPE");

    //Maybe pass in graph type specified in a options obj
    //then call the relevant graph impl constructor
    function GremlinJSPipeline(db) {
        

        if(!db){
            //console.log('No database set. Using mock TinkerGraph.');
            this.graph = java.callStaticMethodSync("com.tinkerpop.blueprints.impls.tg.TinkerGraphFactory", "createTinkerGraph");  
        } else {
            this.graph = db;
        }

        this.engine = ENGINE;
        this.ctx = CONTEXT;
        this.engine.getBindingsSync(this.ctx).putSync("g", this.graph);

        this.gremlinPipeline = {};
        this.Type = 'GremlinJSPipeline';
    }

    var _db;
    exports.tg = function(location) {
        if (!location) {
            _db = java.callStaticMethodSync("com.tinkerpop.blueprints.impls.tg.TinkerGraphFactory", "createTinkerGraph");
        } else {
            _db = new TinkerGraph(location);
        }
    } 

    exports.orientDB = function(location) {
        if (!location) {
            throw "No database specified"
        } else {
            _db = new OrientGraph(location);
        }
    }


    exports.v = function(){
        var gremlin = new GremlinJSPipeline(_db),
            args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments),
            argsLen = args.length,
            list = new ArrayList();
        for (var i = 0; i < argsLen; i++) {
            list.addSync(gremlin.graph.getVertexSync(args[i]));
        };
        gremlin.gremlinPipeline = new GremlinPipeline(list);
        return gremlin;
    }

    exports.e = function(){
        var gremlin = new GremlinJSPipeline(_db),
            args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments),
            argsLen = args.length,
            list = new ArrayList();
        for (var i = 0; i < argsLen; i++) {
            list.addSync(gremlin.graph.getEdgeSync(args[i]));
        };
        gremlin.gremlinPipeline = new GremlinPipeline(list);
        return gremlin;
    }

    function _isFunction(o) {
        return toString.call(o) === '[object Function]';
    };

    function _isClosure(val) {
        return _isString(val) && val.search(closureRegex) > -1;   
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

    function _isType(o, typeName){
        var type;
        try {
                type = o.getClassSync().toString().split('.').slice(-1)[0];
            } catch(err) {
                return false;
            }
            return type === typeName;
    }
    ///////////////////////
    /// TRANSFORM PIPES ///
    ///////////////////////

    exports._ = function() {
        var gremlin = new GremlinJSPipeline(_db);
        gremlin.gremlinPipeline = new GremlinPipeline();
        gremlin.gremlinPipeline._Sync();
        return gremlin;

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

    exports.E = function(key, value){
        var gremlin = new GremlinJSPipeline(_db),
            k,
            o = {};
        if (!key) {
            gremlin.gremlinPipeline = new GremlinPipeline(gremlin.graph.getEdgesSync());    
        } else {
            if (_isObject(key)) {
                o = key;
                for(k in o){
                    if(key.hasOwnProperty(k)){
                        key = k;
                        value = o[k];
                    }
                }
            }
            gremlin.gremlinPipeline = new GremlinPipeline(gremlin.graph.getEdgesSync(key, value));    
        }
        return gremlin;
    }

    GremlinJSPipeline.prototype.gather = function (closure) {
        if (_isClosure(closure)) {
            this.engine.getBindingsSync(this.ctx).putSync("V", this.gremlinPipeline);
            this.gremlinPipeline = this.engine.evalSync("V.gather" + closure);
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

    GremlinJSPipeline.prototype.path = function(/*final PipeFunction... pathFunctions*/) {
        var args = slice.call(arguments),
            argsLen = args.length,
            pipeFunctions = [];
        for (var i = 0; i < argsLen; i++) {
            push.call(pipeFunctions, java.newProxy('com.tinkerpop.pipes.PipeFunction', { compute: args[i] }));
        };
        this.gremlinPipeline.pathSync(java.newArray("com.tinkerpop.pipes.PipeFunction", pipeFunctions));
        return this;
    }

    GremlinJSPipeline.prototype.scatter = function() {
        this.gremlinPipeline.scatterSync();
        return this;
    }

    // function _getGroovy(pipeline){
    //     var groovyPipeline = new GremlinGroovyPipeline();

    //     for(var i = 0, l = pipeline.sizeSync(); i<l ;i++){
    //         groovyPipeline.addPipeSync(pipeline.getSync(i));
    //     }
    //     return groovyPipeline;
    // }

    GremlinJSPipeline.prototype.select = function () {
        var len = 0,
            params = '',
            rest = 0,
            closureArgs;

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
        closureArgs = slice.call(arguments, rest).toString().replace(',','');
        this.engine.getBindingsSync(this.ctx).putSync("V", this.gremlinPipeline);
        this.gremlinPipeline = this.engine.evalSync("V.select"+ params + closureArgs);         
        return this;
    }

    GremlinJSPipeline.prototype.shuffle = function() {
        this.gremlinPipeline.shuffleSync();
        return this;
    }

    GremlinJSPipeline.prototype.transform = function(closure) {
        var funcProxy = java.newProxy('com.tinkerpop.pipes.PipeFunction', { compute: closure });
        this.gremlinPipeline.transformSync(funcProxy);
        return this;
    }    

    //can also pass in JSON
    exports.V = function(key, value){
        var gremlin = new GremlinJSPipeline(_db),
            k,
            o = {};
        if (!key) {
            gremlin.gremlinPipeline = new GremlinPipeline(gremlin.graph.getVerticesSync());    
        } else {
            if (_isObject(key)) {
                o = key;
                for(k in o){
                    if(key.hasOwnProperty(k)){
                        key = k;
                        value = o[k];
                    }
                }
            }
            gremlin.gremlinPipeline = new GremlinPipeline(gremlin.graph.getVerticesSync(key, value));    
        }
        return gremlin;
    }

    ////////////////////
    /// FILTER PIPES ///
    ////////////////////

    GremlinJSPipeline.prototype.index = function(idx) {
        this.gremlinPipeline.range(idx, idx);
        return this;
    }

    GremlinJSPipeline.prototype.range = function(low, high) {
        this.gremlinPipeline.range(low, high);
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
        var funcProxy = java.newProxy('com.tinkerpop.pipes.PipeFunction', { compute: closure });
            this.gremlinPipeline.filterSync(funcProxy);
        return this;
    }

    GremlinJSPipeline.prototype.has = function() {
        var args = slice.call(arguments),
            token;

        if(args.length == 2){
            this.gremlinPipeline.hasSync(args[0], args[1]);    
        } else {
            token = java.getStaticFieldValue("com.tinkerpop.gremlin.Tokens$T", Tokens[args[1]]);
            this.gremlinPipeline.hasSync(args[0], token, args[2]);
        }
        
        return this;
    }

    GremlinJSPipeline.prototype.hasNot = function() {
        var args = slice.call(arguments),
            token;

        if(args.length == 2){
            this.gremlinPipeline.hasNotSync(args[0], args[1]);    
        } else {
            token = java.getStaticFieldValue("com.tinkerpop.gremlin.Tokens$T", Tokens[args[1]]);
            this.gremlinPipeline.hasNotSync(args[0], token, args[2]);
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

    GremlinJSPipeline.prototype.simplePath = function() {
        this.gremlinPipeline.simplePathSync();
        return this;
    }

    /////////////////////////
    /// SIDE EFFECT PIPES ///
    /////////////////////////

    GremlinJSPipeline.prototype.aggregate = function() {
        var args = slice.call(arguments),
            argsLen = args.length,
            aggregateFunctionProxy;

        if (argsLen == 0){
            this.gremlinPipeline.aggregateSync(); 
        }
        if (argsLen == 1) {
            if (_isClosure(args[0])) {
                this.engine.getBindingsSync(this.ctx).putSync("V", this.gremlinPipeline);
                this.gremlinPipeline = this.engine.evalSync("V.aggregate" + args[0]);
            } else {
                this.gremlinPipeline.aggregateSync(args[0]);
            }
        } 
        if (argsLen == 2) {
            if (_isClosure(args[1])) {
                this.engine.getBindingsSync(this.ctx).putSync("V", this.gremlinPipeline);
                this.gremlinPipeline = this.engine.evalSync("V.aggregate(" + args[0] + ")" + args[1]);
            }
        }
        return this;
    }

    GremlinJSPipeline.prototype.as = function(name) {
        this.gremlinPipeline.asSync(name);
        return this;
    }

    GremlinJSPipeline.prototype.groupBy = function (map, /*final PipeFunction*/ keyFunction, /*final PipeFunction*/ valueFunction) {
        var rest = 0,
            param = '',
            closureArgs;

        if(!_isClosure(arguments[0])){
            rest = 1;
            engine.getBindings(ScriptContext.ENGINE_SCOPE).put("map", arguments[0]);
            param += "(map)"
        } 

        closureArgs = slice.call(arguments, rest).toString().replace(',','');
        this.engine.getBindingsSync(this.ctx).putSync("V", this.gremlinPipeline);
        this.gremlinPipeline = this.engine.evalSync("V.groupBy" + param + closureArgs);   
        return this;
    }

    GremlinJSPipeline.prototype.groupCount = function() {
        var rest = 0,
            param = '',
            closureArgs;

        if(!_isClosure(arguments[0])){
            rest = 1;
            engine.getBindings(ScriptContext.ENGINE_SCOPE).put("map", arguments[0]);
            param += "(map)"
        } 

        closureArgs = slice.call(arguments, rest).toString().replace(',','');
        this.engine.getBindingsSync(this.ctx).putSync("V", this.gremlinPipeline);
        this.gremlinPipeline = this.engine.evalSync("V.groupCount" + param + closureArgs);   
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

    GremlinJSPipeline.prototype.store = function(storage, storageFunction) {
        var rest = 0,
            param = '',
            closureArgs;

        if (!arguments.length){
            this.gremlinPipeline.storeSync();
            return this; 
        }

        if(!_isClosure(arguments[0])){
            rest = 1;
            engine.getBindings(ScriptContext.ENGINE_SCOPE).put("list", arguments[0]);
            param += "(list)"
        } 

        closureArgs = slice.call(arguments, rest).toString().replace(',','');
        this.engine.getBindingsSync(this.ctx).putSync("V", this.gremlinPipeline);
        this.gremlinPipeline = this.engine.evalSync("V.store" + param + closureArgs);   
        return this;

    }

    GremlinJSPipeline.prototype.table = function() {
        var args = slice.call(arguments),
            argsLen = args.length,
            table = argsLen > 0 ? !_isFunction(args[0]) : false,
            colle = argsLen > 1 ? !_isFunction(args[1]) : false,
            funcs = args,
            pipeFunctions = [];


        if (argsLen == 0){
            this.gremlinPipeline.tableSync(); 
            return this;
        }
        if (argsLen == 1 && table) {
            this.gremlinPipeline.tableSync(args[0]);       
            return this;
        }

        if(colle){
            funcs = slice.call(args, 2);
        } else if (table) {
            funcs = slice.call(args, 1);
        }
        
        for (var i = 0, l = funcs.length; i < l; i++) {
            push.call(pipeFunctions, java.newProxy('com.tinkerpop.pipes.PipeFunction', { compute: funcs[i] }));
        };

        this.gremlinPipeline.tableSync(java.newArray("com.tinkerpop.pipes.PipeFunction", pipeFunctions));

        return this;
    }

    GremlinJSPipeline.prototype.tree = function(/*final PipeFunction... branchFunctions*/) {
        var args = slice.call(arguments),
            argsLen = args.length,
            tree = !_isFunction(args[0]),
            funcs = tree ? slice.call(args, 1) : args,
            pipeFunctions = [];

        if(!argsLen){
            throw "tree -> invalid number of arguments";
        }

        if(argsLen == 1 && tree) {
            this.gremlinPipeline.treeSync(args[0]);
        }

        if(!!funcs.length) {
            for (var i = 0, l = funcs.length; i < l; i++) {
                push.call(pipeFunctions, java.newProxy('com.tinkerpop.pipes.PipeFunction', { compute: funcs[i] }));
            };
        
            if (table){
                this.gremlinPipeline.treeSync(args[0], java.newArray("com.tinkerpop.pipes.PipeFunction", pipeFunctions));
            } else {
                this.gremlinPipeline.treeSync(java.newArray("com.tinkerpop.pipes.PipeFunction", pipeFunctions));
            }

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
        thie.gremlinPipeline.exhaustMergeSync();
        return this;
    }

    GremlinJSPipeline.prototype.fairMerge = function() {
        thie.gremlinPipeline.fairMergeSync();
        return this;
    }

    GremlinJSPipeline.prototype.ifThenElse = function(ifClosure, thenClosure, elseClosure) {
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

    /**
     * Add a StartPipe to the end of the pipeline.
     * Though, in practice, a StartPipe is usually the beginning.
     * Moreover, the constructor of the Pipeline will internally use StartPipe.
     *
     * @param object the object that serves as the start of the pipeline (iterator/iterable are unfolded)
     * @return the extended Pipeline
    
    public GremlinPipeline<S, S> start(final S object) {
        this.add(new StartPipe<S>(object));
        FluentUtility.setStarts(this, object);
        return (GremlinPipeline<S, S>) this;
    }
    */


    GremlinJSPipeline.prototype.count = function() {
        return this.gremlinPipeline.countSync();
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

    GremlinJSPipeline.prototype.next = function(number){
        if(number){
            return this.gremlinPipeline.nextSync(number);    
        }
        return this.gremlinPipeline.nextSync();
    }

    GremlinJSPipeline.prototype.toList = function(){
        return this.gremlinPipeline.toListSync();
    }

    GremlinJSPipeline.prototype.toArray = function(){
        return this.gremlinPipeline.toListSync().toArraySync();
    }

    GremlinJSPipeline.prototype.fill = function(collection) {
        this.gremlinPipeline.fillSync(collection);
        return collection;
    }

    GremlinJSPipeline.prototype.enablePath = function() {
        this.gremlinPipeline.enablePathSync();
        return this;
    }

    GremlinJSPipeline.prototype.optimize = function(optimize) {
        this.gremlinPipeline.optimizeSync(optimize);
        return this;
    }

    GremlinJSPipeline.prototype.size = function() {
        return this.gremlinPipeline.sizeSync();
    }

    GremlinJSPipeline.prototype.reset = function() {
        this.gremlinPipeline.resetSync();
    }


    // protected void setPipes(final List<Pipe> pipes) {
    //     final int pipelineLength = pipes.size();
    //     this.startPipe = (Pipe<S, ?>) pipes.get(0);
    //     this.endPipe = (Pipe<?, E>) pipes.get(pipelineLength - 1);
    //     for (int i = 1; i < pipelineLength; i++) {
    //         pipes.get(i).setStarts((Iterator) pipes.get(i - 1));
    //     }
    // }


    // public void addPipe(final Pipe pipe) {
    //     this.pipes.add(pipe);
    //     this.setPipes(this.pipes);
    // }

    // public void addPipe(final int location, final Pipe pipe) {
    //     this.pipes.add(location, pipe);
    //     this.setPipes(this.pipes);
    // }

    // public void setStarts(final Iterator<S> starts) {
    //     this.starts = starts;
    //     this.startPipe.setStarts(starts);
    // }

    // public void setStarts(final Iterable<S> starts) {
    //     this.setStarts(starts.iterator());
    // }
    
    GremlinJSPipeline.prototype.hasNext = function() {
        return this.gremlinPipeline.hasNextSync();
    }

    GremlinJSPipeline.prototype.getCurrentPath = function() {
        return this.gremlinPipeline.getCurrentPathSync();
    }

    GremlinJSPipeline.prototype.getPipes = function() {
        return this.gremlinPipeline.getPipesSync();
    }

    GremlinJSPipeline.prototype.getStarts = function() {
        return this.gremlinPipeline.getStartsSync();
    }

    GremlinJSPipeline.prototype.remove = function(index) {
        return index ? this.gremlinPipeline.removeSync(index) : this.gremlinPipeline.removeSync();
    }

    GremlinJSPipeline.prototype.get = function(index) {
        return this.gremlinPipeline.getSync(index);
    }

    GremlinJSPipeline.prototype.equals = function(object) {
        return this.gremlinPipeline.equalsSync(object);
    }
});
