'use strict';

var _ = require('underscore');
var async = require('async');

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
  this.el.getProperty(key, callback);
};

ElementWrapper.prototype.getProperties = function (props, callback) {
  var self = this;

  var res = {};
  async.each(props, function (prop, cb) {
    self.getProperty(prop, function (err, value) {
      if (err) return cb(err);
      res[prop] = value;
      cb();
    });
  }, function (err) {
    return callback(err, res);
  });
};

ElementWrapper.prototype.setProperty = function (key, value, callback) {
  this.el.setProperty(key, value, callback);
};

ElementWrapper.prototype.setProperties = function (props, callback) {
  var self = this;
  async.each(Object.keys(props), function (key, cb) {
    self.setProperty(key, props[key], cb);
  }, callback);
};

ElementWrapper.prototype.removeProperty = function (key, callback) {
  this.el.removeProperty(key, callback);
};

ElementWrapper.prototype.removeProperties = function (props, callback) {
  var self = this;
  async.each(props, function (key, cb) {
    self.removeProperty(key, cb);
  }, callback);
};

ElementWrapper.prototype.remove = function (callback) {
  this.el.remove(callback);
};

ElementWrapper.prototype.toJSON = function (callback) {
  this.gremlin.toJSON(this.el, callback);
};

