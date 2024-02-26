import { WebSocketMessage } from 'src/types/types';
import { WebSocket } from 'ws';
import { displayResponseResult } from './displayResult';

export const sendWebSocketMessage = <T>(ws: WebSocket, type: string, data: T, id: number = 0): void => {
  displayResponseResult(type, data);
  const stringifiedData = JSON.stringify(data);

  const message: WebSocketMessage<string> = {
    type: type,
    data: stringifiedData,
    id: id,
  };

  ws.send(JSON.stringify(message));
};
