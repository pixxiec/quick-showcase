'use strict';

const dao = require('./dynamodao.js');

async function getContracts() {
    try {
        const allContracts = await dao.scanData('dbotcontracts-c134f64ece7a4e84a5801a932546d542');
        return allContracts;
    }
    catch (error) {
        throw error;
    }
};

async function getUsers() {
    try {
        const allUsers = await dao.scanData('dbotusers-9eb51498321a498c8ee611bc13060206');
        return allUsers;
    }
    catch (error) {
        throw error;
    }
};

async function registerUser(user) {
    //add in check for existing users
    await dao.putData('dbotusers-9eb51498321a498c8ee611bc13060206', user);
};

async function getHits(contracts) {
    try {
        if(Array.isArray(contracts)) {
            const contractHits = await dao.batchGet('dbothits-99f829357fd54d7182adbfd91599ac1c', contracts, 'contract');
            return contractHits;
        }
        else {
            const allHits = await dao.scanData('dbothits-99f829357fd54d7182adbfd91599ac1c');
            return allHits;
        }
    }
    catch (error) {
        throw error;
    }
};

async function getLedger() {
    try {
        const allLedger = await dao.scanData('dbotledger-2a4ead742714479d94381da21085c739');
        return allLedger;
    }
    catch (error) {
        throw error;
    }
};

async function createContract(contract) {
    await dao.putData('dbotcontracts-c134f64ece7a4e84a5801a932546d542', contract);
};

module.exports = {
    getContracts,
    getUsers,
    registerUser,
    getHits,
    getLedger,
    createContract,
};
