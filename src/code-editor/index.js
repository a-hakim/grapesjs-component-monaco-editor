//Original work Copyright (c) 2018, Duarte Henriques, https://github.com/portablemind/grapesjs-code-editor
//Modified work Copyright (c) 2020, Brendon Ngirazi, https://github.com/Ju99ernaut/grapesjs-component-code-editor
//Modified work Copyright (c) 2025, A.Hakim, https://github.com/a-hakim/grapesjs-component-monaco-editor
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
        // Check if Monaco is already loaded
        if (window.monaco) {
            this.monacoReady = true;
            return Promise.resolve();
        }

        // Check if Monaco is currently being loaded
        if (window.monacoLoading) {
            return window.monacoLoading;
        }

        // Create a global promise to prevent multiple loads
        window.monacoLoading = new Promise((resolve, reject) => {
            // Check if loader script is already present
            if (document.querySelector('script[src*="vs/loader.min.js"]')) {
                // If script exists but Monaco isn't loaded yet, wait for it
                const checkMonaco = () => {
                    if (window.monaco) {
                        this.configureMonaco();
                        this.monacoReady = true;
                        resolve();
                    } else {
                        setTimeout(checkMonaco, 100);
                    }
                };
                checkMonaco();
                return;
            }

            // Load Monaco Editor from CDN
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.0/min/vs/loader.min.js';
            script.onload = () => {
                // Check if require is already configured
                if (!window.require || !window.require.config) {
                    console.error('Monaco loader failed to initialize require');
                    reject(new Error('Monaco loader failed to initialize require'));
                    return;
                }

                // Configure paths only if not already configured
                if (!window.require.s || !window.require.s.contexts || !window.require.s.contexts._.config.paths.vs) {
                    window.require.config({
                        paths: {
                            'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.0/min/vs'
                        }
                    });
                }

                window.require(['vs/editor/editor.main'], () => {
                    this.configureMonaco();
                    this.monacoReady = true;
                    // console.log('Monaco Editor loaded successfully');
                    resolve();
                });
            };
            script.onerror = () => {
                console.error('Failed to load Monaco Editor');
                reject(new Error('Failed to load Monaco Editor'));
            };
            document.head.appendChild(script);
        });

        return window.monacoLoading;
    }

    configureMonaco() {
        if (!window.monaco) return;

        // Configure HTML language service
        window.monaco.languages.html.htmlDefaults.setOptions({
            format: {
                tabSize: 2,
                insertSpaces: true,
                wrapLineLength: 120,
                unformatted: 'default: "a, abbr, acronym, b, bdo, big, br, button, cite, code, dfn, em, i, img, input, kbd, label, map, mark, meter, noscript, object, output, q, ruby, s, samp, select, small, span, strong, sub, sup, textarea, time, tt, u, var, wbr"',
                contentUnformatted: 'pre',
                indentInnerHtml: false,
                preserveNewLines: true,
                maxPreserveNewLines: 2,
                indentHandlebars: false,
                endWithNewline: false,
                extraLiners: 'head, body, /html',
                wrapAttributes: 'auto'
            }
        });

        // Configure CSS language service
        window.monaco.languages.css.cssDefaults.setOptions({
            format: {
                insertSpaces: true,
                tabSize: 2,
                newlineBetweenSelectors: true,
                newlineBetweenRules: true,
                spaceAroundSelectorSeparator: true,
                braceStyle: 'collapse',
                maxPreserveNewLines: 2,
                preserveNewLines: true
            }
        });
    }

    buildCodeEditor(type) {
        const { editor, opts } = this;
        
        // Create unique container ID to prevent conflicts
        const containerId = `monaco-editor-container-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.height = '100%';
        container.className = `monaco-editor-container-${type}`;
        container.id = containerId;
        
        const editorWrapper = {
            container: container,
            type: type,
            getElement: () => container,
            setContent: (content) => {
                if (editorWrapper.editor) {
                    editorWrapper.editor.setValue(content || '');
                    // Auto-format the code after setting content
                    setTimeout(() => {
                        this.formatCodeAutomatically(type, editorWrapper.editor);
                    }, 100);
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
        container.innerHTML = `<div style="padding: 20px; color: #888; text-align: center; background: #1e1e1e; border: 1px solid #3c3c3c;">Loading Editor...</div>`;
        
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

        // Check if editor already exists for this wrapper
        if (editorWrapper.editor) {
            // console.log(`Monaco editor already exists for ${type}, skipping creation`);
            return;
        }

        // Check if Monaco instance already exists for this type
        if (this.monacoInstances[type]) {
            console.log(`Monaco instance already exists for ${type}, disposing old instance`);
            this.monacoInstances[type].dispose();
            delete this.monacoInstances[type];
        }

        // console.log(`Creating Monaco editor for ${type}...`);
        
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
                formatOnType: true,
                formatOnPaste: true,
                ...this.opts.codeViewOptions
            });

            // Add keyboard shortcut for formatting (Ctrl+Shift+F or Cmd+Shift+F)
            monacoEditor.addAction({
                id: `format-code-${type}`,
                label: 'Format Code',
                keybindings: [
                    window.monaco.KeyMod.CtrlCmd | window.monaco.KeyMod.Shift | window.monaco.KeyCode.KeyF
                ],
                run: () => {
                    this.formatCodeAutomatically(type, monacoEditor);
                }
            });

            editorWrapper.editor = monacoEditor;
            editorWrapper.pendingContent = '';

            // Store the instance for later use
            this.monacoInstances[type] = monacoEditor;
            
            // console.log(`Monaco editor created successfully for ${type}`);
            
            // Auto-format any pending content
            if (editorWrapper.pendingContent && editorWrapper.pendingContent.trim()) {
                setTimeout(() => {
                    this.formatCodeAutomatically(type, monacoEditor);
                }, 200);
            }
            
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
        
        // Auto-format existing content when showing the panel
        setTimeout(() => {
            if (this.monacoInstances.html && this.monacoInstances.html.getValue().trim()) {
                this.formatCodeAutomatically('html', this.monacoInstances.html);
            }
            if (this.monacoInstances.css && this.monacoInstances.css.getValue().trim()) {
                this.formatCodeAutomatically('css', this.monacoInstances.css);
            }
        }, 300);
        
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

    formatCodeAutomatically(type, monacoEditor) {
        if (!monacoEditor) return;

        try {
            // Try Monaco's built-in formatting first
            const action = monacoEditor.getAction('editor.action.formatDocument');
            if (action) {
                action.run().then(() => {
                    // console.log(`Code auto-formatted successfully for ${type}`);
                }).catch(error => {
                    console.warn(`Monaco auto-formatting failed for ${type}, using fallback:`, error);
                    this.fallbackFormat(type, monacoEditor);
                });
            } else {
                // Use fallback if action not available
                this.fallbackFormat(type, monacoEditor);
            }
        } catch (error) {
            console.error(`Failed to auto-format ${type} code:`, error);
            // Fallback to basic formatting if Monaco formatting fails
            this.fallbackFormat(type, monacoEditor);
        }
    }

    fallbackFormat(type, monacoEditor) {
        const content = monacoEditor.getValue();
        if (!content.trim()) return;

        let formattedContent = '';
        
        if (type === 'html') {
            formattedContent = this.formatHtml(content);
        } else if (type === 'css') {
            formattedContent = this.formatCss(content);
        }

        if (formattedContent && formattedContent !== content) {
            monacoEditor.setValue(formattedContent);
        }
    }

    formatHtml(html) {
        try {
            // Basic HTML formatting with better indentation
            let formatted = html
                .replace(/>\s*</g, '><') // Remove whitespace between tags
                .replace(/></g, '>\n<')  // Add newlines between tags
                .split('\n')
                .filter(line => line.trim())
                .map((line, index, array) => {
                    const trimmed = line.trim();
                    if (!trimmed) return '';
                    
                    let indent = 0;
                    
                    // Calculate indentation level
                    for (let i = 0; i < index; i++) {
                        const prevLine = array[i].trim();
                        if (!prevLine) continue;
                        
                        // Count opening tags (not self-closing)
                        const openTags = (prevLine.match(/<[^\/!][^>]*(?<!\/\s*)>/g) || []).length;
                        // Count closing tags
                        const closeTags = (prevLine.match(/<\/[^>]*>/g) || []).length;
                        // Count self-closing tags (shouldn't affect indentation)
                        const selfClosingTags = (prevLine.match(/<[^>]*\/>/g) || []).length;
                        
                        indent += (openTags - selfClosingTags) - closeTags;
                    }
                    
                    // Adjust for current line if it's a closing tag
                    if (trimmed.startsWith('</')) {
                        indent = Math.max(0, indent - 1);
                    }
                    
                    return '  '.repeat(Math.max(0, indent)) + trimmed;
                })
                .join('\n');
            
            return formatted;
        } catch (error) {
            console.error('HTML formatting error:', error);
            return html;
        }
    }

    formatCss(css) {
        try {
            // Enhanced CSS formatting
            let formatted = css
                // Remove extra whitespace
                .replace(/\s+/g, ' ')
                .trim()
                // Format selectors and opening braces
                .replace(/\s*{\s*/g, ' {\n  ')
                // Format properties
                .replace(/;\s*/g, ';\n  ')
                // Format closing braces
                .replace(/\s*}\s*/g, '\n}\n\n')
                // Format comma-separated selectors
                .replace(/,\s*/g, ',\n')
                // Clean up multiple newlines
                .replace(/\n\s*\n\s*\n/g, '\n\n')
                // Remove trailing spaces from properties
                .replace(/\s+;/g, ';')
                // Clean up the last closing brace
                .replace(/}\n\n$/, '}')
                .trim();
            
            // Additional cleanup for nested rules or at-rules
            formatted = formatted
                .replace(/(@[^{]+{\s*)/g, '$1\n  ')
                .replace(/(@media[^{]+{\s*)/g, '$1\n  ')
                .replace(/(@keyframes[^{]+{\s*)/g, '$1\n  ');
            
            return formatted;
        } catch (error) {
            console.error('CSS formatting error:', error);
            return css;
        }
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
            const htmlContent = this.getComponentHtml(this.component);
            const cssContent = this.editor.CodeManager.getCode(this.component, 'css', {
                cssc: this.editor.Css
            });
            
            // Set content without auto-formatting first to avoid double formatting
            if (this.htmlCodeEditor.editor) {
                this.htmlCodeEditor.editor.setValue(htmlContent || '');
                if (htmlContent && htmlContent.trim()) {
                    setTimeout(() => {
                        this.formatCodeAutomatically('html', this.htmlCodeEditor.editor);
                    }, 100);
                }
            } else {
                this.htmlCodeEditor.pendingContent = htmlContent;
            }
            
            if (this.cssCodeEditor.editor) {
                this.cssCodeEditor.editor.setValue(cssContent || '');
                if (cssContent && cssContent.trim()) {
                    setTimeout(() => {
                        this.formatCodeAutomatically('css', this.cssCodeEditor.editor);
                    }, 150);
                }
            } else {
                this.cssCodeEditor.pendingContent = cssContent;
            }
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
        
        // Clear editor wrappers
        if (this.editorWrappers) {
            Object.values(this.editorWrappers).forEach(wrapper => {
                if (wrapper && wrapper.dispose) {
                    wrapper.dispose();
                }
            });
            this.editorWrappers = {};
        }
        
        // Clear instances
        this.monacoInstances = {};
        
        // Clear code panel
        if (this.codePanel) {
            this.codePanel.remove();
            this.codePanel = null;
        }
    }
}
