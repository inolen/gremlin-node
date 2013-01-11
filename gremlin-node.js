(function (definition) {

    // RequireJS
    if (typeof define === "function") {
        define([], function () {
            var exports = {};
            definition(exports);
            return exports;
        });

    // CommonJS
    } else if (typeof exports === "object") {
        definition(exports);
    }

})(function (exports) {

    var java = require("java");
    java.classpath.push("./src"); //make Configurable

    var TinkerGraph = java.import("com.tinkerpop.blueprints.impls.tg.TinkerGraph");
    var TinkerGraphFactory = java.import("com.tinkerpop.blueprints.impls.tg.TinkerGraphFactory");
    var GremlinPipeline = java.import("com.entrendipity.gremlin.javascript.GremlinJSPipeline");
    var ArrayList = java.import('java.util.ArrayList');

    //Map map = new HashMap();

    var toString = Object.prototype.toString,
        push = Array.prototype.push,
        slice = Array.prototype.slice;

    var Tokens = {
        gt: 'gt',
        lt: 'lt',
        eq: 'eq',
        gte: 'gte',
        lte: 'lte',
        neq: 'neq'
    }        
    //Maybe passin in graph type specified in a options obj
    //then call the relevant graph impl constructor
    function GremlinJSPipeline() {
        this.graph = java.callStaticMethodSync("com.tinkerpop.blueprints.impls.tg.TinkerGraphFactory", "createTinkerGraph");
        this.gremlinPipeline = {};
    }

    //NEed to fix this to accept multiple args if possible
    exports.v = function(){
        var gremlin = new GremlinJSPipeline(),
            args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments),
            list = new ArrayList();
        for (var i = 0; i < args.length; i++) {
            list.addSync(gremlin.graph.getVertexSync(args[i]));
        };
        gremlin.gremlinPipeline = new GremlinPipeline(list);
        return gremlin;
    }

    //Need to fix this to accept multiple args if possible
    exports.e = function(){
        var gremlin = new GremlinJSPipeline(),
            args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments),
            list = new ArrayList();
        for (var i = 0; i < args.length; i++) {
            list.addSync(gremlin.graph.getEdgeSync(args[i]));
        };
        gremlin.gremlinPipeline = new GremlinPipeline(list);
        return gremlin;
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


    ///////////////////////
    /// TRANSFORM PIPES ///
    ///////////////////////

    /**
     * Add an IdentityPipe to the end of the Pipeline.
     * Useful in various situations where a step is needed without processing.
     * For example, useful when two as-steps are needed in a row.
     *
     * @return the extended Pipeline
     */
    exports._ = function() {
        var gremlin = new GremlinJSPipeline();
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
        var gremlin = new GremlinJSPipeline(),
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

    GremlinJSPipeline.prototype.gather = function (func) {
        var funcProxy;
        if (_isFunction(func)) {
            funcProxy = java.newProxy('com.tinkerpop.pipes.PipeFunction', { compute: func });
            this.gremlinPipeline.gatherSync(funcProxy);
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

    //map -> need to update to snapshot 2.3.0
    GremlinJSPipeline.prototype.map = function() {
        var args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments);
        this.gremlinPipeline.mapSync(java.newArray("java.lang.String", args));
        //this.gremlinPipeline.mapSync();
        return this;
    }

    //memoize


    // /**
    //  * Add a MemoizePipe to the end of the Pipeline.
    //  * This step will hold a Map of the objects that have entered into its pipeline section.
    //  * If an input is seen twice, then the map stored output is emitted instead of recomputing the pipeline section.
    //  *
    //  * @param namedStep the name of the step previous to memoize to
    //  * @return the extended Pipeline
    //  */
    // public GremlinPipeline<S, E> memoize(final String namedStep) {
    //     return this.add(new MemoizePipe(new Pipeline(FluentUtility.removePreviousPipes(this, namedStep))));
    // }

    // /**
    //  * Add a MemoizePipe to the end of the Pipeline.
    //  * This step will hold a Map of the objects that have entered into its pipeline section.
    //  * If an input is seen twice, then the map stored output is emitted instead of recomputing the pipeline section.
    //  *
    //  * @param numberedStep the number of the step previous to memoize to
    //  * @return the extended Pipeline
    //  */
    // public GremlinPipeline<S, E> memoize(final int numberedStep) {
    //     return this.add(new MemoizePipe(new Pipeline(FluentUtility.removePreviousPipes(this, numberedStep))));
    // }

    // /**
    //  * Add a MemoizePipe to the end of the Pipeline.
    //  * This step will hold a Map of the objects that have entered into its pipeline section.
    //  * If an input is seen twice, then the map stored output is emitted instead of recomputing the pipeline section.
    //  *
    //  * @param namedStep the name of the step previous to memoize to
    //  * @param map       the memoization map
    //  * @return the extended Pipeline
    //  */
    // public GremlinPipeline<S, E> memoize(final String namedStep, final Map map) {
    //     return this.add(new MemoizePipe(new Pipeline(FluentUtility.removePreviousPipes(this, namedStep)), map));
    // }

    // /**
    //  * Add a MemoizePipe to the end of the Pipeline.
    //  * This step will hold a Map of the objects that have entered into its pipeline section.
    //  * If an input is seen twice, then the map stored output is emitted instead of recomputing the pipeline section.
    //  *
    //  * @param numberedStep the number of the step previous to memoize to
    //  * @param map          the memoization map
    //  * @return the extended Pipeline
    //  */
    // public GremlinPipeline<S, E> memoize(final int numberedStep, final Map map) {
    //     return this.add(new MemoizePipe(new Pipeline(FluentUtility.removePreviousPipes(this, numberedStep)), map));
    // }

    //Need to create Map proxy object
    GremlinJSPipeline.prototype.memoize = function() {
        var arg = slice.call(arguments);
        if (arg.length > 1) {
            this.gremlinPipeline.memoizeSync(arg[0], arg[1]);
        } else {
            this.gremlinPipeline.memoizeSync(arg[0]);
        }
        return this;
    }

     //Need to check func call
    GremlinJSPipeline.prototype.order = function(func) {
        var funcProxy;
        if (_isFunction(func)) {
            funcProxy = java.newProxy('com.tinkerpop.pipes.PipeFunction', { compute: func });
            this.gremlinPipeline.orderSync(funcProxy);
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

    //path
    // *
    //  * Add a PathPipe or PathPipe to the end of the Pipeline.
    //  * This will emit the path that has been seen thus far.
    //  * If path functions are provided, then they are evaluated in a round robin fashion on the objects of the path.
    //  *
    //  * @param pathFunctions the path function of the PathPipe
    //  * @return the extended Pipeline

    // public GremlinPipeline<S, List> path(final PipeFunction... pathFunctions) {
    //     return this.add(new PathPipe<Object>(pathFunctions));
    // }

    GremlinJSPipeline.prototype.scatter = function() {
        this.gremlinPipeline.scatterSync();
        return this;
    }

    // /**
    //  * Add a SelectPipe to the end of the Pipeline.
    //  * The objects of the named steps (via as) previous in the pipeline are emitted as a Row object.
    //  * A Row object extends ArrayList and simply provides named columns and some helper methods.
    //  * If column functions are provided, then they are evaluated in a round robin fashion on the objects of the Row.
    //  *
    //  * @param stepNames       the name of the steps in the expression to retrieve the objects from
    //  * @param columnFunctions the functions to apply to the column objects prior to filling the Row
    //  * @return the extended Pipeline
    //  */
    // public GremlinPipeline<S, Row> select(final Collection<String> stepNames, final PipeFunction... columnFunctions) {
    //     return this.add(new SelectPipe(stepNames, FluentUtility.getAsPipes(this), columnFunctions));
    // }

    // /**
    //  * Add a SelectPipe to the end of the Pipeline.
    //  * The objects of the named steps (via as) previous in the pipeline are emitted as a Row object.
    //  * A Row object extends ArrayList and simply provides named columns and some helper methods.
    //  * If column functions are provided, then they are evaluated in a round robin fashion on the objects of the Row.
    //  *
    //  * @param columnFunctions the functions to apply to the column objects prior to filling the Row
    //  * @return the extended Pipeline
    //  */
    // public GremlinPipeline<S, Row> select(final PipeFunction... columnFunctions) {
    //     return this.add(new SelectPipe(null, FluentUtility.getAsPipes(this), columnFunctions));
    // }

    // /**
    //  * Add a SelectPipe to the end of the Pipeline.
    //  * The objects of the named steps (via as) previous in the pipeline are emitted as a Row object.
    //  * A Row object extends ArrayList and simply provides named columns and some helper methods.
    //  *
    //  * @return the extended Pipeline
    //  */
     GremlinJSPipeline.prototype.select = function () {
        this.gremlinPipeline.selectSync();
        return this;
    }

    GremlinJSPipeline.prototype.transform = function(func) {
        var funcProxy = java.newProxy('com.tinkerpop.pipes.PipeFunction', { compute: func });
        this.gremlinPipeline.transformSync(funcProxy);
        return this;
    }    

    //can also pass in JSON
    exports.V = function(key, value){
        var gremlin = new GremlinJSPipeline(),
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

    GremlinJSPipeline.prototype.itemAt = function(idx) {
        this.gremlinPipeline.range(idx, idx);
        return this;
    }

    GremlinJSPipeline.prototype.range = function(low, high) {
        this.gremlinPipeline.range(low, high);
        return this;
    }

    GremlinJSPipeline.prototype.and = function(/*final Pipe<E, ?>... pipes*/) {
        var args = slice.call(arguments),
            pipes = [];
        for (var i = 0; i < args.length; i++) {
            push.call(pipes, args[i].emit());
        };
        this.gremlinPipeline.andSync(java.newArray("com.tinkerpop.pipes.Pipe", pipes));
        return this;
    }

    GremlinJSPipeline.prototype.back = function(step) {
        this.gremlinPipeline.backSync(step);
        return this;
    }

     //Need to check func call
    GremlinJSPipeline.prototype.dedup = function(func) {
        var funcProxy;
        if (_isFunction(func)) {
            funcProxy = java.newProxy('com.tinkerpop.pipes.PipeFunction', { compute: func });
            this.gremlinPipeline.dedupSync(funcProxy);
        } else {
            this.gremlinPipeline.dedupSync();
        }
        return this;
    }

    GremlinJSPipeline.prototype.except = function() {
        var args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments),
            list = new ArrayList();
        for (var i = 0; i < args.length; i++) {
            list.addSync(args[i].single());
        };
        this.gremlinPipeline.exceptSync(list);
        return this;
    }

    GremlinJSPipeline.prototype.filter = function(func) {
        var funcProxy = java.newProxy('com.tinkerpop.pipes.PipeFunction', { compute: func });
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
            pipes = [];
        for (var i = 0; i < args.length; i++) {
            push.call(pipes, args[i].emit());
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
            list = new ArrayList();
        for (var i = 0; i < args.length; i++) {
            list.addSync(args[i].single());
        };
        this.gremlinPipeline.retainSync(list);
        return this;
    }

    GremlinJSPipeline.prototype.simplePath = function() {
        this.gremlinPipeline.simplePathSync();
        return this;
    }

    /////////////////////////
    /// SIDE EFFECT PIPES ///
    /////////////////////////

/**********************************************
    NEED TO IMPLEMENT ALL AGGREGATE METHODS
*********************************************/
    /**
     * Add an AggregatePipe to the end of the Pipeline.
     * The objects prior to aggregate are greedily collected into an ArrayList.
     *
     * @return the extended Pipeline
     */
    GremlinJSPipeline.prototype.aggregate = function() {
        this.gremlinPipeline.aggregateSync();
        return this;
    }

    GremlinJSPipeline.prototype.as = function(name) {
        this.gremlinPipeline.as(name);
        return this;
    }

    GremlinJSPipeline.prototype.groupCount = function() {
        this.gremlinPipeline.groupCountSync();
        return this;
    }


    //////////////////////
    /// UTILITY PIPES ///
    //////////////////////

    GremlinJSPipeline.prototype.emit = function (){
        return this.gremlinPipeline;
    }

    GremlinJSPipeline.prototype.single = function(){
        return this.gremlinPipeline.toListSync().getSync(0);
    }

});
