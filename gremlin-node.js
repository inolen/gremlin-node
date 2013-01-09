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
    java.classpath.push("./src");

    var TinkerGraph = java.import("com.tinkerpop.blueprints.impls.tg.TinkerGraph");
    var TinkerGraphFactory = java.import("com.tinkerpop.blueprints.impls.tg.TinkerGraphFactory");
    var GremlinPipeline = java.import("com.tinkerpop.gremlin.java.GremlinPipeline");
    var ArrayList = java.import('java.util.ArrayList');

    var Float = java.import('java.lang.Float');

    var toString = Object.prototype.toString,
        push = Array.prototype.push,
        slice = Array.prototype.slice;
        
    //Maybe passin in graph type specified in a options obj
    //then call the relevant graph impl constructor
    function GremlinJSPipeline() {
        this.graph = java.callStaticMethodSync("com.tinkerpop.blueprints.impls.tg.TinkerGraphFactory", "createTinkerGraph");
        this.gremlinPipeline = {};
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

    //NEed to fix this to accept multiple args if possible
    exports.v = function(){
        var gremlin = new GremlinJSPipeline(),
            args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments);            
        
        gremlin.gremlinPipeline = new GremlinPipeline(gremlin.graph.getVertexSync(args[0]));    
        return gremlin;
    }

    //Need to fix this to accept multiple args if possible
    exports.e = function(){
        var gremlin = new GremlinJSPipeline(),
            args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments);            
        
        gremlin.gremlinPipeline = new GremlinPipeline(gremlin.graph.getEdgeSync(args[0]));    
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

/******************************************************************************************************************************************************
    NEED TO IMPLEMENT ALL AGGREGATE METHODS
********************************************************************************************************************************************************/
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


    GremlinJSPipeline.prototype.interval = function(key, startValue, endValue) {
        this.gremlinPipeline.intervalSync(key, java.callStaticMethodSync("java.lang.Float", "parseFloat", startValue), java.callStaticMethodSync("java.lang.Float", "parseFloat", endValue));
        return this;
    }


  

    ///////////////////////
    /// TRANSFORM PIPES ///
    ///////////////////////

    GremlinJSPipeline.prototype.bothE = function() {
        var args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments);
        this.gremlinPipeline.bothESync(java.newArray("java.lang.String", args));
        return this;
    }

    GremlinJSPipeline.prototype.both = function() {
        var args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments);
        this.gremlinPipeline.bothSync(java.newArray("java.lang.String", args));
        return this;
    }
    
    GremlinJSPipeline.prototype.bothV = function() {
        this.gremlinPipeline.bothVSync();
        return this;
    }

//     public GremlinPipeline<S, Edge> idEdge(final Graph graph) {
//         return this.add(new IdEdgePipe(graph));
//     }

    GremlinJSPipeline.prototype.id = function() {
        this.gremlinPipeline.idSync();
        return this;
    }

    // GremlinJSPipeline.prototype.idVertex = function() {
    //     this.gremlinPipeline.idVertexSync(this.graph);
    //     return this;
    // }

    GremlinJSPipeline.prototype.inE = function() {
        var args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments);
        this.gremlinPipeline.inESync(java.newArray("java.lang.String", args));
        return this;
    }

    GremlinJSPipeline.prototype.in = function() {
        var args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments);
        this.gremlinPipeline.inSync(java.newArray("java.lang.String", args));
        return this;
    }

    GremlinJSPipeline.prototype.inV = function() {
        this.gremlinPipeline.inVSync();
        return this;
    }

    GremlinJSPipeline.prototype.label = function() {
        this.gremlinPipeline.labelSync();
        return this;
    }

    GremlinJSPipeline.prototype.outV = function (){
        this.gremlinPipeline.outVSync();
        return this;
    }

    GremlinJSPipeline.prototype.out = function (){
        var args = _isArray(arguments[0]) ? arguments[0] : slice.call(arguments);
        this.gremlinPipeline.outSync(java.newArray("java.lang.String", args));
        return this;
    }

    GremlinJSPipeline.prototype.map = function() {
        this.gremlinPipeline.mapSync();
        return this;
    }

    GremlinJSPipeline.prototype.property = function (key) {
        this.gremlinPipeline.propertySync(key);
        return this;
    }

    // /**
    //  * Add a FunctionPipe to the end of the pipeline.
    //  * The provide provided PipeFunction emits whatever is defined by the function.
    //  * This serves as an arbitrary step computation.
    //  *
    //  * @param function the function of the FunctionPipe
    //  * @return the extended Pipeline
    //  */
    // public GremlinPipeline<S, ?> step(final PipeFunction function) {
    //     return this.add(new FunctionPipe(function));
    // }

    // /**
    //  * Add an arbitrary Pipe to the end of the pipeline.
    //  *
    //  * @param pipe The provided pipe.
    //  * @param <T>  the object type emitted by the provided pipe.
    //  * @return the extended Pipeline
    //  */
    // public <T> GremlinPipeline<S, T> step(final Pipe<E, T> pipe) {
    //     return this.add(pipe);
    // }





    /**
     * Add a GatherPipe to the end of the Pipeline.
     * All the objects previous to this step are aggregated in a greedy fashion and emitted as a List.
     *
     * @return the extended Pipeline
     */
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

    /**
     * Add an IdentityPipe to the end of the Pipeline.
     * Useful in various situations where a step is needed without processing.
     * For example, useful when two as-steps are needed in a row.
     *
     * @return the extended Pipeline
     */
    GremlinJSPipeline.prototype._ = function() {
            this.gremlinPipeline._Sync();
            return this;
    }

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

    // /**
    //  * Add an OrderPipe to the end of the Pipeline.
    //  * This step will sort the objects in the stream in a default Comparable order.
    //  *
    //  * @return the extended Pipeline
    //  */
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

    GremlinJSPipeline.prototype.groupCount = function() {
        this.gremlinPipeline.groupCountSync();
        return this;
    }
    // /**
    //  * Add an OrderPipe to the end of the Pipeline.
    //  * This step will sort the objects in the stream according to a comparator defined in the provided function.
    //  *
    //  * @param compareFunction a comparator function of two objects of type E
    //  * @return the extended Pipeline
    //  */
    // public GremlinPipeline<S, E> order(final PipeFunction<Pair<E, E>, Integer> compareFunction) {
    //     return this.add(new OrderPipe(compareFunction));
    // }

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
    // public GremlinPipeline<S, Row> select() {
    //     return this.add(new SelectPipe(null, FluentUtility.getAsPipes(this)));
    // }

    // /**
    //  * Add a SideEffectCapPipe to the end of the Pipeline.
    //  * When the previous step in the pipeline is implements SideEffectPipe, then it has a method called getSideEffect().
    //  * The cap step will greedily iterate the pipeline and then, when its empty, emit the side effect of the previous pipe.
    //  *
    //  * @return the extended Pipeline
    //  */
    GremlinJSPipeline.prototype.cap = function() {
        this.gremlinPipeline.capSync();
        return this;

    }

    // /**
    //  * Add a TransformFunctionPipe to the end of the Pipeline.
    //  * Given an input, the provided function is computed on the input and the output of that function is emitted.
    //  *
    //  * @param function the transformation function of the pipe
    //  * @return the extended Pipeline
    //  */
    // public <T> GremlinPipeline<S, T> transform(final PipeFunction<E, T> function) {
    //     return this.add(new TransformFunctionPipe(function));
    // }
    GremlinJSPipeline.prototype.transform = function(func) {
        var funcProxy = java.newProxy('com.tinkerpop.pipes.PipeFunction', { compute: func });
        this.gremlinPipeline.transformSync(funcProxy);
        return this;
    }


    GremlinJSPipeline.prototype.emit = function (){
        // maybe this.gremlinPipeline.getStartsSync();
        // var it = this.gremlinPipeline.iteratorSync();
        // while(it.hasNextSync()){
        //     var i = it.nextSync();
        //     console.log(i.toString());
        // }
        
        return this.gremlinPipeline.toListSync().toString();
    }

});
