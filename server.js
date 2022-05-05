const { exit } = require('process')
const express = require('express')
const app = express()
const morgan = require('morgan')
const fs = require('fs')

const args = require('minimist')(process.argv.slice(2), {
    boolean: ['debug', 'log'],
    default: {
        debug: false,
        log: false,
    }
}) 
args['port', 'log', 'debug']

if (args.help) {
    console.log(
        "server.js [options] \n" + 
        "\n" +
        "\t --port \t Set the port number for the server to listen on. must be an integer between 1 and 65535.\n" +
        "\t --debug \t If set to `true`, creates endpoints /app/log/access/ which returns a JSON access log from the database and /app/error/ which throws an error with the message " +
            "\"Error test successful.\" " + "Defaults to `false`. \n" +
        "\t --log \t If set to false, no log files are written. Defaults to 'true'. Logs are always written to database. \n" +
        "\t --help \t Return this message and exit."
    )
    exit(0);
}

const database = require('./database')

app.use(express.urlencoded({extended: true}))
app.use(express.json())

// Handling Port for App to Listen
const port = args.port|| 5555

const server = app.listen(port, () => {
    console.log('App is running on port %PORT%'.replace('%PORT%', port))
})

app.use((req, res, next) => {
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        secure: req.secure,
        status: res.statusCode,
        referer: req.headers['referer'],
        useragent: req.headers['user-agent']
    }

    const stmt = database.prepare('INSERT INTO accesslog (remote_addr, remote_user, time, method, url, protocol, http_version, secure, status, referer_url, user_agent) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    stmt.run(logdata.remoteaddr, String(logdata.remoteuser), logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, String(logdata.secure), logdata.status, logdata.referer, logdata.useragent);
    next();
})

if(args.log == true) {
    const accesslog = fs.createWriteStream('access.log', {flags: 'a'});
    app.use(morgan('combined', {stream: accesslog }))
}

if(args.debug == true) {
    app.get('/app/log/access', (req, res) => {
        try {
            const stmt = database.prepare('SELECT * FROM accesslog').all();
            res.status(200).json(stmt)
        } catch(e) {
            console.error(e)
        }
    })
    
    app.get('/app/error', (req, res) => {
        throw new Error("Error test successful.")
    })
}