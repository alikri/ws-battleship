import { CreateGameData } from 'src/types/responseDataTypes';

export const displayResponseResult = <T>(type: string, data: T): void => {
  console.log(`Send message to client - Type: "${type}", Data: ${JSON.stringify(data)}`);
};

export const displayResultWithNoResponse = <T>(command: string, data: T): void => {
  switch (command) {
    case 'reg':
      break;
    case 'create_room':
      const addUserData = data as CreateGameData;
      console.log(
        `Process incoming message: "${command}". Result: Room with ID: "${addUserData.idGame}" created, user with id: "${addUserData.idPlayer}" added to the room`,
      );
      break;
    case 'add_ships': {
      console.log(`Process incoming message: "${command}". Result: ${data}`);
      break;
    }
  }
};
