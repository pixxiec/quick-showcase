/**
 * @author Carl Ingerisch
 * @file
 * Telemetry bubbles messages formatter file
 *
*/

'use strict';

const constants = require('./../utilities/constants')
      ;

const recentEventsPeriod = process.env.STATS_HISTORY_PERIOD_SECONDS || constants.DEFAULT_STATS_HISTORY_PERIOD_SECONDS;

/**
 * @function processMessages
 * Processes messages for a telemetry message set
 * @param {array} list - The list of messages to process
 */
exports.processMessages = function processMessages(list) {
    let retBubbles = new Bubbles(list);

    retBubbles.Add('bat', 'tbatch');
    retBubbles.Add('trans', 'tpri');
    retBubbles.Add('pub', 'tpub');

    delete retBubbles.data;
    return [ retBubbles ];
};

class Bubbles {
    constructor(data) {
        this.history = {};
        this.data = data;
    }

    Add(name, namespace) {
        this[name] = [];
        this.history[name] = [];
        this.ProcessEventData(name, namespace);
    }

    ProcessEventData(name, namespace) {
        let curTime = new Date();
        let nameSet = [];

        for (let i = 0; i < this.history[name].length; i++) {
            let diff = Math.floor((curTime.getTime() - this.history[name][i].eventTime.getTime()) / 1000);
            if (diff < recentEventsPeriod) {
                nameSet.push(this.history[name][i]);
                this[name].push({
                    eventName: this.history[name][i].eventName,
                    total: 0
                });
            }
        }

        if(this.data.length > 0) {
            let events = this.data.filter(e => e.payload.app.containerName.includes(namespace));
            for (let a = 0; a < events.length; a++) {
                for (let b = 0; b < events[a].payload.events.length; b++) {
                    let eventName = events[a].payload.events[b].eventName;
                    let event = this[name].find(e => e.eventName === eventName);
                    if (event) {
                        event.total = event.total + events[a].payload.events[b].total;
                    }
                    else {
                        event = {
                            eventName: eventName,
                            total: events[a].payload.events[b].total
                        };
                        this[name].push(event);
                    }
    
                    let histEvent = nameSet.find(e => e.eventName === eventName);
                    if (histEvent) {
                        histEvent.eventTime = new Date();
                    }
                    else {
                        histEvent = {
                            eventName: eventName,
                            eventTime: new Date()
                        };
                        nameSet.push(histEvent);
                    }
                }
            }
        }

        this.history[name] = nameSet;
    }
}
