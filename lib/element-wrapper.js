'use strict';

var _ = require('underscore');
var async = require('async');
var Q = require('q');

var ElementWrapper = module.exports = function (gremlin, el) {
  this.gremlin = gremlin;
  this.el = el;
};

ElementWrapper.prototype.unwrap = function () {
  return this.el;
};

// each database seems to want to return a different data type for
// the id (Java object, long, string, etc.). in TinkerGraph and Titan
// all of the possible returned types serialize to a string, and the
// Graph object's getVertex and getEdge work correctly with these
// serialized strings. for this reason, we're standardizing on getId
// always returning a string (at least currently)
ElementWrapper.prototype.getId = function () {
  var id = this.el.getIdSync();

  if (_.isString(id)) {
    return id;
  } else if (id.longValue) {
    return id.longValue;
  }

  return id.toStringSync();
};

ElementWrapper.prototype.getProperty = function (key, callback) {
  return Q.nbind(this.el.getProperty, this.el)(key).nodeify(callback);
};

ElementWrapper.prototype.getProperties = function (props, callback) {
  var self = this;
  var res = {};
  var propPromises = props.map(
    function (prop) {
      return self.getProperty(prop)
        .then(function (value) { res[prop] = value; });
    }
  );
  return Q.all(propPromises)
    .then(function () { return new Q(res); })
    .nodeify(callback);
};

ElementWrapper.prototype.setProperty = function (key, value, callback) {
  return Q.nbind(this.el.setProperty, this.el)(key, value).nodeify(callback);
};

ElementWrapper.prototype.setProperties = function (props, callback) {
  var self = this;
  return Q.all(Object.keys(props).map(function (key) { return self.setProperty(key, props[key]); }))
    .nodeify(callback);
};

ElementWrapper.prototype.removeProperty = function (key, callback) {
  return Q.nbind(this.el.removeProperty, this.el)(key).nodeify(callback);
};

ElementWrapper.prototype.removeProperties = function (props, callback) {
  var self = this;
  return Q.all(props.map(function (key) { return self.removeProperty(key); }))
    .nodeify(callback);
};

ElementWrapper.prototype.remove = function (callback) {
  return Q.nbind(this.el.remove, this.el)().nodeify(callback);
};

ElementWrapper.prototype.toJSON = function (callback) {
  return Q.nbind(this.gremlin.toJSON, this.gremlin)(this.el).nodeify(callback);
};

ElementWrapper.prototype.toJSONSync = function (callback) {
  return this.gremlin.toJSONSync(this.el);
};

