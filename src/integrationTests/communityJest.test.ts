import {
  createCommunityTestSaga,
  joinCommunityTestSaga,
  getCommunityOwnerData,
  assertReceivedCertificates,
} from './community';
import { createApp, createAppWithoutTor, integrationTest } from './utils';

const sleep = () =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, 4000);
  });

jest.setTimeout(600_000);

describe('integration test', () => {
  test.skip('create, join community, assert replication of general channel and certificates - with tor', async () => {
    const owner = await createApp();
    const user1 = await createApp();
    const user2 = await createApp();

    await owner
      .runSaga(integrationTest, createCommunityTestSaga, {
        userName: 'Owner',
      })
      .toPromise();

    await user1
      .runSaga(integrationTest, joinCommunityTestSaga, {
        userName: 'User1',
        ...getCommunityOwnerData(owner.store),
        expectedPeersCount: 2,
      })
      .toPromise();

    await user2
      .runSaga(integrationTest, joinCommunityTestSaga, {
        userName: 'User2',
        ...getCommunityOwnerData(owner.store),
        expectedPeersCount: 3,
      })
      .toPromise();

    await owner
      .runSaga(integrationTest, assertReceivedCertificates, 'Owner', 3)
      .toPromise();

    await user1
      .runSaga(integrationTest, assertReceivedCertificates, 'UserOne', 3)
      .toPromise();

    await user2
      .runSaga(
        integrationTest,
        assertReceivedCertificates,
        'UserTwo',
        3,
      )
      .toPromise();

    await sleep();

    await owner.manager.closeAllServices();
    await user1.manager.closeAllServices();
    await user2.manager.closeAllServices();
  });
  test('create, join community, assert replication of general channel and certificates - without tor', async () => {
    const owner = await createAppWithoutTor();
    const user1 = await createAppWithoutTor();
    const user2 = await createAppWithoutTor();

    await owner
      .runSaga(integrationTest, createCommunityTestSaga, {
        userName: 'Owner',
      })
      .toPromise();

    await user1
      .runSaga(integrationTest, joinCommunityTestSaga, {
        userName: 'User1',
        ...getCommunityOwnerData(owner.store),
        expectedPeersCount: 2,
      })
      .toPromise();

    await user2
      .runSaga(integrationTest, joinCommunityTestSaga, {
        userName: 'User2',
        ...getCommunityOwnerData(owner.store),
        expectedPeersCount: 3,
      })
      .toPromise();

      console.log('before checking certs')

    await owner
      .runSaga(integrationTest, assertReceivedCertificates, 'Owner', 3)
      .toPromise();

    await user1
      .runSaga(integrationTest, assertReceivedCertificates, 'UserOne', 3)
      .toPromise();

    await user2
      .runSaga(
        integrationTest,
        assertReceivedCertificates,
        'UserTwo',
        3,
      )
      .toPromise();

    await sleep();

    await owner.manager.closeAllServices();
    await user1.manager.closeAllServices();
    await user2.manager.closeAllServices();
  });
});