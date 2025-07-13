# OpenRBX

A simple CLI tool to launch Roblox Studio with specific Place ID and Universe ID.

## Installation

```bash
# Clone and install dependencies
git clone https://github.com/kanosy88/openrbx.git
cd openrbx
bun install

# Link globally for testing
bun link
```

## Usage

### Basic syntax

```bash
openrbx -p <place-id> -u <universe-id>
```

### Examples

```bash
# Launch Roblox Studio with a specific place
openrbx -p 1234567891234567 -u 1234567890

# Use full option names
openrbx --place-id 1234567891234567 --universe-id 1234567890

# Specify a custom mode and task
openrbx -p 1234567891234567 -u 1234567890 --mode edit --task EditPlace
```

## Options

| Option          | Shortcut | Description                   | Default     |
| --------------- | -------- | ----------------------------- | ----------- |
| `--place-id`    | `-p`     | Roblox Place ID (required)    | -           |
| `--universe-id` | `-u`     | Roblox Universe ID (required) | -           |
| `--mode`        | `-m`     | Launch mode                   | `edit`      |
| `--task`        | `-t`     | Task to execute               | `EditPlace` |
| `--help`        | `-h`     | Show help                     | -           |
| `--version`     | `-v`     | Show version                  | -           |

## Features

-   ✅ **Cross-platform** : Windows, macOS, Linux
-   ✅ **Simple** : Minimal required parameters
-   ✅ **Error handling** : Clear error messages
-   ✅ **Debug mode** : Environment variable `DEBUG=1`

## Development

### Prerequisites

-   [Bun](https://bun.sh/)
-   Roblox Studio installed on your system

### Development commands

```bash
# Run in development mode
bun run dev -p 134510530844509 -u 8049025471

# Build the package
bun run build

# Test the command globally
bun link
openrbx --help
```

## How it works

OpenRBX generates a Roblox Studio protocol URL in the format:

```
roblox-studio:1+launchmode:edit+task:EditPlace+placeId:<place-id>+universeId:<universe-id>
```

The tool uses the appropriate system commands for each platform:

-   **Windows** : `start`
-   **macOS** : `open`
-   **Linux** : `xdg-open`

## Contributing

Contributions are welcome! Feel free to open an issue or pull request.

## License

MIT License - see the LICENSE file for more details.
