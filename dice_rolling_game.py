import random

def roll_dice():
    """Roll two six-sided dice and return the results."""
    die1 = random.randint(1, 6)
    die2 = random.randint(1, 6)
    return die1, die2


def main():
    print("=" * 40)
    print("   WELCOME TO THE DICE ROLLING GAME")
    print("=" * 40)

    total_rolls = 0
    doubles_count = 0

    while True:
        choice = input("\nRoll the dice? (y/n): ").strip().lower()

        if choice == 'y':
            die1, die2 = roll_dice()
            total_rolls += 1
            print(f"You rolled: {die1} and {die2}  (total: {die1 + die2})")

            if die1 == die2:
                doubles_count += 1
                print("Doubles! Lucky roll!")

        elif choice == 'n':
            print("\nThanks for playing!")
            print(f"Total rolls: {total_rolls}")
            print(f"Doubles rolled: {doubles_count}")
            break

        else:
            print("Invalid choice! Please enter 'y' or 'n'.")


if __name__ == "__main__":
    main()