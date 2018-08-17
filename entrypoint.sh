#!/bin/bash

# Add local user
# Either use the LOCAL_USER_ID if passed in at runtime or
# fallback

USER_ID=${LOCAL_USER_ID:-9001}

echo "Starting with UID : $USER_ID"
useradd --shell /bin/bash -u $USER_ID -o -c "" -m user
export HOME=/home/user

hostile set localhost user.nuclide.$(hostname)

# https://github.com/facebookincubator/create-react-app/issues/2271
hostile set 0.0.0.0 $(cat /etc/parent_host)

exec /usr/bin/dumb-init -- /usr/local/bin/gosu user "$@"
