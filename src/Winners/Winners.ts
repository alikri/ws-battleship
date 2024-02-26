import { WinnersData } from 'src/types/responseDataTypes';

export class Winners {
  private winnersResponseData: WinnersData[] = [];

  public addOrUpdateWinner(name: string): void {
    const winnerIndex = this.winnersResponseData.findIndex((winner) => winner.name === name);
    if (winnerIndex !== -1) {
      const winner = this.winnersResponseData[winnerIndex];
      if (winner) {
        winner.wins += 1;
      }
    } else {
      this.winnersResponseData.push({ name, wins: 1 });
    }
  }

  getWinnersResponseData(): WinnersData[] {
    return this.winnersResponseData;
  }
}
