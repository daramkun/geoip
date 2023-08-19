import csv from 'csv-parser';
import fs from 'fs';
import net from 'net';

class IpCountryData {
    public startIp : bigint;
    public endIp : bigint;
    public country : string;

    constructor(startIp : bigint, endIp : bigint, country : string) {
        this.startIp = startIp;
        this.endIp = endIp;
        this.country = country;
    }
}

export class IpCountryDb {
    private ipv4 : Array<IpCountryData>;
    private ipv6 : Array<IpCountryData>;

    constructor() {
        this.ipv4 = [];
        this.ipv6 = [];
    }

    public async initialize() {
        await this.parse_csv(this.ipv4, 'node_modules/@ip-location-db/asn-country/asn-country-ipv4-num.csv');
        await this.parse_csv(this.ipv6, 'node_modules/@ip-location-db/asn-country/asn-country-ipv6-num.csv');
    }

    private parse_csv(target_to : Array<IpCountryData>, path : string) : Promise<any> {
        const stream = fs.createReadStream(path).pipe(csv(['startIp', 'endIp', 'country']));

        return new Promise((resolve, reject) => {
            stream
            .on('data', (data) => {
                const asn = new IpCountryData(data.startIp, data.endIp, data.country);
                target_to.push(asn);
            })
            .on('end', () => resolve(undefined));
        });
    }

    public get_country(ip : string) : string | null {
        if (net.isIPv4(ip)) {
            const ipNum = this.ipv4_to_integer(ip);
            return this.find_country(this.ipv4, ipNum, 0, this.ipv4.length);
        } else if (net.isIPv6(ip)) {
            const ipNum = this.ipv6_to_integer(ip);
            return this.find_country(this.ipv6, ipNum, 0, this.ipv6.length);
        }

        return null;
    }

    private find_country(db : Array<IpCountryData>, ipNum : bigint, start : number, end : number) : string | null {
        if (start > end) {
            return null;
        }

        const current = Math.floor((end + start) / 2);
        const data = db[current];

        if (data.startIp <= ipNum && data.endIp >= ipNum) {
            return data.country;
        }

        if (data.startIp > ipNum) {
            return this.find_country(db, ipNum, start, current - 1);
        } else if (data.endIp < ipNum) {
            return this.find_country(db, ipNum, current + 1, end);
        }

        return null;
    }

    private ipv4_to_integer(ip : string) : bigint {
        return BigInt(ip.split('.').reduce((int : number, value : string) => int * 256 + +value, 0));
    }

    private ipv6_to_integer(ip : string) : bigint {
        return ip.split(':').map(str => Number('0x'+str)).reduce((int : bigint, value : number) => int * BigInt(65536) + BigInt(+value), BigInt(0));
    }
}