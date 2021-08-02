const fs = require('fs');
const { exec, spawn } = require('child_process');

/*
 * This function changes all package versions to asterisks, installs the packages,
 * and writes back the installed versions, which are the latest, to package.json.
 */
const updateAll = async () => {
  // Change all dependency versions to asterisk.
  const file = fs.readFileSync('package.json');
  const content = JSON.parse(file);
  for (const devDep in content.devDependencies) {
    content.devDependencies[devDep] = '*';
  }
  for (const dep in content.dependencies) {
    content.dependencies[dep] = '*';
  }

  // Write to disk.
  fs.writeFileSync('package.json', JSON.stringify(content, null, 2));

  // Install packages.
  console.log('Installing packages...');
  const child = spawn(
    /^win/.test(process.platform) ? 'npm.cmd' : 'npm',
    ['install'],
    { cwd: process.cwd() }
  );
  for await (const data of child.stdout) {
    console.log(data.toString().trim());
  }

  // Update with latest versions.
  const packages = await getInstalledVersions();
  for (const devDep in content.devDependencies) {
    content.devDependencies[devDep] = packages[devDep];
  }
  for (const dep in content.dependencies) {
    content.dependencies[dep] = packages[dep];
  }

  // Write to disk again.
  fs.writeFileSync('package.json', JSON.stringify(content, null, 2));
};

if (require.main === module) {
  updateAll().catch(console.error).finally(process.exit);
} else {
  module.exports = updateAll;
}

function getInstalledVersions() {
  return new Promise((resolve, reject) =>
    exec(`npm list --depth=0`, (error, stdout, stderr) => {
      if (error || stderr) {
        reject(error || stderr);
      } else {
        const data = stdout
          .trim()
          .split(/[+`]--\s/g)
          .slice(1)
          .map((line) => line.trim());
        const packages = {};
        for (const line of data) {
          const index = line.lastIndexOf('@');
          const name = line.substring(0, index);
          const version = line.substring(index + 1);
          packages[name] = version;
        }
        resolve(packages);
      }
    })
  );
}
