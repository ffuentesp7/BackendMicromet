const Nano = require('nano');
require('dotenv').config();
//const process = require('process');

// create variable nano of type DocumentScope with types Station, User and UserWithRole
let nano;
if (
  process.env.LOCAL_COUCHDB_URL && process.env.LOCAL_COUCHDB_URL !== '' &&
  process.env.REMOTE_COUCHDB_URL && process.env.REMOTE_COUCHDB_URL !== ''
) {
  nano = Nano(
    `${process.env.TENANT}:${process.env.PASSWORD}@${process.env.LOCAL_COUCHDB_URL}`
  );
  console.log(process.env.TENANT)
  nano.db.replication.enable(
    `http://${process.env.TENANT}:${process.env.PASSWORD}@${process.env.LOCAL_COUCHDB_URL}`,
    `https://${process.env.TENANT}:${process.env.PASSWORD}@${process.env.REMOTE_COUCHDB_URL}`,
    { create_target: true }
  );
} else {
  nano = Nano(
    `https://${process.env.TENANT}:${process.env.PASSWORD}@${process.env.REMOTE_COUCHDB_URL}`
  );
}

module.exports = nano;