
/* global assert, describe, it */
/* eslint  no-param-reassign: 0, no-shadow: 0, no-unused-vars: 0, no-var: 0, one-var: 0,
one-var-declaration-per-line: 0, no-use-before-define: [2, "nofunc"] */

const assert = require('chai').assert;
const feathersFakes = require('../lib');
const verifyResetService = require('feathers-service-verify-reset').service;

const defaultVerifyDelay = 1000 * 60 * 60 * 24 * 5; // 5 days

// user DB

const now = Date.now();
const usersDb = [
  // x: 1 avoid complaints about duplicate code
  { _id: 'a', x: 1, email: 'a', isVerified: false, verifyToken: '000', verifyExpires: now + 50000 },
  { _id: 'b', x: 1, email: 'b', isVerified: true, verifyToken: null, verifyExpires: null },
];

/*
  Test the generic service require('feathers-service-verify-reset').service
  which works with feathers' standard users service.

  We want to perform unit tests on feathers-service-verify-reset's resend method,
  so we need to fake its feathers dependencies app and users.
  We would be running integration tests if we used feathers' actual app and users.

  We will therefore stub out app (which means we cannot test app's internal state),
  and mock users (which means we can get info about its internal state, e.g. its DB).
 */

describe('verifyReset::resend', () => {
  var db;
  var app;
  var users;
  var verifyReset;

  beforeEach(() => {
    db = clone(usersDb);
    app = feathersFakes.app(); // stub feathers app
    users = feathersFakes.users(app, db); // mock users service, passing it its fake database
    app.configure(verifyResetService());

    // Internally verifyResetService() attaches itself as a service with
    // app.use('/verifyReset/:action/:value', {...});
    // So now we get a handle to that service
    verifyReset = app.service('/verifyReset/:action/:value');
  });

  it('verifyReset::create exists', () => {
    assert.isFunction(verifyReset.create);
  });

  it('updates unverified user', (done) => {
    const email = 'a';
    verifyReset.create({ action: 'resend', value: email }, {}, (err, user) => {
      assert.strictEqual(err, null, 'err code set');

      // Check user record modified as expected
      assert.strictEqual(user.isVerified, false, 'isVerified not false');
      assert.isString(user.verifyToken, 'verifyToken not String');
      assert.equal(user.verifyToken.length, 30, 'verify token wrong length');
      aboutEqualDateTime(user.verifyExpires, makeDateTime());

      // Check database record is identical
      assert.deepEqual(user, db[0]);

      done();
    });
  });

  it('error on verified user', (done) => {
    const email = 'b';
    verifyReset.create({ action: 'resend', value: email }, {}, (err, user) => {
      assert.equal(err.message, 'User is already verified.');

      done();
    });
  });

  it('error on email not found', (done) => {
    const email = 'x';
    verifyReset.create({ action: 'resend', value: email }, {}, (err, user) => {
      assert.equal(err.message, `Email "${email}" not found.`);

      done();
    });
  });
});

// Helpers

function makeDateTime(options1) {
  options1 = options1 || {};
  return Date.now() + (options1.delay || defaultVerifyDelay);
}

function aboutEqualDateTime(time1, time2, msg, delta) {
  delta = delta || 500;
  const diff = Math.abs(time1 - time2);
  assert.isAtMost(diff, delta, msg || `times differ by ${diff}ms`);
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
