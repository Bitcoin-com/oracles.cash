## oracles.cash

![crystal ball](crystal-ball.jpg)

[oracles.cash](https://oracles.cash) is a platform for creating Oracles on Bitcoin Cash.

Oracles allow outside information to be provided which can trigger execution in smart-contracts. Oracles.cash is a template for easily spinning up a backend to publish oracle data as well as an example of a Bitcoin Cash smart-contract which consumes data from the oracle service.

This was created for the [2019 WyoHackathon](https://wyohackathon.io)

## Price Data

`/v1/price/details` returns a data object with 2 properties.

`message` is a byte sequence of 8 bytes encoded as a hex string. The first 4 bytes are the blockheight and the 2nd 4 bytes are BCH price in USDl. The price is fetched from [Bitcoin.com's price index](https://index-api.bitcoin.com/api/v0/cash/price/usd)

`signature` is the message signed by an ECPair.

```
curl -X GET "http://localhost:3000/v1/price/details" -H "accept: application/json"

{
  "message": "cd2c0900a8790000",
  "signature": "30440220121c33f5669d328bb02de727bc742c1213ed92a96ef989cd68cbd95ec2b402d302207c562ebbd6849b7b938700e09267b158380ef0e8760e2eb4784a5cc95b984fc1"
}
```

## Smart contract
