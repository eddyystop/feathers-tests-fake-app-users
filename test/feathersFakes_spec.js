
/* global assert, describe, it */
/* eslint  consistent-return: 0, no-shadow: 0, no-var: 0, one-var: 0,
one-var-declaration-per-line: 0, no-underscore-dangle: 0 */

const assert = require('chai').assert;
const feathersStubs = require('../lib');

// user DB

const now = Date.now();
const usersDb = [
  // x: 2 avoid complaints about duplicate code
  { _id: 'a', email: 'a', x: 2, isVerified: false, verifyToken: '000', verifyExpires: now + 50000 },
  { _id: 'b', email: 'b', x: 2, isVerified: true, verifyToken: null, verifyExpires: null },
];

// Tests

describe('users callbacks & Promises', () => {
  var db;
  var app;
  var users;

  beforeEach(() => {
    db = clone(usersDb);
    app = feathersStubs.app();
    users = feathersStubs.makeDbService(app, 'users', db);
    app.use('users', users);
  });

  it('successful with Promise', (done) => {
    users.find({ query: { email: 'a' } })
      .then(({ total, data }) => {
        assert.equal(total, 1);
        assert.deepEqual(data[0], usersDb[0]);
        done();
      })
      .catch(() => {
        assert.isNotOk(true, '.catch on find');
        done();
      });
  });

  it('successful with callback', (done) => {
    users.find({ query: { email: 'a' } }, (err, { total, data }) => {
      if (err) {
        assert.isNotOk(true, 'err code unexpectedly set');
        return done();
      }

      assert.equal(total, 1);
      assert.deepEqual(data[0], usersDb[0]);
      done();
    });
  });

  it('unsuccessful with Promise', (done) => {
    users.get('no_such_id', {})
      .then(() => {
        assert.isNotOk(true, 'err code unexpectedly not set');
        done();
      })
      .catch(() => {
        done();
      });
  });

  it('unsuccessful with callback', (done) => {
    users.get('no_such_id', {}, (err) => {
      if (err) { return done(); }

      assert.isNotOk(true, 'err code unexpectedly not set');
      done();
    });
  });
});

describe('users test methods', () => {
  var db;
  var app;
  var users;

  beforeEach(() => {
    db = clone(usersDb);
    app = feathersStubs.app();
    users = feathersStubs.makeDbService(app, 'users', db);
    app.use('users', users);
  });

  it('find works', (done) => {
    users.find({ query: { email: 'a' } })
      .then(({ total, data }) => {
        assert.equal(total, 1);
        assert.deepEqual(data[0], usersDb[0]);
        done();
      })
      .catch(() => {
        assert.isNotOk(true, '.catch on find');
        done();
      });
  });

  it('get works', (done) => {
    users.get('a')
      .then((data) => {
        assert.deepEqual(data, usersDb[0]);
        done();
      })
      .catch(() => {
        assert.isNotOk(true, '.catch on get');
        done();
      });
  });

  it('create works', (done) => {
    var rec = { email: 'c', isVerified: true, verifyToken: null, verifyExpires: null };
    users.create(rec)
      .then((data) => {
        rec._id = db[2]._id;
        assert.equal(db.length, 3);
        assert.deepEqual(data, db[2]);
        done();
      })
      .catch(() => {
        assert.isNotOk(true, '.catch on create');
        done();
      });
  });

  it('update works', (done) => {
    const id = usersDb[0]._id; // eslint-disable-line no-underscore-dangle
    const newRec = { email: 'abc123' };

    users.update(id, newRec)
      .then((data) => {
        assert.deepEqual(data, Object.assign({ _id: id }, newRec));
        done();
      })
      .catch(() => {
        assert.isNotOk(true, '.catch on update');
        done();
      });
  });

  it('patch works', (done) => {
    const oldRec = db[1];
    const id = oldRec._id; // eslint-disable-line no-underscore-dangle
    const set = { email: 'xyz789' };

    users.patch(id, set)
      .then((data) => {
        assert.deepEqual(data, Object.assign({}, oldRec, set));
        done();
      })
      .catch(() => {
        assert.isNotOk(true, '.catch on patch');
        done();
      });
  });

  it('remove works', (done) => {
    const oldRec = db[1];
    const id = oldRec._id; // eslint-disable-line no-underscore-dangle

    users.remove(id)
      .then((data) => {
        assert.equal(db.length, 1);
        assert.deepEqual(db[0], usersDb[0]);
        assert.deepEqual(data, oldRec);
        done();
      })
      .catch(() => {
        assert.isNotOk(true, '.catch on remove');
        done();
      });
  });
});

// Helpers

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
