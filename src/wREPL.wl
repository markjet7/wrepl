Check[Needs["CodeParser`"], PacletInstall["CodeParser"]; Needs["CodeParser`"]];
Check[Needs["CodeInspector`"], PacletInstall["CodeInspector"]; Needs["CodeInspector`"]]; 

messageHandler = StackInhibit@If[Last[#],
    Print[ToString@Stack[]];] &;

(* This is a custom repl that listens through the standard input and output. *)
$port = 7777;
(* This is the port that the repl will listen on. *)

$server = SocketOpen[$port, "TCP"];
$listener = SocketListen[$server, $onMessage];
(* This is the socket listener that will listen on the port. *)

$buffer = "";
$lastMessage = "";
$onMessage[msg_]:=Module[{},
    $lastMessage = msg;
    $onLine[msg["Data"]]

];

$sendMessage[msg_]:=Module[{},
    Table[
        WriteString[client, msg <> "\n\n"];,
    {client, $server["ConnectedClients"]}];
];
$history = {};
$onLine[str_]:=Module[{json},
    json = Quiet@Check[ImportString[str, "RawJSON"], Print["Error parsing input"]; Return[]];

    result = $handler[Lookup[json, "method", "unknown"], json];

    (* $history = Prepend[$history, json]; *)
    (* $buffer = ""; *)
    $sendMessage[result];
];


$handler["unknown", json_]:=("Unknown method for: " <> json);

Unprotect[NotebookDirectory];
$handler["eval", json_]:=Module[
    (* {}, *)
    {src, m, e, index, line, character, ast, call,  code, out, r, callNodes},
    src = json["params"]["src"];
    index = json["params"]["position"]["index"]-1;
    line = json["params"]["position"]["line"]+1;
    character = json["params"]["position"]["character"]+1;
    NotebookDirectory[] = DirectoryName[json["params"]["file"]];

    ast = CodeParse[src, SourceConvention -> "SourceCharacterIndex"];
    callNodes = Cases[ast, _CallNode, {2}];

    call = SelectFirst[callNodes, inCallNodeQ[#, index] &, 99];
    If[Head@call != CallNode, Return[<|"method" -> "noCall", "result" -> <||> |>]];

    nextPosition = SelectFirst[callNodes, #[[-1]][Source][[2]] >= call[[-1]][Source][[2]] + 1 &, 97];

    If[Head@nextPosition == CallNode,
        $sendMessage@ExportString[<|"method" -> "moveCursor", "position" -> nextPosition[[-1]][Source][[2]]+1 |>, "JSON", "Compact" -> True]
    ];
    code = StringTake[src, call[[-1]][Source]];

    e = EvaluationData[ToExpression@code];
    out = e["Result"];
    m = ExportString[e["MessagesText"], "HTMLFragment"];
    r= <|
        "index" -> index,
        "start" -> call[[-1]][Source][[1]],
        "end" -> call[[-1]][Source][[2]],
        "input" -> $myShort[code],
        "out" -> ExportString[out, "HTMLFragment"],
        "head" -> ToString@Head@out,
        "short"-> $myShort[out],
        "success" -> e["Success"],
        "messages" -> m
    |>;
    WriteString["stdout", ToString[out, InputForm]<>"\r"];

    ExportString[<|"method" -> "evaluation", "result" -> r |>, "JSON", "Compact" -> True]
];

$myShort[expr_] := Module[{str},
    str = ToString[ReplaceAll[expr, $Failed -> "Failed"], InputForm];
    If[StringLength[str] > 100, StringTake[str, 100] <> "...", str]
];

inCallNodeQ[cn_, p_] := Module[{},
  Last[cn][Source][[1]] <= p <= Last[cn][Source][[2]]
];