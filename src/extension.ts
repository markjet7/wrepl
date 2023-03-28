import * as net from 'net';
import * as path from 'path';
import * as vscode from 'vscode';
import {handler} from './handlers';
import { PlotsViewProvider } from './plotsView';

let extensionPath: string;
let port: number = 7777;

let plotsViewProvider: PlotsViewProvider;
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "wrepl" is now active!');

	registerCommands(context);

	extensionPath = context.extensionPath;

	plotsViewProvider = new PlotsViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(PlotsViewProvider.viewType, plotsViewProvider)
    );
	plotsViewProvider.updateView(["",""]);

	vscode.window.onDidCloseTerminal((t) => {
		if (t.name === "wrepl") {
			terminal?.dispose();
			terminal = undefined!;
		}
	});

	loadWolfram();


}

function registerCommands(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('wrepl.startWolfram', async () => {
		loadWolfram();
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('wrepl.eval', evaluate);
	context.subscriptions.push(disposable);

}

let terminal: vscode.Terminal | undefined = undefined;
let client: any;

let evaluateAttempts = 0;
async function evaluate() {
	let e = vscode.window.activeTextEditor;

	if (e && terminal) {
		// terminal.show();
		let index = e.document.offsetAt(e.selection.active);
		let line = e.selection.active.line;
		let character = e.selection.active.character;
		
		terminal.show(true);
		let j = JSON.stringify({
			"method": "eval",
			"params": {
				"file": e.document.fileName,
				"position": {
					"line": line,
					"character": character,
					"index": index
				},
				"src": e.document.getText()
			}
		});
		client.write(j);
	} else {
		evaluateAttempts++;
		if (evaluateAttempts > 7) {
			vscode.window.showErrorMessage("Could not evaluate");
			return;
		}
		loadWolfram().then(() => {
			evaluate();
			evaluateAttempts = 0;
		});
	}
}

async function loadWolfram(): Promise<void> {
	return new Promise((resolve, reject) => {
		terminal = vscode.window.createTerminal("wrepl", "wolframscript", ["-initfile", path.join(extensionPath, "src", "wREPL.wl")]);
		terminal.show(true);


		connectClient(0).then(() => {
			console.log('Connected client');
			let j = JSON.stringify({
				"method": "init",
				"params": {
					"extensionPath": extensionPath
				}
			});
			client.write(j);

			resolve();
			
		});
	});
}
let result:any;
async function connectClient(attempts: number): Promise<void> {
	return new Promise((resolve, reject) => {
		client = new net.Socket();

		client.on('data', (data: any) => {
			result = handler(data);
			if (result.method === "evaluation") {
				plotsViewProvider.updateView([result.result.input, result.result.out]);
			}
		});

		client.on('message', (data: any) => {
			result = handler(data);
		});

		client.on('error', (err: any) => {
			console.error('Connection error.');
			if (attempts < 10) {
				setTimeout(() => {
					connectClient(attempts + 1);
				}, 1000);
			} else {
				vscode.window.showErrorMessage("Could not connect to wREPL");
				reject();
			}
		});

		client.connect(port, 'localhost', () => {
			console.log('Connected to server');
			resolve();
		});
	});
}


export function deactivate() { }
