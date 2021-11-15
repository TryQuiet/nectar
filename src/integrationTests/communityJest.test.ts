import {
  createCommunity,
  joinCommunity,
  getCommunityOwnerData,
  tryToJoinOfflineRegistrar,
  assertReceivedCertificates,
  assertReceivedChannels,
} from './community';
import { createApp, createAppWithoutTor } from './utils';

jest.setTimeout(600_000);

describe('integration test', () => {
  test('create, join community, assert replication of general channel and certificates - with tor', async () => {
    const owner = await createApp();
    const userOne = await createApp();
    const userTwo = await createApp();
    
    await createCommunity({ userName: 'Owner', store: owner.store });
    
    const ownerData = getCommunityOwnerData(owner.store);
    
    await joinCommunity({
      ...ownerData,
      store: userOne.store,
      userName: 'username1',
    });
    
    await joinCommunity({
      ...ownerData,
      store: userTwo.store,
      userName: 'username2',
    });

    await assertReceivedCertificates('owner', 3, 120_000, owner.store);
    await assertReceivedCertificates('userOne', 3, 120_000, userOne.store);
    await assertReceivedCertificates('userTwo', 3, 120_000, userTwo.store);
    await assertReceivedChannels('owner', 1, 120_000, owner.store);
    await assertReceivedChannels('userTwo', 1, 120_000, userOne.store);
    await assertReceivedChannels('userTwo', 1, 120_000, userTwo.store);
    
    await owner.manager.closeAllServices();
    await userOne.manager.closeAllServices();
    await userTwo.manager.closeAllServices();
  });
  
  test.skip('try to join offline registrar', async () => {
    const user = await createApp();
    
    await tryToJoinOfflineRegistrar(user.store)


  })
});
