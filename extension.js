const vscode = require('vscode');
const path = require('path');
const { minimatch } = require('minimatch');
const fs = require('fs');
const ignore = require('ignore');

async function activate(context) {
    let disposable = vscode.commands.registerCommand('oficw.openFileInCurrentWorkspace', async function () {

        let workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage("Workspace not found");
            return;
        }
        let currentWorkspace = workspaceFolders[0].uri.fsPath;

        let excludeSettings = vscode.workspace.getConfiguration('search').get('exclude');

        let gitignorePath = path.join(currentWorkspace, '.gitignore');
        let ig = ignore().add(
            fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath).toString() : ''
        );

        let fileUris = await vscode.workspace.findFiles('**/*');

        let items = fileUris.filter(uri => {
            let filePath = uri.fsPath;
            let relativePath = path.relative(currentWorkspace, filePath);

            for (let pattern in excludeSettings) {
                return !(minimatch(uri.fsPath, pattern) || ig.ignores(relativePath));
            }
            return true;
        }).map(uri => ({
            label: path.basename(uri.fsPath),
            description: path.relative(currentWorkspace, uri.fsPath),
            path: uri.fsPath,
        }));

        let selectedItem = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a file',
            matchOnDescription: true,
            matchOnDetail: false,
        });

        if (selectedItem) {
            let document = await vscode.workspace.openTextDocument(selectedItem.path);
            await vscode.window.showTextDocument(document);
        }

    });
    context.subscriptions.push(disposable);

}

module.exports = {
    activate,
}