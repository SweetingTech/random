"""
Password Generator Script
Author: SweetDLight
Created: January 23, 2025

This script generates secure passwords with the following characteristics:
- Minimum length of 4 characters
- Includes at least one character from each of these categories:
  * Uppercase letters
  * Lowercase letters
  * Numbers
  * Special characters
- Random character placement to avoid predictable patterns

Usage:
    Run the script directly to use the interactive mode:
    $ python password_generator.py
    
    Or import the generate_password function:
    >>> from password_generator import generate_password
    >>> password = generate_password(length=12)
"""

import random
import string

def generate_password(length=12):
    """
    Generate a secure password of specified length with mixed character types.
    
    Args:
        length (int): The desired length of the password (minimum 4)
        
    Returns:
        str: A randomly generated password containing at least one uppercase letter,
            one lowercase letter, one digit, and one special character
            
    Raises:
        ValueError: If length is less than 4, as this is required to include
                   all character types
    """
    if length < 4:
        raise ValueError("Password length must be at least 4 characters to include all required character types.")

    # Define character pools for each type of character
    uppercase = string.ascii_uppercase    # A-Z
    lowercase = string.ascii_lowercase    # a-z
    digits = string.digits                # 0-9
    special_characters = string.punctuation  # !@#$%^&*()_+, etc.

    # Ensure password complexity by including at least one character from each pool
    password = [
        random.choice(uppercase),         # One uppercase
        random.choice(lowercase),         # One lowercase
        random.choice(digits),            # One number
        random.choice(special_characters) # One special character
    ]

    # Fill the remaining length with random characters from all possible characters
    all_characters = uppercase + lowercase + digits + special_characters
    password += random.choices(all_characters, k=length - 4)

    # Shuffle the password to randomize the guaranteed characters' positions
    random.shuffle(password)

    # Convert the character list to a string and return
    return ''.join(password)

if __name__ == "__main__":
    # Interactive mode when script is run directly
    try:
        length = int(input("Enter the desired password length (minimum 4): "))
        print("Generated Password:", generate_password(length))
    except ValueError as e:
        print("Error:", e)
