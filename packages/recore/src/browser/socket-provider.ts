import * as io from "socket.io-client";
import { injectable } from "inversify";
import Socket = SocketIOClient.Socket;
import { getWebSocketEndpoint } from './config';

export const SocketProvider = Symbol('SocketProvider');

export interface SocketProvider {
    create(): Socket
}

@injectable()
export class RecoreSocketProvider implements SocketProvider {
    // get socket(): SocketIOClient.Socket {
    //     return this._socket;
    // }
    // private _socket: Socket;

    public create() {
        // if (this._socket) {
        //     return this._socket;
        // }

        const { url, path } = getWebSocketEndpoint();

        const opts = {
            transports: ['websocket'],
            path,
            reconnectionDelay: 3000,
        };

        return io(url, opts);

        // this._socket = io(url, opts);
        //
        // return this._socket;
    }
}
