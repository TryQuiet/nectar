import { createAction } from "@reduxjs/toolkit"
import assert from 'assert'
import { all, put, take, takeEvery } from "redux-saga/effects"
import { select } from "typed-redux-saga"
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
  ]);
}

function* createCommunityTestSaga(payload): Generator {
  const userName = payload.payload.userName
  const communityName = 'CommunityName'
  yield put(communitiesActions.createNewCommunity(communityName))
  yield take(communitiesActions.responseCreateCommunity)
  const currentCommunity = yield* select(communitiesSelectors.currentCommunity())
  console.log('CURRENT', currentCommunity)
  assert.equal(currentCommunity.name, communityName)
  assert(currentCommunity.onionAddress)
  assert(currentCommunity.port)
  assert(currentCommunity.privateKey)
  yield put(identityActions.registerUsername(userName))
  yield take(identityActions.storeUserCertificate)
  // const certificateRegistrationError = yield* select(errorsSelectors.certificateRegistration)
  // console.log(certificateRegistrationError)
  // assert.equal(certificateRegistrationError, undefined, `Registration failed: ${certificateRegistrationError}`)
  // check if we have cert and cert ca
  const createdIdentity = yield* select(identitySelectors.currentIdentity)
  console.log('IDENTITY', createdIdentity)
  assert.equal(createdIdentity.id, currentCommunity.id)
  assert.notEqual(createdIdentity.peerId, undefined)
  assert.notEqual(createdIdentity.userCertificate, undefined)
  assert.notEqual(createdIdentity.hiddenService, undefined)
  // TODO: check if identity contains zbaynickname
}

function* joinCommunityTestSaga(payload): Generator {
  const { registrarAddress, userName, ownerPeerId } = payload.payload
  yield put(communitiesActions.joinCommunity(registrarAddress))
  yield take(communitiesActions.responseCreateCommunity)
  const currentCommunity = yield* select(communitiesSelectors.currentCommunity())
  yield put(identity.actions.registerUsername(userName))
  const responseCreatedUserCert = yield take(identityActions.storeUserCertificate)
  // @ts-expect-error
  const bootstrapPeers = responseCreatedUserCert.payload.peers
  const createdIdentity = yield* select(identitySelectors.currentIdentity)
  // TODO: check storePeerList instead
  assert.notEqual(bootstrapPeers, undefined)
  assert.equal(bootstrapPeers.length, 2)
  assertListElementMatches(bootstrapPeers, new RegExp(ownerPeerId))
  assertListElementMatches(bootstrapPeers, new RegExp(createdIdentity.peerId.id))
  console.log(`User ${userName} identity:`, createdIdentity)
  // TODO: assert contains nickname
  assert.equal(createdIdentity.id, currentCommunity.id)
  assert.notEqual(createdIdentity.peerId, undefined)
  assert.notEqual(createdIdentity.userCertificate, undefined)
  assert.notEqual(createdIdentity.hiddenService, undefined)
  
}

const main = async () => {
  const store1 = await createApp('First', handleTestActions)
  const store2 = await createApp('Second', handleTestActions)

  store1.dispatch({ type: 'userCreatingCommunity', payload: { userName: 'Owner' } })

  const unsubscribe = store1.subscribe(async () => {
    const communitiesState = store1.getState().Communities
    const identityState = store1.getState().Identity
    const useridentity = identityState.entities[identityState.ids[0]]
    const communities = communitiesState.communities
    const mainCommunityId = communitiesState.currentCommunity

    // TODO: simplify this ^
    if (mainCommunityId && communities.entities[mainCommunityId].onionAddress && useridentity && useridentity.userCertificate) {
      unsubscribe()
      const community = communities.entities[mainCommunityId]
      const registrarAddress = `http://${community.onionAddress}.onion:${community.port}`
      store2.dispatch({ 
        type: 'userJoiningCommunity', 
        payload: { userName: 'User', registrarAddress, communityId: community.id, ownerPeerId: useridentity.peerId.id }
      })
    }
  })
}

main().catch(e => console.error('oops', e))