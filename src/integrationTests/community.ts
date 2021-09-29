import { createAction } from "@reduxjs/toolkit"
import assert from 'assert'
import { fork, put, select, take } from "typed-redux-saga"
import { identity } from "../index"
import { communitiesSelectors } from "../sagas/communities/communities.selectors"
import { communitiesActions } from "../sagas/communities/communities.slice"
import { errorsSelectors } from "../sagas/errors/errors.selectors"
import { errorsActions } from "../sagas/errors/errors.slice"
import { identitySelectors } from "../sagas/identity/identity.selectors"
import { identityActions } from "../sagas/identity/identity.slice"
import { SocketActionTypes } from "../sagas/socket/const/actionTypes"
import { assertListElementMatches, assertNoErrors, assertNotEmpty, createApp, integrationTest, watchResults } from "./utils"

function* createCommunityTestSaga(payload): Generator {
  const userName = payload.userName
  const communityName = 'CommunityName'
  yield* fork(assertNoErrors)
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
  const createdIdentity = yield* select(identitySelectors.currentIdentity)
  assert.equal(createdIdentity.zbayNickname, userName)
  assert.equal(createdIdentity.id, currentCommunity.id)
  assertNotEmpty(createdIdentity.peerId, 'Identity.peerId')
  assertNotEmpty(createdIdentity.userCertificate, 'Identity.userCertificate')
  assertNotEmpty(createdIdentity.hiddenService, 'Identity.hiddenService')
  yield* put(createAction('testContinue')())
}

function* joinCommunityTestSaga(payload): Generator {
  const { registrarAddress, userName, ownerPeerId, ownerRootCA, expectedPeersCount } = payload
  console.log('USER::::', userName)
  yield* fork(assertNoErrors)
  yield* put(communitiesActions.joinCommunity(registrarAddress))
  yield* take(communitiesActions.responseCreateCommunity)
  yield* put(identity.actions.registerUsername(userName))
  yield* take(identityActions.storeUserCertificate)
  yield* take(communitiesActions.community)
  const currentCommunity = yield* select(communitiesSelectors.currentCommunity)
  const createdIdentity = yield* select(identitySelectors.currentIdentity)
  assert.equal(currentCommunity.rootCa, ownerRootCA, "User joining community should have the same rootCA as the owner")
  assert.notEqual(currentCommunity.peerList, undefined, "User joining community should have a list of peers to connect to")
  assert.equal(currentCommunity.peerList.length, expectedPeersCount, `User joining community should receive a full list of peers to connect to. Received ${currentCommunity.peerList.length}, expected ${expectedPeersCount}`)
  assertListElementMatches(currentCommunity.peerList, new RegExp(ownerPeerId))
  assertListElementMatches(currentCommunity.peerList, new RegExp(createdIdentity.peerId.id))
  assert.equal(createdIdentity.zbayNickname, userName)
  assert.equal(createdIdentity.id, currentCommunity.id)
  assertNotEmpty(createdIdentity.peerId, 'Identity.peerId')
  assertNotEmpty(createdIdentity.userCertificate, 'Identity.userCertificate')
  assertNotEmpty(createdIdentity.hiddenService, 'Identity.hiddenService')
  yield* put(createAction('testContinue')())
}

function* finishTestSaga () {
  yield* put(createAction('testFinished')())
}

const testUsersCreateAndJoinCommunitySuccessfully = async () => {
  const app1 = await createApp()
  const app2 = await createApp()
  const app3 = await createApp()
  watchResults([app1, app2, app3], app3, 'Users create and join community successfully')

  // Owner creates community and registers
  app1.runSaga(integrationTest, createCommunityTestSaga, { userName: 'Owner' })

  const unsubscribeApp2 = app2.store.subscribe(() => {
    if (app2.store.getState().Test.continue) {
      unsubscribeApp2()
      const ownerStoreState = app1.store.getState()
      const community = ownerStoreState.Communities.communities.entities[ownerStoreState.Communities.currentCommunity]
      const registrarAddress = `http://${community.onionAddress}:${community.port}`
      const ownerIdentityState = app1.store.getState().Identity
      app3.runSaga(integrationTest, joinCommunityTestSaga, {
        userName: 'User2', 
        registrarAddress, 
        communityId: community.id, 
        ownerPeerId: ownerIdentityState.entities[ownerIdentityState.ids[0]].peerId.id,
        ownerRootCA: community.rootCa,
        expectedPeersCount: 3
      })
    }
  })

  const unsubscribeApp1 = app1.store.subscribe(async () => {
    // User joins community and registers as soon as the owner finishes registering
    if (app1.store.getState().Test.continue) {
      unsubscribeApp1()
      const ownerStoreState = app1.store.getState()
      const community = ownerStoreState.Communities.communities.entities[ownerStoreState.Communities.currentCommunity]
      const registrarAddress = `http://${community.onionAddress}:${community.port}`
      const ownerIdentityState = app1.store.getState().Identity
      app2.runSaga(integrationTest, joinCommunityTestSaga, {
        userName: 'User1', 
        registrarAddress, 
        communityId: community.id, 
        ownerPeerId: ownerIdentityState.entities[ownerIdentityState.ids[0]].peerId.id,
        ownerRootCA: community.rootCa,
        expectedPeersCount: 2
      })
    }
  })

  const unsubscribeApp3 = app3.store.subscribe(() => {
    if (app3.store.getState().Test.continue) {
      unsubscribeApp3()
      app3.runSaga(finishTestSaga)
    }
  })
}

function* tryToJoinOfflineRegistrarTestSaga(): Generator {
  yield* put(communitiesActions.joinCommunity(`http://offlineRegistrarAddress.onion:4040`))
  yield* take(communitiesActions.responseCreateCommunity)
  const currentCommunityId = yield* select(communitiesSelectors.currentCommunityId)
  yield* put(identity.actions.registerUsername('IamTheUser'))
  yield* take(errorsActions.addError)
  const registrarError = yield* select(errorsSelectors.currentCommunityErrorByType(SocketActionTypes.REGISTRAR))
  assertNotEmpty(registrarError, 'Registrar error')
  assert.equal(registrarError.communityId, currentCommunityId)
  assert.equal(registrarError.code, 500)
  assert.equal(registrarError.message, 'Connecting to registrar failed')
  yield* put(createAction('testFinished')())
}

const testUserTriesToJoinOfflineCommunity = async () => {
  const app = await createApp()
  watchResults([app], app, 'User receives error when tries to connect to offline registrar')
  app.runSaga(integrationTest, tryToJoinOfflineRegistrarTestSaga)
}

export default [
  testUsersCreateAndJoinCommunitySuccessfully,
  // testUserTriesToJoinOfflineCommunity
]
