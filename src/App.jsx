import { useState, useEffect, useRef } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import FILE_SYSTEM from './data/fileSystem.json';

const getSavedState = (key, defaultValue) => {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultValue;
    } catch {
        return defaultValue;
    }
};

const addNodeToTree = (tree, parentPath, newNode) => {
    if (!parentPath || parentPath === '') {
        return [...tree, newNode].sort((a, b) => {
            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
    }
    const pathParts = parentPath.split('/');
    const walk = (nodes, currentDepth) => {
        return nodes.map(node => {
            if (node.name === pathParts[currentDepth]) {
                if (currentDepth === pathParts.length - 1) {
                    return { 
                        ...node, 
                        children: [...(node.children || []), newNode].sort((a, b) => {
                            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
                            return a.name.localeCompare(b.name);
                        })
                    };
                } else {
                    return { ...node, children: walk(node.children || [], currentDepth + 1) };
                }
            }
            return node;
        });
    };
    return walk(tree, 0);
};

const updateNodeInTree = (tree, targetPath, newContent) => {
    const pathParts = targetPath.split('/');
    const walk = (nodes, currentDepth) => {
        return nodes.map(node => {
            if (node.name === pathParts[currentDepth]) {
                if (currentDepth === pathParts.length - 1) {
                    return { ...node, content: newContent };
                } else {
                    return { ...node, children: walk(node.children || [], currentDepth + 1) };
                }
            }
            return node;
        });
    };
    return walk(tree, 0);
};

const deleteNodeFromTree = (tree, targetPath) => {
    if (!targetPath) return tree;
    const pathParts = targetPath.split('/');
    const walk = (nodes, currentDepth) => {
        return nodes.filter(node => {
            if (node.name === pathParts[currentDepth] && currentDepth === pathParts.length - 1) {
                return false;
            }
            return true;
        }).map(node => {
            if (node.name === pathParts[currentDepth]) {
                return { ...node, children: walk(node.children || [], currentDepth + 1) };
            }
            return node;
        });
    };
    return walk(tree, 0);
};

const renameNodeInTree = (tree, targetPath, newName) => {
    const pathParts = targetPath.split('/');
    const walk = (nodes, currentDepth) => {
        return nodes.map(node => {
            if (node.name === pathParts[currentDepth]) {
                if (currentDepth === pathParts.length - 1) {
                    return { ...node, name: newName };
                } else {
                    return { ...node, children: walk(node.children || [], currentDepth + 1) };
                }
            }
            return node;
        }).sort((a, b) => {
            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
    };
    return walk(tree, 0);
};

const isNodeFolder = (tree, targetPath) => {
    if (!targetPath) return true;
    const parts = targetPath.split('/');
    let currentNodes = tree;
    for (let i=0; i<parts.length; i++) {
        const node = currentNodes.find(n => n.name === parts[i]);
        if (!node) return false;
        if (i === parts.length - 1) return node.type === 'folder';
        currentNodes = node.children || [];
    }
    return false;
};

const FileIcon = ({ name }) => {
    if (name.endsWith('.py')) {
        return (
            <svg viewBox="0 0 110 110" className="w-[14px] h-[14px] mr-1.5 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M54.7 15.6c-18.7 0-21.6 8.2-21.6 8.2l.1 11.2h22.2v3.2H32s-10.4-1.2-10.4 15.3c0 16.5 9 15.8 9 15.8h5.9v-8.4s-.2-9.6 9.8-9.6h15.2s8.6.2 8.6-8.5v-18c0-8.6-8.8-9.2-8.8-9.2h-16.6zm-10.7 6.4c1.8 0 3.2 1.4 3.2 3.2 0 1.8-1.4 3.2-3.2 3.2-1.8 0-3.2-1.4-3.2-3.2 0-1.8 1.4-3.2 3.2-3.2z" fill="#387EB8"/>
                <path d="M55.5 94.4c18.7 0 21.6-8.2 21.6-8.2l-.1-11.2H54.8v-3.2h23.4s10.4 1.2 10.4-15.3c0-16.5-9-15.8-9-15.8h-5.9v8.4s.2 9.6-9.8 9.6H48.7s-8.6-.2-8.6 8.5v18c0 8.6 8.8 9.2 8.8 9.2h16.6zm10.7-6.4c-1.8 0-3.2-1.4-3.2-3.2 0-1.8 1.4-3.2 3.2-3.2 1.8 0 3.2 1.4 3.2 3.2 0 1.8-1.4 3.2-3.2 3.2z" fill="#FFE052"/>
            </svg>
        );
    }
    if (name.endsWith('.java')) {
        return (
            <svg viewBox="0 0 50 50" className="w-[14px] h-[14px] mr-1.5 shrink-0" xmlns="http://www.w3.org/2000/svg">
                <path d="M28.4 19.3c-2.8-1.7-5.9-.6-6.4-.4-1 .3-1.6 1.4-1.3 2.4.3 1 1.4 1.6 2.4 1.3 0 0 1.9-.6 3.4.3 1.5 1 2.2 2.6 1.9 4.1-.3 1.5-1.5 2.7-3.1 3-3.6.7-10.7-.7-10.7-.7-1-.3-2 .3-2.3 1.3-.3 1 .3 2 1.3 2.3 0 0 7.8 1.6 12.3.8 2.5-.5 4.5-2.3 5-4.7.7-2.6-.4-5.2-2.5-6.7z" fill="#E76F00"/>
                <path d="M22.8 2.2C15.9 4 16 11.2 16 11.2c0 1 1 1.9 2 1.8 1.1-.1 1.9-1 1.8-2 0 0-.2-4.1 4.1-5.1 4.2-1 6.5 1.7 6.5 1.7.6.8 1.8.9 2.6.2.8-.6.9-1.8.2-2.6 0 0-3.8-4.4-10.4-3zM35 15.5c-3-2.8-7.5-3.3-10.9-2.3-.9.3-1.4 1.2-1.1 2.1.3.9 1.2 1.4 2.1 1.1 2-.6 4.7-.2 6.6 1.6 2 1.8 2 4.4 1.5 6.3-.3.9.3 1.9 1.2 2.2 1 .3 1.9-.3 2.2-1.2.9-2.9.8-6.6-1.6-9.8z" fill="#5382A1"/>
                <path d="M38.8 35.8c-2-1.9-5.1-3.2-8.5-3.8-7.5-1.4-15-.1-15-.1-1-.2-1.7.5-1.9 1.5-.2 1 .5 1.7 1.5 1.9 0 0 6.6 1.2 13.3 0 2.6-.5 4.8-1.4 5.9-2.4 1.2-1.2 1-2.5 1-2.5.2-1-.4-1.9-1.4-2.1-1-.2-1.9.4-2.1 1.4 0 0 0 1.2-.8 2zM33 41.5c-4.4-1.3-9.5-1.5-14-.6-1 .2-1.6 1.2-1.4 2.1.2 1 1.2 1.6 2.1 1.4 3.7-.8 7.9-.7 11.6.4 1 .3 1.9-.3 2.2-1.3.2-1-.4-1.9-1.3-2.2z" fill="#5382A1"/>
            </svg>
        );
    }
    if (name.endsWith('.js') || name.endsWith('.jsx')) {
        return (
            <svg viewBox="0 0 24 24" className="w-[14px] h-[14px] mr-1.5 shrink-0" fill="#F7DF1E" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0h24v24H0V0z" fill="none"/><path d="M21.2 18.2c-.3-.9-1.1-1.3-2.3-1.3-1.6 0-2.4.9-2.5 2.1-.1 1.4 1 2.3 2.8 2.3 1.3 0 2.3-.4 2.8-1.2l-1.3-.8c-.4.5-.8.7-1.4.7-.7 0-1.2-.4-1.2-1h3.9c0-.2 0-.4.1-.6.1-2-1.2-3.1-2.9-3.1-1.8 0-3 1.2-3 3 0 1.9 1.2 3.1 3 3.1 2 0 3-1.1 3.5-2.2l-1.5-.9zm-3.2 2c0-.4.3-.8.9-.8.6 0 .9.3.9.8h-1.8zM14 15h1.6v5.8c0 1.5-.7 2.2-2.1 2.2-.9 0-1.6-.3-2.1-.9l1.1-1.1c.3.4.7.5 1.2.5.6 0 1-.3 1-.8v-5.7z"/>
            </svg>
        );
    }
    if (name.endsWith('.json')) {
        return <i className="codicon codicon-json mr-1.5 text-[#cbcb41] text-[14px]"></i>;
    }
    if (name.endsWith('.html')) {
        return <i className="codicon codicon-file-code mr-1.5 text-[#e34c26] text-[14px]"></i>;
    }
    return <i className="codicon codicon-file mr-1.5 text-[#cccccc] text-[14px]"></i>;
};

const InlineInput = ({ type, depth, initialValue = "", onSubmit, onCancel }) => {
    const [val, setVal] = useState(initialValue);
    const inputRef = useRef(null);
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
            if (initialValue) {
                const dotIndex = initialValue.lastIndexOf('.');
                inputRef.current.setSelectionRange(0, dotIndex > 0 ? dotIndex : initialValue.length);
            }
        }
    }, [initialValue]);
    
    return (
        <div className="flex items-center h-[22px]" style={{ paddingLeft: `${depth * 12 + (type === 'folder' ? 4 : 20)}px` }}>
            {type === 'folder' && <i className="codicon codicon-chevron-right mr-1 text-[#cccccc]"></i>}
            {type === 'folder' ? <i className="codicon codicon-folder mr-1.5 text-[#dcb67a]"></i> : <FileIcon name={val || 'file'} />}
            <input 
                ref={inputRef}
                className="bg-[#3c3c3c] text-[#cccccc] border border-[#007fd4] outline-none text-[13px] h-[20px] w-[120px] px-1"
                value={val}
                onChange={e => setVal(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter') { e.stopPropagation(); onSubmit(val); }
                    if (e.key === 'Escape') { e.stopPropagation(); onCancel(); }
                }}
                onBlur={() => {
                    if (val.trim()) onSubmit(val);
                    else onCancel();
                }}
                onClick={e => e.stopPropagation()}
            />
        </div>
    );
};

const TreeFile = ({ node, path, depth, hiddenPaths, openFile, contextMenuHandler, renamingPath, onRenameSubmit, onRenameCancel }) => {
    if (hiddenPaths.includes(path)) return null;

    if (renamingPath === path) {
        return <InlineInput type="file" depth={depth} initialValue={node.name} onSubmit={(val) => onRenameSubmit(path, val)} onCancel={onRenameCancel} />;
    }

    return (
        <div 
           className="flex items-center hover:bg-[#2a2d2e] cursor-pointer text-[13px] h-[22px] text-[#cccccc] select-none"
           style={{ paddingLeft: `${depth * 12 + 20}px` }}
           onClick={() => openFile(node, path)}
           onContextMenu={(e) => contextMenuHandler(e, path)}
        >
            <FileIcon name={node.name} />
            <span>{node.name}</span>
        </div>
    );
};

const TreeFolder = ({ node, path, depth, hiddenPaths, setHiddenPaths, openFile, contextMenuHandler, creatingNode, onCreateSubmit, onCreateCancel, renamingPath, onRenameSubmit, onRenameCancel }) => {
    const [isOpen, setIsOpen] = useState(() => getSavedState(`folder_${path}`, true));
    
    useEffect(() => {
        localStorage.setItem(`folder_${path}`, JSON.stringify(isOpen));
    }, [isOpen, path]);

    if (hiddenPaths.includes(path)) return null;

    if (renamingPath === path) {
        return <InlineInput type="folder" depth={depth} initialValue={node.name} onSubmit={(val) => onRenameSubmit(path, val)} onCancel={onRenameCancel} />;
    }

    return (
        <div>
            <div 
               className="flex items-center hover:bg-[#2a2d2e] cursor-pointer text-[13px] h-[22px] text-[#cccccc] select-none"
               style={{ paddingLeft: `${depth * 12 + 4}px` }}
               onClick={() => setIsOpen(!isOpen)}
               onContextMenu={(e) => contextMenuHandler(e, path)}
            >
                <i className={`codicon codicon-chevron-${isOpen ? 'down' : 'right'} mr-1`}></i>
                <i className={`codicon codicon-${isOpen ? 'folder-opened' : 'folder'} mr-1.5 text-[#dcb67a]`}></i>
                <span>{node.name}</span>
            </div>
            {isOpen && node.children.map(child => (
                child.type === 'folder' ? 
                <TreeFolder key={child.name} node={child} path={`${path}/${child.name}`} depth={depth + 1} hiddenPaths={hiddenPaths} setHiddenPaths={setHiddenPaths} openFile={openFile} contextMenuHandler={contextMenuHandler} creatingNode={creatingNode} onCreateSubmit={onCreateSubmit} onCreateCancel={onCreateCancel} renamingPath={renamingPath} onRenameSubmit={onRenameSubmit} onRenameCancel={onRenameCancel} /> :
                <TreeFile key={child.name} node={child} path={`${path}/${child.name}`} depth={depth + 1} hiddenPaths={hiddenPaths} openFile={openFile} contextMenuHandler={contextMenuHandler} renamingPath={renamingPath} onRenameSubmit={onRenameSubmit} onRenameCancel={onRenameCancel} />
            ))}
            {creatingNode && creatingNode.parentPath === path && isOpen && (
                <InlineInput type={creatingNode.type} depth={depth + 1} onSubmit={onCreateSubmit} onCancel={onCreateCancel} />
            )}
        </div>
    );
};

const App = () => {
    // Persisted File Tree
    const [fileTree, setFileTree] = useState(() => getSavedState('vscode_fileTree', FILE_SYSTEM));
    
    // Persisted State
    const [hiddenPaths, setHiddenPaths] = useState(() => getSavedState('vscode_hiddenPaths', ['DAA', 'IAI', 'FLNN']));
    const [openTabs, setOpenTabs] = useState(() => getSavedState('vscode_openTabs', []));
    const [activeTabPath, setActiveTabPath] = useState(() => getSavedState('vscode_activeTabPath', null));
    const [sidebarOpen, setSidebarOpen] = useState(() => getSavedState('vscode_sidebarOpen', true));
    
    const [terminalOpen, setTerminalOpen] = useState(() => getSavedState('vscode_terminalOpen', false));
    const [terminalHistory, setTerminalHistory] = useState(() => getSavedState('vscode_terminalHistory', [
        "Welcome to Visual Studio Code Terminal (Integrated Bash)",
        "Type 'help' to see available commands."
    ]));
    
    const [terminalInput, setTerminalInput] = useState("");
    const [contextMenu, setContextMenu] = useState({ isOpen: false, x: 0, y: 0, path: null });
    const [creatingNode, setCreatingNode] = useState(null);
    const [renamingPath, setRenamingPath] = useState(null);
    const terminalEndRef = useRef(null);

    const monaco = useMonaco();
    const stateRef = useRef({ activeTabPath, openTabs, fileTree, sidebarOpen });

    useEffect(() => {
        stateRef.current = { activeTabPath, openTabs, fileTree, sidebarOpen };
    });

    useEffect(() => {
        localStorage.setItem('vscode_fileTree', JSON.stringify(fileTree));
        localStorage.setItem('vscode_hiddenPaths', JSON.stringify(hiddenPaths));
        localStorage.setItem('vscode_openTabs', JSON.stringify(openTabs));
        localStorage.setItem('vscode_activeTabPath', JSON.stringify(activeTabPath));
        localStorage.setItem('vscode_sidebarOpen', JSON.stringify(sidebarOpen));
        localStorage.setItem('vscode_terminalOpen', JSON.stringify(terminalOpen));
        localStorage.setItem('vscode_terminalHistory', JSON.stringify(terminalHistory));
    }, [fileTree, hiddenPaths, openTabs, activeTabPath, sidebarOpen, terminalOpen, terminalHistory]);

    useEffect(() => {
        if (monaco) {
            monaco.editor.defineTheme('github-dark', {
                base: 'vs-dark',
                inherit: true,
                rules: [
                    { background: '0d1117' },
                    { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
                    { token: 'keyword', foreground: 'ff7b72' },
                    { token: 'string', foreground: 'a5d6ff' },
                    { token: 'number', foreground: '79c0ff' },
                    { token: 'type', foreground: 'ff7b72' },
                    { token: 'class', foreground: 'd2a8ff' },
                    { token: 'function', foreground: 'd2a8ff' },
                    { token: 'variable', foreground: 'c9d1d9' },
                    { token: 'operator', foreground: '79c0ff' }
                ],
                colors: {
                    'editor.background': '#0d1117',
                    'editor.foreground': '#c9d1d9',
                    'editorLineNumber.foreground': '#484f58',
                    'editorCursor.foreground': '#58a6ff',
                    'editor.selectionBackground': '#3392FF44',
                    'editorIndentGuide.background': '#21262d',
                    'editorIndentGuide.activeBackground': '#30363d'
                }
            });
            monaco.editor.setTheme('github-dark');
        }
    }, [monaco]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const { activeTabPath, openTabs, fileTree, sidebarOpen } = stateRef.current;
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                setSidebarOpen(!sidebarOpen);
            }
            if ((e.ctrlKey || e.metaKey) && e.key === '`') {
                e.preventDefault();
                setTerminalOpen(prev => !prev);
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                if (!activeTabPath) return;
                const tab = openTabs.find(t => t.path === activeTabPath);
                if (tab && tab.editedContent !== tab.content) {
                    const newTree = updateNodeInTree(fileTree, activeTabPath, tab.editedContent);
                    setFileTree(newTree);
                    setOpenTabs(openTabs.map(t => t.path === activeTabPath ? { ...t, content: tab.editedContent } : t));
                }
            }
            // Alt+W to close tab, because browsers enforce Ctrl+W to close the browser window.
            if (e.altKey && e.key.toLowerCase() === 'w') {
                e.preventDefault();
                if (activeTabPath) {
                    const newTabs = openTabs.filter(t => t.path !== activeTabPath);
                    setOpenTabs(newTabs);
                    setActiveTabPath(newTabs.length > 0 ? newTabs[newTabs.length - 1].path : null);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const handleClick = () => setContextMenu({ ...contextMenu, isOpen: false });
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [contextMenu]);

    useEffect(() => {
        if (terminalEndRef.current && terminalOpen) {
            terminalEndRef.current.scrollIntoView();
        }
    }, [terminalHistory, terminalOpen]);

    const contextMenuHandler = (e, path) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY, path });
    };

    const openFile = (file, path) => {
        if (!openTabs.find(t => t.path === path)) {
            setOpenTabs([...openTabs, { ...file, path, editedContent: file.content || '' }]);
        }
        setActiveTabPath(path);
    };

    const closeTab = (path) => {
        const newTabs = openTabs.filter(t => t.path !== path);
        setOpenTabs(newTabs);
        if (activeTabPath === path) {
            setActiveTabPath(newTabs.length > 0 ? newTabs[newTabs.length - 1].path : null);
        }
    };

    const handleEditorChange = (value, path) => {
        setOpenTabs(tabs => tabs.map(t => t.path === path ? { ...t, editedContent: value } : t));
    };

    const handleCreateStart = (type) => {
        let parentPath = '';
        if (contextMenu.path) {
            const isFolder = isNodeFolder(fileTree, contextMenu.path);
            parentPath = isFolder ? contextMenu.path : contextMenu.path.substring(0, contextMenu.path.lastIndexOf('/'));
        }
        setCreatingNode({ type, parentPath });
        if (parentPath !== '') {
            localStorage.setItem(`folder_${parentPath}`, JSON.stringify(true));
        }
        setContextMenu({ ...contextMenu, isOpen: false });
    };

    const handleCreateSubmit = (name) => {
        const nameTrimmed = name.trim();
        if (nameTrimmed && creatingNode) {
            const newNode = creatingNode.type === 'folder' 
                ? { name: nameTrimmed, type: 'folder', children: [] }
                : { name: nameTrimmed, type: 'file', content: '' };
            const newTree = addNodeToTree(fileTree, creatingNode.parentPath, newNode);
            setFileTree(newTree);
            if (creatingNode.type === 'file') {
                const newPath = creatingNode.parentPath ? `${creatingNode.parentPath}/${nameTrimmed}` : nameTrimmed;
                openFile(newNode, newPath);
            }
        }
        setCreatingNode(null);
    };

    const handleRenameSubmit = (oldPath, newName) => {
        const newNameTrimmed = newName.trim();
        if (newNameTrimmed) {
            const newTree = renameNodeInTree(fileTree, oldPath, newNameTrimmed);
            setFileTree(newTree);
            
            // Update open tabs if a file was renamed
            const oldPathParts = oldPath.split('/');
            oldPathParts[oldPathParts.length - 1] = newNameTrimmed;
            const newPath = oldPathParts.join('/');
            
            setOpenTabs(tabs => tabs.map(t => {
                if (t.path === oldPath) {
                    return { ...t, name: newNameTrimmed, path: newPath };
                } else if (t.path.startsWith(oldPath + '/')) {
                    // If a folder was renamed, update paths of all open children
                    return { ...t, path: t.path.replace(oldPath, newPath) };
                }
                return t;
            }));
            
            if (activeTabPath === oldPath) {
                setActiveTabPath(newPath);
            } else if (activeTabPath?.startsWith(oldPath + '/')) {
                setActiveTabPath(activeTabPath.replace(oldPath, newPath));
            }
        }
        setRenamingPath(null);
    };

    const handleDelete = () => {
        if (contextMenu.path) {
            const newTree = deleteNodeFromTree(fileTree, contextMenu.path);
            setFileTree(newTree);
            
            // Close tab if deleted
            const newTabs = openTabs.filter(t => !t.path.startsWith(contextMenu.path));
            setOpenTabs(newTabs);
            if (activeTabPath?.startsWith(contextMenu.path)) {
                setActiveTabPath(newTabs.length > 0 ? newTabs[newTabs.length - 1].path : null);
            }
        }
        setContextMenu({ ...contextMenu, isOpen: false });
    };

    const handleTerminalCommand = (e) => {
        if (e.key === 'Enter') {
            const cmd = terminalInput.trim();
            setTerminalInput("");
            
            const newHistory = [...terminalHistory, `PC00420@admin:~$ ${cmd}`];
            
            if (cmd === '') {
                setTerminalHistory(newHistory);
                return;
            }

            if (cmd === 'clear') {
                setTerminalHistory([]);
                return;
            } else if (cmd === 'cal') {
                const calOutput = [
                    "    October 2026    ",
                    "Su Mo Tu We Th Fr Sa",
                    "             1  2  3",
                    " 4  5  6  7  8  9 10",
                    "11 12 13 14 15 16 17",
                    "18 19 20 21 22 23 24",
                    "25 26 27 28 29 30 31"
                ].join('\n');
                newHistory.push(calOutput);
            } else if (cmd === 'ls') {
                newHistory.push("BlockChain  DAA  FLNN  STQA");
            } else if (cmd === 'help') {
                newHistory.push("Available commands: cal, clear, ls, help, echo");
            } else if (cmd.startsWith('echo ')) {
                newHistory.push(cmd.substring(5));
            } else if (cmd.startsWith('python ') || cmd.startsWith('java ') || cmd.startsWith('node ')) {
                newHistory.push(`Error: Cannot execute ${cmd.split(' ')[0]} in browser environment. Use real VS Code to compile.`);
            } else {
                newHistory.push(`bash: ${cmd}: command not found`);
            }
            
            setTerminalHistory(newHistory);
        }
    };

    const handleMaximize = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(e => console.error(e));
        }
    };

    const handleMinimize = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(e => console.error(e));
        }
    };

    const handleClose = () => {
        window.close();
    };

    const activeFile = openTabs.find(t => t.path === activeTabPath);
    const activeLanguage = activeFile?.name.endsWith('.py') ? 'python' : 
                           activeFile?.name.endsWith('.java') ? 'java' : 
                           activeFile?.name.endsWith('.html') ? 'html' : 
                           activeFile?.name.endsWith('.json') ? 'json' : 'javascript';

    return (
        <div className="h-screen w-screen flex flex-col text-[#cccccc] font-sans overflow-hidden bg-[#1e1e1e]" onContextMenu={(e) => e.preventDefault()}>
            
            <header className="h-[35px] flex items-center justify-between bg-[#181818] select-none shrink-0 border-b border-[#2b2b2b]">
                <div className="flex items-center h-full">
                    <div className="px-3 flex items-center h-full">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/9/9a/Visual_Studio_Code_1.35_icon.svg" alt="VS Code" className="w-5 h-5" />
                    </div>
                    <div className="hidden md:flex items-center text-[13px] h-full text-[#cccccc]">
                        {['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal', 'Help'].map(m => (
                            <div key={m} className="px-2 h-full flex items-center hover:bg-[#2a2d2e] cursor-default" onClick={m === 'Terminal' ? () => setTerminalOpen(!terminalOpen) : undefined}>{m}</div>
                        ))}
                    </div>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center h-full">
                    <div className="flex items-center justify-center bg-[#2b2d2e] hover:bg-[#333536] border border-[#3c3c3c] rounded-md px-3 w-[450px] h-[26px] text-[12px] transition-colors cursor-pointer text-center text-[#cccccc] shadow-sm">
                        <i className="codicon codicon-search mr-2 text-[#a8a8a8] text-[14px]"></i>
                        <span>Visual Studio Code</span>
                    </div>
                </div>
                <div className="flex h-full">
                    <div className="w-[46px] h-full flex items-center justify-center hover:bg-[#2a2d2e] cursor-pointer" onClick={handleMinimize}><i className="codicon codicon-chrome-minimize"></i></div>
                    <div className="w-[46px] h-full flex items-center justify-center hover:bg-[#2a2d2e] cursor-pointer" onClick={handleMaximize}><i className="codicon codicon-chrome-maximize"></i></div>
                    <div className="w-[46px] h-full flex items-center justify-center hover:bg-[#e81123] hover:text-white cursor-pointer" onClick={handleClose}><i className="codicon codicon-chrome-close"></i></div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-[48px] h-full flex flex-col items-center py-2 bg-[#181818] border-r border-[#2b2b2b] shrink-0">
                    <div className="relative cursor-pointer text-[#cccccc] flex justify-center items-center w-full h-[48px]">
                        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#007fd4]"></div>
                        <i className="codicon codicon-files text-[24px]"></i>
                    </div>
                    <div className="cursor-pointer text-[#858585] hover:text-[#cccccc] flex justify-center items-center w-full h-[48px]">
                        <i className="codicon codicon-search text-[24px]"></i>
                    </div>
                    <div className="cursor-pointer text-[#858585] hover:text-[#cccccc] flex justify-center items-center w-full h-[48px]">
                        <div className="relative">
                            <i className="codicon codicon-source-control text-[24px]"></i>
                            <span className="absolute -top-0.5 -right-1 bg-[#007fd4] text-white text-[9px] w-[14px] h-[14px] rounded-full flex items-center justify-center font-semibold">1</span>
                        </div>
                    </div>
                    <div className="cursor-pointer text-[#858585] hover:text-[#cccccc] flex justify-center items-center w-full h-[48px]">
                        <i className="codicon codicon-debug-alt text-[24px]"></i>
                    </div>
                    <div className="cursor-pointer text-[#858585] hover:text-[#cccccc] flex justify-center items-center w-full h-[48px]">
                        <i className="codicon codicon-extensions text-[24px]"></i>
                    </div>
                    <div className="mt-auto flex flex-col w-full">
                        <div className="cursor-pointer text-[#858585] hover:text-[#cccccc] flex justify-center items-center w-full h-[48px]">
                            <i className="codicon codicon-account text-[24px]"></i>
                        </div>
                        <div className="cursor-pointer text-[#858585] hover:text-[#cccccc] flex justify-center items-center w-full h-[48px] mb-2">
                            <i className="codicon codicon-settings-gear text-[24px]"></i>
                        </div>
                    </div>
                </div>

                {sidebarOpen && (
                    <div className="w-[250px] h-full flex flex-col bg-[#181818] border-r border-[#2b2b2b] shrink-0" onContextMenu={(e) => contextMenuHandler(e, null)}>
                        <div className="h-[35px] flex items-center px-5 text-[11px] tracking-wide text-[#cccccc] justify-between select-none">
                            <span>EXPLORER</span>
                            <i className="codicon codicon-ellipsis cursor-pointer hover:text-white"></i>
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            <div className="flex items-center px-1 h-[22px] cursor-pointer font-bold text-[11px] text-[#cccccc] hover:text-white select-none">
                                <i className="codicon codicon-chevron-down mr-0.5 text-[16px]"></i>
                                <span className="tracking-wide">WORKSPACE</span>
                            </div>
                            <div className="py-1">
                                {creatingNode && creatingNode.parentPath === '' && (
                                    <InlineInput type={creatingNode.type} depth={0} onSubmit={handleCreateSubmit} onCancel={() => setCreatingNode(null)} />
                                )}
                                {fileTree.map(node => (
                                    <TreeFolder 
                                        key={node.name} 
                                        node={node} 
                                        path={node.name} 
                                        depth={0} 
                                        hiddenPaths={hiddenPaths} 
                                        setHiddenPaths={setHiddenPaths} 
                                        openFile={openFile} 
                                        contextMenuHandler={contextMenuHandler} 
                                        creatingNode={creatingNode}
                                        onCreateSubmit={handleCreateSubmit}
                                        onCreateCancel={() => setCreatingNode(null)}
                                        renamingPath={renamingPath}
                                        onRenameSubmit={handleRenameSubmit}
                                        onRenameCancel={() => setRenamingPath(null)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 flex flex-col min-w-0 bg-[#0d1117]">
                    <div className="flex-1 flex flex-col min-h-0 relative">
                        {openTabs.length > 0 ? (
                            <>
                                <div className="h-[35px] flex bg-[#181818] overflow-x-auto no-scrollbar shrink-0" style={{boxShadow: 'inset 0 -1px 0 #2b2b2b'}}>
                                    {openTabs.map(tab => (
                                        <div 
                                            key={tab.path} 
                                            onClick={() => setActiveTabPath(tab.path)}
                                            className={`h-full px-3 flex items-center gap-2 cursor-pointer border-r border-[#2b2b2b] group min-w-fit shrink-0 ${activeTabPath === tab.path ? 'bg-[#0d1117] text-white border-t border-t-[#007fd4]' : 'bg-[#2d2d2d] text-[#969696] hover:bg-[#1e1e1e]'}`}
                                        >
                                            <FileIcon name={tab.name} />
                                            <span className="text-[13px] select-none">{tab.name}</span>
                                            {tab.editedContent !== tab.content && <span className="w-2 h-2 rounded-full bg-white ml-1"></span>}
                                            <div 
                                                className={`p-0.5 rounded hover:bg-[#333333] flex items-center justify-center ${activeTabPath === tab.path ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                                onClick={(e) => { e.stopPropagation(); closeTab(tab.path); }}
                                            >
                                                <i className="codicon codicon-close text-[14px]"></i>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="h-[22px] flex items-center px-4 text-[12px] shrink-0 bg-[#0d1117] shadow-[0_1px_2px_rgba(0,0,0,0.2)] z-10 select-none">
                                    <span className="text-[#cccccc]">Workspace</span>
                                    <i className="codicon codicon-chevron-right text-[14px] mx-1 text-[#858585]"></i>
                                    <span className="text-[#cccccc]">{activeFile?.path.replace(/\//g, ' > ')}</span>
                                </div>
                                <div className="flex-1 overflow-hidden pt-2 relative">
                                    <Editor
                                        height="100%"
                                        language={activeLanguage}
                                        theme="github-dark"
                                        value={activeFile?.editedContent}
                                        onChange={(val) => handleEditorChange(val, activeFile?.path)}
                                        path={activeFile?.path}
                                        options={{
                                            fontSize: 14,
                                            fontFamily: "'Consolas', 'Courier New', monospace",
                                            minimap: { enabled: false },
                                            scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
                                            scrollBeyondLastLine: false,
                                            wordWrap: 'on',
                                            padding: { top: 16 }
                                        }}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center select-none bg-[#1e1e1e]">
                                <svg viewBox="0 0 24 24" className="w-[280px] h-[280px] text-[#2c2c2d] mb-12" xmlns="http://www.w3.org/2000/svg">
                                    <path fill="currentColor" d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"/>
                                </svg>
                                <div className="flex flex-col gap-3 text-[13px] text-[#cccccc]">
                                    <div className="flex items-center justify-between w-[350px]">
                                        <span className="text-[#858585]">Show All Commands</span>
                                        <div className="flex items-center gap-1.5 font-sans">
                                            <span className="bg-[#2d2d2d] border border-[#3c3c3c] rounded px-2 py-0.5 shadow-sm text-[12px]">Ctrl</span>
                                            <span className="text-[#858585] text-[14px] font-bold">+</span>
                                            <span className="bg-[#2d2d2d] border border-[#3c3c3c] rounded px-2 py-0.5 shadow-sm text-[12px]">Shift</span>
                                            <span className="text-[#858585] text-[14px] font-bold">+</span>
                                            <span className="bg-[#2d2d2d] border border-[#3c3c3c] rounded px-2 py-0.5 shadow-sm text-[12px]">P</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between w-[350px]">
                                        <span className="text-[#858585]">Save Active File</span>
                                        <div className="flex items-center gap-1.5 font-sans">
                                            <span className="bg-[#2d2d2d] border border-[#3c3c3c] rounded px-2 py-0.5 shadow-sm text-[12px]">Ctrl</span>
                                            <span className="text-[#858585] text-[14px] font-bold">+</span>
                                            <span className="bg-[#2d2d2d] border border-[#3c3c3c] rounded px-2 py-0.5 shadow-sm text-[12px]">S</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between w-[350px]">
                                        <span className="text-[#858585]">Close Active File</span>
                                        <div className="flex items-center gap-1.5 font-sans">
                                            <span className="bg-[#2d2d2d] border border-[#3c3c3c] rounded px-2 py-0.5 shadow-sm text-[12px]">Alt</span>
                                            <span className="text-[#858585] text-[14px] font-bold">+</span>
                                            <span className="bg-[#2d2d2d] border border-[#3c3c3c] rounded px-2 py-0.5 shadow-sm text-[12px]">W</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between w-[350px] mt-2">
                                        <span className="text-[#858585]">Toggle Terminal</span>
                                        <div className="flex items-center gap-1.5 font-sans">
                                            <span className="bg-[#2d2d2d] border border-[#3c3c3c] rounded px-2 py-0.5 shadow-sm text-[12px]">Ctrl</span>
                                            <span className="text-[#858585] text-[14px] font-bold">+</span>
                                            <span className="bg-[#2d2d2d] border border-[#3c3c3c] rounded px-2.5 py-0.5 shadow-sm text-[12px]">`</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {terminalOpen && (
                        <div className="h-[250px] bg-[#1e1e1e] border-t border-[#2b2b2b] flex flex-col font-mono text-[13px] shrink-0 z-20">
                            <div className="flex items-center justify-between px-4 h-[35px] border-b border-[#2b2b2b] select-none text-[#cccccc] bg-[#181818]">
                                <div className="flex items-center gap-4 text-[11px] tracking-wide uppercase">
                                    <span className="cursor-pointer hover:text-white">Problems</span>
                                    <span className="cursor-pointer hover:text-white">Output</span>
                                    <span className="cursor-pointer hover:text-white">Debug Console</span>
                                    <span className="cursor-pointer text-white border-b border-[#007fd4] pb-[10px] pt-[10px]">Terminal</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <i className="codicon codicon-add cursor-pointer hover:text-white text-[14px]"></i>
                                    <i className="codicon codicon-trash cursor-pointer hover:text-white text-[14px]" onClick={() => setTerminalHistory([])}></i>
                                    <i className="codicon codicon-close cursor-pointer hover:text-white text-[14px]" onClick={() => setTerminalOpen(false)}></i>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 no-scrollbar text-[#cccccc]" onClick={() => document.getElementById('terminal-input').focus()}>
                                {terminalHistory.map((line, i) => (
                                    <div key={i} className="whitespace-pre-wrap leading-[22px]">{line}</div>
                                ))}
                                <div className="flex items-center mt-1 leading-[22px]">
                                    <span className="text-[#858585] mr-2">PC00420@admin:~$</span>
                                    <input 
                                        id="terminal-input"
                                        type="text" 
                                        value={terminalInput}
                                        onChange={(e) => setTerminalInput(e.target.value)}
                                        onKeyDown={handleTerminalCommand}
                                        className="flex-1 bg-transparent outline-none border-none text-[#cccccc] font-mono"
                                        autoComplete="off"
                                        spellCheck="false"
                                        autoFocus
                                    />
                                </div>
                                <div ref={terminalEndRef} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <footer className="h-[22px] flex items-center justify-between text-[#ffffff] text-[12px] font-sans z-30 select-none bg-[#007acc] shrink-0 px-2">
                <div className="flex items-center h-full">
                    <div className="flex items-center h-full px-2 cursor-pointer hover:bg-[#1f8ad6] gap-1">
                        <i className="codicon codicon-remote text-[14px]"></i>
                    </div>
                    <div className="flex items-center h-full px-2 cursor-pointer hover:bg-[#1f8ad6] gap-1">
                        <i className="codicon codicon-source-control text-[14px]"></i> main*
                    </div>
                    <div className="flex items-center h-full px-2 cursor-pointer hover:bg-[#1f8ad6] gap-1">
                        <i className="codicon codicon-sync text-[14px]"></i> 0 &darr; 0 &uarr;
                    </div>
                    <div className="flex items-center h-full px-2 cursor-pointer hover:bg-[#1f8ad6] gap-1.5">
                        <span className="flex items-center"><i className="codicon codicon-error text-[14px] mr-0.5"></i>0</span>
                        <span className="flex items-center"><i className="codicon codicon-warning text-[14px] mr-0.5"></i>0</span>
                    </div>
                </div>
                
                <div className="flex items-center h-full">
                    <div className="flex items-center h-full px-2 cursor-pointer hover:bg-[#1f8ad6]">Ln 1, Col 1</div>
                    <div className="flex items-center h-full px-2 cursor-pointer hover:bg-[#1f8ad6]">Spaces: 4</div>
                    <div className="flex items-center h-full px-2 cursor-pointer hover:bg-[#1f8ad6]">UTF-8</div>
                    <div className="flex items-center h-full px-2 cursor-pointer hover:bg-[#1f8ad6]">LF</div>
                    <div className="flex items-center h-full px-2 cursor-pointer hover:bg-[#1f8ad6] gap-1">
                        <i className="codicon codicon-check-all text-[14px]"></i> Prettier
                    </div>
                    <div className="flex items-center h-full px-2 cursor-pointer hover:bg-[#1f8ad6]">
                        <i className="codicon codicon-bell text-[14px]"></i>
                    </div>
                </div>
            </footer>

            {contextMenu.isOpen && (
                <div 
                    className="fixed bg-[#252526] border border-[#454545] rounded shadow-[0_4px_10px_rgba(0,0,0,0.5)] py-1.5 z-50 text-[13px] text-[#cccccc] min-w-[300px]"
                    style={{ top: Math.min(contextMenu.y, window.innerHeight - 500), left: contextMenu.x }}
                >
                    <div className="px-6 py-1 hover:bg-[#04395e] hover:text-white cursor-pointer" onClick={() => handleCreateStart('file')}>New File...</div>
                    <div className="px-6 py-1 hover:bg-[#04395e] hover:text-white cursor-pointer" onClick={() => handleCreateStart('folder')}>New Folder...</div>
                    <div className="px-6 py-1 hover:bg-[#04395e] hover:text-white cursor-pointer flex justify-between" onClick={() => setContextMenu({ ...contextMenu, isOpen: false })}><span>Reveal in File Explorer</span><span className="text-[#858585]">Shift+Alt+R</span></div>
                    <div className="px-6 py-1 hover:bg-[#04395e] hover:text-white cursor-pointer" onClick={() => { setTerminalOpen(true); setContextMenu({ ...contextMenu, isOpen: false }); }}>Open in Integrated Terminal</div>
                    <div className="h-[1px] bg-[#454545] my-1.5"></div>
                    
                    {contextMenu.path && (
                        <>
                            <div className="px-6 py-1 hover:bg-[#04395e] hover:text-white cursor-pointer flex justify-between" onClick={() => { setRenamingPath(contextMenu.path); setContextMenu({ ...contextMenu, isOpen: false }); }}>
                                <span>Rename</span><span className="text-[#858585]">F2</span>
                            </div>
                            <div className="px-6 py-1 hover:bg-[#e81123] hover:text-white cursor-pointer flex justify-between text-[#e81123]" onClick={handleDelete}>
                                <span>Delete</span><span className="text-[#858585]">Del</span>
                            </div>
                            <div className="h-[1px] bg-[#454545] my-1.5"></div>
                        </>
                    )}

                    <div className="px-6 py-1 hover:bg-[#04395e] hover:text-white cursor-pointer flex justify-between" onClick={() => handleCreateStart('file')}><span>New Java File</span><i className="codicon codicon-chevron-right text-[12px] mt-0.5"></i></div>
                    <div className="px-6 py-1 hover:bg-[#04395e] hover:text-white cursor-pointer" onClick={() => handleCreateStart('folder')}>New Java Package...</div>
                    <div className="px-6 py-1 hover:bg-[#04395e] hover:text-white cursor-pointer flex justify-between" onClick={() => setContextMenu({ ...contextMenu, isOpen: false })}><span>Maven</span><i className="codicon codicon-chevron-right text-[12px] mt-0.5"></i></div>
                    <div className="h-[1px] bg-[#454545] my-1.5"></div>
                    
                    <div className="px-6 py-1 hover:bg-[#04395e] hover:text-white cursor-pointer flex justify-between" onClick={() => setContextMenu({ ...contextMenu, isOpen: false })}><span>Find in Folder...</span><span className="text-[#858585]">Shift+Alt+F</span></div>
                    <div className="h-[1px] bg-[#454545] my-1.5"></div>
                    
                    <div className="px-6 py-1 hover:bg-[#04395e] hover:text-white cursor-pointer text-[#858585] flex justify-between"><span>Paste</span><span>Ctrl+V</span></div>
                    <div className="h-[1px] bg-[#454545] my-1.5"></div>

                    <div className="px-6 py-1 hover:bg-[#04395e] hover:text-white cursor-pointer flex justify-between" onClick={() => setContextMenu({ ...contextMenu, isOpen: false })}><span>Copy Path</span><span className="text-[#858585]">Shift+Alt+C</span></div>
                    <div className="px-6 py-1 hover:bg-[#04395e] hover:text-white cursor-pointer flex justify-between" onClick={() => setContextMenu({ ...contextMenu, isOpen: false })}><span>Copy Relative Path</span><span className="text-[#858585]">Ctrl+K Ctrl+Shift+C</span></div>
                    <div className="h-[1px] bg-[#454545] my-1.5"></div>
                    
                    <div 
                        className="px-6 py-1.5 hover:bg-[#04395e] hover:text-white cursor-pointer flex items-center text-[#cccccc]"
                        onClick={() => {
                            if (contextMenu.path) setHiddenPaths([...hiddenPaths, contextMenu.path]);
                            setContextMenu({ ...contextMenu, isOpen: false });
                        }}
                    >
                        <i className="codicon codicon-eye-closed mr-3"></i> Hide from Explorer
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
