var app = angular.module('cof-buyer', ['ui.router', 'firebase']);

app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('login');
}]);

app.run(['$rootScope', '$firebaseAuth', '$state', function($rootScope, $firebaseAuth, $state) {
  $rootScope.$on('$stateChangeStart', function (event, toState) {
    var ref = new Firebase("https://radiant-heat-3970.firebaseio.com");
    if(toState.name.indexOf('customers') !== -1 ) {
      if(!ref.getAuth()) $state.go('login', {});
    }
  });
}]);


/* Customers Factory */
app.factory('customers', ['$http', '$firebaseAuth', '$state', function($http, $firebaseAuth, $state){

  var o = {
    customers: [],
    customer: {},
  };

  o.getAll = function() {
    return $http.get('/customers').success(function(data) {
      angular.copy(data, o.customers);
    });
  }

  o.getByEmail = function(email, firstName, lastName) {
    return $http.get('/customers?email=' + email + '&givenName=' + firstName + "&familyName=" + lastName).success(function(data) {
      angular.copy(data, o.customer);
    });
  }

  // Check Auth!!!!!!
  o.getLoggedInCustomer = function() {
    if (o.customer.id) return o.customer;
    /*---------- AUTH------------*/
    var ref = new Firebase("https://radiant-heat-3970.firebaseio.com");
    // create an instance of the authentication service
    var authData = ref.getAuth();
    console.log(authData);
    if (authData) {
      console.log("User " + authData.uid + " is logged in with " + authData.provider);
      var displayName = authData.google.displayName;
      var firstName = displayName.split(' ')[0];
      var lastName = displayName.split(' ')[1];
      return o.getByEmail(authData.google.email, firstName, lastName);
    } else {
      console.log("Not authenticated")
      $state.transitionTo('login');
      return null;
    }
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
  '$firebaseAuth',
  'customers',
  function($scope, $window, $firebaseAuth, customers) {


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
