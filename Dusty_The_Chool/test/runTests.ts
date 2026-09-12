import * as path from 'path';
import Mocha from 'mocha';

async function run(): Promise<void> {
  const mocha = new Mocha({
    ui: 'bdd',
    color: true,
    timeout: 10000
  });

  const testFile = path.resolve(__dirname, 'extension.test.js');
  mocha.addFile(testFile);

  return new Promise((resolve, reject) => {
    mocha.run(failures => {
      if (failures > 0) {
        reject(new Error(`${failures} test(s) failed.`));
      } else {
        resolve();
      }
    });
  });
}

run().then(
  () => {
    console.log('All tests passed successfully!');
    process.exit(0);
  },
  err => {
    console.error('Test run encountered failures:', err);
    process.exit(1);
  }
);
