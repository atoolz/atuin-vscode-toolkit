export interface SectionOption {
  name: string;
  type: "string" | "number" | "boolean" | "array";
  default: string;
  description: string;
  enumValues?: string[];
}

export interface AtuinSection {
  name: string;
  description: string;
  docUrl: string;
  options: SectionOption[];
}

const DOC_BASE = "https://docs.atuin.sh/cli/configuration/config/";

/**
 * Top-level options (no section header).
 */
export const topLevelOptions: SectionOption[] = [
  { name: "db_path", type: "string", default: '"~/.local/share/atuin/history.db"', description: "Path to the history database file." },
  { name: "key_path", type: "string", default: '"~/.local/share/atuin/key"', description: "Path to the encryption key." },
  { name: "session_path", type: "string", default: '"~/.local/share/atuin/session"', description: "Path to the session token file." },
  { name: "dialect", type: "string", default: '"us"', description: "Date parsing dialect.", enumValues: ["us", "uk"] },
  { name: "auto_sync", type: "boolean", default: "true", description: "Automatically sync history when logged in." },
  { name: "update_check", type: "boolean", default: "true", description: "Check for updates at startup." },
  { name: "sync_address", type: "string", default: '"https://api.atuin.sh"', description: "Address of the sync server." },
  { name: "sync_frequency", type: "string", default: '"5m"', description: "How often to sync with the server (e.g. 5m, 1h)." },
  { name: "search_mode", type: "string", default: '"fuzzy"', description: "Search algorithm to use.", enumValues: ["prefix", "fulltext", "fuzzy", "skim", "daemon-fuzzy"] },
  { name: "filter_mode", type: "string", default: '"global"', description: "Default filter mode for search.", enumValues: ["global", "host", "session", "directory", "workspace"] },
  { name: "filter_mode_shell_up_key_binding", type: "string", default: '"global"', description: "Filter mode used when pressing the up arrow key.", enumValues: ["global", "host", "session", "directory", "workspace"] },
  { name: "search_mode_shell_up_key_binding", type: "string", default: '"fuzzy"', description: "Search mode used when pressing the up arrow key.", enumValues: ["prefix", "fulltext", "fuzzy", "skim", "daemon-fuzzy"] },
  { name: "style", type: "string", default: '"compact"', description: "UI style for the search interface.", enumValues: ["auto", "full", "compact"] },
  { name: "inline_height", type: "number", default: "40", description: "Maximum number of lines for the inline interface." },
  { name: "invert", type: "boolean", default: "false", description: "Place the search bar at the top of the screen." },
  { name: "show_preview", type: "boolean", default: "true", description: "Show a preview of the selected command." },
  { name: "max_preview_height", type: "number", default: "4", description: "Maximum number of lines for the preview window." },
  { name: "show_help", type: "boolean", default: "true", description: "Show the help row at the bottom." },
  { name: "show_tabs", type: "boolean", default: "true", description: "Show tab bar for filter modes." },
  { name: "show_numeric_shortcuts", type: "boolean", default: "true", description: "Show numeric shortcuts for quick selection." },
  { name: "auto_hide_height", type: "number", default: "8", description: "Minimum terminal height before auto-hiding the interface." },
  { name: "exit_mode", type: "string", default: '"return-original"', description: "Behavior when pressing escape.", enumValues: ["return-original", "return-query"] },
  { name: "keymap_mode", type: "string", default: '"emacs"', description: "Keyboard mapping mode.", enumValues: ["emacs", "vim-normal", "vim-insert", "auto"] },
  { name: "word_jump_mode", type: "string", default: '"emacs"', description: "Word navigation style.", enumValues: ["emacs", "subl"] },
  { name: "history_format", type: "string", default: '"{time}\\t{command}\\t{duration}"', description: "Format string for history display." },
  { name: "store_failed", type: "boolean", default: "true", description: "Store commands that exit with a non-zero status." },
  { name: "secrets_filter", type: "boolean", default: "true", description: "Filter out commands that likely contain secrets." },
  { name: "workspaces", type: "boolean", default: "false", description: "Enable workspace-based filtering." },
  { name: "enter_accept", type: "boolean", default: "false", description: "Execute the selected command immediately on Enter." },
  { name: "smart_sort", type: "boolean", default: "false", description: "Enable smart sorting based on context." },
  { name: "network_timeout", type: "number", default: "30", description: "Network request timeout in seconds." },
  { name: "network_connect_timeout", type: "number", default: "5", description: "Network connection timeout in seconds." },
  { name: "local_timeout", type: "number", default: "2.0", description: "Local database query timeout in seconds." },
  { name: "prefers_reduced_motion", type: "boolean", default: "false", description: "Reduce UI animations." },
  { name: "ctrl_n_shortcuts", type: "boolean", default: "false", description: "Enable Ctrl+N shortcuts for quick selection." },
  { name: "command_chaining", type: "boolean", default: "false", description: "Enable command chaining with && and ||." },
];

/**
 * All Atuin config sections with their options.
 */
export const atuinSections: AtuinSection[] = [
  {
    name: "daemon",
    description: "Configure the Atuin background daemon for improved performance and background sync.",
    docUrl: DOC_BASE,
    options: [
      { name: "enabled", type: "boolean", default: "false", description: "Activate the Atuin daemon." },
      { name: "autostart", type: "boolean", default: "false", description: "Automatically start the daemon when Atuin is used." },
      { name: "sync_frequency", type: "number", default: "300", description: "How often the daemon syncs in seconds." },
      { name: "socket_path", type: "string", default: '""', description: "Path to the Unix socket for daemon communication." },
      { name: "pidfile_path", type: "string", default: '""', description: "Path to the PID file for the daemon process." },
      { name: "systemd_socket", type: "boolean", default: "false", description: "Use systemd socket activation." },
      { name: "tcp_port", type: "number", default: "8889", description: "TCP port for the daemon to listen on." },
    ],
  },
  {
    name: "sync",
    description: "Configure sync behavior for Atuin history synchronization.",
    docUrl: DOC_BASE,
    options: [
      { name: "records", type: "boolean", default: "true", description: "Enable the v2 sync protocol with record-based syncing." },
    ],
  },
  {
    name: "search",
    description: "Fine-tune search behavior and scoring.",
    docUrl: DOC_BASE,
    options: [
      { name: "filters", type: "array", default: "[]", description: "List of filter modes to cycle through when searching." },
      { name: "recency_score_multiplier", type: "number", default: "1.0", description: "Weight multiplier for how recently a command was used." },
      { name: "frequency_score_multiplier", type: "number", default: "1.0", description: "Weight multiplier for how frequently a command is used." },
      { name: "frecency_score_multiplier", type: "number", default: "1.0", description: "Weight multiplier for the combined frecency score." },
    ],
  },
  {
    name: "stats",
    description: "Configure the stats command output.",
    docUrl: DOC_BASE,
    options: [
      { name: "common_subcommands", type: "array", default: '["apt","cargo","docker","git","kubectl","npm","yarn"]', description: "Commands whose subcommands are tracked in stats." },
      { name: "common_prefix", type: "array", default: '["sudo","doas"]', description: "Command prefixes that are stripped for stats aggregation." },
      { name: "ignored_commands", type: "array", default: "[]", description: "Commands excluded from stats entirely." },
    ],
  },
  {
    name: "keys",
    description: "Configure keyboard behavior in the Atuin search interface.",
    docUrl: DOC_BASE,
    options: [
      { name: "scroll_exits", type: "boolean", default: "true", description: "Exit search when scrolling past the end of the list." },
      { name: "prefix", type: "string", default: '"a"', description: "Prefix key for keyboard shortcuts." },
      { name: "exit_past_line_start", type: "boolean", default: "true", description: "Exit search when pressing left past the start of the line." },
      { name: "accept_past_line_end", type: "boolean", default: "true", description: "Accept selection when pressing right past the end of the line." },
      { name: "accept_past_line_start", type: "boolean", default: "false", description: "Accept selection when pressing left past the start of the line." },
      { name: "accept_with_backspace", type: "boolean", default: "false", description: "Accept selection when pressing backspace on an empty line." },
    ],
  },
  {
    name: "preview",
    description: "Configure the command preview panel.",
    docUrl: DOC_BASE,
    options: [
      { name: "strategy", type: "string", default: '"auto"', description: "Preview rendering strategy.", enumValues: ["auto", "static", "fixed"] },
    ],
  },
  {
    name: "theme",
    description: "Configure the visual theme for Atuin.",
    docUrl: DOC_BASE,
    options: [
      { name: "name", type: "string", default: '"default"', description: "Name of the theme to use." },
      { name: "debug", type: "boolean", default: "false", description: "Enable debug output for theme loading." },
      { name: "max_depth", type: "number", default: "10", description: "Maximum inheritance depth for theme resolution." },
    ],
  },
  {
    name: "logs",
    description: "Configure Atuin logging behavior.",
    docUrl: DOC_BASE,
    options: [
      { name: "enabled", type: "boolean", default: "true", description: "Enable writing log files." },
      { name: "dir", type: "string", default: '"~/.atuin/logs"', description: "Directory for log files." },
      { name: "level", type: "string", default: '"info"', description: "Minimum log level to record.", enumValues: ["trace", "debug", "info", "warn", "error"] },
      { name: "retention", type: "number", default: "4", description: "Number of days to retain log files." },
    ],
  },
  {
    name: "ui",
    description: "Configure the Atuin user interface columns.",
    docUrl: DOC_BASE,
    options: [
      { name: "columns", type: "array", default: '["duration","time","command"]', description: "Columns to display in the search results. Options: duration, time, datetime, directory, host, user, exit, command." },
    ],
  },
  {
    name: "ai",
    description: "Configure AI-powered features in Atuin.",
    docUrl: DOC_BASE,
    options: [
      { name: "enabled", type: "boolean", default: "false", description: "Enable AI-powered features." },
      { name: "endpoint", type: "string", default: '""', description: "Custom API endpoint for the AI service." },
      { name: "api_token", type: "string", default: '""', description: "API token for authenticating with the AI service." },
      { name: "send_cwd", type: "boolean", default: "false", description: "Send the current working directory as context to the AI." },
    ],
  },
  {
    name: "dotfiles",
    description: "Configure dotfiles syncing through Atuin.",
    docUrl: DOC_BASE,
    options: [
      { name: "enabled", type: "boolean", default: "false", description: "Enable syncing shell aliases via Atuin." },
    ],
  },
  {
    name: "tmux",
    description: "Configure tmux integration for the Atuin search interface.",
    docUrl: DOC_BASE,
    options: [
      { name: "enabled", type: "boolean", default: "false", description: "Launch Atuin search in a tmux popup." },
      { name: "width", type: "string", default: '"80%"', description: "Width of the tmux popup (percentage or absolute)." },
      { name: "height", type: "string", default: '"60%"', description: "Height of the tmux popup (percentage or absolute)." },
    ],
  },
];

/**
 * All known section names.
 */
export const allSectionNames: string[] = atuinSections.map((s) => s.name);

/**
 * All known top-level option names.
 */
export const allTopLevelNames: string[] = topLevelOptions.map((o) => o.name);

/**
 * Find a section by name.
 */
export function findSection(name: string): AtuinSection | undefined {
  return atuinSections.find((s) => s.name === name);
}

/**
 * Find a top-level option by name.
 */
export function findTopLevelOption(name: string): SectionOption | undefined {
  return topLevelOptions.find((o) => o.name === name);
}
