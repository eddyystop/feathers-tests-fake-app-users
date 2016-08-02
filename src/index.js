
/* eslint consistent-return: 0, no-param-reassign: 0, no-underscore-dangle: 0,
 no-unused-vars: 0 */

const sift = require('sift');
const crypto = require('crypto');
const debug = require('debug')('test:feathersStubs');

/**
 * Return a stub for feathers' app
 * @param {Object} config to server .app.get(prop) requests
 * @returns {Object} feathers' app with .use and .service
 */

module.exports.app = function app(config) {
  return {
    services: {},
    configure(fcn) {
      fcn.call(this);
      return this;
    },
    get(str) {
      return (config || {})[str];
    },
    service(route) {
      if (!(route in this.services)) {
        throw new Error(`Service for route '${route} not found.`);
      }

      return this.services[route];
    },
    use(route, serviceObject) {
      this.services[route] = serviceObject;
      return this;
    },
  };
};

/**
 * Return a stub for feathers' users service
 * @param {Object} app stub
 * @poaram {String} name is the name of the service. Only used in informational messages.
 * @param {Array.Object} db is the database of users
 * @returns {Object} feather' service for route /users
 *
 * Only single records are supported.
 */

module.exports.makeDbService = function makeDbService(app, name, db) {
  const serviceConfig = {
    find(params, cb) {
      const data = sift(params.query || {}, db);
      debug(`${name}.find: total=%d %o`, data.length, params);

      return done(null, { total: data.length, data }, cb);
    },
    get(id, params, cb) {
      const index = db.findIndex(rec => rec._id === id);
      debug(`${name}.get: index=%d id=%s %o`, index, id, params);

      if (index === -1) {
        const errMsg = index === -1 ? `Service ${name}.get id "${id}" does not exist.` : null;
        return done(errMsg, {}, cb);
      }

      return done(null, clone(db[index]), cb);
    },
    create(data, params, cb) {
      data = clone(data);
      debug(`${name}.create: data=%o %o`, data, params);

      data._id = createNewId(db);
      db.push(data);

      return done(null, clone(data), cb);
    },
    update(id, data, params, cb) {
      data = clone(data);
      const index = db.findIndex(rec => rec._id === id);
      debug(`${name}.update: index=%d id=%s data=%o %o`, index, id, data, params);

      if (index === -1) {
        const errMsg = index === -1 ? `Service ${name}.update id "${id}" does not exist.` : null;
        return done(errMsg, {}, cb);
      }

      data._id = db[index]._id;
      db[index] = data;

      return done(null, clone(data), cb);
    },
    patch(id, data, params, cb) {
      data = clone(data);
      const index = db.findIndex(rec => rec._id === id);
      debug(`${name}.patch: index=%d id=%s data=%o %o`, index, id, data, params);

      if (index === -1) {
        const errMsg = index === -1 ? `Service ${name}.patch id "${id}" does not exist.` : null;
        return done(errMsg, {}, cb);
      }

      const newData = Object.assign({}, db[index], data);
      newData._id = id;
      db[index] = newData;
      return done(null, clone(newData), cb);
    },
    remove(id, params, cb) {
      const index = db.findIndex(rec => rec._id === id);
      debug(`${name}.remove: index=%d id=%s %o`, index, id, params);

      if (index === -1) {
        const errMsg = index === -1 ? `Service ${name}.remove id "${id}" does not exist.` : null;
        return done(errMsg, {}, cb);
      }

      const data = clone(db[index]);
      db.splice(index, 1);
      return done(null, data, cb);
    },
  };

  app.use(name, serviceConfig);

  return app.service(name);
};

// Return Promise or invoke callback

function done(errMsg, data, cb) {
  const err = errMsg ? Error(errMsg) : null;

  if (cb) {
    return cb(err, data);
  }

  return err ? Promise.reject(err) : Promise.resolve(data);
}

// Get a new id that's not already used. (Based on npm 'nedb'.)

function createNewId(db) {
  var tentativeId = uid(16); // eslint-disable-line no-var
  // Try as many times as needed to get an unused _id.
  // As explained in customUtils, the probability of this ever happening is extremely small,
  // so this is O(1)
  if (db.findIndex(rec => rec._id === tentativeId) !== -1) {
    tentativeId = createNewId(db);
  }
  return tentativeId;
}

function uid(len) {
  return crypto.randomBytes(Math.ceil(Math.max(8, len * 2)))
    .toString('base64')
    .replace(/[+\/]/g, '')
    .slice(0, len);
}

// Helpers

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
