// get socket url path
// get static public path

export function getWebSocketEndpoint() {
    return {
        url: 'http://127.0.0.1:8880',
        path: '/v1/channels',
    }
}


export function getStaticURLPrefix() {
    return "http://127.0.0.1:8880/v1/workspaces/1234";
}
