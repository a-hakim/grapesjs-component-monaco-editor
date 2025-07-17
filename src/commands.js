import { CodeEditor } from './code-editor';
import { openCodeStr, getObject, getConstuctor } from './consts';

export default (editor, opts) => {
    const cm = editor.Commands;
    let codeEditor = null;

    cm.add(openCodeStr, {
        run: editor => {
            !codeEditor && (codeEditor = new CodeEditor(editor, opts)) && codeEditor.buildCodePanel();
            codeEditor.showCodePanel();
            // Expose CodeEditor instance to the editor object
            editor.CodeEditor = codeEditor;
        },
        stop: editor => {
            codeEditor && codeEditor.hideCodePanel();
        },
    });

    cm.add(getObject, () => {
        return codeEditor;
    });

    cm.add(getConstuctor, () => {
        return CodeEditor;
    });
}