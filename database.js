const database = require('better-sqlite3');
const { appendFile } = require('fs');

const logdb = new database('log.db')

const row = logdb.prepare(`SELECT name FROM sqlite_master WHERE type='table' and name='accesslog'; `).get();

if (row == undefined){
    console.log('Log database appears to be empty. Creating log database...')

    const sqlInit = `
        CREATE TABLE accesslog (
            id INTEGER PRIMARY KEY,
            remote_addr VARCHAR,
            remote_user VARCHAR,
            time VARCHAR,
            method VARCHAR,
            url VARCHAR,
            protocol VARCHAR,
            http_version NUMERIC,
            secure INTEGER,
            status INTEGER,
            referer VARCHAR,
            user_agent VARCHAR
        );
    `
        
    logdb.exec(sqlInit);
}
else{
    console.log('Log database found!')
}

module.exports = logdb;
