import communityTestCases from './community';
import debug from 'debug';
const log = Object.assign(debug('tests'), {
  error: debug('tests:err'),
});

const testCases = [...communityTestCases];

const run = async () => {
  for (const testCase of testCases) {
    await testCase();
  }
};

run().catch((e) => {
  log.error('Error occurred while running integration tests', e);
  process.exit(1);
});
