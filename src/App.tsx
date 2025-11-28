import { useCallback, useEffect, useRef, useState } from "react";
import CodeMirror, { Extension } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { php } from "@codemirror/lang-php";
import { python } from "@codemirror/lang-python";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { invoke } from "@tauri-apps/api/core";
import {
    Play,
    Trash2,
    ChevronDown,
    Terminal,
    Check,
    XCircle,
    LoaderCircle,
} from "lucide-react";
import { Button } from "./components/button";
import IconGithub from "./components/icon-github";
import { cn } from "./lib/utils";
import { useLocalStorage } from "./hooks/use-local-storage";
import { useKeyPress } from "./hooks/use-key-press";
import icon48x48 from "./assets/48x48.png";

type LanguageConfig = {
    name: string;
    key: string;
    handler: string;
    editor_extensions?: Extension[];
    snippet: string;
};

const VERSION = "v0.1.2";

const LANGUAGES: LanguageConfig[] = [
    {
        name: "NodeJS",
        key: "nodejs",
        handler: "run_njs",
        editor_extensions: [javascript()],
        snippet: 'console.log("Hello World")\n',
    },
    {
        name: "Bun (TypeScript)",
        key: "bun",
        handler: "run_bun",
        editor_extensions: [javascript({ jsx: true, typescript: true })],
        snippet: 'console.log("Hello World")\n',
    },
    {
        name: "PHP",
        key: "php",
        handler: "run_php",
        editor_extensions: [php()],
        snippet: '<?php\necho "Hello World";\n',
    },
    {
        name: "Python",
        key: "python",
        handler: "run_python",
        editor_extensions: [python()],
        snippet: 'print("Hello World")\n',
    },
];

export default function App() {
    const debounceRef = useRef<number | null>(null);
    const logsEndRef = useRef<HTMLDivElement | null>(null);
    const cursorLastPos = useRef({ line: 1, col: 1 });

    const [memoryLang, setMemoryLang] = useLocalStorage(
        "lang",
        LANGUAGES[0].key
    );
    const [code, setCode] = useState("");
    const [editorWidth, setEditorWidth] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
    const [logs, setLogs] = useState([
        {
            id: 1,
            type: "info",
            text: "CodeLive Console Ready...",
            time: new Date(),
        },
    ]);

    const currentLang =
        LANGUAGES.find((l) => l.key === memoryLang) || LANGUAGES[0];

    useEffect(() => {
        setCode(currentLang.snippet);
        setLogs([]);
        addLog(`Language changed to ${currentLang.name}`, "info");
    }, [memoryLang]);

    const onCodeChange = useCallback(
        debounce((v) => setCode(v), 500),
        []
    );

    const handleCideMirrorUpdate = useCallback((view: any) => {
        const pos = view.state.selection.main.head;
        const line = view.state.doc.lineAt(pos);
        const newPos = {
            line: line.number,
            col: pos - line.from + 1,
        };

        if (
            newPos.line !== cursorLastPos.current.line ||
            newPos.col !== cursorLastPos.current.col
        ) {
            cursorLastPos.current = newPos;
            setCursorPos(newPos);
        }
    }, []);

    useEffect(() => {
        if (code) runCode(code, currentLang.handler);
    }, [code]);

    async function runCode(code: string, handler: string) {
        setIsRunning(true);
        try {
            const output = await invoke(handler, { code });
            addLog(output as string, "output");
        } catch (err) {
            addLog(err as string, "error");
        } finally {
            setIsRunning(false);
        }
    }

    const addLog = (text: string, type: string = "output") => {
        if (!text.trim()) return;
        setLogs((prev) => [
            ...prev.slice(-100),
            { id: Date.now(), type, text, time: new Date() },
        ]);
    };

    const clearLogs = () => {
        setLogs([]);
        addLog("Console cleared", "info");
    };

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    // Drag Resizing
    const startDragging = () => {
        setIsDragging(true);
        document.addEventListener("mousemove", onDrag);
        document.addEventListener("mouseup", stopDragging);
    };
    const onDrag = (e: MouseEvent) => {
        const percent = (e.clientX / window.innerWidth) * 100;
        if (percent > 15 && percent < 85) setEditorWidth(percent);
    };
    const stopDragging = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", onDrag);
        document.removeEventListener("mouseup", stopDragging);
    };

    // Keyboard Shortcuts
    useKeyPress("Ctrl+r", (e) => {
        e.preventDefault();
        runCode(code, currentLang.handler);
    });
    useKeyPress("Ctrl+l", (e) => {
        e.preventDefault();
        clearLogs();
    });
    useKeyPress("Ctrl+n", (e) => {
        e.preventDefault();
        setMemoryLang(nextLang(memoryLang)?.key || memoryLang);
    });
    useKeyPress("Ctrl+Shift+N", (e) => {
        e.preventDefault();
        setMemoryLang(prevLang(memoryLang)?.key || memoryLang);
    });

    // helper functions
    const nextLang = (key: string) => {
        const i = LANGUAGES.findIndex((l) => l.key === key);
        return i !== -1 ? LANGUAGES[(i + 1) % LANGUAGES.length] : null;
    };
    const prevLang = (key: string) => {
        const i = LANGUAGES.findIndex((l) => l.key === key);
        return i !== -1
            ? LANGUAGES[(i - 1 + LANGUAGES.length) % LANGUAGES.length]
            : null;
    };
    function debounce<T extends (...args: any[]) => any>(fn: T, time: number) {
        return (...args: Parameters<T>) => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
            debounceRef.current = setTimeout(() => {
                fn(...args);
            }, time);
        };
    }

    return (
        <div
            className={cn(
                "flex flex-col h-screen bg-zinc-950 text-zinc-100 font-sans select-none overflow-hidden selection:bg-blue-500/30",
                { "cursor-col-resize": isDragging }
            )}
        >
            <nav className="h-14 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 border border-blue-900 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
                            <img
                                src={icon48x48}
                                className="w-5 h-5 pointer-events-none"
                            />
                        </div>
                        <span className="font-bold text-lg tracking-tight">
                            CodeLive
                        </span>
                    </div>
                    {/* <div className="h-4 w-px bg-zinc-800 ml-2 mr-1" />
                    <span className="text-zinc-500 text-xs font-[monospace]">love is a grave mental disease</span> */}
                    {/* <div className="hidden md:flex items-center gap-2 text-sm text-zinc-400 bg-zinc-900/50 px-3 py-1.5 rounded-md border border-zinc-800/50">
                        <FileCode className="w-4 h-4 text-blue-400" />
                        <span>{currentLang.name}</span>
                    </div> */}
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select
                            value={memoryLang}
                            onChange={(e) => setMemoryLang(e.target.value)}
                            className="appearance-none bg-zinc-900 text-sm pl-3 pr-8 py-2 rounded-md border border-zinc-800 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700 outline-none cursor-pointer hover:bg-zinc-800 transition-colors"
                        >
                            {LANGUAGES.map((lang) => (
                                <option key={lang.key} value={lang.key}>
                                    {lang.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    </div>
                    <Button
                        onClick={() => runCode(code, currentLang.handler)}
                        variant="success"
                        className="cursor-pointer"
                        disabled={isRunning}
                        title="Run (Ctrl+R)"
                    >
                        {isRunning ? (
                            <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Play className="w-4 h-4 mr-2 fill-current" />
                        )}
                        {isRunning ? "Running..." : "Run Code"}
                    </Button>
                </div>
            </nav>

            <main className="flex-1 flex overflow-hidden">
                <div
                    className="flex flex-col border-r border-zinc-800 bg-[#282a36]"
                    style={{ width: `${editorWidth}%` }}
                >
                    <div className="h-9 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 justify-between select-none">
                        <span className="text-xs font-[monospace] text-zinc-400 font-medium">
                            EDITOR
                        </span>
                    </div>
                    <div className="flex-1 relative overflow-hidden">
                        <CodeMirror
                            value={code}
                            height="100%"
                            className="h-full"
                            theme={dracula}
                            extensions={currentLang.editor_extensions}
                            onChange={onCodeChange}
                            onUpdate={handleCideMirrorUpdate}
                            autoFocus
                        />
                    </div>
                </div>

                <div
                    onMouseDown={startDragging}
                    className={cn(
                        "w-1 cursor-col-resize bg-zinc-800 hover:bg-emerald-700 transition-colors",
                        { "bg-emerald-700": isDragging }
                    )}
                />

                <div className="flex flex-col bg-zinc-950 flex-1">
                    <div className="h-9 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 select-none">
                        <div className="flex gap-6 h-full">
                            <button className="text-xs font-[monospace] text-zinc-100 border-b-2 border-blue-500 h-full px-1">
                                TERMINAL
                            </button>
                        </div>
                        <button
                            onClick={clearLogs}
                            className="text-zinc-500 hover:text-red-400 transition-colors p-1 rounded-sm hover:bg-zinc-800"
                            title="Clear Console (Ctrl+L)"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    <div
                        className={cn(
                            "flex-1 p-4 px-2 font-[monospace] text-sm overflow-y-auto font-medium",
                            {
                                "cursor-text select-auto": !isDragging,
                                "cursor-col-resize select-none": isDragging,
                            }
                        )}
                    >
                        <div className="divide-y divide-zinc-900 space-y-1">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex flex-col gap-0.5 animate-in fade-in duration-200 hover:bg-zinc-900 p-0.5 px-1"
                                >
                                    <span
                                        className={cn(
                                            "text-zinc-600 text-xs mb-0.5 select-none shrink-0 animate-fade-in",
                                            {
                                                "text-emerald-400":
                                                    log.type !== "error",
                                            }
                                        )}
                                    >
                                        {log.time?.toLocaleTimeString([], {
                                            hour12: false,
                                        })}
                                    </span>
                                    <span
                                        className={cn(
                                            "break-all animate-fade-in whitespace-pre-line wrap-break-word",
                                            {
                                                "text-red-400":
                                                    log.type === "error",
                                                "text-emerald-400":
                                                    log.type === "success",
                                                "text-blue-400":
                                                    log.type === "system",
                                                "text-zinc-500 italic":
                                                    log.type === "info",
                                                "text-zinc-300": ![
                                                    "error",
                                                    "success",
                                                    "system",
                                                    "info",
                                                ].includes(log.type),
                                            }
                                        )}
                                    >
                                        {log.type === "error" && (
                                            <XCircle className="inline w-3 h-3 mr-1.5 -mt-0.5" />
                                        )}
                                        {log.type === "success" && (
                                            <Check className="inline w-3 h-3 mr-1.5 -mt-0.5" />
                                        )}
                                        {log.type === "system" && (
                                            <Terminal className="inline w-3 h-3 mr-1.5 -mt-0.5" />
                                        )}
                                        {log.text}
                                    </span>
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    </div>
                </div>
            </main>

            <footer className="h-7 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between pr-3 text-xs select-none text-zinc-500">
                <div className="flex items-center justify-center h-full">
                    <a
                        href="https://github.com/mhs003"
                        target="_blank"
                        className="flex justify-center items-center gap-2 px-3 h-full hover:bg-zinc-800"
                    >
                        <IconGithub className="mb-0.5" />
                        <span>Monzurul Hasan</span>
                    </a>
                    <span className="w-px h-full bg-zinc-800 mr-2"></span>
                    <a
                        href="https://github.com/mhs003/codelive/releases/"
                        target="_blank"
                        className="font-[monospace] hover:text-zinc-400 hover:underline"
                    >
                        {VERSION}
                    </a>
                </div>

                <div className="flex items-center gap-4">
                    <span className="font-[monospace]">
                        Ln {cursorPos.line}, Col {cursorPos.col}
                    </span>
                    <span className="hidden sm:inline">UTF-8</span>
                    <span className="hidden sm:inline text-blue-400">
                        {currentLang.name}
                    </span>
                </div>
            </footer>
        </div>
    );
}
