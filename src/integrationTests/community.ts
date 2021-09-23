import { createAction } from "@reduxjs/toolkit"
import assert from 'assert'
import { put, select, take } from "typed-redux-saga"
import { identity } from "../index"
import { communitiesSelectors } from "../sagas/communities/communities.selectors"
import { communitiesActions } from "../sagas/communities/communities.slice"
import { identitySelectors } from "../sagas/identity/identity.selectors"
import { identityActions } from "../sagas/identity/identity.slice"
import { assertListElementMatches, assertNotEmpty, createApp, integrationTest, watchResults } from "./utils"

function* createCommunityTestSaga(payload): Generator {
  const userName = payload.userName
  const communityName = 'CommunityName'
  yield* put(communitiesActions.createNewCommunity(communityName))
  yield* take(communitiesActions.responseCreateCommunity)
  yield* put(identityActions.registerUsername(userName))
  yield* take(identityActions.storeUserCertificate)
  yield* take(communitiesActions.community)
  yield* take(communitiesActions.responseRegistrar)
  yield* take(identityActions.savedOwnerCertificate)
  const currentCommunity = yield* select(communitiesSelectors.currentCommunity)
  assert.equal(currentCommunity.name, communityName)
  assert(currentCommunity.onionAddress)
  assert(currentCommunity.port)
  assert(currentCommunity.privateKey)
  assert(currentCommunity.rootCa)
  // TODO: check for errors (there should not be any)
  const createdIdentity = yield* select(identitySelectors.currentIdentity)
  assert.equal(createdIdentity.zbayNickname, userName)
  assert.equal(createdIdentity.id, currentCommunity.id)
  assertNotEmpty(createdIdentity.peerId, 'Identity.peerId')
  assertNotEmpty(createdIdentity.userCertificate, 'Identity.userCertificate')
  assertNotEmpty(createdIdentity.hiddenService, 'Identity.hiddenService')
  yield* put(createAction('testDone')())
}

function* joinCommunityTestSaga(payload): Generator {
  const { registrarAddress, userName, ownerPeerId, ownerRootCA } = payload
  yield* put(communitiesActions.joinCommunity(registrarAddress))
  yield* take(communitiesActions.responseCreateCommunity)
  yield* put(identity.actions.registerUsername(userName))
  yield* take(identityActions.storeUserCertificate)
  yield* take(communitiesActions.community)
  const currentCommunity = yield* select(communitiesSelectors.currentCommunity)
  const createdIdentity = yield* select(identitySelectors.currentIdentity)
  assert.equal(currentCommunity.rootCa, ownerRootCA, "User joining community should have the same rootCA as the owner")
  assert.notEqual(currentCommunity.peerList, undefined, "User joining community should have a list of peers to connect to")
  assert.equal(currentCommunity.peerList.length, 2, "User joining community should receive a full list of peers to connect to")
  assertListElementMatches(currentCommunity.peerList, new RegExp(ownerPeerId))
  assertListElementMatches(currentCommunity.peerList, new RegExp(createdIdentity.peerId.id))
  assert.equal(createdIdentity.zbayNickname, userName)
  assert.equal(createdIdentity.id, currentCommunity.id)
  assertNotEmpty(createdIdentity.peerId, 'Identity.peerId')
  assertNotEmpty(createdIdentity.userCertificate, 'Identity.userCertificate')
  assertNotEmpty(createdIdentity.hiddenService, 'Identity.hiddenService')
  yield* put(createAction('testDone')())
}

const testUsersCreateAndJoinCommunitySuccessfully = async () => {
  const app1 = await createApp()
  const app2 = await createApp()
  watchResults([app1.store, app2.store], app2.store, 'Users create and join community successfully')

  // Owner creates community and registers
  app1.runSaga(integrationTest, createCommunityTestSaga, { userName: 'Owner' })

  const unsubscribe = app1.store.subscribe(async () => {
    // User joins community and registers as soon as the owner finishes registering
    if (app1.store.getState().Test.done) {
      unsubscribe()
      const ownerStoreState = app1.store.getState()
      const community = ownerStoreState.Communities.communities.entities[ownerStoreState.Communities.currentCommunity]
      const registrarAddress = `http://${community.onionAddress}.onion:${community.port}`
      const ownerIdentityState = app1.store.getState().Identity
      app2.runSaga(integrationTest, joinCommunityTestSaga, {
        userName: 'User', 
        registrarAddress, communityId: community.id, 
        ownerPeerId: ownerIdentityState.entities[ownerIdentityState.ids[0]].peerId.id,
        ownerRootCA: community.rootCa
      })
    }
  })
}

function* tryToJoinOfflineRegistrarTestSaga(): Generator {
  yield* put(communitiesActions.joinCommunity(`http://offlineRegistrarAddress.onion:4040`))
  yield* take(communitiesActions.responseCreateCommunity)
  yield* put(identity.actions.registerUsername('IamTheUser'))
  // TODO: check errors
  yield* put(createAction('setDone')())
}

const testUserTriesToJoinOfflineCommunity = async () => {
  const app = await createApp()
  watchResults([app.store], app.store, 'User receives error when tries to connect to offline registrar')
  app.runSaga(integrationTest, tryToJoinOfflineRegistrarTestSaga)
}

export default [
  testUsersCreateAndJoinCommunitySuccessfully,
  // testUserTriesToJoinOfflineCommunity // TODO
]
