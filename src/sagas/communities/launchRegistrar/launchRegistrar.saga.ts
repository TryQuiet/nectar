// import { select, apply } from "typed-redux-saga"

// export function* launchRegistrar (action: any, socket: any): Generator {

//     const id = action.payload

//     const csr = yield* select(identitySelectors.userCsr);


//     select(id)

//     const payload = {
//         id,
//         peerId,
//         rootCertString,
//         rootKeyString,
//         hiddenServicePrivKey
//     }

//     yield* apply(socket, socket.emit, [SocketActionTypes.LAUNCH_REGISTRAR, {payload}])


// } 

// socket.on(EventTypesServer.LAUNCH_REGISTRAR, async (id: string, peerId: string, rootCertString: string, rootKeyString: string, hiddenServicePrivKey?: string, port?: number) => {
//     await ioProxy.launchRegistrar(id, peerId, rootCertString, rootKeyString, hiddenServicePrivKey, port)
//   })