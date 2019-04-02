// Based on https://adrianmejia.com/blog/2016/08/24/building-a-node-js-static-file-server-files-over-http-using-es6/
import * as http from 'http';
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import {Server} from "http";

// maps file extention to MIME types
const mimeType = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.eot': 'appliaction/vnd.ms-fontobject',
    '.ttf': 'aplication/font-sfnt'
};

const DIR = '../fixture';

function respondNotFound(res, pathname) {
    res.statusCode = 404;
    res.end(`File ${pathname} not found!`);
    return;
}

function handler(req, res) {

    // parse URL
    const parsedUrl = url.parse(req.url);

    // extract URL path
    // Avoid https://en.wikipedia.org/wiki/Directory_traversal_attack
    // e.g curl --path-as-is http://localhost:9000/../fileInDanger.txt
    // by limiting the path to current directory only
    const sanitizePath = path.normalize(parsedUrl.pathname).replace(/^(\.\.[\/\\])+/, '');
    let pathname = path.join(__dirname, DIR, sanitizePath);

    // check if path exists
    if(!fs.existsSync(pathname)) {
        return respondNotFound(res, pathname);
    }

    // if is a directory, then look for index.html
    if (fs.statSync(pathname).isDirectory()) {
        pathname += '/index.html';
        if(!fs.existsSync(pathname)) {
            return respondNotFound(res, pathname);
        }
    }

    // read file from file system
    let data;
    try {
        data = fs.readFileSync(pathname);
    } catch (err) {
        res.statusCode = 500;
        res.end(`Error getting the file: ${err}.`);
        return;
    }

    // based on the URL path, extract the file extention. e.g. .js, .doc, ...
    const ext = path.parse(pathname).ext;
    // if the file is found, set Content-type and send data
    res.setHeader('Content-type', mimeType[ext] || 'text/plain' );
    res.end(data);

}

let server: Server;

export async function startServer(port = 9000): Promise<any> {
    if (server) return;
    server = http.createServer(handler);
    await util.promisify(server.listen.bind(server))(port);
    console.log(`Server listening on port ${port}`);
}

export async function stopServer(): Promise<void> {
    if (server) {
        server.close();
        server = null;
    }
}

if (require.main === module) {
    const port = parseInt(process.argv[2]) || undefined;
    startServer(port);
}

