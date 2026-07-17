#include <iostream>
using namespace std;

char board[3][3];


void initializeBoard()
{
    char value = '1';

    for(int i = 0; i < 3; i++)
    {
        for(int j = 0; j < 3; j++)
        {
            board[i][j] = value++;
        }
    }
}


void displayBoard()
{
    cout << "\n";
    cout << "-------------\n";

    for(int i = 0; i < 3; i++)
    {
        cout << "| ";

        for(int j = 0; j < 3; j++)
        {
            cout << board[i][j] << " | ";
        }

        cout << "\n-------------\n";
    }
}


bool checkWin(char player)
{
    for(int i = 0; i < 3; i++)
    {
        if(board[i][0] == player &&
           board[i][1] == player &&
           board[i][2] == player)
            return true;

        if(board[0][i] == player &&
           board[1][i] == player &&
           board[2][i] == player)
            return true;
    }


    if(board[0][0] == player &&
       board[1][1] == player &&
       board[2][2] == player)
        return true;

    if(board[0][2] == player &&
       board[1][1] == player &&
       board[2][0] == player)
        return true;

    return false;
}


bool checkDraw()
{
    for(int i = 0; i < 3; i++)
    {
        for(int j = 0; j < 3; j++)
        {
            if(board[i][j] != 'X' && board[i][j] != 'O')
                return false;
        }
    }

    return true;
}


void playerMove(char player)
{
    int choice;

    while(true)
    {
        cout << "Player " << player << ", enter position (1-9): ";
        cin >> choice;

        if(choice >= 1 && choice <= 9)
        {
            int row = (choice - 1) / 3;
            int col = (choice - 1) % 3;

            if(board[row][col] != 'X' && board[row][col] != 'O')
            {
                board[row][col] = player;
                break;
            }
            else
            {
                cout << "Position already occupied!\n";
            }
        }
        else
        {
            cout << "Invalid position!\n";
        }
    }
}



void playGame()
{
    char player = 'X';

    initializeBoard();

    while(true)
    {
        displayBoard();

        playerMove(player);

        if(checkWin(player))
        {
            displayBoard();
            cout << "Player " << player << " wins!\n";
            break;
        }

        if(checkDraw())
        {
            displayBoard();
            cout << "Game Draw!\n";
            break;
        }

        
        if(player == 'X')
            player = 'O';
        else
            player = 'X';
    }
}


int main()
{
    char replay;

    do
    {
        playGame();

        cout << "\nDo you want to play again? (Y/N): ";
        cin >> replay;

    } while(replay == 'Y' || replay == 'y');

    cout << "Thanks for playing!\n";

    return 0;
}
