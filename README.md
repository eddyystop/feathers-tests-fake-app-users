## feathers-tests-fake-app-users
Fake some Feathers dependencies in service unit tests. Starter for your own customized fakes

> Fake `app` and database services such as `users`.

[![Build Status](https://travis-ci.org/eddyystop/feathers-tests-fake-app-users.svg?branch=master)](https://travis-ci.org/eddyystop/feathers-tests-fake-app-users)
[![Coverage Status](https://coveralls.io/repos/github/eddyystop/feathers-tests-fake-app-users/badge.svg?branch=master)](https://coveralls.io/github/eddyystop/feathers-tests-fake-app-users?branch=master)
[![Code Climate](https://codeclimate.com/repos/57979ed0b9ed527dd00004c2/badges/e5a3250f5a86a1e16ea6/gpa.svg)](https://codeclimate.com/repos/57979ed0b9ed527dd00004c2/feed)

## Code Example

The following example is from `test/example.js`.
It may be run with `npm run test:only`.

In this example we want to perform some unit tests on `feathers-service-verify-reset`'s resend method,
so we need to fake its Feathers dependencies `app` and `users`.
We would be running integration tests if we used Feathers' actual `app` and `users`,
and such tests would be more complicated.

```javascript
const feathersFakes = require('feathers-tests-fake-app-user');
const verifyResetService = require('feathers-service-verify-reset').service;
const testUsersDb = [ // faked in-memory database
  { _id: 'a', email: 'a', isVerified: false, verifyToken: '000', verifyExpires: Date.now() + 5000 },
];

describe('verifyReset::resend', () => {
  var db, app, users, verifyReset;

  beforeEach(() => {
    db = clone(testUsersDb);
    app = feathersFakes.app(); // stub Feathers app
    users = feathersFakes.makeDbService(app, 'users', db); // mock users service
    app.use('/users', users);
    app.configure(verifyResetService());
    
    // Internally verifyResetService() attaches itself as a service with
    // app.use('/verifyReset/:action/:value', {...});
    // So now we get a handle to that service
    verifyReset = app.service('/verifyReset/:action/:value');
  });

  it('updates unverified user', (done) => {
    const email = 'a';
    verifyReset.create({ action: 'resend', value: email }, {}, (err, user) => {
      assert.strictEqual(err, null, 'err code set');

      // Check user record modified as expected
      assert.strictEqual(user.isVerified, false, 'isVerified not false');
      assert.isString(user.verifyToken, 'verifyToken not String');
      assert.equal(user.verifyToken.length, 30, 'verify token wrong length');

      // Check database record is identical
      assert.deepEqual(user, db[0]);

      done();
    });
  });
});
```

## Motivation

It can be difficult to fake dependencies when running unit tests.
This package provides fakes for the most common dependencies in a Feathers' project.

## Installation

Install [Nodejs](https://nodejs.org/en/).

Run `npm install feathers-tests-fake-app-users --save-dev` in your project folder.

You can then require the utilities.

`/src` on GitHub contains the ES6 source.
It will run on Node 6+ without transpiling.

## Running the Example

`test/example.js` is described above. It runs as part of the tests.

## API Reference

See Code Example above.

The exports in `src/index.js` are fully documented.

## Tests

`npm test` to run tests.

`npm run cover` to run tests plus coverage.

## Contributors

- [eddyystop](https://github.com/eddyystop)

## License

MIT. See LICENSE.