/**
 * @author Carl Ingerisch
 * @file
 * Pipeline messages formatter file
 *
*/

'use strict';

/**
 * @function processMessages
 * Processes messages for a pipeline message set
 * @param {array} list - The list of messages to process
 */
exports.processMessages = function processMessages(list) {
    let retList = [];
    list.forEach(item => {
        let msg = retList.find(e => e.clientId === item.clientId && e.pipelineId === item.pipe.pipelineId); 
        if (!msg) {
            retList.push({
                clientId: item.clientId,
                pipelineId: item.pipe.pipelineId,
                messages: [
                    item
                ]
            });
        }
        else {
            retList.messages.push(item);
        }
    });

    return retList;
};
