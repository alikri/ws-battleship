// GameServer.ts
import * as http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Player } from '../Player/Player';
import { GameRoom } from '../GameRoom/GameRoom';
import { Ship } from 'src/Ship/Ship';
import { Status } from 'src/types/enums';
import { sendWebSocketMessage } from 'src/utils/sendWebSocketMessage';
import {
  RegistrationData,
  StartGameData,
  PlayerTurnData,
  FinishGameData,
  AttackFeedbackData,
  UpdateRoomData,
  CreateGameData,
} from 'src/types/responseDataTypes';

export class GameServer {
  private wss: WebSocketServer;
  private players: Map<WebSocket, Player>;
  private gameRooms: Map<number, GameRoom>;
  private newGameRoomId: number;

  constructor(port: number) {
    this.players = new Map<WebSocket, Player>();
    this.gameRooms = new Map<number, GameRoom>();
    const server = http.createServer((_, res) => {
      res.writeHead(404);
      res.end();
    });
    this.newGameRoomId = 0;

    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket) => {
      ws.on('message', (message: string) => {
        try {
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      });
    });

    server.listen(port, () => {
      console.log(`Game server started on port ${port}`);
    });
  }

  private handleMessage(ws: WebSocket, message: string) {
    const messageObj = JSON.parse(message);

    switch (messageObj.type) {
      case 'reg':
        const { data } = messageObj;
        const dataObj = JSON.parse(data);
        this.registerPlayer(ws, dataObj);
        break;
      case 'create_room':
        this.createRoom(ws);
        break;
      case 'add_user_to_room':
        const roomId = JSON.parse(messageObj.data).indexRoom;
        this.addPlayerToRoom(ws, roomId);
        break;
      case 'add_ships': {
        const { gameId, ships, indexPlayer } = JSON.parse(messageObj.data);
        this.addShips(gameId, ships, indexPlayer);
        break;
      }
      case 'attack': {
        const { gameId, x, y, indexPlayer } = JSON.parse(messageObj.data);
        this.processAttack(gameId, x, y, indexPlayer);
        break;
      }
    }
  }

  private registerPlayer(ws: WebSocket, data: { name: string; password: string }) {
    const playerIndex = this.players.size;
    const player = new Player(data.name, data.password, ws, playerIndex);
    this.players.set(ws, player);

    const responseData = {
      name: data.name,
      index: player.index,
      error: false,
      errorText: '',
    };

    sendWebSocketMessage<RegistrationData>(ws, 'reg', responseData);
  }

  private createRoom(ws: WebSocket) {
    const player = this.players.get(ws);
    if (!player) {
      console.error('Player not found');
      return;
    }

    const newRoom = new GameRoom((this.newGameRoomId += 1));
    newRoom.addPlayer(player);
    this.gameRooms.set(newRoom.roomId, newRoom);
    this.updateAvailableRooms();
  }

  private addPlayerToRoom(ws: WebSocket, roomId: number) {
    const room = this.gameRooms.get(roomId);
    const player = this.players.get(ws);

    if (player && room) {
      room.addPlayer(player);
      if (room.gameCreated) {
        this.notifyPlayersGameCreated(room);
      }
    }
    if (room && room.isFull()) {
      this.updateAvailableRooms();
    }
  }

  private updateAvailableRooms() {
    const roomsData = Array.from(this.gameRooms.values())
      .filter((room) => !room.isFull())
      .map((room) => ({
        roomId: room.roomId,
        roomUsers: room.players.map((player) => ({
          name: player.name,
          index: player.index,
        })),
      }));

    this.wss.clients.forEach((client) => {
      sendWebSocketMessage<UpdateRoomData[]>(client, 'update_room', roomsData);
    });
  }

  private addShips(gameId: number, shipsData: Ship[], indexPlayer: number) {
    const gameRoom = this.gameRooms.get(gameId);
    if (gameRoom) {
      gameRoom.handleShipsSubmission(indexPlayer, shipsData);
      if (gameRoom.gameStarted) {
        this.notifyPlayersGameStarted(gameRoom);
      }
    } else {
      console.error('Game room not found for gameId:', gameId);
    }
  }

  private notifyPlayersGameCreated(room: GameRoom) {
    room.players.forEach((player) => {
      const ws = player.ws;
      const responseData = {
        idGame: room.roomId,
        idPlayer: player.index,
      };
      if (ws && ws.readyState === WebSocket.OPEN) {
        sendWebSocketMessage<CreateGameData>(ws, 'create_game', responseData);
      }
    });
  }

  private notifyPlayersGameStarted(room: GameRoom) {
    room.players.forEach((player) => {
      const shipsData = room.getShipsDataForPlayer(player.index);
      const response = {
        ships: shipsData,
        currentPlayerIndex: player.index,
      };

      const ws = player.ws;
      if (ws && ws.readyState === WebSocket.OPEN) {
        sendWebSocketMessage<StartGameData>(ws, 'start_game', response);
      }

      const currentPlayer = { currentPlayer: room.getCurrentPlayerIndex() };

      sendWebSocketMessage<PlayerTurnData>(player.ws, 'turn', currentPlayer);
    });
  }

  private processAttack(gameId: number, x: number, y: number, indexPlayer: number) {
    const gameRoom = this.gameRooms.get(gameId);
    if (!gameRoom) {
      console.log(`Game room not found for gameId: ${gameId}`);
      return;
    }

    const attackFeedback = gameRoom.handleAttack(x, y, indexPlayer);

    if (attackFeedback) {
      gameRoom.players.forEach((player) => {
        sendWebSocketMessage<AttackFeedbackData>(player.ws, 'attack', attackFeedback.feedback);

        if (attackFeedback.misses.length !== 0) {
          attackFeedback.misses.forEach((pos) => {
            const response = {
              position: {
                x: pos.x,
                y: pos.y,
              },
              status: Status.miss,
              currentPlayer: indexPlayer,
            };
            sendWebSocketMessage<AttackFeedbackData>(player.ws, 'attack', response);
          });
        }

        if (gameRoom.gameFinished) {
          const response = {
            winPlayer: indexPlayer,
          };
          sendWebSocketMessage<FinishGameData>(player.ws, 'finish', response);
        }

        const currentPlayer = { currentPlayer: gameRoom.getCurrentPlayerIndex() };
        sendWebSocketMessage<PlayerTurnData>(player.ws, 'turn', currentPlayer);
      });
    }
  }
}
