require('dotenv').config();

const fetch = require('node-fetch');
const express = require('express');
const bodyParser = require('body-parser');
const yaTaxi = require('./lib/yataxi');
const DataBase = require('./lib/db');
const serverHealth = require('server-health');

const app = express();

const delayTime = process.env.DELAY || 30000; // 30 sec
const taxiClass = process.env.TAXI_CLASS || 'econom';

const apiClid = process.env.API_CLID || null;
const apiKey = process.env.API_KEY || null;

if ((apiClid === null) || (apiKey === null))
{
    console.error('Error: apiClid or apiKey is not set');
    process.exit(0);
}

const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

serverHealth.addConnectionCheck('database', async () => {
    const dataBaseStatus = await DataBase.checkStatus();
    if (dataBaseStatus === false)
    {
        console.error('DataBase status check ERROR');
    }
    return dataBaseStatus;
});

serverHealth.exposeHealthEndpoint(app, '/api/health/', 'express');

app.listen(port, host, () => {
    console.log(`Server listens ${host}:${port}`);
});