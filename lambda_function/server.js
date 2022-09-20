const express = require('express');
const cors = require('cors');
const {getActiveContracts, postStatus, postBuy, postRegister} = require('./functions/functions.js');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.set('Content-Type', 'text/html');
    res.status(200).json('dbot');
});
app.get('/contracts', async (req, res) => {
    res.set('Content-Type', 'application/json');
    try {
        let contracts = await getActiveContracts();
        res.status(200).json(contracts);
    }
    catch (error) {
        res.status(500).json(error);
    }
});
app.post('/register', async (req, res) => {
    res.set('Content-Type', 'application/json');
    try {
        await postRegister(req.body);
        res.sendStatus(200);
    }
    catch (error) {
        res.status(500).json(error);
    }
});
app.post('/status', async (req, res) => {
    res.set('Content-Type', 'application/json');
    try {
        let status = await postStatus(req.body);
        res.status(200).json(status);
    }
    catch (error) {
        res.status(500).json(error);
    }
});
app.post('/buy', async (req, res) => {
    res.set('Content-Type', 'application/json');
    try {
        await postBuy(req.body);
        res.sendStatus(200);
    }
    catch (error) {
        res.status(500).json(error);
    }
});

module.exports = app;