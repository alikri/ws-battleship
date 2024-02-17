import { httpServer } from './src/http_server/index.js';
import { GameServer } from 'src/GameServer/GameServer.js';

const HTTP_PORT = 8181;

new GameServer(3000);

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);
