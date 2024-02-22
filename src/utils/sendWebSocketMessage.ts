import { WebSocketMessage } from 'src/types/types';
import { WebSocket } from 'ws';

export const sendWebSocketMessage = <T>(ws: WebSocket, type: string, data: T, id: number = 0): void => {
  const stringifiedData = JSON.stringify(data);

  const message: WebSocketMessage<string> = {
    type: type,
    data: stringifiedData,
    id: id,
  };

  ws.send(JSON.stringify(message));
};
