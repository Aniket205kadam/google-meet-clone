class WebSocketService {
  client;

  constructor(stompClient) {
    this.client = stompClient;
  }

  sendPacketToServer = (destination, headers = {}, body) => {
    if (!this.client?.connected) {
      console.warn("STOMP client not connected. Cannot send:", destination);
      return;
    }

    this.client.publish({
      destination,
      headers,
      body: JSON.stringify(body)
    });
  };
}

export default WebSocketService;