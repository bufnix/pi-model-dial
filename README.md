# pi-model-dial

A minimal [pi](https://pi.dev) extension with four Agent Modes. Each mode selects a main agent and an oracle reserved for future subagent work:

| Mode | Agent | Oracle |
| --- | --- | --- |
| **Low** | `opencode-go/deepseek-v4-flash` at `max` | `opencode-go/gpt-5.6-luna` at `max` |
| **Medium** | `opencode-go/gpt-5.6-luna` at `max` | `opencode-go/deepseek-v4-pro` at `max` |
| **High** | `opencode-go/deepseek-v4-pro` at `max` | `openai-codex/gpt-5.6-sol` at `xhigh` |
| **Ultra** | `openai-codex/gpt-5.6-sol` at `xhigh` | `openai-codex/gpt-5.6-sol` at `max` |

Press **Ctrl+S** in pi's editor to open the dial. Use **Left/Right** (or Tab) to turn it, **Enter** to select, and **Esc** to cancel.

Each mode switches the active agent model and thinking level, validates and records the oracle selection, then adds a small matching instruction to the system prompt. The complete agent/oracle selection is persisted in the current session and published on the `bufnix:agent-mode-selection` extension event. With `pi-bufnix-tui`, both selections are shown in the footer.

## Install

From GitHub:

```bash
pi install git:github.com/bufnix/pi-model-dial
```

Or try a local checkout:

```bash
pi -e .
```

You can also open or set the mode with a command:

```text
/agent-mode
/agent-mode high
```

## Development

```bash
pnpm install --ignore-scripts
pnpm typecheck
```
