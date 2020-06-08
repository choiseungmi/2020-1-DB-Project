const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
var fs = require("fs");
app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.urlencoded({
  extended: false
})); //post에서bodyparser로 받기 위함

var price;
var shape = [];
var kinds = [];

app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.render('index.html', {title: "슬기로운 격리생활", description:"dsgd",randvalue:'sds' });
})


app.listen(app.get('port'), () => {
  console.log('running on port', app.get('port'));
})
