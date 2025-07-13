import { spawn, exec } from "child_process";
import { platform } from "os";
import { parseArgs } from "util";
import { promisify } from "util";
import type { RobloxProtocolParams } from "./types";

const execAsync = promisify(exec);

class RobloxStudioLauncher {
    private protocolUrl: string;

    constructor(params: RobloxProtocolParams) {
        this.protocolUrl = this.buildProtocolUrl(params);
    }

    private buildProtocolUrl(params: RobloxProtocolParams): string {
        const baseUrl = "roblox-studio:1";

        const allParams = {
            launchmode: params.launchmode,
            task: params.task,
            placeId: params.placeId,
            universeId: params.universeId,
        };

        const paramString = Object.entries(allParams)
            .map(([key, value]) => `${key}:${value}`)
            .join("+");

        return `${baseUrl}+${paramString}`;
    }

    public async checkExistingProcesses(
        noLogs: boolean = false
    ): Promise<boolean> {
        try {
            const currentPlatform = platform();
            let command: string;

            switch (currentPlatform) {
                case "win32":
                    command =
                        'tasklist /fi "imagename eq RobloxStudioBeta.exe" /fo csv | find /c "RobloxStudioBeta.exe"';
                    break;
                case "darwin":
                    command = 'pgrep -f "RobloxStudio" | wc -l';
                    break;
                case "linux":
                    command = 'pgrep -f "roblox-studio" | wc -l';
                    break;
                default:
                    if (!noLogs) {
                        console.warn(
                            `Process checking not supported on platform: ${currentPlatform}`
                        );
                    }
                    return false;
            }

            const { stdout } = await execAsync(command);
            const processCount = parseInt(stdout.trim());

            if (process.env.DEBUG) {
                console.log(`🔍 Found ${processCount} Roblox Studio processes`);
            }

            return processCount > 0;
        } catch (error) {
            if (process.env.DEBUG) {
                console.warn(
                    "Warning: Could not check for existing processes:",
                    error
                );
            }
            return false;
        }
    }

    public async launch(): Promise<void> {
        try {
            const currentPlatform = platform();

            switch (currentPlatform) {
                case "win32":
                    await this.launchWindows();
                    break;
                case "darwin":
                    await this.launchMacOS();
                    break;
                case "linux":
                    await this.launchLinux();
                    break;
                default:
                    throw new Error(`Failed to launch on: ${currentPlatform}`);
            }
        } catch (error) {
            console.error("Error at launch:", error);
            throw error;
        }
    }

    private async launchWindows(): Promise<void> {
        return new Promise((resolve, reject) => {
            const child = spawn(
                "cmd",
                ["/c", "start", '""', this.protocolUrl],
                {
                    detached: true,
                    stdio: "ignore",
                }
            );

            child.on("error", reject);
            child.on("close", () => resolve());
            child.unref();
        });
    }

    private async launchMacOS(): Promise<void> {
        return new Promise((resolve, reject) => {
            const child = spawn("open", [this.protocolUrl], {
                detached: true,
                stdio: "ignore",
            });

            child.on("error", reject);
            child.on("close", () => resolve());
            child.unref();
        });
    }

    private async launchLinux(): Promise<void> {
        return new Promise((resolve, reject) => {
            const child = spawn("xdg-open", [this.protocolUrl], {
                detached: true,
                stdio: "ignore",
            });

            child.on("error", reject);
            child.on("close", () => resolve());
            child.unref();
        });
    }

    public getProtocolUrl(): string {
        return this.protocolUrl;
    }
}

function showHelp() {
    console.log(`
🚀 OpenRBX - Roblox Studio Launcher

Usage:
  openrbx [options]

Options:
  -p, --place-id <id>         Place ID (required)
  -u, --universe-id <id>      Universe ID (required)
  -m, --mode <mode>           Launch mode (default: edit)
  -t, --task <task>           Task to execute (default: EditPlace)
  --multiple-process          Allow multiple Roblox Studio instances
  --no-logs                   Show only essential logs
  -h, --help                  Show this help
  -v, --version               Show version

Examples:
  openrbx -p 134510530844509 -u 8049025471
  openrbx --place-id 134510530844509 --universe-id 8049025471 --mode edit
  openrbx -p 134510530844509 -u 8049025471 -t EditPlace
  openrbx -p 134510530844509 -u 8049025471 --multiple-process
  openrbx -p 134510530844509 -u 8049025471 --no-logs
`);
}

function showVersion() {
    console.log("openrbx v1.0.0");
}

async function main() {
    try {
        const { values } = parseArgs({
            args: process.argv.slice(2),
            options: {
                "place-id": { type: "string", short: "p" },
                "universe-id": { type: "string", short: "u" },
                mode: { type: "string", short: "m", default: "edit" },
                task: { type: "string", short: "t", default: "EditPlace" },
                "multiple-process": { type: "boolean" },
                "no-logs": { type: "boolean" },
                help: { type: "boolean", short: "h" },
                version: { type: "boolean", short: "v" },
            },
            allowPositionals: true,
        });

        if (values.help) {
            showHelp();
            return;
        }

        if (values.version) {
            showVersion();
            return;
        }

        if (!values["place-id"] || !values["universe-id"]) {
            console.error(
                "❌ Error: --place-id and --universe-id are required"
            );
            console.log("Use --help for more information");
            process.exit(1);
        }

        const params: RobloxProtocolParams = {
            launchmode: values.mode as string,
            task: values.task as string,
            placeId: values["place-id"] as string,
            universeId: values["universe-id"] as string,
        };

        const noLogs = values["no-logs"] as boolean;

        if (!noLogs) {
            console.log("Launching Roblox Studio:");
            console.log(`   📍 Place ID: ${params.placeId}`);
            console.log(`   🌌 Universe ID: ${params.universeId}`);
            console.log(`   ⚙️  Mode: ${params.launchmode}`);
            console.log(`   📋 Task: ${params.task}`);
        }

        const launcher = new RobloxStudioLauncher(params);

        // Check for existing processes unless multiple-process is enabled
        if (!values["multiple-process"]) {
            if (!noLogs) {
                console.log(
                    "🔍 Checking for existing Roblox Studio processes..."
                );
            }
            const hasExistingProcesses = await launcher.checkExistingProcesses(
                noLogs
            );

            if (hasExistingProcesses) {
                console.log("⚠️  Warning: Roblox Studio is already running");
                if (!noLogs) {
                    console.log(
                        "💡 Use --multiple-process to allow multiple instances"
                    );
                }
                console.log("❌ Aborting launch to prevent conflicts");
                process.exit(1);
            } else {
                if (!noLogs) {
                    console.log("✅ No existing Roblox Studio processes found");
                }
            }
        } else {
            if (!noLogs) {
                console.log(
                    "🔄 Multiple process mode enabled - skipping process check"
                );
            }
        }

        if (process.env.DEBUG) {
            console.log("🔗 Protocol URL:", launcher.getProtocolUrl());
        }

        await launcher.launch();

        if (noLogs) {
            console.log("✅ Launched successfully");
        } else {
            console.log("✅ Roblox Studio launched successfully!");
        }
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

if (import.meta.main) {
    main();
}

export { RobloxStudioLauncher };
