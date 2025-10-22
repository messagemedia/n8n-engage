#!/usr/bin/env bash
set -euo pipefail

# Optimized dockerized Node 20 CI runner for n8n engage community connector
# Usage: ./deploy/ci-run.sh <install|lint|build|test|release>
# Uses persistent container with cached dependencies for better performance

STEP="${1:-}" || true
if [[ -z "${STEP}" ]]; then
  echo "Usage: $0 <install|lint|build|test|release>" >&2
  exit 2
fi

IMAGE="node:20-alpine"
WORKDIR="/workspace"
CACHE_DIR=".ci-npm-cache"
mkdir -p "${CACHE_DIR}" || true

# Compose base docker command with optimized caching
# Use native platform for better compatibility, especially on ARM64 agents
DOCKER_CMD=(docker run --rm \
  -v "$(pwd):${WORKDIR}" \
  -w "${WORKDIR}" \
  -e CI=1 \
  -e NODE_ENV=development \
  -e NPM_CONFIG_PROGRESS=false \
  -e NPM_CONFIG_Loglevel=warn \
  -e NPM_CONFIG_AUDIT=false \
  -e NPM_CONFIG_FUND=false \
  -v "$(pwd)/${CACHE_DIR}:/root/.npm")

# Mount node_modules only if it exists to avoid issues
if [[ -d "node_modules" ]]; then
  DOCKER_CMD+=(-v "$(pwd)/node_modules:${WORKDIR}/node_modules")
fi

DOCKER_CMD+=(${IMAGE} sh -c)

# Add timeout wrapper to prevent hanging builds
run_with_timeout() {
  local cmd="$1"
  local timeout="${2:-300}"  # Default 5 minutes

  echo "[ci-run] Running command with ${timeout}s timeout..." >&2

  # Use timeout command if available, otherwise run normally
  if command -v timeout >/dev/null 2>&1; then
    timeout ${timeout} bash -c "$cmd"
  else
    eval "$cmd"
  fi
}

run_in_docker() {
  local inner_cmd="$1"
  echo "[ci-run] → ${inner_cmd}" >&2
  echo "[ci-run] Starting Docker container with ${IMAGE}..." >&2

  # Use cat to pass the command, avoiding shell expansion on host
  local full_cmd='
    set -euo pipefail

    echo "[container] ===== ENVIRONMENT INFO ====="
    echo "[container] Node version: $(node --version 2>/dev/null || echo unavailable)"
    echo "[container] NPM version: $(npm --version 2>/dev/null || echo unavailable)"
    echo "[container] Platform: $(uname -m)"
    echo "[container] Working directory: $(pwd)"
    echo "[container] NPM cache directory: $(npm config get cache 2>/dev/null || echo unavailable)"
    echo "[container] ================================="

    echo "[container] ===== NPM CONFIGURATION ====="
    npm config set fetch-retries 5 2>/dev/null || true
    npm config set fetch-retry-mintimeout 20000 2>/dev/null || true
    npm config set fetch-retry-maxtimeout 120000 2>/dev/null || true
    npm config set progress false 2>/dev/null || true
    npm config set loglevel warn 2>/dev/null || true
    npm config set fund false 2>/dev/null || true
    npm config set audit false 2>/dev/null || true
    echo "[container] ================================="

    echo "[container] Running command..."
    '"$inner_cmd"'
  '

  echo "[ci-run] Executing Docker command..." >&2
  "${DOCKER_CMD[@]}" "$full_cmd"
}

case "${STEP}" in
  install)
    run_in_docker "
      echo '[npm] Starting dependency installation...'
      echo '[npm] Current directory contents:'
      ls -la
      echo '[npm] Package.json exists:'
      ls -la package.json

      # Check if npm cache seems corrupted and clear if needed
      echo '[npm] Checking npm cache health...'
      if ! npm cache verify 2>/dev/null; then
        echo '[npm] Cache verification failed, clearing cache...'
        npm cache clean --force
      fi

      echo '[npm] Installing dependencies (optimized for speed)...'
      # Use faster install options with extended timeout for CI reliability
      if command -v timeout >/dev/null 2>&1; then
        timeout 600 npm ci --no-audit --no-fund --prefer-offline
      else
        npm ci --no-audit --no-fund --prefer-offline
      fi

      echo '[npm] Installation completed successfully'
      echo '[npm] Verifying node_modules...'
      ls -la node_modules | head -10
    "
    ;;
  lint)
    run_in_docker "
      echo '[check] Verifying node_modules...'
      if [ ! -d node_modules ]; then
        echo '[npm] Installing dependencies first (fast mode)...'
        # Check cache health before installing
        if ! npm cache verify 2>/dev/null; then
          echo '[npm] Clearing corrupted cache...'
          npm cache clean --force
        fi
        timeout 600 npm ci --no-audit --no-fund --prefer-offline
      fi
      echo '[lint] Running linter...'
      npm run lint
      echo '[lint] Linting completed successfully'
    "
    ;;
  build)
    run_in_docker "
      echo '[check] Verifying node_modules...'
      if [ ! -d node_modules ]; then
        echo '[npm] Installing dependencies first (fast mode)...'
        # Check cache health before installing
        if ! npm cache verify 2>/dev/null; then
          echo '[npm] Clearing corrupted cache...'
          npm cache clean --force
        fi
        timeout 600 npm ci --no-audit --no-fund --prefer-offline
      fi
      echo '[build] Compiling TypeScript...'
      npm run build
      echo '[build] Build completed successfully'
      echo '[build] Verifying dist directory...'
      ls -la dist/
    "
    ;;
  test)
    # Use vitest; ensure dependencies installed, run in watch-disabled mode
    run_in_docker "
      echo '[check] Verifying node_modules...'
      if [ ! -d node_modules ]; then
        echo '[npm] Installing dependencies first (fast mode)...'
        # Check cache health before installing
        if ! npm cache verify 2>/dev/null; then
          echo '[npm] Clearing corrupted cache...'
          npm cache clean --force
        fi
        timeout 600 npm ci --no-audit --no-fund --prefer-offline
      fi
      echo '[test] Running test suite...'
      npm test
      echo '[test] Tests completed successfully'
    "
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
    run_in_docker "
      echo '[check] Verifying node_modules...'
      if [ ! -d node_modules ]; then
        echo '[npm] Installing dependencies first (fast mode)...'
        # Check cache health before installing
        if ! npm cache verify 2>/dev/null; then
          echo '[npm] Clearing corrupted cache...'
          npm cache clean --force
        fi
        timeout 600 npm ci --no-audit --no-fund --prefer-offline
      fi
      echo '[release] Configuring npm registry...'
      echo '//registry.npmjs.org/:_authToken=${NPM_TOKEN}' > .npmrc
      echo '[release] Building package...'
      npm run build
      echo '[release] Publishing to npm...'
      npm publish --access public
      echo '[release] Release completed successfully'
    "
    ;;
  *)
    echo "Unknown step: ${STEP}" >&2
    exit 5
    ;;
esac

echo "[ci-run] ✅ Step '${STEP}' completed" >&2
