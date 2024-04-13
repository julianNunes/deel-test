const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./model.js')
const routes = require('./routes.js')
const app = express();

app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)
app.use('', routes)
module.exports = app;
