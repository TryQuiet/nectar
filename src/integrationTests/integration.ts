import { createAction } from "@reduxjs/toolkit"
import assert from 'assert'
import { select, put, all, take, takeEvery, call } from "typed-redux-saga"
import { identity } from "../index"
import { communitiesSelectors } from "../sagas/communities/communities.selectors"
import { communitiesActions } from "../sagas/communities/communities.slice"
import { identitySelectors } from "../sagas/identity/identity.selectors"
import { identityActions } from "../sagas/identity/identity.slice"
import { assertListElementMatches, createApp } from "./utils"

export function* handleTestActions(): Generator {
  yield all([
    takeEvery(
      createAction('userCreatingCommunity'),
      createCommunityTestSaga,
    ),
    takeEvery(
      createAction('userJoiningCommunity'),
      joinCommunityTestSaga,
    ),
    // takeEvery(
    //   createAction('assert'),
    //   assertResultSaga
    // )
  ]);
}

function* assertResultSaga(payload: {fn: (...args: any[]) => any, args: any[]}): Generator {
  try {
    payload.fn(...payload.args)
  } catch (e) {
    console.log('ERRROR', e)
  }
}

function* createCommunityTestSaga(payload): Generator {
  const userName = payload.payload.userName
  const communityName = 'CommunityName'
  
  yield* put(communitiesActions.createNewCommunity(communityName))
  yield* take(communitiesActions.responseCreateCommunity)

  // yield* put({type: 'assert', payload: {fn: assert.equal, args: ['hop', 'padu']}})
  // yield* call(assert.equal, 'apud', 'hop')
  
  yield* put(identityActions.registerUsername(userName))
  yield* take(identityActions.storeUserCertificate)
  yield* take(communitiesActions.community)
  yield* take(communitiesActions.responseRegistrar)
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
  assert.notEqual(createdIdentity.peerId, undefined)
  assert.notEqual(createdIdentity.userCertificate, undefined)
  assert.notEqual(createdIdentity.hiddenService, undefined)
  yield* put(createAction('setDone')())
}

function* joinCommunityTestSaga(payload): Generator {
  const { registrarAddress, userName, ownerPeerId, ownerRootCA } = payload.payload
  yield* put(communitiesActions.joinCommunity(registrarAddress))
  yield* take(communitiesActions.responseCreateCommunity)
  yield* put(identity.actions.registerUsername(userName))
  yield* take(identityActions.storeUserCertificate)
  yield* take(communitiesActions.community)
  const currentCommunity = yield* select(communitiesSelectors.currentCommunity)
  const createdIdentity = yield* select(identitySelectors.currentIdentity)
  assert.equal(currentCommunity.rootCa, ownerRootCA, "User joining community should have the same rootCA as the owner")
  assert.notEqual(currentCommunity.peerList, undefined, "User joining community should have a list of peers to connect to")
  assert.equal(currentCommunity.peerList.length, 2)
  assertListElementMatches(currentCommunity.peerList, new RegExp(ownerPeerId))
  assertListElementMatches(currentCommunity.peerList, new RegExp(createdIdentity.peerId.id))
  assert.equal(createdIdentity.zbayNickname, userName)
  assert.equal(createdIdentity.id, currentCommunity.id)
  assert.notEqual(createdIdentity.peerId, undefined)
  assert.notEqual(createdIdentity.userCertificate, undefined)
  assert.notEqual(createdIdentity.hiddenService, undefined)
  yield* put(createAction('setDone')())
}

const main = async () => {
  const store1 = await createApp('First', handleTestActions)
  const store2 = await createApp('Second', handleTestActions)

  // Owner creates community and registers
  store1.dispatch({ type: 'userCreatingCommunity', payload: { userName: 'Owner' } })

  const unsubscribe = store1.subscribe(async () => {
    
    const ownerStoreState = store1.getState()
    // User joins community and registers as soon as the owner finishes registering
    if (store1.getState().Test.done) {
      unsubscribe()
      const community = ownerStoreState.Communities.communities.entities[ownerStoreState.Communities.currentCommunity]
      const registrarAddress = `http://${community.onionAddress}.onion:${community.port}`
      const ownerIdentityState = store1.getState().Identity
      store2.dispatch({ 
        type: 'userJoiningCommunity', 
        payload: { 
          userName: 'User', 
          registrarAddress, communityId: community.id, 
          ownerPeerId: ownerIdentityState.entities[ownerIdentityState.ids[0]].peerId.id,
          ownerRootCA: community.rootCa
        }
      })
    }
  })

  store2.subscribe(() => {
    if (store2.getState().Test.done) {
      console.log('Test passed')
      process.exit(0)
    }
  })
}

main().then(() => {}, (e) => {
  console.log('Test failed: ', e)
  process.exit(1)
}).catch(e => {
  console.error('Test failed:', e)
  process.exit(1)
})
