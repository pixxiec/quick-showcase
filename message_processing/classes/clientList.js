/**
 * @author Carl Ingerisch
 * @file
 * Client list class file
 *
*/

'use strict';

const dayjs = require('dayjs')
      ;

class ClientList {
    constructor() {
        this.created = dayjs();
        this.clients = [];
    }

    get count() {
        return this.clients.length;
    }

    Add(client) {
        if(!Array.isArray(this.clients)) {
            this.clients = [];
        }
        this.clients.push(client);
    }

    Remove(client) {
        let i = this.clients.map(e => e.id).indexOf(client.id);
        if (i >= 0) {
            this.clients.splice(i, 1);
        }
    }
}

exports.ClientList = ClientList;
