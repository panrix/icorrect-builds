'use strict';

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

let _db = null;

function open(dbPath) {
  if (_db) return _db;
  const dir = path.dirname(dbPath);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  _db = new Database(dbPath);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  return _db;
}

function migrate(dbPath) {
  const db = open(dbPath);
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
  fs.chmodSync(dbPath, 0o600);
  return db;
}

function close() {
  if (_db) { _db.close(); _db = null; }
}

module.exports = { open, migrate, close };
