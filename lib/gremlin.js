'use strict';

var _ = require('underscore');
var async = require('async');
var fs = require('fs');
var glob = require('glob');
var path = require('path');

var Gremlin = module.exports = function (opts) {
  opts = opts || {};
  opts.options = opts.options || [];
  opts.classpath = opts.classpath || [];

  // add default globbed lib/**/*.jar classpath
  opts.classpath.push(path.join(__dirname, '..', 'target', '**', '*.jar'));

  // initialize java
  var java = this.java = require('java');

  // add options
  java.options.push('-Djava.awt.headless=true');
  for (var i = 0; i < opts.options.length; i++) {
    java.options.push(opts.options[i]);
  }

  // add jar files
  for (var i = 0; i < opts.classpath.length; i++) {
    var pattern = opts.classpath[i];
    var filenames = glob.sync(pattern);
    for (var j = 0; j < filenames.length; j++) {
      java.classpath.push(filenames[j]);
    }
  }

  var MIN_VALUE = 0;
  var MAX_VALUE = java.newInstanceSync('java.lang.Long', 2147483647);
  var JSONResultConverter = java.import('com.tinkerpop.rexster.gremlin.converter.JSONResultConverter');

  this.GremlinPipeline = java.import('com.tinkerpop.gremlin.groovy.GremlinGroovyPipeline');
  this.NULL = java.callStaticMethodSync('org.codehaus.groovy.runtime.NullObject', 'getNullObject');

  var Class = this.Class = java.import('java.lang.Class');
  this.ArrayList = java.import('java.util.ArrayList');
  this.HashMap = java.import('java.util.HashMap');
  this.Table = java.import('com.tinkerpop.pipes.util.structures.Table');
  this.Tree = java.import('com.tinkerpop.pipes.util.structures.Tree');

  this.Direction = java.import('com.tinkerpop.blueprints.Direction');
  this.Tokens = java.import('com.tinkerpop.gremlin.Tokens$T');
  this.Compare = java.import('com.tinkerpop.blueprints.Compare');
  this.Contains = java.import('com.tinkerpop.blueprints.Contains');

  this.ClassTypes = {
    'String': Class.forNameSync('java.lang.String'),
    'Vertex': java.getClassLoader().loadClassSync('com.tinkerpop.blueprints.Vertex'),
    'Edge': java.getClassLoader().loadClassSync('com.tinkerpop.blueprints.Edge'),
    'Byte': Class.forNameSync('java.lang.Byte'),
    'Character': Class.forNameSync('java.lang.Character'),
    'Double': Class.forNameSync('java.lang.Double'),
    'Float': Class.forNameSync('java.lang.Float'),
    'Integer': Class.forNameSync('java.lang.Integer'),
    'Long': Class.forNameSync('java.lang.Long'),
    'Short': Class.forNameSync('java.lang.Short'),
    'Number': Class.forNameSync('java.lang.Number'),
    'BigDecimal': Class.forNameSync('java.math.BigDecimal'),
    'BigInteger': Class.forNameSync('java.math.BigInteger')
  };

  this.JSON = new JSONResultConverter(null, MIN_VALUE, MAX_VALUE, null);

  // allow users to override the constructors used inside of gremlin
  this.GraphWrapper = Gremlin.GraphWrapper;
  this.QueryWrapper = Gremlin.QueryWrapper;
  this.PipelineWrapper = Gremlin.PipelineWrapper;
  this.VertexWrapper = Gremlin.VertexWrapper;
  this.EdgeWrapper = Gremlin.EdgeWrapper;
};

Gremlin.GraphWrapper = require('./graph-wrapper');
Gremlin.QueryWrapper = require('./query-wrapper');
Gremlin.PipelineWrapper = require('./pipeline-wrapper');
Gremlin.ElementWrapper = require('./element-wrapper');
Gremlin.VertexWrapper = require('./vertex-wrapper');
Gremlin.EdgeWrapper = require('./edge-wrapper');

Gremlin.prototype.isClosure = function (val) {
  var closureRegex = /^\{.*\}$/;
  return _.isString(val) && val.search(closureRegex) > -1;
};

Gremlin.prototype.isType = function (o, typeName) {
  if (!o) return false;
  if (!o._isType) {
    o._isType = {};
    if (typeof o._isType === 'undefined') {
      return false;
    }
  }
  var res = o._isType[typeName];
  if (res === undefined) {
    try {
      res = this.java.instanceOf(o, typeName);
    } catch(err) {
      res = false;
    }
    o._isType[typeName] = res;
  }
  return res;
};

Gremlin.prototype.toList = function (obj, callback) {
  if (_.isArray(obj)) {
    var list = new this.ArrayList();
    for (var i = 0; i < obj.length; i++) {
      list.addSync(obj[i]);
    }
    return callback(null, list);
  }
  if (obj.getClassSync().isArraySync()) {
    this.java.callStaticMethod('java.util.Arrays', 'asList', obj, callback);
    return;
  }
  this.java.callStaticMethod('com.google.common.collect.Lists', 'newArrayList', obj, callback);
};

Gremlin.prototype.toListSync = function (obj) {
  if (_.isArray(obj)) {
    var list = new this.ArrayList();
    for (var i = 0; i < obj.length; i++) {
      list.addSync(obj[i]);
    }
    return list;
  }
  if (obj.getClassSync().isArraySync()) {
    return this.java.callStaticMethodSync('java.util.Arrays', 'asList', obj);
  }
  return this.java.callStaticMethodSync('com.google.common.collect.Lists', 'newArrayList', obj);
};

Gremlin.prototype.toJSON = function (obj, callback) {
  // if this is a wrapped datatype, unwrap it to get the underlying Java object
  if (obj.unwrap) {
    obj = obj.unwrap();
  }

  this.JSON.convert(obj, function (err, json) {
    if (err) return callback(err);
    try {
      json = JSON.parse(json.toString());
    } catch (e) {
      return callback(e);
    }
    return callback(null, json);
  });
};

Gremlin.prototype.toJSONSync = function (obj) {
  // if this is a wrapped datatype, unwrap it to get the underlying Java object
  if (obj.unwrap) {
    obj = obj.unwrap();
  }

  var json = this.JSON.convertSync(obj);
  json = JSON.parse(json.toString());
  return json;
};

Gremlin.prototype.getEngine = function () {
  if (this._engine) {
    return this._engine;
  }
  var GremlinGroovyScriptEngine = this.java.import('com.tinkerpop.gremlin.groovy.jsr223.GremlinGroovyScriptEngine');
  this._engine = new GremlinGroovyScriptEngine();
  return this._engine;
};

Gremlin.prototype.unwrap = function (val) {
  if (val.unwrap) {
    return val.unwrap();
  } else if (this.isClosure(val)) {
    return this.getEngine().evalSync(val);
  }
  return val;
};

Gremlin.prototype.wrap = function (val) {
  if (val && val.longValue) {
    return parseInt(val.longValue, 10);
  } else if (this.isType(val, 'com.tinkerpop.blueprints.Vertex')) {
    return new this.VertexWrapper(this, val);
  } else if (this.isType(val, 'com.tinkerpop.blueprints.Edge')) {
    return new this.EdgeWrapper(this, val);
  } else if (this.isType(val, 'com.tinkerpop.blueprints.Graph')) {
    return new this.GraphWrapper(this, val);
  } else if (this.isType(val, 'java.util.Map')) {
    // it seems this type of coercion could be ported to node-java
    // https://github.com/joeferner/node-java/issues/56
    var map = {};
    var it = val.entrySetSync().iteratorSync();
    while (it.hasNextSync()) {
      var pair = it.nextSync();
      map[pair.getKeySync()] = this.wrap(pair.getValueSync());
    }
    return map;
  }
  return val;
};
