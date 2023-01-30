# valoreye

## Development/Build Prerequisites

- Ensure [Node.js ≥ 18](https://nodejs.org/en/download/) is installed
- Ensure [pnpm is installed globally](https://pnpm.io/installation) (`npm install -g pnpm`)

## Building & running from source

```sh
# Ensure you installed the development/build prerequisites above
# Clone repository and install build dependencies
git clone https://github.com/nyrpqsqq35/valoreye.git valoreye
cd valoreye
pnpm install

# Build for production
pnpm dist # built artifact is at valoreye/dist/index.js

# Start in-dev
pnpm dev # Starts web/ devserver and starts watching valoreye/ for changes
cd valoreye && pnpm start:dev # Start valoreye/dist/index.js (or use IDE to debug it)
```

## References

- [VALORANT-rank-yoinker](https://github.com/zayKenyon/VALORANT-rank-yoinker)
- [Deceive](https://github.com/molenzwiebel/Deceive)
- [valorant-api-docs](https://github.com/techchrism/valorant-api-docs)
