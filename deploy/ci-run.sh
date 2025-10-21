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
  echo "[ci-run] Starting Docker container with node:20-alpine..." >&2
  "${DOCKER_CMD[@]}" "set -euo pipefail; echo '[container] Running command...'; ${inner_cmd}"  
}

case "${STEP}" in
  install)
    run_in_docker "echo '[npm] Installing dependencies...'; npm ci --no-audit --no-fund --progress=true"
    ;;
  lint)
    run_in_docker "echo '[check] Verifying node_modules...'; [ -d node_modules ] || (echo '[npm] Installing dependencies...' && npm ci --no-audit --no-fund --progress=true); echo '[lint] Running linter...'; npm run lint"
    ;;
  build)
    run_in_docker "echo '[check] Verifying node_modules...'; [ -d node_modules ] || (echo '[npm] Installing dependencies...' && npm ci --no-audit --no-fund --progress=true); echo '[build] Compiling TypeScript...'; npm run build"
    ;;
  test)
    # Use vitest; ensure dependencies installed, run in watch-disabled mode
    run_in_docker "echo '[check] Verifying node_modules...'; [ -d node_modules ] || (echo '[npm] Installing dependencies...' && npm ci --no-audit --no-fund --progress=true); echo '[test] Running test suite...'; npm test"
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
    run_in_docker "echo '[check] Verifying node_modules...'; [ -d node_modules ] || (echo '[npm] Installing dependencies...' && npm ci --no-audit --no-fund --progress=true); echo '[release] Configuring npm registry...'; echo '//registry.npmjs.org/:_authToken=${NPM_TOKEN}' > .npmrc; echo '[release] Building package...'; npm run build; echo '[release] Publishing to npm...'; npm publish --access public"
    ;;
  *)
    echo "Unknown step: ${STEP}" >&2
    exit 5
    ;;
 esac

echo "[ci-run] ✅ Step '${STEP}' completed" >&2
