/**
 * @author Carl Ingerisch
 * @file
 * Client class file
 *
*/

'use strict';

const dayjs = require('dayjs'),
      { v4: uuidv4 } = require('uuid'),
      EventEmitter = require('events'),
      constants = require('./../utilities/constants')
      ;

class Client extends EventEmitter {
    constructor(client) {
        super();
        Object.assign(this, client);
        if(client.hasOwnProperty('id')) {
            this._id = client.id;
        }
        else {
            this._id = uuidv4().toString();
        }

        if(!this.type) {
            this.type = 'data';
        }

        if(!this.created) {
            this.created = dayjs();
        }

        if(client.tacAuthDetails && client.tacAuthDetails.exp) {
            this.expires = dayjs().add(client.tacAuthDetails.exp, 'second');
        }

        this.interval = setInterval(this.checkExpiry, constants.CLIENT_EXPIRY_INTERVAL, this);
    }

    get id() {
        return this._id;
    }

    set id(value) {
        this._id = value;
    }

    setType(value) {
        switch(value) {
            case 'telemetry':
              this.type = value;
              break;
            case 'pipeline':
              this.type = value;
              break;
            default:
              this.type = 'data';
          }
    }

    checkExpiry(client) {
        if(dayjs().isAfter(client.expires)) {
            client.emit('disconnect');
            clearInterval(client.interval);
        }
    }
}

exports.Client = Client;
