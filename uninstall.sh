#!/usr/bin/env bash

set -e

if [ "$(id -u)" -ne 0 ]; then
    echo "Please run this script as root or using sudo!"
    exit 1
fi


# remove /opt/codelive
rm -rf /opt/codelive 2>/dev/null || true
# rm -f /opt/codelive/codelive
# rm -f /opt/codelive/icon.ico
# rmdir /opt/codelive 2>/dev/null || true

# remove .desktop file
rm -f /usr/share/applications/codelive.desktop
update-desktop-database /usr/share/applications 2>/dev/null || true

# remove symblink to the binary
rm -f /usr/local/bin/codelive

echo -e "\n\e[1;31muninstall complete !!\e[0m\n"
