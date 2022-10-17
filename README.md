# Dapp Template

Fullstack web3 application template

### Build status:

- Contracts
  [![Lint & Test](https://github.com/sonicsmith/dapp-template/actions/workflows/lint-and-test-contracts.yml/badge.svg)](https://github.com/sonicsmith/dapp-template/actions/workflows/lint-and-test-contracts.yml)
- Frontend
  [![Lint & Test](https://github.com/sonicsmith/dapp-template/actions/workflows/lint-and-test-frontend.yml/badge.svg)](https://github.com/sonicsmith/dapp-template/actions/workflows/lint-and-test-frontend.yml)

<br>

## Local development

Install dependencies:

```shell
npm install
```

<br>

Run local geth node:

```shell
npm start
```

<br>

Open a new terminal and deploy the smart contract in the local network:

```shell
npm run deploy:local
```

<br>

Output of deployment will display contract address.
Create `.env.local` file.
Copy contract address and use as `REACT_APP_DEV_CONTRACT` value.

Run the front end:

```shell
cd frontend
npm start
```

<br>

Add local network to Metamask wallet:

- Click "Add Network"
- Network Name: Local Network
- New RPC URL: http://127.0.0.1:8545/
- Chain ID: 31337
- Currency Symbol: GO

<br>

---

<br>

### TODO:

- Add Front end tests
- Implement [Mythril](https://github.com/ConsenSys/mythril)
