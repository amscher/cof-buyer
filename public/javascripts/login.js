'use strict';

angular.module('cof-buyer')
  .config(function ($stateProvider) {
    $stateProvider
      .state('login', {
        url: '/login',
        templateUrl: '../partials/login.ejs',
        controller: 'LoginCtrl',
        resolve: {
          customerPromise: ['customers', function(customers) {
            return customers.getAll();
          }]
        }
      });
  })
  .controller('LoginCtrl',['$scope', '$http', '$state', '$location', 'customers', '$firebaseAuth', 
    function ($scope, $http, $state, $location, customers, $firebaseAuth) {
    $scope.customers = customers.customers;

    /*---------- AUTH------------*/
    var ref = new Firebase("https://radiant-heat-3970.firebaseio.com");

    // create an instance of the authentication service
    var auth = $firebaseAuth(ref);
    // login with Google
    $scope.login = function() {
      auth.$authWithOAuthPopup("google", {
        remember: "sessionOnly",
        scope: "email"
      }).then(function(authData) {
        // console.log(authData.google.email);
        var displayName = authData.google.displayName;
        var firstName = displayName.split(' ')[0];
        var lastName = displayName.split(' ')[1];
        // console.log(firstName + ' ' + lastName);
        // console.log("Logged in as:", authData.uid);
        // var customer = $scope.customerByEmail(authData.google.email);
        customers.getByEmail(authData.google.email, firstName, lastName)
            .then(function() {
              $state.go('customers');
            })

      }).catch(function(error) {
        console.log("Authentication failed:", error);
      });
    }
  }]);