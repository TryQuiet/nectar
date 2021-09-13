import { put,call } from "typed-redux-saga";
import { identityActions } from "../../identity/identity.slice";
import { generateDmKeyPair } from '../../../utils/cryptography/cryptography';


export function* responseCreateCommunitySaga (action: any): Generator {

const id = action.payload.id
const hiddenService = action.payload.payload.hiddenService

const peerId = action.payload.payload.peerId

const dmKeys = yield* call(generateDmKeyPair)

yield* put(identityActions.addNewIdentity({
    id,
    hiddenService,
    peerId,
    dmKeys
}))
}