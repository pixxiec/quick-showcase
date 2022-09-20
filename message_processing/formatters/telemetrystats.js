/**
 * @author Carl Ingerisch
 * @file
 * Telemetry statistics messages formatter file
 *
*/

'use strict';

/**
 * @function processMessages
 * Processes messages for a telemetry message set
 * @param {array} list - The list of messages to process
 */
exports.processMessages = function processMessages(list) {
    let returnStats = new Stats(list);

    returnStats.Add('bat', 'tbatch');
    returnStats.Add('trans', 'tpri');
    returnStats.Add('pub', 'tpub');

    delete returnStats.data;
    return [ returnStats ];
};

class Stats {
    constructor(data) {
        this.data = data;
        this.total = new Stat();
        this.all = new Stat();
        this.all.Populate('', data);
    }

    Add(obj, name) {
        let s = new Stat();
        s.Populate(name, this.data);
        this[obj] = s;
        let thisTotals = this.total;
        Object.keys(thisTotals).forEach((key) => {
            thisTotals[key] += s[key];
        });
    }
}

class Stat {
    constructor() {
        this.events  = 0;
        this.pd      = 0;
        this.errors  = 0;
        this.cpu     = 0;
        this.mem     = 0;
        this.network = 0;
    }

    Populate(container, data) {
        if(Array.isArray(data) && data.length > 0) {
            let cs = data.filter(e => e.payload.app.containerName.includes(container));
            if(cs.length > 0) {
                this.events  = cs.reduce((a, b) => a + b.payload.totalEvents, 0);
                this.pd      = cs.reduce((a, b) => a + b.payload.totalPII, 0);
                this.errors  = cs.reduce((a, b) => a + b.payload.totalErrors, 0);
                this.cpu     = Math.round((cs.reduce((a, b) => a + b.payload.perf.cpu.load, 0) / cs.length)*100)/100;
                this.mem     = Math.round(((cs.reduce((a, b) => a + b.payload.perf.mem.used, 0) / cs.reduce((a, b) => a + b.payload.perf.mem.total, 0)) * 100)*100)/100;
                this.network = Math.round((cs.reduce((a, b) => a + b.payload.perf.network.receive.data, 0) / 1024)*100)/100;
            }
        }
    }
}