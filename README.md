# pi-model-dial

A minimal [pi](https://pi.dev) extension with four Agent Modes:

- **Low** — `opencode-go/deepseek-v4-flash` at `max`
- **Medium** — `opencode-go/gpt-5.6-luna` at `max`
- **High** — `opencode-go/kimi-k3` at `max`
- **Ultra** — `openai-codex/gpt-5.6-sol` at `xhigh`

Press **Ctrl+S** in pi's editor to open the dial. Use **Left/Right** (or Tab) to turn it, **Enter** to select, and **Esc** to cancel.

Each mode switches the model and thinking level, then adds a small matching instruction to the system prompt. The selected mode is shown in the footer and persisted in the current session. Kimi K3 uses `max` because that is its only supported thinking level.

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
