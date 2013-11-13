'use strict';

var _ = require('underscore');
var async = require('async');
var fs = require('fs');
var glob = require('glob');
var path = require('path');
var GraphWrapper = require('./graph-wrapper');
var QueryWrapper = require('./query-wrapper');
var PipelineWrapper = require('./pipeline-wrapper');

var Gremlin = module.exports = function(opts) {
    var java = require('java');

    opts = opts || {};
    opts.options = opts.options || [];
    opts.classpath = opts.classpath || [];

    //add default globbed lib/**/*.jar classpath
    opts.classpath.push(path.join(__dirname, '..', 'target', '**', '*.jar'));

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
    var NULL = java.callStaticMethodSync('org.codehaus.groovy.runtime.NullObject', 'getNullObject');

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

    var MAX_VALUE = java.newInstanceSync('java.lang.Long', 2147483647);
    var MIN_VALUE = 0;
    var _JSON = new JSONResultConverter(null, MIN_VALUE, MAX_VALUE, null);

    function isType(o, typeName) {
        if (!o._isType) {
            o._isType = {};
        }
        var res = o._isType[typeName];
        if (res === undefined) {
            try {
                res = java.instanceOf(o, typeName);
            } catch(err) {
                res = false;
            }
            o._isType[typeName] = res;
        }
        return res;
    }

    function toList(obj, callback) {
        if (_.isArray(obj)) {
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

    function toListSync(obj) {
        if (_.isArray(obj)) {
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

    function toJSON(obj, callback) {
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

    function toJSONSync(obj) {
        var json = _JSON.convertSync(obj);
        json = JSON.parse(json.toString());
        return json;
    }

    function getEngine() {
        if (getEngine.engine) {
            return getEngine.engine;
        }
        getEngine.engine = new GremlinGroovyScriptEngine();
        return getEngine.engine;
    }

    function wrap(graph) {
        return new GraphWrapper(graph);
    }

    return {
        GremlinPipeline: GremlinPipeline,
        NULL: NULL,
        GraphWrapper: GraphWrapper,
        PipelineWrapper: PipelineWrapper,
        QueryWrapper: QueryWrapper,
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
        isType: isType,
        toList: toList,
        toListSync: toListSync,
        toJSON: toJSON,
        toJSONSync: toJSONSync,
        getEngine: getEngine,
        wrap: wrap
    };
};
