import { Injectable } from '@nestjs/common';
import { readFileSync, existsSync } from "fs";
import { writeFile } from "fs/promises";
import { join, dirname } from 'path'

export interface data {
    // ID map is a map that corresponds the appointment ID to the etag
    idToURLMap: {
        [id: string]: string
    }
}

@Injectable()
export class DbService {

    db: data;
    file = join("..", "db", 'db.json');

    constructor() {
        this.readDB();       
    }


    readDB() {
        // Use JSON file for storage
        if (existsSync(this.file)) {
            const jsonStr = readFileSync(this.file, { encoding: "utf8" });
            this.db = JSON.parse(jsonStr);
            this.db ||= { idToURLMap: {} }
        }
        else {
            this.db = { idToURLMap: {} }
        }
        

        console.log(this.db)
    }

    writeDB() {
        return writeFile(this.file, JSON.stringify(this.db), {encoding: "utf8"});
    }

    isIDinDB(id: string) {
        return id in this.db;
    }

    addEntry(id: string, url: string) {
        this.db[id] = url;
    }

    getIDDAVURL(id: string) {
        return this.db[id];
    }
}
