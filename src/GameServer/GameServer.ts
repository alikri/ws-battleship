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
  WinnersData,
} from 'src/types/responseDataTypes';
import { Winners } from 'src/Winners/Winners';
import { displayReslutForIncommingMessages } from 'src/utils/displayResult';
import { AttackFeedback, Position } from 'src/types/types';

export class GameServer {
  private wss: WebSocketServer;
  private players: Map<WebSocket, Player>;
  private gameRooms: Map<number, GameRoom>;
  private newGameRoomId: number;
  static winners = new Winners();
  private playersByName = new Map<string, Player>();

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
      console.log(`New connection established. Number of connected clients: ${this.wss.clients.size}`);

      ws.on('message', (message: string) => {
        try {
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      });

      ws.on('close', () => {
        console.log(`Connection closed. Number of connected clients: ${this.wss.clients.size}`);
      });
    });

    server.listen(port, () => {
      console.log(`Game server started on port ${port}`);

      process.on('SIGINT', () => this.shutdownServer());
      process.on('SIGTERM', () => this.shutdownServer());
    });
  }

  private shutdownServer() {
    this.wss.clients.forEach((client) => {
      client.close(1000, 'Server shutdown');
    });
    this.wss.close(() => {
      console.log('WebSocket server closed.');
      process.exit(0);
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
      case 'randomAttack': {
        const { gameId, indexPlayer } = JSON.parse(messageObj.data);
        this.processRandomAttack(gameId, indexPlayer);
        break;
      }
    }
  }

  private registerPlayer(ws: WebSocket, data: { name: string; password: string }) {
    if (this.playersByName.has(data.name)) {
      const errorResponseData = {
        name: data.name,
        index: null,
        error: true,
        errorText: 'Player already exists.',
      };

      sendWebSocketMessage<RegistrationData>(ws, 'reg', errorResponseData);
      return;
    }

    const playerIndex = this.players.size;
    const player = new Player(data.name, data.password, ws, playerIndex);
    this.players.set(ws, player);
    this.playersByName.set(data.name, player);

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

    displayReslutForIncommingMessages<CreateGameData>('create_room', {
      idGame: newRoom.roomId,
      idPlayer: player.index,
    });

    this.gameRooms.set(newRoom.roomId, newRoom);
    this.updateAvailableRooms();
  }

  private addPlayerToRoom(ws: WebSocket, roomId: number) {
    const room = this.gameRooms.get(roomId);
    const player = this.players.get(ws);

    if (player && room && !room.containsPlayer(player)) {
      room.addPlayer(player);
      displayReslutForIncommingMessages<number>('add_user_to_room', player.index);
      if (room.gameCreated) {
        this.notifyPlayersGameCreated(room);
      }
    } else if (player && room && room.containsPlayer(player)) {
      console.log(`Player ${player.name} is already in room ${roomId}, cannot join again.`);
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

    this.players.forEach((player) => {
      sendWebSocketMessage<UpdateRoomData[]>(player.ws, 'update_room', roomsData);
    });
  }

  private addShips(gameId: number, shipsData: Ship[], indexPlayer: number) {
    const gameRoom = this.gameRooms.get(gameId);
    if (gameRoom) {
      gameRoom.handleShipsSubmission(indexPlayer, shipsData);
      if (gameRoom.gameStarted) {
        displayReslutForIncommingMessages<string>('add_ships', 'Ships added to both players');
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

    this.sendAttackFeedback(attackFeedback, gameRoom, indexPlayer);
  }

  private processRandomAttack(gameId: number, indexPlayer: number) {
    const gameRoom = this.gameRooms.get(gameId);
    if (!gameRoom) {
      console.log(`Game room not found for gameId: ${gameId}`);
      return;
    }
    const attackFeedback = gameRoom.handleRandomAttack(indexPlayer);
    displayReslutForIncommingMessages('randomAttack', '');
    this.sendAttackFeedback(attackFeedback, gameRoom, indexPlayer);
  }

  private sendAttackFeedback(attackFeedback: AttackFeedback, gameRoom: GameRoom, indexPlayer: number) {
    if (attackFeedback) {
      gameRoom.players.forEach((player: Player) => {
        sendWebSocketMessage<AttackFeedbackData>(player.ws, 'attack', attackFeedback.feedback);

        if (attackFeedback.misses.length !== 0) {
          attackFeedback.misses.forEach((pos: Position) => {
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
          this.broadcastWinners();
          const response = {
            winPlayer: indexPlayer,
          };
          sendWebSocketMessage<FinishGameData>(player.ws, 'finish', response);
          this.gameRooms.clear();
          return;
        }

        const currentPlayer = { currentPlayer: gameRoom.getCurrentPlayerIndex() };
        sendWebSocketMessage<PlayerTurnData>(player.ws, 'turn', currentPlayer);
      });
    }
  }

  private broadcastWinners(): void {
    const currentWinners = GameServer.winners.getWinnersResponseData();
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        sendWebSocketMessage<WinnersData[]>(client, 'update_winners', currentWinners);
      }
    });
  }
}
