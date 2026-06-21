---
description: Refresh the graphify knowledge graph and Obsidian vault after code changes
---

Update the project's knowledge layer in two steps:

1. Run `/graphify . --update` — incrementally re-extracts only new or changed files and rebuilds `graphify-out/graph.json`.
2. Run `/graphify . --obsidian` — regenerates the Obsidian vault under `graphify-out/obsidian/` from the refreshed graph.

Run them in order; step 2 depends on the graph produced by step 1.
