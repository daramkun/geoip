import express, {Express, Request, Response} from 'express';
import {IpCountryDb} from './ipcountry';

console.log('==============================');
console.log('                    __        ');
console.log('.-----.-----.-----.|__|.-----.');
console.log('|  _  |  -__|  _  ||  ||  _  |');
console.log('|___  |_____|_____||__||   __|');
console.log('|_____|                |__|   ');
console.log('==============================');

const app = express();
const ipCountryDb = new IpCountryDb();

function get_ip(req: Request) : string {
    console.log(`X-Real-IP: ${req.headers['x-real-ip']}`);
    console.log(`X-Forwarded-For: ${req.headers['x-forwarded-for']}`);
    console.log(`Socket Address: ${req.socket.remoteAddress}`);
    let ip = req.headers['x-real-ip']?.toString() ?? req.headers['x-forwarded-for']?.toString() ?? req.socket.remoteAddress ?? "";
    if (ip.startsWith("::ffff:")) {
        ip = ip.substring("::ffff:".length);
    }

    return ip;
}

app.get('/ip', (req: Request, res: Response) => {
    const ip = get_ip(req);
    res.send({"ip": ip});
});
app.get('/country', (req: Request, res: Response) => {
    const ip = get_ip(req);
    const country = ipCountryDb.get_country(ip);

    res.send({"ip": ip, "country": country});
});
app.get('/country/:ip', (req: Request, res: Response) => {
    const ip = req.params.ip ?? get_ip(req);
    const country = ipCountryDb.get_country(ip);
    res.send({"ip": ip, "country": country});
});

app.listen(7890, async () => {
    console.log('IP-Country Database Initializing...');
    await ipCountryDb.initialize();
    console.log('IP-Country Database Initialized.');
});