import {
	CustomEditor,
	type ExtensionAPI,
	type ExtensionContext,
	type Theme,
	type ThemeColor,
} from "@earendil-works/pi-coding-agent";
import {
	Key,
	matchesKey,
	truncateToWidth,
	visibleWidth,
	type Component,
} from "@earendil-works/pi-tui";

const MODES = ["Low", "Medium", "High", "Ultra"] as const;
type AgentMode = (typeof MODES)[number];
type ThinkingLevel = "off" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max";

interface ModeDefinition {
	provider: string;
	modelId: string;
	thinkingLevel: ThinkingLevel;
	themeColor: ThemeColor;
	description: string;
	instructions: string;
}

const MODE_DEFINITIONS: Record<AgentMode, ModeDefinition> = {
	Low: {
		provider: "opencode-go",
		modelId: "deepseek-v4-flash",
		thinkingLevel: "max",
		themeColor: "thinkingLow",
		description: "Fast reasoning for simple tasks",
		instructions:
			"Prioritize speed and simplicity. Use brief reasoning, avoid unnecessary exploration, and make the smallest correct change.",
	},
	Medium: {
		provider: "opencode-go",
		modelId: "gpt-5.6-luna",
		thinkingLevel: "max",
		themeColor: "thinkingMedium",
		description: "Balanced reasoning for everyday work",
		instructions:
			"Use balanced reasoning. Read the relevant context, make focused changes, and verify the result without over-investigating.",
	},
	High: {
		provider: "opencode-go",
		modelId: "kimi-k3",
		thinkingLevel: "max",
		themeColor: "thinkingHigh",
		description: "Deep reasoning for hard tasks",
		instructions:
			"Reason deeply. Investigate the relevant context, consider edge cases, and validate the work before finishing.",
	},
	Ultra: {
		provider: "openai-codex",
		modelId: "gpt-5.6-sol",
		thinkingLevel: "xhigh",
		themeColor: "thinkingMax",
		description: "Maximum effort for the hardest tasks",
		instructions:
			"Use maximum care and reasoning. Investigate thoroughly, compare viable approaches, account for risks and edge cases, and validate the work rigorously.",
	},
};

const STATE_ENTRY = "agent-mode-state";
const STATUS_ID = "agent-mode";

class AgentModeEditor extends CustomEditor {
	onOpenDial?: () => void;

	override handleInput(data: string): void {
		if (matchesKey(data, Key.ctrl("s"))) {
			this.onOpenDial?.();
			return;
		}
		super.handleInput(data);
	}
}

function isAgentMode(value: unknown): value is AgentMode {
	return typeof value === "string" && (MODES as readonly string[]).includes(value);
}

class ModeDial implements Component {
	readonly width = 74;

	private selectedIndex: number;

	constructor(
		private readonly theme: Theme,
		initialMode: AgentMode,
		private readonly onChange: () => void,
		private readonly done: (mode: AgentMode | null) => void,
	) {
		this.selectedIndex = MODES.indexOf(initialMode);
	}

	handleInput(data: string): void {
		if (matchesKey(data, Key.escape) || matchesKey(data, Key.ctrl("c"))) {
			this.done(null);
			return;
		}

		if (matchesKey(data, Key.enter)) {
			this.done(MODES[this.selectedIndex]);
			return;
		}

		if (
			matchesKey(data, Key.left) ||
			matchesKey(data, Key.shift("tab")) ||
			data === "h"
		) {
			this.turn(-1);
			return;
		}

		if (
			matchesKey(data, Key.right) ||
			matchesKey(data, Key.tab) ||
			matchesKey(data, Key.ctrl("s")) ||
			data === "l"
		) {
			this.turn(1);
		}
	}

	render(availableWidth: number): string[] {
		const width = Math.min(this.width, availableWidth);
		if (width < 4) return [truncateToWidth("Mode", Math.max(0, width))];

		const theme = this.theme;
		const innerWidth = width - 2;
		const contentWidth = Math.max(1, innerWidth - 2);
		const mode = MODES[this.selectedIndex];
		const definition = MODE_DEFINITIONS[mode];

		const pad = (value: string, targetWidth: number): string => {
			const clipped = truncateToWidth(value, targetWidth, "");
			return clipped + " ".repeat(Math.max(0, targetWidth - visibleWidth(clipped)));
		};

		const row = (value = ""): string => {
			const body = pad(value, innerWidth);
			return theme.fg("border", "│") + body + theme.fg("border", "│");
		};

		// The track and label row share the same exact bounds: Low starts at the
		// first dot and Ultra ends at the last dot.
		const trackWidth = Math.max(
			1,
			contentWidth % 2 === 0 ? contentWidth - 1 : contentWidth,
		);
		const trackInset = Math.max(0, Math.floor((innerWidth - trackWidth) / 2));
		const dotCount = Math.floor(trackWidth / 2) + 1;
		const activeDots = Math.max(
			0,
			Math.round((this.selectedIndex * (dotCount - 1)) / (MODES.length - 1)) +
				1 -
				(this.selectedIndex === MODES.indexOf("High") ? 1 : 0),
		);
		const dots = Array.from({ length: dotCount }, (_, index) =>
			theme.fg(index < activeDots ? definition.themeColor : "dim", "⬤"),
		).join(" ");

		const labelTexts = MODES.map((item) => item.toLowerCase());
		const labelStarts = labelTexts.map((label, index) => {
			if (index === 0) return 0;
			if (index === MODES.length - 1) return trackWidth - visibleWidth(label);
			const anchor = Math.round((index * (trackWidth - 1)) / (MODES.length - 1));
			return Math.round(anchor - visibleWidth(label) / 2);
		});
		let labelCursor = 0;
		const labels = labelTexts.map((label, index) => {
			const gap = " ".repeat(Math.max(0, labelStarts[index] - labelCursor));
			labelCursor = labelStarts[index] + visibleWidth(label);
			const item = MODES[index];
			const styled =
				item === mode
					? theme.bold(theme.fg(definition.themeColor, label))
					: theme.fg("muted", label);
			return gap + styled;
		}).join("");

		const modelName = `${definition.provider}/${definition.modelId}`;
		const agent =
			theme.fg("text", " Agent:  ") +
			theme.fg("muted", `${modelName}  `) +
			theme.bold(theme.fg(definition.themeColor, definition.thinkingLevel));
		const description = theme.fg("muted", ` ${definition.description}`);
		const helpText = "↔ turn  ·  enter select  ·  esc cancel";
		const help =
			" ".repeat(Math.max(1, innerWidth - visibleWidth(helpText) - 1)) +
			theme.fg("dim", helpText);

		return [
			theme.fg("border", `╭${"─".repeat(innerWidth)}╮`),
			row(),
			row(`${" ".repeat(trackInset)}${dots}`),
			row(`${" ".repeat(trackInset)}${labels}`),
			row(),
			row(agent),
			row(),
			row(description),
			row(),
			row(help),
			theme.fg("border", `╰${"─".repeat(innerWidth)}╯`),
		];
	}

	invalidate(): void {}

	private turn(direction: -1 | 1): void {
		this.selectedIndex =
			(this.selectedIndex + direction + MODES.length) % MODES.length;
		this.onChange();
	}
}

export default function modelDialExtension(pi: ExtensionAPI): void {
	let activeMode: AgentMode = "Medium";
	let dialOpen = false;

	function updateStatus(ctx: ExtensionContext): void {
		ctx.ui.setStatus(
			STATUS_ID,
			ctx.ui.theme.fg(
				MODE_DEFINITIONS[activeMode].themeColor,
				`agent:${activeMode.toLowerCase()}`,
			),
		);
	}

	async function activateMode(
		mode: AgentMode,
		ctx: ExtensionContext,
		options: { persist?: boolean; notify?: boolean } = {},
	): Promise<boolean> {
		const definition = MODE_DEFINITIONS[mode];
		const model = ctx.modelRegistry.find(definition.provider, definition.modelId);
		if (!model) {
			if (options.notify !== false) {
				ctx.ui.notify(
					`Agent mode ${mode}: model ${definition.provider}/${definition.modelId} was not found`,
					"error",
				);
			}
			return false;
		}

		if (!(await pi.setModel(model))) {
			if (options.notify !== false) {
				ctx.ui.notify(
					`Agent mode ${mode}: no credentials for ${definition.provider}/${definition.modelId}`,
					"error",
				);
			}
			return false;
		}

		pi.setThinkingLevel(definition.thinkingLevel);
		activeMode = mode;
		updateStatus(ctx);

		if (options.persist !== false) {
			pi.appendEntry(STATE_ENTRY, { mode });
		}
		if (options.notify !== false) {
			ctx.ui.notify(
				`Agent mode: ${mode} · ${definition.provider}/${definition.modelId} · ${pi.getThinkingLevel()}`,
				"info",
			);
		}
		return true;
	}

	async function showDial(ctx: ExtensionContext): Promise<void> {
		if (ctx.mode !== "tui") {
			ctx.ui.notify("The Agent Mode dial requires interactive mode", "warning");
			return;
		}
		if (dialOpen) return;

		dialOpen = true;
		try {
			const selected = await ctx.ui.custom<AgentMode | null>(
				(tui, theme, _keybindings, done) =>
					new ModeDial(
						theme,
						activeMode,
						() => tui.requestRender(),
						done,
					),
				{
					overlay: true,
					overlayOptions: {
						width: 74,
						minWidth: 48,
						maxHeight: 12,
						anchor: "center",
						margin: 1,
					},
				},
			);

			if (selected) await activateMode(selected, ctx);
		} finally {
			dialOpen = false;
		}
	}

	pi.registerCommand("agent-mode", {
		description: "Select an Agent Mode (low, medium, high, ultra)",
		handler: async (args, ctx) => {
			const requested = args.trim().toLowerCase();
			if (!requested) {
				await showDial(ctx);
				return;
			}

			const mode = MODES.find((item) => item.toLowerCase() === requested);
			if (!mode) {
				ctx.ui.notify("Agent mode must be low, medium, high, or ultra", "error");
				return;
			}

			await activateMode(mode, ctx);
		},
	});

	pi.on("before_agent_start", async (event) => {
		const definition = MODE_DEFINITIONS[activeMode];
		return {
			systemPrompt: `${event.systemPrompt}\n\n[AGENT MODE: ${activeMode.toUpperCase()}]\n${definition.instructions}`,
		};
	});

	pi.on("session_start", async (_event, ctx) => {
		if (ctx.mode === "tui") {
			ctx.ui.setEditorComponent((tui, theme, keybindings) => {
				const editor = new AgentModeEditor(tui, theme, keybindings);
				editor.onOpenDial = () => {
					void showDial(ctx).catch((error: unknown) => {
						ctx.ui.notify(`Could not open Agent Mode dial: ${String(error)}`, "error");
					});
				};
				return editor;
			});
		}

		const branch = ctx.sessionManager.getBranch();
		for (let index = branch.length - 1; index >= 0; index--) {
			const entry = branch[index];
			if (entry?.type !== "custom" || entry.customType !== STATE_ENTRY) continue;

			const savedMode = (entry.data as { mode?: unknown } | undefined)?.mode;
			if (isAgentMode(savedMode)) activeMode = savedMode;
			break;
		}

		await activateMode(activeMode, ctx, { persist: false, notify: false });
	});
}
