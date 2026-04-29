'use strict';

const config = require('../config.json');
const { migrate } = require('./client');

const db = migrate(config.db_path);
console.log(`Migrated schema at ${config.db_path}`);
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('Tables:', tables.map(t => t.name).join(', '));
db.close();
