//Original work Copyright (c) 2018, Duarte Henriques, https://github.com/portablemind/grapesjs-code-editor
//Modified work Copyright (c) 2020, Brendon Ngirazi,
//All rights reserved.

import Split from 'split.js';

export class CodeEditor {
    constructor(editor, opts) {
        this.editor = editor;
        this.$ = editor.$;
        this.pfx = editor.getConfig('stylePrefix');
        this.opts = opts;
        this.canvas = this.findWithinEditor(`.${this.pfx}cv-canvas`);
        this.panelViews = opts.appendTo ? this.$(opts.appendTo) :
            this.findWithinEditor(`.${this.pfx}pn-${opts.panelId}`);
        this.isShowing = true;
        this.monacoInstances = {};
        this.monacoReady = false;
        this.loadMonaco();
    }

    findPanel() {
        const pn = this.editor.Panels;
        const id = this.opts.panelId;
        return pn.getPanel(id) || pn.addPanel({ id });
    }

    findWithinEditor(selector) {
        return this.$(selector, this.editor.getEl());
    }

    loadMonaco() {
        if (window.monaco) {
            this.monacoReady = true;
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            // Load Monaco Editor from CDN
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.0/min/vs/loader.min.js';
            script.onload = () => {
                window.require.config({
                    paths: {
                        'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.0/min/vs'
                    }
                });
                window.require(['vs/editor/editor.main'], () => {
                    this.monacoReady = true;
                    console.log('Monaco Editor loaded successfully');
                    resolve();
                });
            };
            script.onerror = () => {
                console.error('Failed to load Monaco Editor');
                reject(new Error('Failed to load Monaco Editor'));
            };
            document.head.appendChild(script);
        });
    }

    buildCodeEditor(type) {
        const { editor, opts } = this;
        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        container.className = `monaco-editor-container-${type}`;
        
        const editorWrapper = {
            container: container,
            type: type,
            getElement: () => container,
            setContent: (content) => {
                if (editorWrapper.editor) {
                    editorWrapper.editor.setValue(content || '');
                } else {
                    editorWrapper.pendingContent = content;
                }
            },
            getContent: () => {
                return editorWrapper.editor ? editorWrapper.editor.getValue() : (editorWrapper.pendingContent || '');
            },
            refresh: () => {
                if (editorWrapper.editor) {
                    editorWrapper.editor.layout();
                }
            },
            dispose: () => {
                if (editorWrapper.editor) {
                    editorWrapper.editor.dispose();
                    editorWrapper.editor = null;
                }
            },
            editor: null,
            pendingContent: ''
        };

        // Set initial loading message
        container.innerHTML = `<div style="padding: 20px; color: #888; text-align: center; background: #1e1e1e; border: 1px solid #3c3c3c;">Loading Monaco Editor...</div>`;
        
        // Store reference for later initialization
        if (!this.editorWrappers) {
            this.editorWrappers = {};
        }
        this.editorWrappers[type] = editorWrapper;

        return editorWrapper;
    }

    createMonacoEditor(editorWrapper, type) {
        if (!window.monaco) {
            console.error('Monaco is not available');
            return;
        }

        console.log(`Creating Monaco editor for ${type}...`);
        
        // Clear loading message
        editorWrapper.container.innerHTML = '';

        try {
            const monacoEditor = window.monaco.editor.create(editorWrapper.container, {
                value: editorWrapper.pendingContent || '',
                language: type === 'html' ? 'html' : 'css',
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollbar: {
                    vertical: 'auto',
                    horizontal: 'auto'
                },
                wordWrap: 'on',
                ...this.opts.codeViewOptions
            });

            editorWrapper.editor = monacoEditor;
            editorWrapper.pendingContent = '';

            // Store the instance for later use
            this.monacoInstances[type] = monacoEditor;
            
            console.log(`Monaco editor created successfully for ${type}`);
            
            // Trigger layout after a short delay to ensure proper sizing
            setTimeout(() => {
                monacoEditor.layout();
            }, 100);
            
        } catch (error) {
            console.error(`Failed to create Monaco editor for ${type}:`, error);
            // Fallback to textarea for this specific editor
            this.createTextareaFallback(editorWrapper, type);
        }
    }

    createTextareaFallback(editorWrapper, type) {
        const textarea = document.createElement('textarea');
        textarea.style.width = '100%';
        textarea.style.height = '100%';
        textarea.style.background = '#1e1e1e';
        textarea.style.color = '#cccccc';
        textarea.style.border = '1px solid #3c3c3c';
        textarea.style.fontFamily = 'monospace';
        textarea.style.fontSize = '14px';
        textarea.style.resize = 'none';
        textarea.style.outline = 'none';
        textarea.value = editorWrapper.pendingContent || '';
        
        editorWrapper.container.innerHTML = '';
        editorWrapper.container.appendChild(textarea);
        
        // Update wrapper methods
        editorWrapper.setContent = (content) => {
            textarea.value = content || '';
        };
        editorWrapper.getContent = () => textarea.value;
        editorWrapper.refresh = () => {};
    }

    buildSection(type, codeViewer) {
        const { $, pfx, opts } = this;
        const section = $('<section></section>');
        const btnText = type === 'html' ? opts.htmlBtnText : opts.cssBtnText;
        const cleanCssBtn = (opts.cleanCssBtn && type === 'css') ?
            `<button class="cp-delete-${type} ${pfx}btn-prim">${opts.cleanCssBtnText}</button>` : '';
        section.append($(`
            <div class="codepanel-separator">
                <div class="codepanel-label">${type}</div>
                <div class="cp-btn-container">
                    ${cleanCssBtn}
                    <button class="cp-apply-${type} ${pfx}btn-prim">${btnText}</button>
                </div>
            </div>`));
        const codeViewerEl = codeViewer.getElement();
        codeViewerEl.style.height = 'calc(100% - 30px)';
        section.append(codeViewerEl);
        this.codePanel.append(section);
        return section.get(0);
    }

    buildCodePanel() {
        const { $, editor } = this;
        const panel = this.opts.panelId ? this.findPanel() : 0;
        this.codePanel = $('<div></div>');
        this.codePanel.addClass('code-panel');

        this.htmlCodeEditor = this.buildCodeEditor('html');
        this.cssCodeEditor = this.buildCodeEditor('css');

        const sections = [this.buildSection('html', this.htmlCodeEditor), this.buildSection('css', this.cssCodeEditor)];

        panel && !this.opts.appendTo &&
            panel.set('appendContent', this.codePanel).trigger('change:appendContent');
        this.opts.appendTo && $(this.opts.appendTo).append(this.codePanel);

        this.codePanel.find('.cp-apply-html')
            .on('click', this.updateHtml.bind(this));

        this.codePanel.find('.cp-apply-css')
            .on('click', this.updateCss.bind(this));

        this.opts.cleanCssBtn && this.codePanel.find('.cp-delete-css')
            .on('click', this.deleteSelectedCss.bind(this));

        Split(sections, {
            direction: 'vertical',
            sizes: [50, 50],
            minSize: 100,
            gutterSize: 1,
            onDragEnd: this.refreshEditors.bind(this),
        });

        editor.on('component:update', model => this.updateEditorContents());
        editor.on('stop:preview', () => {
            if (this.isShowing && !this.opts.preserveWidth) {
                this.canvas.css('width', this.opts.openState.cv);
            }
        });

        // Initialize Monaco editors after panel is built
        this.initializeMonacoEditorsWhenReady();
    }

    initializeMonacoEditorsWhenReady() {
        if (this.monacoReady && window.monaco) {
            this.initializeMonacoEditors();
        } else {
            // Wait for Monaco to load
            this.loadMonaco().then(() => {
                this.initializeMonacoEditors();
            }).catch(error => {
                console.error('Failed to initialize Monaco editors:', error);
                // Fallback to basic textarea
                this.fallbackToTextarea();
            });
        }
    }

    initializeMonacoEditors() {
        console.log('Initializing Monaco editors...');
        
        // Wait a bit for DOM to be ready
        setTimeout(() => {
            if (this.editorWrappers) {
                Object.keys(this.editorWrappers).forEach(type => {
                    const wrapper = this.editorWrappers[type];
                    if (wrapper && wrapper.container.parentElement) {
                        this.createMonacoEditor(wrapper, type);
                    }
                });
            }
        }, 100);
    }

    fallbackToTextarea() {
        if (this.editorWrappers) {
            Object.keys(this.editorWrappers).forEach(type => {
                const wrapper = this.editorWrappers[type];
                if (wrapper && wrapper.container) {
                    const textarea = document.createElement('textarea');
                    textarea.style.width = '100%';
                    textarea.style.height = '100%';
                    textarea.style.background = '#1e1e1e';
                    textarea.style.color = '#cccccc';
                    textarea.style.border = '1px solid #3c3c3c';
                    textarea.style.fontFamily = 'monospace';
                    textarea.style.fontSize = '14px';
                    textarea.style.resize = 'none';
                    textarea.style.outline = 'none';
                    textarea.value = wrapper.pendingContent || '';
                    
                    wrapper.container.innerHTML = '';
                    wrapper.container.appendChild(textarea);
                    
                    // Update wrapper methods
                    wrapper.setContent = (content) => {
                        textarea.value = content || '';
                    };
                    wrapper.getContent = () => textarea.value;
                    wrapper.refresh = () => {};
                }
            });
        }
        this.updateEditorContents();
    }

    showCodePanel() {
        this.isShowing = true;
        this.codePanel.css('display', 'block');
        
        // Initialize Monaco editors if not already done
        if (!this.monacoInstances.html && !this.monacoInstances.css) {
            this.initializeMonacoEditorsWhenReady();
        }
        
        this.updateEditorContents();
        
        // make sure editor is aware of width change after the 300ms effect ends
        setTimeout(this.refreshEditors.bind(this), 320);

        if (this.opts.preserveWidth) return;

        this.panelViews.css('width', this.opts.openState.pn);
        this.canvas.css('width', this.opts.openState.cv);
    }

    hideCodePanel() {
        if (this.codePanel) this.codePanel.css('display', 'none');
        this.isShowing = false;

        if (this.opts.preserveWidth) return;

        this.panelViews.css('width', this.opts.closedState.pn);
        this.canvas.css('width', this.opts.closedState.cv);
    }

    refreshEditors() {
        this.htmlCodeEditor.refresh();
        this.cssCodeEditor.refresh();
    }

    updateHtml(e) {
        e?.preventDefault();
        const { editor, component } = this;
        let htmlCode = this.htmlCodeEditor.getContent().trim();
        if (!htmlCode || htmlCode === this.previousHtmlCode) return;
        this.previousHtmlCode = htmlCode;

        let idStyles = '';
        this.cssCodeEditor
            .getContent()
            .split('}\n')
            .filter((el) => Boolean(el.trim()))
            .map((cssObjectRule) => {
                if (!(/}$/.test(cssObjectRule))) {
                    //* Have to check closing bracket existence for every rule cause it can be missed after split and add it if it doesnt match
                    return `${cssObjectRule}}`;
                }
            })
            .forEach(rule => {
                if (/^#/.test(rule))
                    idStyles += rule;
            });

        htmlCode += `<style>${idStyles}</style>`;

        if (component.attributes.type === 'wrapper') {
            editor.setComponents(htmlCode);
        } else {
            editor.select(component.replaceWith(htmlCode));
        }
        return htmlCode;
    }

    updateCss(e) {
        e?.preventDefault();
        const cssCode = this.cssCodeEditor.getContent().trim();
        if (!cssCode || cssCode === this.previousCssCode) return;
        this.previousCssCode = cssCode;
        this.editor.Css.addRules(cssCode);
        return cssCode;
    }

    deleteSelectedCss(e) {
        e?.preventDefault();
        const monacoEditor = this.monacoInstances.css;
        if (!monacoEditor) return;
        
        const selection = monacoEditor.getSelection();
        if (selection && !selection.isEmpty()) {
            const selectedText = monacoEditor.getModel().getValueInRange(selection);
            this.parseRemove(selectedText);
            monacoEditor.executeEdits('', [{
                range: selection,
                text: ''
            }]);
        }
    }

    parseRemove(removeCss) {
        return this.editor.Css.remove(this.getRules(this.editor.Parser.parseCss(removeCss)));
    }

    getRules(rules, opts = {}) {
        const { editor } = this;
        const sm = editor.Selectors;
        return rules.map((rule) => {
            const selector = sm.get(rule.selectors);
            const { state, selectorsAdd } = rule;
            const { atRuleType, atRuleParams } = opts;
            return (
                selector &&
                editor.Css.get(selector, state, atRuleParams, {
                    selectorsAdd,
                    atRule: atRuleType,
                })
            );
        });
    }

    updateEditorContents() {
        if (!this.isShowing) return;

        this.component = this.editor.getSelected();
        if (this.component) {
            this.htmlCodeEditor.setContent(this.getComponentHtml(this.component));
            this.cssCodeEditor.setContent(this.editor.CodeManager.getCode(this.component, 'css', {
                cssc: this.editor.Css
            }));
        }
    }

    getComponentHtml(component) {
        const { pfx, opts } = this;
        let result = '';
        const componentEl = component.getEl();

        !opts.clearData && componentEl.classList.remove(`${pfx}selected`);
        const html = opts.clearData ? component.toHTML() :
            (component.attributes.type === 'wrapper' ? componentEl.innerHTML : componentEl.outerHTML);
        !opts.clearData && componentEl.classList.add(`${pfx}selected`);
        result += html;

        const js = opts.editJs ? component.getScriptString() : '';
        result += js ? `<script>${js}</script>` : '';

        return result;
    }

    dispose() {
        // Clean up Monaco Editor instances
        if (this.htmlCodeEditor && this.htmlCodeEditor.dispose) {
            this.htmlCodeEditor.dispose();
        }
        if (this.cssCodeEditor && this.cssCodeEditor.dispose) {
            this.cssCodeEditor.dispose();
        }
        if (this.monacoInstances.html) {
            this.monacoInstances.html.dispose();
        }
        if (this.monacoInstances.css) {
            this.monacoInstances.css.dispose();
        }
    }
}
