import { apply, select } from "typed-redux-saga";
import { SocketActionTypes } from "../../socket/const/actionTypes";
import { identitySelectors } from "../../identity/identity.selectors";

export function* launchCommunity(_action, socket): Generator {
    const selectedIdentity = yield* select(identitySelectors.selectById())
    yield* apply(socket, socket.emit, [SocketActionTypes.LAUNCH_COMMUNITY, selectedIdentity.peerId, selectedIdentity.hiddenService.privateKey])
}