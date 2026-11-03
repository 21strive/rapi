#!/usr/bin/env bash
# Build and deploy rapi.21strive.com with the 21 Strive Cloudflare login.
# The login lives in its own config dir, so other wrangler logins on this machine stay untouched:
#   XDG_CONFIG_HOME=$HOME/.config/21strive npx wrangler@4 login
set -euo pipefail
cd "$(dirname "$0")/.."
export XDG_CONFIG_HOME="${XDG_CONFIG_HOME_21STRIVE:-$HOME/.config/21strive}"
npm run build
npx --yes wrangler@4 deploy "$@"
