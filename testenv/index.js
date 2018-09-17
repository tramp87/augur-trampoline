const fs = require('fs-extra');
const express = require('express');
const AccountManager = require('augur-core/output/libraries/AccountManager').AccountManager;
const CompilerConfiguration = require('augur-core/output/libraries/CompilerConfiguration').CompilerConfiguration;
const ContractCompiler = require('augur-core/output/libraries/ContractCompiler').ContractCompiler;
const ContractDeployer = require('augur-core/output/libraries/ContractDeployer').ContractDeployer;
const Connector = require('augur-core/output/libraries/Connector').Connector;
const DeployerConfiguration = require('augur-core/output/libraries/DeployerConfiguration').DeployerConfiguration;
const NetworkConfiguration = require('augur-core/output/libraries/NetworkConfiguration').NetworkConfiguration;
const BN = require('bn.js');

const port = 80;
const app = express();

var addressesPromise = null;

async function deployContracts() {
  const compilerConfiguration = CompilerConfiguration.create();
  const contractCompiler = new ContractCompiler(compilerConfiguration);
  const compiledContracts = await contractCompiler.compileContracts();

  const RPC = 'http://ganache:8545/';

  const networkConfiguration = new NetworkConfiguration(
    'testrpc',
    RPC,
    undefined,
    undefined,
    new BN('10000000000', 10),
    '73dff7a656b0ecc3bb281bd5d14f9f8e77b60355d6274683d2f6fc5e3ab7ac11',
    false,
  );
  const connector = new Connector(networkConfiguration);
  const accountManager = new AccountManager(
    connector,
    networkConfiguration.privateKey,
  );

  const artifactsDir = await fs.mkdtemp('/tmp/artifacts.');

  try {
    const deployerConfiguration = DeployerConfiguration.create(artifactsDir);
    const contractDeployer = new ContractDeployer(
      deployerConfiguration,
      connector,
      accountManager,
      compiledContracts,
    );
    await contractDeployer.deploy();
    return await fs.readFile(artifactsDir + '/addresses.json', 'utf8');
  } finally {
    await fs.remove(artifactsDir);
  }
}

app.get('/', async (req, res) => {
  const addresses = await addressesPromise;
  res.send(addresses);
});

addressesPromise = deployContracts();

app.listen(port, () => console.log(`Listening on port ${port}!`));
