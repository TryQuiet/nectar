import { Crypto } from '@peculiar/webcrypto';
import { assertReceivedCertificates } from './assertions';
import {
  createCommunity,
  joinCommunity,
  getCommunityOwnerData,
} from './appActions';
import { createApp } from './utils';
import { AsyncReturnType } from '../utils/types/AsyncReturnType.interface';

jest.setTimeout(600_000);
const crypto = new Crypto();

global.crypto = crypto;

describe.skip('owner creates community', () => {
  let owner: AsyncReturnType<typeof createApp>;

  beforeAll(async () => {
    owner = await createApp();
  });

  afterAll(async () => {
    await owner.manager.closeAllServices();
  });

  test('Owner creates community', async () => {
    await createCommunity({ userName: 'Owner', store: owner.store });
  });
});

describe.skip('owner creates community and two users join', () => {
  let owner: AsyncReturnType<typeof createApp>;
  let userOne: AsyncReturnType<typeof createApp>;
  let userTwo: AsyncReturnType<typeof createApp>;

  beforeAll(async () => {
    owner = await createApp();
    userOne = await createApp();
    userTwo = await createApp();
  });

  afterAll(async () => {
    await owner.manager.closeAllServices();
    await userOne.manager.closeAllServices();
    await userTwo.manager.closeAllServices();
  });

  test('Owner creates community', async () => {
    await createCommunity({ userName: 'Owner', store: owner.store });
  });

  test('Two users join community', async () => {
    const ownerData = getCommunityOwnerData(owner.store);

    await joinCommunity({
      ...ownerData,
      store: userOne.store,
      userName: 'username1',
      expectedPeersCount: 2,
    });

    await joinCommunity({
      ...ownerData,
      store: userTwo.store,
      userName: 'username2',
      expectedPeersCount: 3,
    });
  });

  test('Owner and users received certificates', async () => {
    await assertReceivedCertificates('owner', 3, 120_000, owner.store);
    await assertReceivedCertificates('userOne', 3, 120_000, userOne.store);
    await assertReceivedCertificates('userTwo', 3, 120_000, userTwo.store);
  });
});
