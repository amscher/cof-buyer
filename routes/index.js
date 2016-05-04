var express = require('express');
var router = express.Router();

var app = express();
var config = {
  "squareApplicationId": "sq0idp-xbQIz_OU5yqnYiiYrcL9xQ",
  "squareAccessToken": "sq0atp-PnnRVfzNHYPNwxd0UU1Jhg"
}

//require('.././config.json')[app.get('env')];

var unirest = require('unirest');
var base_url = "https://connect.squareup.com/v2";


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'CoF' , 'square_application_id': config.squareApplicationId });
});

/* SQ Merchant Name. */
// router.get('/', function(req, res, next) {
//   res.json();
// });

/* SQ CUSTOMERS API CALLS */
router.get('/customers', function(req, res, next) {

  unirest.get(base_url + '/customers')
  .headers({
    'Authorization': 'Bearer ' + config.squareAccessToken,
    'Accept': 'application/json',
  })
  .end(function (response) {
    var customers = response.body.customers;
    console.log(response.body);
    res.json(customers);
  });
});

/* SQ CUSTOMERS API CALLS */
router.get('/customers/:customer', function(req, res, next) {

  unirest.get(base_url + '/customers/' + req.params.customer)
  .headers({
    'Authorization': 'Bearer ' + config.squareAccessToken,
    'Accept': 'application/json',
  })
  .end(function (response) {
    var customer = response.body.customer;
    console.log(customer);
    res.json(customer);
  });
});


/* SQ Add customer */
router.post('/customers', function(req, res, next) {
  var request_body = req.body;

  unirest.post(base_url + '/customers')
    .headers({
      'Authorization': 'Bearer ' + config.squareAccessToken,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    })
    .send(request_body)
    .end(function(response){
      if (response.body.errors){
        res.json({status: 400, errors: response.body.errors})
      }else{
        res.json({status: 200, customer:response.body.customer})
      }
    });
});

/* SQ Add card to customer */
router.post('/customers/:customer/cards', function(req, res, next) {
  var request_params = req.body;

  request_body = {
    card_nonce: request_params.nonce,
    cardholder_name: request_params.customer.give_name + ' ' + request_params.customer.family_name
  }

  unirest.post(base_url + '/customers/' + request_params.customer.id + "/cards")
    .headers({
      'Authorization': 'Bearer ' + config.squareAccessToken,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    })
    .send(request_body)
    .end(function(response){
      if (response.body.errors){
        res.json({status: 400, errors: response.body.errors})
      }else{
        res.json({status: 200, card:response.body})
      }
    });
});

/* Delete card from customer */
router.delete('/customers/:customer/cards/:card', function(req, res, next) {
  console.log(req.params.customer);
  unirest.delete(base_url + '/customers/' + req.params.customer + "/cards/" + req.params.card)
    .headers({
      'Authorization': 'Bearer ' + config.squareAccessToken,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    })
    .end(function(response){
      if (response.body.errors){
        res.json({status: 400, errors: response.body.errors})
      }else{
        res.json({status: 200})
      }
    });
});

module.exports = router;
