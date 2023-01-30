import Nano from 'nano';
import * as dotenv from 'dotenv';
import * as process from "process";
dotenv.config();
// create variable nano of type DocumentScope with types Crop, System, User and UserWithRole
let nano: Nano.ServerScope;

if (
    process.env.LOCAL_COUCHDB_URL && process.env.LOCAL_COUCHDB_URL != '' &&
    process.env.REMOTE_COUCHDB_URL && process.env.REMOTE_COUCHDB_URL != ''
) {
    nano = Nano(
        `${process.env.TENANT}:${process.env.PASSWORD}@${process.env.LOCAL_COUCHDB_URL}`
    );
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

export default nano;
