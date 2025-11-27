import React, { useCallback, useEffect, useRef, useState } from "react";
import CodeMirror, { Extension } from "@uiw/react-codemirror";
import { javascript, typescriptLanguage } from "@codemirror/lang-javascript";
import { php } from "@codemirror/lang-php";
import { python } from "@codemirror/lang-python";
// import { aura } from "@uiw/codemirror-theme-aura";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { invoke } from "@tauri-apps/api/core";
import {
    Play,
    Trash2,
    Code2,
    ChevronDown,
    Terminal,
    FileCode,
    Check,
    XCircle,
    LoaderCircle,
} from "lucide-react";
import { Button } from "./components/button";
import IconGithub from "./components/icon-github";
import { cn } from "./lib/utils";

type LanguageConfig = {
    name: string;
    key: string;
    handler: string;
    editor_extensions: Extension[] | undefined;
    snippet: string;
};

const VERSION = "v0.1.1";

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

    const [code, setCode] = useState<string>("");
    const [currentLang, setCurrentLang] = useState<LanguageConfig>(
        LANGUAGES[0]
    );
    const [isDragging, setIsDraggint] = useState<boolean>(false);
    const [editorWidth, setEditorWidth] = useState<number>(50);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
    const [logs, setLogs] = useState([
        {
            id: 1,
            type: "info",
            text: "CodeLive Console Ready...",
            time: new Date(),
        },
    ]);

    const startDragging = () => {
        setIsDraggint(true);
        document.addEventListener("mousemove", onDrag);
        document.addEventListener("mouseup", stopDragging);
    };

    const onDrag = (e: MouseEvent) => {
        const percent = (e.clientX / window.innerWidth) * 100;
        if (percent > 15 && percent < 85) setEditorWidth(percent);
    };

    const stopDragging = () => {
        setIsDraggint(false);
        document.removeEventListener("mousemove", onDrag);
        document.removeEventListener("mouseup", stopDragging);
    };

    const handleLanguageChange = (
        event: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const sortLang =
            LANGUAGES.find((e) => e.key === event.target.value) || LANGUAGES[0];
        setCurrentLang(sortLang);
        setCode(sortLang.snippet);
        setLogs([]);
        addLog("Language changed to " + sortLang.name, "info");
    };


    const onCodeChange = (value: string) => {
        debounce((value: string) => {
            setCode(value);
        }, 500)(value);
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

    useEffect(() => {
        if(!!code) runCode(code, currentLang.handler);
    }, [code])

    async function runCode(freshCode: string, freshLang: string) {
        const currentCode = freshCode;
        const language = freshLang;

        setIsRunning(true);
        try {
            const output: string = await invoke(language, {
                code: currentCode,
            });
            addLog(output, "output");
        } catch (err) {
            addLog(err as string, "error");
        } finally {
            setIsRunning(false);
        }
    }

    // Log Management
    const addLog = (text: string, type: string = "output") => {
        if (text.trim() === "") return;
        setLogs((prev) => [
            ...prev,
            { id: Date.now(), type, text, time: new Date() },
        ]);
    };

    const clearLogs = () => {
        setLogs([]);
        addLog("Console cleared", "info");
    };

    // Auto-scroll console
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    return (
        <div
            className={cn(
                "flex flex-col h-screen bg-zinc-950 text-zinc-100 font-sans select-none overflow-hidden selection:bg-blue-500/30",
                {
                    "cursor-col-resize": isDragging,
                }
            )}
        >
            {/* Header Navbar */}
            <nav className="h-14 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
                            <Code2 className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">
                            CodeLive
                        </span>
                    </div>

                    <div className="h-4 w-px bg-zinc-800 mx-2" />

                    <div className="hidden md:flex items-center gap-2 text-sm text-zinc-400 bg-zinc-900/50 px-3 py-1.5 rounded-md border border-zinc-800/50">
                        <FileCode className="w-4 h-4 text-blue-400" />
                        <span>{currentLang.name}</span>
                    </div>
                </div>
                {/*  */}
                <div className="flex items-center gap-3">
                    {/* Language Selector */}
                    <div className="relative">
                        <select
                            value={currentLang.key}
                            onChange={handleLanguageChange}
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
            {/* Grid Body */}
            <main className="flex-1 flex overflow-hidden">
                {/* Grid-left | Editor */}
                <div
                    className="flex flex-col border-r border-zinc-800 bg-[#282a36]"
                    style={{ width: `${editorWidth}%` }}
                >
                    {" "}
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
                            onUpdate={(view) => {
                                const pos = view.state.selection.main.head;
                                const line = view.state.doc.lineAt(pos);
                                setCursorPos({
                                    line: line.number,
                                    col: pos - line.from + 1,
                                });
                            }}
                            autoFocus
                        />
                    </div>
                </div>

                <div
                    onMouseDown={startDragging}
                    className={cn(
                        "w-1 cursor-col-resize bg-zinc-800 hover:bg-emerald-700 transition-colors",
                        {
                            "bg-emerald-700": isDragging,
                        }
                    )}
                />

                {/* Grid-right | Console */}
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
                            title="Clear Console"
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
                                        {log.time
                                            ? log.time.toLocaleTimeString([], {
                                                  hour12: false,
                                              })
                                            : ""}
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

                        {/* <div className="flex items-center mt-3 text-zinc-400">
                            <span className="text-blue-500 mr-2 select-none">
                                ❯
                            </span>
                            <div className="w-2 h-4 bg-zinc-600 animate-[pulse_1s_ease-in-out_infinite]" />
                        </div> */}
                    </div>
                    {/*  */}
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
