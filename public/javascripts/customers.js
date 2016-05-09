'use strict';

angular.module('cof-buyer')
  .config(function ($stateProvider) {
    $stateProvider.state('customers', {
      url: '/customers',
      templateUrl: '../partials/customers.ejs',
      controller: 'CustomerCtrl',
      resolve: {
        customerPromise: ['$state', '$firebaseAuth', 'customers', function($state, $firebaseAuth, customers) {
          var ref = new Firebase("https://radiant-heat-3970.firebaseio.com");
          if(!ref.getAuth()) {
            $state.go('login', {});
            return null;
          }
          return customers.getLoggedInCustomer();
        }]
      }
    });
  })
  /* Customer app controller */
  .controller('CustomerCtrl', [
    '$scope',
    '$firebaseAuth',
    '$state',
    'customers',
    function($scope, $firebaseAuth, $state, customers) {
      $scope.ref = new Firebase("https://radiant-heat-3970.firebaseio.com");

      // console.log(customers.customer);
      $scope.customer = customers.customer;

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

      $scope.logout = function() {
        $scope.ref.unauth();
        $scope.customer = null;
        customers.customer = {};
        $state.go('login');
      }

    }]);

