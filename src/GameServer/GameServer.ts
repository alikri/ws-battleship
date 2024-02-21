// GameServer.ts
import * as http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Player } from '../Player/Player';
import { GameRoom } from '../GameRoom/GameRoom';
import { Ship } from 'src/Ship/Ship';

export class GameServer {
  private wss: WebSocketServer;
  private players: Map<WebSocket, Player>;
  private gameRooms: Map<string, GameRoom>;

  constructor(port: number) {
    this.players = new Map<WebSocket, Player>();
    this.gameRooms = new Map<string, GameRoom>();
    const server = http.createServer((_, res) => {
      res.writeHead(404);
      res.end();
    });

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
        this.addShipsToGame(gameId, ships, indexPlayer);
        break;
      }
      case 'attack': {
        const { gameId, x, y, indexPlayer } = JSON.parse(messageObj.data);
        this.handleAttackMessage(gameId, x, y, indexPlayer);
        break;
      }
    }
  }

  private handleAttackMessage(gameId: string, x: number, y: number, indexPlayer: number) {
    const gameRoom = this.gameRooms.get(gameId);
    if (!gameRoom) {
      console.log(`Game room not found for gameId: ${gameId}`);
      return;
    }

    gameRoom.on('attack_processed', (feedback) => {
      gameRoom.players.forEach((player) => {
        player.ws.send(
          JSON.stringify({
            type: 'attack',
            data: JSON.stringify(feedback),
            id: 0,
          }),
        );

        const currentPlayer = { currentPlayer: gameRoom.currentPlayerIndex };
        player.ws.send(
          JSON.stringify({
            type: 'turn',
            data: JSON.stringify(currentPlayer),
            id: 0,
          }),
        );
      });
    });

    gameRoom.handleAttack(x, y, indexPlayer);
  }

  private addShipsToGame(gameId: string, shipsData: Ship[], indexPlayer: number) {
    const gameRoom = this.gameRooms.get(gameId);
    if (gameRoom) {
      gameRoom.handleShipSubmission(indexPlayer, shipsData);
    } else {
      console.error('Game room not found for gameId:', gameId);
    }
  }

  private addPlayerToRoom(ws: WebSocket, roomId: string) {
    const room = this.gameRooms.get(roomId);
    const player = this.players.get(ws);

    if (player && room) {
      room.addPlayer(player);
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
      client.send(
        JSON.stringify({
          type: 'update_room',
          data: JSON.stringify(roomsData),
          id: 0,
        }),
      );
    });
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

    const message = {
      type: 'reg',
      data: JSON.stringify(responseData),
      id: 0,
    };

    ws.send(JSON.stringify(message));
  }

  private createRoom(ws: WebSocket) {
    const player = this.players.get(ws);
    if (!player) {
      console.error('Player not found');
      return;
    }

    const newRoom = new GameRoom();

    newRoom.on('game_created', () => {
      this.notifyPlayersGameCreated(newRoom);
    });

    newRoom.on('game_started', () => {
      this.notifyPlayersGameIsStarting(newRoom);
    });

    newRoom.addPlayer(player);
    this.gameRooms.set(newRoom.roomId, newRoom);
    this.updateAvailableRooms();
  }

  private notifyPlayersGameCreated(room: GameRoom) {
    room.players.forEach((player) => {
      const ws = player.ws;
      const responseData = {
        idGame: room.roomId,
        idPlayer: player.index,
      };
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'create_game',
            data: JSON.stringify(responseData),
            id: 0,
          }),
        );
      }
    });
  }

  private notifyPlayersGameIsStarting(room: GameRoom) {
    room.players.forEach((player) => {
      const shipsData = room.getShipsDataForPlayer(player.index);
      const response = JSON.stringify({
        type: 'start_game',
        data: {
          ships: shipsData,
          currentPlayerIndex: player.index,
        },
        id: 0,
      });
      const ws = player.ws;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(response);
      }

      const currentPlayer = { currentPlayer: room.currentPlayerIndex };

      player.ws.send(
        JSON.stringify({
          type: 'turn',
          data: JSON.stringify(currentPlayer),
          id: 0,
        }),
      );
    });
  }
}
