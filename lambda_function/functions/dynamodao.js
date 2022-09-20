'use strict';

const AWS = require('aws-sdk'),
    helper = require('./helper.js')
    ;

AWS.config.update({ region: 'eu-west-1' });

const dynamoDBClient = new AWS.DynamoDB.DocumentClient();

async function queryData(table, conditions) {
    const parameters = {
        TableName: table,
        ...conditions
    };

    try {
        const data = await dynamoDBClient.query(parameters).promise();
        return data;
    }
    catch (error) {
        throw error;
    }
};

async function scanData(table) {
    const parameters = {
        TableName: table
    };

    try {
        const data = await dynamoDBClient.scan(parameters).promise();
        return data;
    }
    catch (error) {
        throw error;
    }
};

async function batchGet(table, keys, keyname) {
    const parameters = {
        RequestItems: {
            [table]: {
                Keys: []
            }
        }
    };

    keys.forEach((k) => {
        parameters[table].Keys.push({[keyname]: {S: k}});
    });

    try {
        const data = await dynamoDBClient.batchGetItem(parameters).promise();
        return data;
    }
    catch (error) {
        throw error;
    }
};

async function putData(table, data) {
    const parameters = {
        TableName: table, 
        Item: data
    };

    try {
        const data = await dynamoDBClient.put(parameters).promise();
        return data;
    }
    catch (error) {
        throw error;
    }
};

async function update(table, id, data) {
    const alpharray = new Array( 26 ).fill( 1 ).map( (_, i) => String.fromCharCode( 97 + i ) );
    let updateExpression = [];
    let expressionAttributeValues = {};
    let expressionAttributeNames = {};

    Object.keys(data).forEach(function(element, index) {
        if (helper.isDynamoReserved(element)) {
            let reservedElement = `#${element}element`;
            updateExpression.push(`${reservedElement} = :${alpharray[index]}`);
            expressionAttributeNames[reservedElement] = element;
        }
        else {
            updateExpression.push(`${element} = :${alpharray[index]}`);
        }
        expressionAttributeValues[`:${alpharray[index]}`] = data[element];
    });

    const parameters = {
        TableName: table,
        Key: {
            id
        },
        UpdateExpression: updateExpression.join(', '),
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: expressionAttributeNames,
        ReturnValues: 'UPDATED_NEW'
    };

    try {
        await dynamoDBClient.update(parameters).promise();
    }
    catch (error) {
        throw error;
    }
};

module.exports = {
    queryData,
    scanData,
    batchGet,
    putData,
    update
};
