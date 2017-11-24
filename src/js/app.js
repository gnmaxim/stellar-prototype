/*
  1. Account creation reference https://www.stellar.org/developers/guides/get-started/create-account.html
  2. Asset issuing reference https://www.stellar.org/developers/guides/issuing-assets.html
  3. Attaching data
    - https://galactictalk.org/d/433-stellar-should-have-a-big-memo-or-data
    -
*/

/*
Issuer: GDKKLOMGRKNM7LPA57VQB2YVIYAMWMTKYXROSEUN2SJ4ZRRIQJQM6WQE
        SA2B2CJAKHPH42ADUAVTS2WPXU7QCUDBST6QPY7LZ7ODWEOILCKSK3JZ

Owner: GAGNQJOK6KZDXAIUXLJD6D52HNSTAL5PQVZ5R24ZO44H3C2VZREVO457
       SAWC5AWIO6KQSKTWRVBFE5A25SDHCWMS2IP6HLO34HM6LZWLENASDJJP
*/

var request = require('request');
var crypto = require('crypto')
var StellarSdk = require('stellar-sdk');

var horizonTestnet = 'https://horizon-testnet.stellar.org';
var horizonTestnetFriendbot = 'https://horizon-testnet.stellar.org/friendbot';

var server = new StellarSdk.Server(horizonTestnet);

var issuerPub = 'GDKKLOMGRKNM7LPA57VQB2YVIYAMWMTKYXROSEUN2SJ4ZRRIQJQM6WQE';
var issuerPriv = 'SA2B2CJAKHPH42ADUAVTS2WPXU7QCUDBST6QPY7LZ7ODWEOILCKSK3JZ';
var ownerPub = 'GAGNQJOK6KZDXAIUXLJD6D52HNSTAL5PQVZ5R24ZO44H3C2VZREVO457';


window.app = {
  start: function () {
    var self = this;

    // Use test network, comment if real network is needed
    StellarSdk.Network.useTestNetwork();

    // Creating a new issuer account
    // var pair = StellarSdk.Keypair.random();
    // issuerPriv = pair.secret();
    // issuerPub = pair.publicKey();

    // Creating a new owner account
    // var ownerPair = StellarSdk.Keypair.random();
    // ownerPriv = ownerPair.secret();
    // ownerPub = ownerPair.publicKey();

    // Request account creation to horizon testnet friendbot,
    // if succesfull, show account information
    // request.get({
    //   url: horizonTestnetFriendbot,
    //   qs: { addr: issuerPub },
    //   json: true
    // }, function(error, response, body) {
    //   if (error || response.statusCode !== 200) {
    //     console.error('ERROR!', error || body);
    //   }
    //   else {
    //     server.loadAccount(issuerPub).then(function(account) {
    //       console.log('Issuer: ' + issuerPub + ' ' + issuerPriv);
    //       account.balances.forEach(function(balance) {
    //         console.log('Type:', balance.asset_type);
    //         console.log('Balance:', balance.balance);
    //       });
    //     });
    //   }
    // });

    // request.get({
    //   url: horizonTestnetFriendbot,
    //   qs: { addr: ownerPub },
    //   json: true
    // }, function(error, response, body) {
    //   if (error || response.statusCode !== 200) {
    //     console.error('ERROR!', error || body);
    //   }
    //   else {
    //     server.loadAccount(ownerPub).then(function(account) {
    //       console.log('Owner: ' + ownerPub + ' ' + ownerPriv);
    //       account.balances.forEach(function(balance) {
    //         console.log('Type:', balance.asset_type);
    //         console.log('Balance:', balance.balance);
    //       });
    //     });
    //   }
    // });

    // chunkAsset = new StellarSdk.Asset('CO2C', issuerPub);

    self.issueCertificate();
    self.getCompensations();

    return;
  },

  /*
    Generate certificate for chunk in JSON format
  */
  generateCertificate: function () {
    var self = this;

    var cert = {
      "client": "Rafaello",
      "block": "1"
    }

    var hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(cert));
    var memoHashHex = hash.digest('hex');

    console.log(memoHashHex);

    return memoHashHex;
  },

  /*
    Unique transaction memos must be implemented
  */
  issueCertificate: function () {
    var self = this;
    var certHash = self.generateCertificate();

    var issuerPair = StellarSdk.Keypair.fromSecret(issuerPriv);

    console.log(issuerPair.publicKey());

    // First, check to make sure that the destination account exists.
    // You could skip this, but if the account does not exist, you will be charged
    // the transaction fee when the transaction fails.
    server.loadAccount(ownerPub)
      // If the account is not found, surface a nicer error message for logging.
      .catch(StellarSdk.NotFoundError, function (error) {
        throw new Error('The destination account does not exist!');
      })
      // If there was no error, load up-to-date information on your account.
      .then(function() {
        return server.loadAccount(issuerPub);
      })
      .then(function(sourceAccount) {
        // Start building the transaction.
        var transaction = new StellarSdk.TransactionBuilder(sourceAccount)
          .addOperation(StellarSdk.Operation.payment({
            destination: ownerPub,
            // Because Stellar allows transaction in many currencies, you must
            // specify the asset type. The special "native" asset represents Lumens.
            asset: StellarSdk.Asset.native(),
            amount: "10"
          }))
          // A memo allows you to add your own metadata to a transaction. It's
          // optional and does not affect how Stellar treats the transaction.
          .addMemo(StellarSdk.Memo.hash(certHash))
          .build();
        // Sign the transaction to prove you are actually the person sending it.
        transaction.sign(issuerPair);
        // And finally, send it off to Stellar!
        return server.submitTransaction(transaction);
      })
      .then(function(result) {
        console.log('Success! Results:', result);
      })
      .catch(function(error) {
        console.error('Something went wrong!', error);
      });

    server.loadAccount(ownerPub).then(function(account) {
      console.log('Owner: ' + ownerPub);
      account.balances.forEach(function(balance) {
        console.log('Type:', balance.asset_type);
        console.log('Balance:', balance.balance);
      });
    });

    return;
  },

  getCompensations: function () {
    var self = this;

    server.transactions().forAccount(ownerPub).call().then(function (page) {
      console.log('Page 1: ');
      console.log(page.records);
      return page.next();
    })
    .then(function (page) {
      console.log('Page 2: ');
      console.log(page.records);
    })
    .catch(function (err) {
      console.log(err);
    });

    return;
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
