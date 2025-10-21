#!/usr/bin/env bash
set -euo pipefail

# Generic dockerized Node 18 CI runner for n8n engage community connector
# Usage: ./deploy/ci-run.sh <install|lint|build|test|release>
# Ensures consistent environment even on agents without Node installed.

STEP="${1:-}" || true
if [[ -z "${STEP}" ]]; then
  echo "Usage: $0 <install|lint|build|test|release>" >&2
  exit 2
fi

IMAGE="node:20-alpine"
WORKDIR="/workspace"
CACHE_DIR=".ci-npm-cache"
mkdir -p "${CACHE_DIR}" || true

# Compose base docker command (mount project + optional npm cache)
DOCKER_CMD=(docker run --rm --platform linux/amd64 \
  -v "$(pwd):${WORKDIR}" \
  -w "${WORKDIR}" \
  -e CI=1 \
  -e NODE_ENV=development \
  -v "$(pwd)/${CACHE_DIR}:/root/.npm" \
  ${IMAGE} sh -c)

run_in_docker() {
  local inner_cmd="$1"
  echo "[ci-run] → ${inner_cmd}" >&2
  "${DOCKER_CMD[@]}" "set -euo pipefail; ${inner_cmd}"  
}

case "${STEP}" in
  install)
    run_in_docker "npm ci --no-audit --no-fund"
    ;;
  lint)
    run_in_docker "[ -d node_modules ] || npm ci --no-audit --no-fund; npm run lint"
    ;;
  build)
    run_in_docker "[ -d node_modules ] || npm ci --no-audit --no-fund; npm run build"
    ;;
  test)
    # Use vitest; ensure dependencies installed, run in watch-disabled mode
    run_in_docker "[ -d node_modules ] || npm ci --no-audit --no-fund; npm test"
    ;;
  release)
    if [[ "${CI:-}" != "" && "${GIT_BRANCH:-}" != "main" && "${BUILDKITE_BRANCH:-}" != "main" ]]; then
      echo "Release step only allowed on main branch" >&2
      exit 3
    fi
    if [[ -z "${NPM_TOKEN:-}" ]]; then
      echo "NPM_TOKEN env var must be provided for release" >&2
      exit 4
    fi
    run_in_docker "[ -d node_modules ] || npm ci --no-audit --no-fund; echo '//registry.npmjs.org/:_authToken=${NPM_TOKEN}' > .npmrc; npm run build; npm publish --access public"
    ;;
  *)
    echo "Unknown step: ${STEP}" >&2
    exit 5
    ;;
 esac

echo "[ci-run] ✅ Step '${STEP}' completed" >&2
