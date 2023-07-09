const fs = require("fs");

function createDeploymentFile(network, contracts) {
  const filename = `deployments/${network}-deployments.json`;
  const data = JSON.stringify(contracts, null, 2);
  fs.writeFileSync(filename, data);
  console.log(`Deployment data saved to ${filename}`);
}

module.exports = { createDeploymentFile };
