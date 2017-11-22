/*
  1. Account creation reference https://www.stellar.org/developers/guides/get-started/create-account.html
  2. Asset issuing reference https://www.stellar.org/developers/guides/issuing-assets.html
*/

var StellarSdk = require('stellar-sdk');
var request = require('request');

var horizonTestnet = 'https://horizon-testnet.stellar.org';
var horizonTestnetFriendbot = 'https://horizon-testnet.stellar.org/friendbot';

var server = new StellarSdk.Server(horizonTestnet);

var issuerPub;
var issuerPriv;

var chunkAsset;


window.app = {
  start: function () {
    var self = this;

    // Use test network, comment if real network is needed
    StellarSdk.Network.useTestNetwork();

    // Creating a new account
    var pair = StellarSdk.Keypair.random();
    issuerPriv = pair.secret();
    issuerPub = pair.publicKey();

    // Request account creation to horizon testnet friendbot,
    // if succesfull, show account information
    request.get({
      url: horizonTestnetFriendbot,
      qs: { addr: issuerPub },
      json: true
    }, function(error, response, body) {
      if (error || response.statusCode !== 200) {
        console.error('ERROR!', error || body);
      }
      else {
        server.loadAccount(issuerPub).then(function(account) {
          console.log('Balances for account: ' + pair.publicKey());
          account.balances.forEach(function(balance) {
            console.log('Type:', balance.asset_type);
            console.log('Balance:', balance.balance);
          });
        });
      }
    });

    chunkAsset = new StellarSdk.Asset('CO2C', issuerPub);
  }
}


window.addEventListener('load', function() {
  app.start();
})



// Async friendbot call
// const request = require('request-promise');
// const StellarSdk = require('stellar-sdk');
// const pair = StellarSdk.Keypair.random();
// console.log(pair.secret(), pair.publicKey());
//
// request({
//   url: 'https://horizon-testnet.stellar.org/friendbot',
//   qs: { addr: pair.publicKey() },
//   json: true
// })
// .then(function() {
//   const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
//   server.loadAccount(pair.publicKey())
//     .then(function(account) { console.log(account); });
// });
