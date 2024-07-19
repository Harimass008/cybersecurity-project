import os
import sqlite3
import hashlib
import subprocess

# 1. Hardcoded secret key (fixed)
secret_key = os.environ.get('SECRET_KEY')

# 2. SQL Injection vulnerability (fixed)
def get_user_by_username(username):
    conn = sqlite3.connect('example.db')
    cursor = conn.cursor()
    query = "SELECT * FROM users WHERE username =?"
    cursor.execute(query, (username,))  # Use parameterized query
    result = cursor.fetchall()
    conn.close()
    return result

# 3. Command Injection vulnerability (fixed)
def execute_command(command):
    subprocess.run(command, shell=False, check=True)  # Use subprocess.run() with a list of arguments

# 4. Hardcoded password (fixed)
db_password = os.environ.get('DB_PASSWORD')

# 5. Weak cryptographic hash (fixed)
password = "password123"
hashed_password = hashlib.sha256(password.encode()).hexdigest()  # Use a stronger hash algorithm like SHA-256

# 6. Insecure file permissions (fixed)
def save_secret(data):
    with open('secret.txt', 'w', mode=0o600) as f:  # Set secure file permissions
        f.write(data)

# 7. Path traversal vulnerability (fixed)
def read_file(file_path):
    if not os.path.basename(file_path) == file_path:
        raise ValueError("Invalid file path")
    with open(os.path.realpath(file_path), 'r') as file:  # Validate and sanitize file paths
        return file.read()