#!/bin/bash

# MIT License

# Copyright (c) 2024 DataStax, Inc.

# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:

# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.

# **THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.**

# Default values for variables
USER=""
PASSWORD=""
DATABASE=""
MODE=""

# Parse command line arguments
while getopts u:p:d:m: flag
do
    case "${flag}" in
        m) MODE=${OPTARG};;
        u) USER=${OPTARG};;
        p) PASSWORD=${OPTARG};;
        d) DATABASE=${OPTARG};;
        *) echo "Usage: $0  -m MODE (add|drop) -u USER -p PASSWORD -d DATABASE" 
           exit 1 ;;
    esac
done

# Check if all required parameters are provided
if [ -z "$USER" ] || [ -z "$DATABASE" ] || [ -z "$MODE" ]; then
    echo "Error: Parameters -u (user), -d (database), and -m (mode) are required."
    exit 1
fi

# Ensure the MODE is either "add" or "drop"
if [ "$MODE" != "add" ] && [ "$MODE" != "drop" ]; then
    echo "Error: Mode must be either 'add' or 'drop'."
    exit 1
fi

# Execute the appropriate SQL commands based on the mode
if [ "$MODE" == "add" ]; then
    if [ -z "$PASSWORD" ]; then
        echo "Error: Password is required in 'add' mode."
        exit 1
    fi

    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<-EOSQL
        CREATE USER $USER WITH PASSWORD '$PASSWORD';
        CREATE DATABASE $DATABASE WITH OWNER $USER;
EOSQL

    echo "User '$USER' and database '$DATABASE' created successfully."

elif [ "$MODE" == "drop" ]; then
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<-EOSQL
        DROP DATABASE IF EXISTS $DATABASE;
        DROP USER IF EXISTS $USER;
EOSQL

    echo "User '$USER' and database '$DATABASE' dropped successfully."
fi
