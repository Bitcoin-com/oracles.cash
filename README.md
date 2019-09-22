# oracles.cash

![crystal ball](crystal-ball.jpg)

[oracles.cash](https://oracles.cash) is a platform for creating Oracles on Bitcoin Cash.

Oracles allow outside information to be provided which can trigger execution in smart-contracts. Oracles.cash is a template for easily spinning up a backend to publish oracle data as well as an example of a Bitcoin Cash smart-contract which consumes data from the oracle service.

Oracles can be used for:

- Prediction markets
- trustless gambling
- Covenants

Oracles.cash was created by [@cgcardona](https://twitter.com/cgcardona) for the [2019 WyoHackathon](https://wyohackathon.io)

More info at [https://oracle.bitcoin.com/](https://oracle.bitcoin.com/)

## Price Data

`/v1/price/details` returns a data object with 4 properties.

- `price`: USD price in cents
- `height`: block height
- `message` is a byte sequence of 8 bytes encoded as a hex string. The first 4 bytes are the blockheight and the 2nd 4 bytes are USD price in cents. The price is fetched from [Bitcoin.com's price index](https://index-api.bitcoin.com/api/v0/cash/price/usd)
- `signature` is the message signed by an ECPair.

```
curl -X GET "http://localhost:3000/v1/price/details" -H "accept: application/json"

{
  "price": 30350,
  "height": 601406,
  "message": "3e2d09008e760000",
  "signature": "304502210082180bc9cc4a4e41a5fe8b6c04d5c0d47d6a3174b3c0f3b7694550ad2bc72bbb02202250e01c018a760b30593ad9b71f1b6e0b0192c44183c4d38b0bdbc9f9edd3fd"
}
```

## Smart contract

This contract forces HODLing until a certain price target has been reached
A minimum block is provided to ensure that oracle price entries from before this block are disregarded
i.e. when the BCH price was \$1000 in the past, an oracle entry with the old block number and price can not be used.
Instead, a message with a block number and price from after the minBlock needs to be passed.
This contract serves as a simple example for checkDataSig-based contracts.

Credit to [Rosco Khalis](https://twitter.com/RoscoKalis), creator of CashScript, for creating the HodlVault Cash Contract.

`./src/routes/v1/contracts/hodl_vault.cash`
`./hodl_vault.ts`

Comment out the following lines in `hold_vault.ts`

```ts
// Produce new oracle message and signature
const oracleMessage: Buffer = oracle.createMessage(597000, 30000)
const oracleSignature: Buffer = oracle.signMessage(oracleMessage)

// Spend from the vault
const tx: TxnDetailsResult = await instance.functions
  .spend(new Sig(owner, 0x01), oracleSignature, oracleMessage)
  .send(instance.address, 1000)
```

Then run the script using [ts-node](https://www.npmjs.com/package/ts-node)

```
./node_modules/.bin/ts-node ./hodl_vault.ts
contract address: bchtest:pr6a369a5s3k5fqfnkhnnjw2a0rq6rkrkgvaqy7g7l
contract balance: 0
```

Notice it displays the contracts P2SH (pay-to-script-hash) address. Send some funds to that address where they will be locked.
