var app = angular.module('cof-buyer', ['ui.router']);

app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('home', {
      url: '/home',
      templateUrl: '../partials/home.ejs',
      controller: 'MainCtrl',
      resolve: {
        customerPromise: ['customers', function(customers) {
          return customers.getAll();
        }]
      }
    })
    .state('customers', {
      url: '/customers/{id}',
      templateUrl: '../partials/customers.ejs',
      controller: 'CustomerCtrl',
      resolve: {
        customer: ['$stateParams', 'customers', function($stateParams, customers) {
          return customers.get($stateParams.id);
        }]
      }
    })

  $urlRouterProvider.otherwise('home');
}]);

/* Posts Factory */
app.factory('customers', ['$http', function($http){

  var o = {
    customers: []
  };

  o.getAll = function() {
    return $http.get('/customers').success(function(data) {
      angular.copy(data, o.customers);
    });
  }

  o.getCards = function(customer) {
    return $http.get('/customers/' + customer.id ).success(function(data) {
      angular.copy(data, customer);
    });
  }

  o.get = function(id) {
    return $http.get('/customers/' + id).then(function(res) {
      // console.log(res.data);
      return res.data;
    });
  }

  o.post = function(email, first_name, last_name) {
    return $http.post('/customers', {
      "email_address": email,
      "given_name": first_name,
      "family_name": last_name
    })
    .then(function(res) {
      // console.log(res.data.customer);
      return res.data.customer;
    });;
  }

  o.addCard = function(customer, nonce) {
    return $http.post('/customers/' + customer.id + '/cards', {
      "customer": customer,
      "nonce": nonce
    })
    .success(function(data) {
      o.getCards(customer);
    });;
  }

  o.deleteCard = function(customer, card) {
    return $http.delete('/customers/' + customer.id + '/cards/' + card.id)
    .success(function(data) {
      // console.log(data);
    });;
  }

  return o;
}]);


/* Main app controller */
app.controller('MainCtrl', [
  '$scope',
  '$window',
  'customers',
  function($scope, $window, customers) {
    $scope.customers = customers.customers;
    $scope.filtered_customers = [];
    $scope.show_add_customer = false;

    var resetFields = function(){
      $scope.filtered_customers = [];
      $scope.add_card_success = false;
      $scope.show_add_customer = false;
    }

    $scope.customersByEmail = function() {
      resetFields();
      var customerArr = [];
      for(var i in $scope.customers) {
        var customer = $scope.customers[i];
        if(customer.email_address == $scope.email) {
          customerArr.push(customer);
        }
      }
      if (customerArr.length == 0) {
        $scope.show_add_customer = true;
      } else if (customerArr.length == 1) {
        $window.location.assign('#/customers/' + customerArr[0].id);
        return;
      }
      $scope.filtered_customers = customerArr;
      $scope.email = '';
    }

    $scope.addCustomer = function() {
      resetFields();
      customers.post($scope.email, $scope.first_name, $scope.last_name)
        .then(function(customer) {
          $window.location.assign('#/customers/' + customer.id);
        });
    }

  }]);



/* Customer app controller */
app.controller('CustomerCtrl', [
  '$scope',
  'customers',
  'customer',
  function($scope, customers, customer) {
    $scope.customer = customer;

    $scope.paymentCardNonce = null;
    $scope.paymentForm = null;
    $scope.show_payment_form = false;
    $scope.add_card_success = false;
    $scope.show_add_customer = false;
    $scope.card_icons = {
      "AMERICAN_EXPRESS" : "../images/Amex.png",
      "VISA" : "../images/Visa.png",
      "MASTER_CARD" : "../images/Mastercard.png",
      "DISCOVER" : "../images/Discover.png",
    };

    var resetFields = function(){
      $scope.paymentCardNonce = null;
      $scope.paymentForm = null;
      $scope.show_payment_form = false;
      $scope.add_card_success = false;
      $scope.show_add_customer = false;
    }

    var newPaymentForm = function() {
      return new SqPaymentForm({
        applicationId: 'sq0idp-0H4tmUZMLoKHfWYfWcFc2g', // <-- REQUIRED: Add Application ID
        inputClass: 'form-control',
        inputStyles: [
          {
            fontSize: '15px'
          }
        ],
        cardNumber: {
          elementId: 'sq-card-number',
          placeholder: '•••• •••• •••• ••••'
        },
        cvv: {
          elementId: 'sq-cvv',
          placeholder: 'CVV'
        },
        expirationDate: {
          elementId: 'sq-expiration-date',
          placeholder: 'MM/YY'
        },
        postalCode: {
          elementId: 'sq-postal-code',
          placeholder: '94110'
        },
        callbacks: {
          cardNonceResponseReceived: function(errors, nonce, cardData) {
            if (errors) {
              // handle errors
              errors.forEach(function(error) { console.log(error.message); });
            } else {
              // handle nonce
              $scope.paymentCardNonce = nonce;
              customers.addCard($scope.customer, nonce);
              $scope.togglePaymentForm();
              $scope.add_card_success = true;
              console.log('Nonce received:');
              // console.log(nonce);
            }
          },
          unsupportedBrowserDetected: function() {
            // Alert the buyer that their browser is not supported
          }
        }
      });
    };

    $scope.togglePaymentForm = function() {
      if ($scope.show_payment_form) {
        $scope.show_payment_form = false;
        $scope.paymentForm.destroy();
        $scope.paymentForm = null;
      } else {
        $scope.paymentForm = new newPaymentForm();
        $scope.paymentForm.build();
        $scope.show_payment_form = true;
        $scope.add_card_success = false;
      }
    }

    // $scope.toggleCustomer = function(customer) {
    //   if ($scope.selected_customer != customer) {
    //     $scope.selected_customer = customer;
    //   } else {
    //     $scope.selected_customer = null;
    //   }
    // }

    $scope.removeCard = function(index) {
      var card = $scope.customer.cards[index];
      customers.deleteCard($scope.customer, card)
        .success(function(index) {
          $scope.customer.cards.splice(index, 1);
        });
    }


    $scope.requestCardNonce = function() {
      $scope.paymentForm.requestCardNonce();
    }

  }]);

/* Auth factory */
// app.factory('auth', ['$http', '$window', function($http, $window) {
//   var auth = {};

//   auth.saveToken = function(token) {
//     $window.localStorage['flapper-news-token'] = token;
//   }

//   auth.getToken = function() {
//     return $window.localStorage['flapper-news-token'];
//   }

//   auth.isLoggedIn = function() {
//     var token = auth.getToken();

//     if(token){
//       var payload = JSON.parse($window.atob(token.split('.')[1]));

//       return payload.exp > Date.now() / 1000;
//     } else {
//       return false;
//     }
//   }

//   return auth;
// }]);
