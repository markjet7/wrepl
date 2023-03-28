

import * as vscode from 'vscode';


vscode.workspace.onDidChangeTextDocument(onDidChangeTextDocument);
let decorationType = vscode.window.createTextEditorDecorationType({
	borderWidth: '1px',
	borderStyle: 'solid',
	overviewRulerColor: 'blue',
	overviewRulerLane: vscode.OverviewRulerLane.Right,
	light: {
		// this color will be used in light color themes
		borderColor: 'darkblue'
	},
	dark: {
		// this color will be used in dark color themes
		borderColor: 'lightblue'
	}
});

let wreplDecorations:Map<string, any> = new Map();
let decorations:Map<string, vscode.DecorationOptions> = new Map();

let buffer = "";
export function handler(data: any) {
	try {
		buffer += data.toString();
        let msgs = buffer.split("\n");
        if (msgs.length > 1) {
            buffer = msgs[msgs.length - 1];
            msgs = msgs.slice(0, msgs.length - 1);
        }
        for (let msg of msgs) {
		let j = JSON.parse(msg);
        switch (j.method) {
            case "evaluation":
			    evaluate(j);
                break;
            case "moveCursor":
                moveCursor(j);
                break;
        
            default:
                break;
        }
    }
	} catch (e:any) {
		//console.error(e);

        return {"error": e.toString()};
	}
}

function moveCursor(j:any) {
    let e = vscode.window.activeTextEditor;
    let pos = j.position;
    if (e) {
        e.selection = new vscode.Selection(e.document.positionAt(pos), e.document.positionAt(pos));
    }
}

function evaluate(j:any) {
    let e = vscode.window.activeTextEditor;
    if (e) {
        let line = e.document.lineAt(e.document.positionAt(j.result.index));
        // add a decoration 
        let startPos = e.document.positionAt(j.result.start-1);
        let endPos = e.document.positionAt(j.result.end);

        let errors = j.result.messages;
        let border = "2px solid blue";
        let bg = "gray";
        if (j.result.success  === false) {
            border = "2px solid red";
            bg = "rgba(255, 0, 0, 0.2)";
        }


        let decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: new vscode.MarkdownString(j.result.out, false),
            renderOptions: {
                after: {
                    contentText: "  " + j.result.short + "  ",
                    color: new vscode.ThemeColor("editor.foreground"),
                    backgroundColor: bg,
                    borderRadius: "5px",
                    borderSpacing: "5px"
                }
            }
        };
        let h: vscode.MarkdownString = new vscode.MarkdownString(((j.result.out + "<br>" + errors) as string), false);
        h.isTrusted = true;
        h.supportHtml = true;
        decoration.hoverMessage = h;
        decorations.set(line.lineNumber.toString(), decoration);

        let decs:any = [...decorations.values()];
        e.setDecorations(decorationType, decs);
        wreplDecorations.set(e.document.fileName, decs);


        return j;
    }
}

export function onDidChangeTextDocument(e: vscode.TextDocumentChangeEvent) {
	let textEditor = vscode.window.activeTextEditor;
	let decorations = wreplDecorations.get(e.document.fileName);
    if (decorations && textEditor) {
        let newDecorations = decorations.filter((d: vscode.DecorationOptions) => {
            return d.range.start.line < e.contentChanges[0].range.end.line;
        });
        wreplDecorations.set(e.document.fileName, newDecorations);
        textEditor.setDecorations(decorationType, newDecorations);
    }
}