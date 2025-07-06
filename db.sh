#!/usr/bin/env bash

DB_FILE="./data/db.sqlite"

function create_db() {
    echo "[*] Creating tables in $DB_FILE..."
    sqlite3 $DB_FILE <<EOF
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS itineraries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  days INTEGER NOT NULL,
  data TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, prompt),
  FOREIGN KEY(user_id) REFERENCES users(id)
);
EOF
    echo "[+] DB schema created."
}

function reset_db() {
    echo "[*] Removing $DB_FILE..."
    rm -f "$DB_FILE"
    echo "[+] DB file removed."
}

sanitize() {
    echo "$1" | sed "s/'/''/g"
}

function populate_fake() {
    create_db
    echo "[*] Populating with fake data..."
    FAKE_JSON=$(curl -s 'https://fakerapi.it/api/v1/users?_quantity=5')

    for row in $(echo "$FAKE_JSON" | jq -c '.data[]'); do
        email=$(sanitize "$(echo "$row" | jq -r '.email')")
        password=$(sanitize "$(echo "$row" | jq -r '.password')")
        first_name=$(sanitize "$(echo "$row" | jq -r '.firstname')")
        last_name=$(sanitize "$(echo "$row" | jq -r '.lastname')")
        city="Fake City"
        title="$first_name Trip"

        echo "[debug] email=$email | name=$first_name | last_name=$last_name"

        sqlite3 $DB_FILE <<EOF
INSERT OR IGNORE INTO users (email, password, first_name, last_name)
VALUES ('$email', '$password', '$first_name', '$last_name');

INSERT INTO itineraries (user_id, title, location, days, data)
VALUES (
  (SELECT id FROM users WHERE email = '$email'),
  '$title',
  '$city',
  5,
  '{"day1":"Beach","day2":"Food Tour","day3":"Museum","day4":"Shopping","day5":"Relax"}'
);
EOF
    done

    echo "[+] Dummy data inserted."
}

case "$1" in
--init) create_db ;;
--reset) reset_db ;;
--fake) populate_fake ;;
*)
    echo "Usage: $0 [--init | --reset | --fake]"
    ;;
esac
