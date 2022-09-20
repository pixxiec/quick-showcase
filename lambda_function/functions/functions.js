'use strict';

const {getContracts, getUsers, registerUser, getHits, getLedger, createContract} = require('./datarepo.js'),
      moment = require('moment'),
      { randomUUID } = require('crypto');

async function getActiveContracts() {
    try {
        const contracts = await getContracts();
        const users = await getUsers();
        const activeContracts = contracts.Items
            .filter((contract) => contract.active && contract.end == null)
            .map(contract => ({ ...contract, buyername: users.Items.find((user) => user.id === contract.buyer).name}));

        return activeContracts;
    }
    catch (error) {
        throw error;
    }
};

async function postRegister(user) {
    try {
        await registerUser(user);
    }
    catch (error) {
        throw error;
    }
};

async function postStatus(user) {
    try {
        const status = {user: {}, contracts: {buyer: {total: 0, paid: 0}, seller: {total: 0, sold: 0}}, hits: {}};

        const users = await getUsers();
        const thisUser = users.Items.find((u) => u.discord.id === user.discord.id && u.discord.tag === user.discord.tag);
        status.user.id = thisUser.id;
        status.user.name = thisUser.name;
        status.user.added = thisUser.added;

        const contracts = await getContracts();
        let userContracts = contracts.Items
            .filter((contract) => contract.buyer === status.user.id);
        status.contracts.buyer.total = userContracts.length;
        status.contracts.buyer.active = userContracts.filter(c => c.active).length;
        status.contracts.buyer.paidfor = userContracts.filter(c => c.paidfor).length;
        status.contracts.buyer.paidout = userContracts.filter(c => c.paidout).length;
        status.contracts.buyer.notpaidout = userContracts.filter(c => !c.paidout).length;

        const hits = await getHits();
        const userHits = hits.Items.filter((h) => h.seller === status.user.id);
        status.hits.total = userHits.length;
        const userHitsContracts = userHits.map(hit => hit.contract)
        const userHitsUniqueContracts = [... new Set(userHitsContracts)];
        userContracts = contracts.Items
            .filter((contract) => userHitsUniqueContracts.includes(contract.id));
        status.contracts.seller.total = userContracts.length;
        status.contracts.seller.active = userContracts.filter(c => c.active).length;
        status.contracts.seller.paidfor = userContracts.filter(c => c.paidfor).length;
        status.contracts.seller.paidout = userContracts.filter(c => c.paidout).length;
        status.contracts.seller.notpaidout = userContracts.filter(c => !c.paidout).length;

        const ledger = await getLedger();
        const userLedger = ledger.Items
            .filter((entry) => entry.user === status.user.id);
        userLedger
            .map((entry) => {
                if(entry.receive) {
                    status.contracts.buyer.paid += entry.receive;
                }
                if(entry.pay) {
                    status.contracts.seller.sold += entry.pay;
                }
            });

        return status;
    }
    catch (error) {
        throw error;
    }
}

async function postBuy(contract) {
    try {
        let newContract = {
            id: randomUUID(), 
            active: false, 
            added: moment().unix().toString(), 
            hitsrequired: contract.hits, 
            hitstaken: 0, 
            paidfor: false,
            type: contract.type, 
            notes: contract.notes
        };

        const users = await getUsers();
        const thisUser = users.Items.find((u) => u.discord.id === contract.user.discord.id && u.discord.tag === contract.user.discord.tag);
        newContract.buyer = thisUser.id;

        await createContract(newContract);
    }
    catch (error) {
        throw error;
    }
}


module.exports = {
    getActiveContracts,
    postRegister,
    postStatus, 
    postBuy
};
