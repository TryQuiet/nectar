import { applyMiddleware, combineReducers, createStore } from "@reduxjs/toolkit"
import createSagaMiddleware from "redux-saga"
import { all, fork } from "redux-saga/effects"
import { communitiesMasterSaga } from './sagas/communities/communities.master.saga'
import waggle from 'waggle'
import { io, Socket } from 'socket.io-client'
import fp from 'find-free-port'
import tmp from 'tmp'
import path from 'path'
import thunk from 'redux-thunk'
import { communities, storeKeys } from "./index"
import { useIO } from './sagas/socket/startConnection/startConnection.saga'

// import promise from 'redux-promise-middleware'
// import createDebounce from 'redux-debounced'

export const createTmpDir = (prefix: string) => {
  return tmp.dirSync({ mode: 0o750, prefix, unsafeCleanup: true })
}

export const createPath = (dirName: string) => {
  return path.join(dirName, '.nectar')
}

const createApp = async (name: string) => {
  const [dataServerPort1] = await fp(4677)
  const server1 = new waggle.DataServer(dataServerPort1)
  server1.listen()
  const socket = io(`http://localhost:${dataServerPort1}`)
  socket.on('connect', async () => {
    console.log(`websocket connection is ready for ${name}`)
  })

  function* root(): Generator {
    yield all([
      // fork(handleActions, server1.io),
      // fork(publicChannelsMasterSaga, socket),
      // fork(messagesMasterSaga, socket),
      // fork(identityMasterSaga, socket),
      fork(communitiesMasterSaga, socket)
    ])
  }
  const reducers = {
    [storeKeys.Communities]: communities.reducer
  }
  const combinedReducers = combineReducers(reducers)
  const sagaMiddleware = createSagaMiddleware()
  const store = createStore(
    combinedReducers,
    applyMiddleware(...[sagaMiddleware, thunk])
  )
  sagaMiddleware.run(root)

  const [proxyPort] = await fp(1234)
  const [controlPort] = await fp(5555)
  const manager1 = new waggle.ConnectionsManager({
    agentHost: 'localhost',
    agentPort: proxyPort,
    options: {
      env: {
        appDataPath: path.join(createTmpDir(`nectarTestWaggle${name}`).name, '.nectar')
      },
      torControlPort: controlPort
    },
    io: server1.io
  })
  await manager1.init()
}

const main = async () => {
  await createApp('First')
  console.log('=============================')
  await createApp('Second')
}

main().catch(e => console.error('oops', e))