#!/usr/bin/env bash
set -euo pipefail

: "${CPANEL_SERVER:?}" "${CPANEL_USERNAME:?}" "${DEPLOY_PATH:?}"
: "${SSH_PRIVATE_KEY:?}" "${SSH_KNOWN_HOSTS:?}" "${RUNNER_TEMP:?}"
[[ "$CPANEL_SERVER" =~ ^[a-zA-Z0-9.-]+$ ]]
[[ "$CPANEL_USERNAME" =~ ^[a-zA-Z0-9_]+$ ]]
[[ "$DEPLOY_PATH" =~ ^/home/$CPANEL_USERNAME/[a-zA-Z0-9_./-]+$ ]]
[[ "$DEPLOY_PATH" != *..* && "$DEPLOY_PATH" != */ && "$DEPLOY_PATH" != *admin2dayna2day* ]]
test -s frontend/dist/index.html
test -d frontend/dist/_next/static

umask 077
key="$RUNNER_TEMP/2day-deploy-key"
hosts="$RUNNER_TEMP/2day-known-hosts"
printf '%s\n' "$SSH_PRIVATE_KEY" > "$key"
printf '%s\n' "$SSH_KNOWN_HOSTS" > "$hosts"
unset SSH_PRIVATE_KEY SSH_KNOWN_HOSTS
ssh_options=(-i "$key" -o BatchMode=yes -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$hosts" -o ConnectTimeout=15)
remote="$CPANEL_USERNAME@$CPANEL_SERVER"

# No deletion: preserve hosting configuration and assets used by open browser tabs.
ssh "${ssh_options[@]}" "$remote" "bash -s -- '$DEPLOY_PATH' '${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}'" <<'REMOTE'
set -euo pipefail
target="$1"
test -d "$target"
test ! -L "$target"
test -e "$target/.2dayna2day-frontend"
test ! -d "$target/wp-admin"
test ! -f "$target/wp-config.php"
test "$(realpath "$target")" = "$target"
backup="$HOME/2dayna2day-backups"
mkdir -p "$backup"
tar -czf "$backup/frontend-$2.tar.gz" -C "$target" .
REMOTE

export RSYNC_RSH="ssh -i $key -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=$hosts -o ConnectTimeout=15"
# Upload assets before HTML that references them.
rsync -az --delay-updates --timeout=60 frontend/dist/_next/ "$remote:$DEPLOY_PATH/_next/"
rsync -az --delay-updates --timeout=60 --exclude='_next/' frontend/dist/ "$remote:$DEPLOY_PATH/"
curl --fail --silent --show-error --retry 3 --max-time 30 'https://2dayna2day.goldenbackapparel.com/fr/' -o "$RUNNER_TEMP/2day-home.html"
grep -qi '<html' "$RUNNER_TEMP/2day-home.html"
echo 'Transfert terminé ; page publique accessible. Tester aussi les parcours métier.'
