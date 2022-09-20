/**
 * @author Carl Ingerisch
 * @file
 * Messages class file
 *
*/

'use strict';

const dayjs = require('dayjs'),
      EventEmitter = require('events'),
      constants = require('./../utilities/constants'),
      pipelineMessages = require('./../formatters/pipeline'),
      telemetryBubblesMessages = require('./../formatters/telemetrybubbles'),
      telemetryStatsMessages = require('./../formatters/telemetrystats')
      ;

let interval = null;

class Messages extends EventEmitter {
    constructor(type) {
        super();
        this.created = dayjs();
        this.list = [];
        this.type = type;

        interval = setInterval(this.processMessages, constants.PIPE_MESSAGE_INTERVAL, this);
    }

    get count() {
        return this.list.length;
    }

    Add(message) {
        if(!Array.isArray(this.list)) {
            this.list = [];
        }
        this.list.push(message);
    }

    processMessages(messages) {
        let messagesToSend = messages.list.splice(0, messages.list.length);

        if (messagesToSend.length > 0) {
            console.log(`Sending ${messagesToSend.length} ${messages.type} messages.`);

            let clientsMessages = [];

            switch(messages.type) {
                case 'pipeline':
                    clientsMessages = pipelineMessages.processMessages(messagesToSend);
                    break;
                case 'telemetrystats':
                    clientsMessages = telemetryStatsMessages.processMessages(messagesToSend);
                    break;
                case 'telemetrybubbles':
                    clientsMessages = telemetryBubblesMessages.processMessages(messagesToSend);
                    break;
                }

            clientsMessages.forEach(clientMessage => {
                messages.emit('message', clientMessage);
            });
        }
    }
}

exports.Messages = Messages;
