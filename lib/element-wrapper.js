'use strict';

var async = require('async');

var ElementWrapper = module.exports = function (gremlin, el) {
  this.gremlin = gremlin;
  this.el = el;
};

ElementWrapper.prototype.unwrap = function () {
  return this.el;
};

ElementWrapper.prototype.getId = function () {
  return this.el.getIdSync();
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

ElementWrapper.prototype.toJSON = function () {
  return {
    id: this.getId()
  };
};
