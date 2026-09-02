# claude-plugins

Personal Claude Code plugin marketplace.

## Install

```
/plugin marketplace add YOUR_GH_USER/claude-plugins
/plugin install clean-forge@kapelsinas-plugins
```
Or from a terminal: `claude plugin marketplace add YOUR_GH_USER/claude-plugins && claude plugin install clean-forge@kapelsinas-plugins`.

Update later with `/plugin update clean-forge@kapelsinas-plugins` (versions are pinned by `plugins/<name>/.claude-plugin/plugin.json` → bump `version` to ship an update).

## Plugins

| Plugin | What |
|---|---|
| [clean-forge](./plugins/clean-forge) | Spec → Gherkin → plan → per-task coder/cleaner → architect → mutation-hardener pipeline for Node / NestJS / Next.js, gated by deterministic tools. |

## Team use
Add to a project's `.claude/settings.json` so collaborators get it on trust:
```json
{
  "extraKnownMarketplaces": {
    "kapelsinas-plugins": { "source": { "source": "github", "repo": "YOUR_GH_USER/claude-plugins" } }
  },
  "enabledPlugins": { "clean-forge@kapelsinas-plugins": true }
}
```

## Develop
```
claude plugin validate ./plugins/clean-forge --strict
claude --plugin-dir ./plugins/clean-forge      # try changes before pushing
```
