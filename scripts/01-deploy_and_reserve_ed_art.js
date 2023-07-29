const { ethers } = require("hardhat");
const hardhat = require("hardhat");
const { createDeploymentFile } = require("./utils/createDeploymentFile");
const dotenv = require("dotenv");

dotenv.config();

async function main() {
  // Retrieve the network configuration from the hardhat.config.js file
  const network = hardhat.network.name;
  console.log(`${"Deploying to network:".padEnd(40, "-")} ${network}`);

  // Retrieve the account used for deployment
  const [deployer] = await ethers.getSigners();
  console.log(`${"Deployer balance:".padEnd(40, "-")} ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);
  console.log(`${"Deploying contracts with the account:".padEnd(40, "-")} ${deployer.address}`);

  // Deploy the contract with constructor arguments
  const arguments = [
    process.env.OWNER,
    process.env.BASE_URI,
    process.env.COST,
    process.env.MAX_TOKEN_SUPPLY,
    process.env.MAX_TOKEN_PURCHASE,
    process.env.RESERVE,
  ];

  console.log(arguments);

  const EdArt = await ethers.getContractFactory("EdArt");
  const edArt = await EdArt.deploy(...arguments);

  // Wait for the deployment transaction to be mined and get the transaction receipt
  const deploymentReceipt = await edArt.deployTransaction.wait();
  const actualGasSpent = deploymentReceipt.gasUsed;
  console.log(`${"Actual gas spent:".padEnd(40, "-")} ${actualGasSpent.toString()}`);

  console.log(`${"EdArt deployed to:".padEnd(40, "-")} ${edArt.address}`);

  // Mint tokens to the owner's address
  const ownerAddress = deployer.address;
  await edArt.reserve();
  const tokenSupply = await edArt.totalSupply();

  const reserve_text = `Minted ${tokenSupply} tokens to address:`;
  console.log(`${reserve_text.padEnd(40, "-")} ${ownerAddress}`);

  // Create deployment data file
  const contracts = {
    EdArt: {
      address: edArt.address,
      abi: EdArt.interface.format("json"),
    },
  };
  createDeploymentFile(network, contracts);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
