'use strict';

/* eslint consistent-return: 0, no-param-reassign: 0, no-underscore-dangle: 0,
 no-unused-vars: 0 */

var sift = require('sift');
var debug = require('debug')('test:feathersStubs');

/**
 * Return a stub for feathers' app
 * @param {Object} config to server .app.get(prop) requests
 * @returns {Object} feathers' app with .use and .service
 */

module.exports.app = function app(config) {
  return {
    services: {},
    configure: function configure(fcn) {
      fcn.call(this);
      return this;
    },
    get: function get(str) {
      return (config || {})[str];
    },
    service: function service(route) {
      if (!(route in this.services)) {
        throw new Error('Service for route \'' + route + ' not found.');
      }

      return this.services[route];
    },
    use: function use(route, serviceObject) {
      this.services[route] = serviceObject;
    }
  };
};

/**
 * Return a stub for feathers' users service
 * @param {Object} app stub
 * @param {Array.Object} usersDb is the database of users
 * @returns {Object} feather' service for route /users
 */

module.exports.users = function users(app, usersDb) {
  var usersConfig = {
    find: function find(params) {
      // always use as a Promise
      var data = sift(params.query || {}, usersDb);
      debug('/users find: %d %o', data.length, params);

      return new Promise(function (resolve) {
        resolve({
          total: data.length,
          data: data
        });
      });
    },
    update: function update(id, user, params, cb) {
      // always use with a callback
      debug('/users update: %s %o %o', id, user, params);
      var index = usersDb.findIndex(function (user1) {
        return user1._id === id;
      });

      if (index === -1) {
        return cb(new Error('users.update _id=' + id + ' not found.'));
      }

      usersDb[index] = user;
      cb(null, user); // we're skipping before & after hooks
    }
  };

  app.use('/users', usersConfig);

  return app.service('/users');
};