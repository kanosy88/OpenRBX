import { spawn } from "child_process";
import { platform } from "os";
import { parseArgs } from "util";
import type { RobloxProtocolParams } from "./types";

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
🚀 OpenRBX - Lanceur Roblox Studio

Usage:
  openrbx [options]

Options:
  -p, --place-id <id>      ID de la place (requis)
  -u, --universe-id <id>   ID de l'univers (requis)
  -m, --mode <mode>        Mode de lancement (défaut: edit)
  -t, --task <task>        Tâche à exécuter (défaut: EditPlace)
  -h, --help               Afficher cette aide
  -v, --version            Afficher la version

Exemples:
  openrbx -p 134510530844509 -u 8049025471
  openrbx --place-id 134510530844509 --universe-id 8049025471 --mode edit
  openrbx -p 134510530844509 -u 8049025471 -t EditPlace
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
            console.error("❌ Erreur: --place-id et --universe-id sont requis");
            console.log("Utilisez --help pour plus d'informations");
            process.exit(1);
        }

        const params: RobloxProtocolParams = {
            launchmode: values.mode as string,
            task: values.task as string,
            placeId: values["place-id"] as string,
            universeId: values["universe-id"] as string,
        };

        console.log("Launching Roblox Studio:");
        console.log(`   📍 Place ID: ${params.placeId}`);
        console.log(`   🌌 Universe ID: ${params.universeId}`);
        console.log(`   ⚙️  Mode: ${params.launchmode}`);
        console.log(`   📋 Task: ${params.task}`);

        const launcher = new RobloxStudioLauncher(params);

        if (process.env.DEBUG) {
            console.log("🔗 Protocol URL:", launcher.getProtocolUrl());
        }

        await launcher.launch();
        console.log("✅ Roblox Studio launched successfully!");
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

if (import.meta.main) {
    main();
}

export { RobloxStudioLauncher };
