# wREPL

wREPL is a Visual Studio Code extension that provides a REPL (Read-Eval-Print Loop) for Wolfram Language. It allows users to evaluate Wolfram Language code directly in their editor, with output displayed in a separate "Plots" view. This extension simplifies the process of developing and testing Wolfram Language code.

## Features

- Evaluate selected code or code under the cursor directly in the editor
- Display evaluation results in a separate "Plots" view
- Simple commands to start and evaluate Wolfram Language code

## Requirements

- Visual Studio Code
- Wolfram Language (e.g., Wolfram Mathematica or Wolfram Engine)
- WolframScript

## Installation

1. Install the extension from the Visual Studio Code Marketplace.
2. Ensure that WolframScript is installed and available in your system's PATH.

## Usage

1. Open a Wolfram Language file (`.wl`, `.wls`, or `.m` file extension) in Visual Studio Code.
2. Start the wREPL by running the `wrepl.startWolfram` command in the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
3. Select the code you want to evaluate, or place the cursor at the desired location.
4. Run the `wrepl.eval` command in the Command Palette to evaluate the code.
5. The evaluation results will be displayed in the "Plots" view.

## Commands

- `wrepl.startWolfram`: Start the wREPL.
- `wrepl.eval`: Evaluate the selected code or code under the cursor.

## Extension Settings

There are currently no settings for this extension.

## Known Issues

- Ensure that WolframScript is installed and available in your system's PATH to avoid connection errors.

## Contributing

If you would like to contribute to this extension, please feel free to submit pull requests or open issues on the GitHub repository.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.
