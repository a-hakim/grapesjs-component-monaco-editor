# GrapesJS Component Monaco Editor

A plugin that allows you to edit the code of a component that is selected on the canvas using Monaco Editor (VS Code's editor) with syntax highlighting, auto-formatting, and advanced editing features.

[VIEW DEMO - https://dev.use.senangwebs.com/maker/grapesjs-component-monaco-editor-demo](https://dev.use.senangwebs.com/maker/grapesjs-component-monaco-editor-demo)

## Features

- **Monaco Editor Integration**: Full VS Code editor experience with syntax highlighting
- **Auto-formatting**: Automatic code formatting for HTML and CSS (Ctrl+Shift+F / Cmd+Shift+F)
- **Split View**: Resizable HTML and CSS editors in a split-pane layout
- **Real-time Preview**: Live updates as you edit your code
- **Dark Theme**: Professional dark theme matching VS Code
- **Keyboard Shortcuts**: Standard VS Code shortcuts supported
- **Error Detection**: Built-in syntax error detection and highlighting
- **IntelliSense**: Code completion and suggestions
- **Fallback Support**: Graceful fallback to textarea if Monaco fails to load

> Recommended: use [grapesjs-parser-postcss](https://github.com/artf/grapesjs-parser-postcss) with this plugin to avoid issues with `styles` as the default parser is inconsistent and will add a lot of extra rules to your css, more explained [here](https://grapesjs.com/docs/guides/Custom-CSS-parser.html#cssom-results-are-inconsistent)


| Chrome Result                                 | PostCSS Result                                |
| ----------------------------------------------- | ----------------------------------------------- |
| <p align="center"><img src="default.png"></p> | <p align="center"><img src="postcss.png"></p> |

### HTML

```html
<link href="https://unpkg.com/grapesjs/dist/css/grapes.min.css" rel="stylesheet">
<script src="https://unpkg.com/grapesjs"></script>

<link href="https://unpkg.com/grapesjs-component-monaco-editor/dist/grapesjs-component-monaco-editor.min.css" rel="stylesheet">
<script src="https://unpkg.com/grapesjs-component-monaco-editor"></script>

<div id="gjs"></div>
```

### JS

```js
const editor = grapesjs.init({
	container: '#gjs',
  height: '100%',
  fromElement: true,
  storageManager: false,
  //...
  panels: {
    defaults: [
      {
        buttons: [
          //...
          {
            attributes: { title: 'Open Code' },
            className: 'fa fa-code',
            command: 'open-code',
            id: 'open-code'
          }
          //...
        ],
        id: 'views'
      }
    ]
  },
  //...
  plugins: ['grapesjs-component-monaco-editor'],
});
```

### CSS

```css
body, html {
  margin: 0;
  height: 100%;
}
```

## Keyboard Shortcuts


| Shortcut                       | Action                 |
| -------------------------------- | ------------------------ |
| `Ctrl+Shift+F` / `Cmd+Shift+F` | Format code            |
| `Ctrl+S` / `Cmd+S`             | Save (applies changes) |
| `Ctrl+Z` / `Cmd+Z`             | Undo                   |
| `Ctrl+Y` / `Cmd+Y`             | Redo                   |
| `Ctrl+F` / `Cmd+F`             | Find                   |
| `Ctrl+H` / `Cmd+H`             | Find and Replace       |

## Summary

* Plugin name: `grapesjs-component-monaco-editor`
* Commands
  * `open-code` - opens Monaco code editor in right panel
  * `code-editor-object` - get `CodeEditor` object
  * `code-editor-constructor` - get `CodeEditor` constructor

## Options


| Option name       | Default value              | Description                                                                                                                                                        |
| ------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `panelId`         | `views-container`          | Id of panel to append code editor.                                                                                                                                 |
| `appendTo`        | `.gjs-pn-views-container`  | Append code editor to an element not`views-container` (class or id).                                                                                               |
| `openState`       | `{ pn: '35%', cv: '65%' }` | Determine width of views panel (`pn`) and canvas (`cv`) in the open state.                                                                                         |
| `closedState`     | `{ pn: '15%', cv: '85%' }` | Determine width of views panel (`pn`) and canvas (`cv`) in the closed state.                                                                                       |
| `codeViewOptions` | `{}`                       | Monaco editor options. ([Monaco Editor Options](https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.IStandaloneEditorConstructionOptions.html)) |
| `preserveWidth`   | `false`                    | Stop resizing`openState` and `closedState`. Preserve views panel and canvas sizes.                                                                                 |
| `clearData`       | `false`                    | Remove all`gjs-data` attributes from the component.                                                                                                                |
| `editJs`          | `false`                    | Lets you edit component scripts`allowScripts` must be set to true.                                                                                                 |
| `cleanCssBtn`     | `true`                     | Used to remove css from the Selector Manager.                                                                                                                      |
| `htmlBtnText`     | `Apply`                    | Save HTML button text.                                                                                                                                             |
| `cssBtnText`      | `Apply`                    | Save CSS button text.                                                                                                                                              |
| `cleanCssBtnText` | `Delete`                   | Clean CSS button text.                                                                                                                                             |

### Monaco Editor Specific Options

The `codeViewOptions` object accepts all Monaco Editor configuration options. Common options include:

```js
codeViewOptions: {
  theme: 'vs-dark', // or 'vs', 'hc-black'
  fontSize: 14,
  minimap: { enabled: false },
  wordWrap: 'on',
  formatOnType: true,
  formatOnPaste: true,
  automaticLayout: true
}
```

> Tip: [grapesjs-script-editor](https://github.com/Ju99ernaut/grapesjs-script-editor) is better suited for editing scripts instead of using `editJs`, reason being `editJs` will inject scripts as separate components onto the canvas which often interferes with the main editor. [grapesjs-script-editor](https://github.com/Ju99ernaut/grapesjs-script-editor) avoids this by injecting scripts directly into a component therefore avoiding the use of `allowScripts`.

> `cleanCssBtn`: When you delete a selector in the `code-editor` it is still in the `Selector Manager` therefore it will still affect the component after saving, this button removes the selector from both the `code-editor` and `Selector Manager`. Only valid css rules can be removed eg `.class{ color: blue }`

## Auto-formatting

The plugin includes automatic code formatting for both HTML and CSS:

- **HTML**: Proper indentation, tag formatting, and structure
- **CSS**: Property alignment, selector formatting, and consistent spacing
- **Trigger**: Automatic on content load or manual via `Ctrl+Shift+F` / `Cmd+Shift+F`
- **Fallback**: Custom formatting algorithms if Monaco's built-in formatter fails

## Download

* CDN
  * `https://unpkg.com/grapesjs-component-monaco-editor`
* NPM
  * `npm i grapesjs-component-monaco-editor`
* GIT
  * `git clone https://github.com/a-hakim/grapesjs-component-monaco-editor.git`

## Usage

Directly in the browser

```html
<link href="https://unpkg.com/grapesjs/dist/css/grapes.min.css" rel="stylesheet"/>
<script src="https://unpkg.com/grapesjs"></script>

<link href="./dist/grapesjs-component-monaco-editor.min.css" rel="stylesheet">
<script src="./dist/grapesjs-component-monaco-editor.min.js"></script>

<div id="gjs"></div>

<script type="text/javascript">
  var editor = grapesjs.init({
      container: '#gjs',
      // ...
      panels: { /* add panel button with command open-code */}
      plugins: ['grapesjs-component-monaco-editor'],
      pluginsOpts: {
        'grapesjs-component-monaco-editor': { /* options */ }
      }
  });
</script>
```

Modern javascript

```js
import grapesjs from 'grapesjs';
import plugin from 'grapesjs-component-monaco-editor';
import 'grapesjs/dist/css/grapes.min.css';
import 'grapesjs-component-monaco-editor/dist/grapesjs-component-monaco-editor.min.css';

const editor = grapesjs.init({
  container : '#gjs',
  // ...
  plugins: [plugin],
  pluginsOpts: {
    [plugin]: { /* options */ }
  }
  // or
  plugins: [
    editor => plugin(editor, { /* options */ }),
  ],
});
```

Adding after `editor` initialization

```js
const pn = editor.Panels;
const panelViews = pn.addPanel({
  id: 'views'
});
panelViews.get('buttons').add([{
  attributes: {
     title: 'Open Code'
  },
  className: 'fa fa-file-code-o',
  command: 'open-code',
  togglable: false, //do not close when button is clicked again
  id: 'open-code'
}]);
```

## Development

Clone the repository

```sh
$ git clone https://github.com/a-hakim/grapesjs-component-monaco-editor.git
$ cd grapesjs-component-monaco-editor
```

Install dependencies

```sh
$ npm i
```

Build css

```sh
$ npm run build:css
```

Start the dev server

```sh
$ npm start
```

Build the source

```sh
$ npm run build
```

## Technical Details

- **Monaco Editor Version**: 0.52.0 (loaded from CDN)
- **Supported Languages**: HTML, CSS with syntax highlighting
- **Theme**: VS Code dark theme
- **Fallback**: Textarea with basic styling if Monaco fails to load
- **Split Layout**: Powered by Split.js for resizable panes
- **Dependencies**: split.js for panel resizing

## License

MIT
