import { Crypto } from '@peculiar/webcrypto';
import { createCommunity, sendRegistrationRequest } from './appActions';
import {
  assertReceivedCertificate,
  assertReceivedRegistrationError,
} from './assertions';
import { createApp, sleep } from './utils';
import { AsyncReturnType } from '../utils/types/AsyncReturnType.interface';

jest.setTimeout(600_000);
const crypto = new Crypto();

global.crypto = crypto;

describe('offline registrar, user tries to join', () => {
  let user: AsyncReturnType<typeof createApp>;

  beforeAll(async () => {
    user = await createApp();
  });

  afterAll(async () => {
    await user.manager.closeAllServices();
  });

  test('user tries to join community', async () => {
    await sendRegistrationRequest({
      registrarAddress:
        '76gan734wqm4hy7ahj33pnfub7qobdhhkdnd3rbma7o4dq4hce3ncxad',
      userName: 'waclaw',
      store: user.store,
    });
  });

  test('user should get an error message', async () => {
    await assertReceivedRegistrationError(user.store);
  });
});

describe('registrar is offline, user tries to join, then registrar goes online', () => {
  let owner: AsyncReturnType<typeof createApp>;
  let user: AsyncReturnType<typeof createApp>;
  let store: typeof owner.store;
  let oldState: ReturnType<typeof owner.store.getState>;
  let registrarAddress: string;

  beforeAll(async () => {
    owner = await createApp();
    user = await createApp();
  });

  afterAll(async () => {
    await owner.manager.closeAllServices();
    await user.manager.closeAllServices();
  });

  test('owner creates community', async () => {
    await createCommunity({ userName: 'placek', store: owner.store });
    const communityId = owner.store.getState().Communities.currentCommunity;
    registrarAddress =
      owner.store.getState().Communities.communities.entities[communityId]
        .onionAddress;
    oldState = owner.store.getState();
  });

  test('owner goes offline', async () => {
    await owner.manager.closeAllServices();
  });

  // User should keep sending requests
  test('user tries to join community, while registrar is offline', async () => {
    await sendRegistrationRequest({
      userName: 'wacek',
      store: user.store,
      registrarAddress,
    });
  });

  test('user get error message', async () => {
    await assertReceivedRegistrationError(user.store);
  });

  test('registrar goes online', async () => {
    owner = await createApp(oldState);
  });

  test('user finishes registration', async () => {
    console.log('user registered certificate');
    await assertReceivedCertificate(user.store);
  });
});
