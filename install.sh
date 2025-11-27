#!/usr/bin/env bash

set -e

if [ $(id -u) -ne 0 ]; then
    echo "Please run this script as root or using sudo!"
    exit 1
fi

FILE_D_BINARY="src-tauri/target/release/codelive"
INSTALL_DIR="/opt/codelive"

if [ ! -f "$FILE_D_BINARY" ]; then
    echo "Binary doesn't exists. Please build the application first. See instructions in README.md"
    exit 1
fi


mkdir -p "$INSTALL_DIR"


# copy files
install -Dm644 src-tauri/icons/icon.ico "$INSTALL_DIR/icon.ico"
install -Dm755 "$FILE_D_BINARY" "$INSTALL_DIR/codelive"

# remove debug pointers | decreases binary size :)
strip "$INSTALL_DIR/codelive"

# make a symblink to the executable
ln -sf "$INSTALL_DIR/codelive" /usr/local/bin/codelive

# install .desktop file
desktop-file-install codelive.desktop

echo -e "\n\e[1;32minstall complete !!\e[0m\n"