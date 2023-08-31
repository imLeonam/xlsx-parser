const fs = require('fs');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
const options = findFiles();

function findFiles(directory) {
  if (!directory) directory = './_inputs';
  else directory = `../${directory}`;

  const files = fs.readdirSync(directory);
  const filenames = [];

  for (const file of files) {
    const basename = path.basename(file);
    if (/\w+\.xlsx/.test(basename)) filenames.push(path.basename(file));
  }
  if (!filenames.length) {
    console.log('The folder is empty or the files are not in the correct format!');
    console.log('Supported file format is "xslx"!');
    return;
  };
  return filenames;
}

function displayOptions() {
  if (!options) return;
  console.log('Options:');
  options.forEach((option, index) => {
    console.log(`${index + 1}. ${option}`);
  });
}

function getUserChoice() {
  if (!options) return;
  return new Promise((resolve) => {
    displayOptions();
    rl.question('Enter the number of your choice: ', (answer) => {
      const choiceIndex = parseInt(answer) - 1;
      if (choiceIndex >= 0 && choiceIndex < options.length) {
        resolve(choiceIndex);
      } else {
        console.log('Invalid choice. Please select a valid option.');
        getUserChoice().then(resolve);
      }
    });
  });
}

async function requestFile() {
  if (!options) throw new Error('Files not Found!');
  const choiceIndex = await getUserChoice();
  console.log(`You selected: ${options[choiceIndex]}`);
  rl.close();
  return options[choiceIndex];
}

module.exports = requestFile
