# claude-plugins

Personal Claude Code plugin marketplace.

## Install

```
/plugin marketplace add YOUR_GH_USER/claude-plugins
/plugin install clean-forge@claude-plugins
```
Or from a terminal: `claude plugin marketplace add YOUR_GH_USER/claude-plugins && claude plugin install clean-forge@claude-plugins`.

Update later with `/plugin update clean-forge@claude-plugins` (versions are pinned by `plugins/<name>/.claude-plugin/plugin.json` → bump `version` to ship an update).

## Plugins

| Plugin | What |
|---|---|
| [clean-forge](./plugins/clean-forge) | Spec → Gherkin → plan → per-task coder/cleaner → architect → mutation-hardener pipeline for Node / NestJS / Next.js, gated by deterministic tools. |

## Team use
Add to a project's `.claude/settings.json` so collaborators get it on trust:
```json
{
  "extraKnownMarketplaces": {
    "claude-plugins": { "source": { "source": "github", "repo": "YOUR_GH_USER/claude-plugins" } }
  },
  "enabledPlugins": { "clean-forge@claude-plugins": true }
}
```

## Develop
```
claude plugin validate ./plugins/clean-forge --strict
claude --plugin-dir ./plugins/clean-forge      # try changes before pushing
```
