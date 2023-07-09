const { ethers } = require("hardhat");
const hardhat = require("hardhat");
const { createDeploymentFile } = require("./utils/createDeploymentFile");

async function main() {
  // Retrieve the network configuration from the hardhat.config.js file
  const network = hardhat.network.name;
  console.log(`${"Deploying to network:".padEnd(40, "-")} ${network}`);

  // Retrieve the account used for deployment
  const [deployer] = await ethers.getSigners();
  console.log(`${"Deployer balance:".padEnd(40, "-")} ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);
  console.log(`${"Deploying contracts with the account:".padEnd(40, "-")} ${deployer.address}`);

  // Deploy the contract with constructor arguments
  const EdArt = await ethers.getContractFactory("EdArt");
  const edArt = await EdArt.deploy(
    "0xd17f0237BfeCB3eFCEE4c94637dd0924680694C3",
    "ipfs://bafybeihbgged3ui7lu4apft24api2bgjmd2hwtpi5i7uusw54bhzt5mlua/",
    "69000000000000000"
  );

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
