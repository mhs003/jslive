import { useCallback, useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { php } from '@codemirror/lang-php';
import { aura } from '@uiw/codemirror-theme-aura';
import { invoke } from '@tauri-apps/api/core';

export default function App() {
  const [code, setCode] = useState("");
  const [output, setOutput] = useState('');
  const debounceRef = useRef<number | null>(null);
  const [language, setLanguage] = useState<string>("js");

  useEffect(() => {
    const savedCode = localStorage.getItem('code_value');
    if (savedCode) setCode(savedCode);
    else setCode("console.log('Hello World!');");
  }, []);

  const onChange = useCallback((value: string, _: any) => {
    setCode(value);
    localStorage.setItem('code_value', value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runCode(value, language);
    }, 500);
  }, []);

  async function runCode(currentCode: string = code, language: string) {
    const languages: Record<string, string> = {
      php: "run_php",
      js: "run_njs"
    };
    let finalCode = currentCode;
    if (language === 'php' && currentCode.toLowerCase().startsWith('<?php')) {
      finalCode = code.substring(5);
    }
    const output: string = await invoke(languages[language], { code: finalCode });
    setOutput(output);
  }

  return (
    <div className="h-screen select-none grid grid-rows-1 grid-cols-1 md:grid-cols-2 bg-gray-900 text-white">
      <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-gray-700">
        <div className="p-4 w-full font-bold text-lg border-b border-gray-700 flex justify-between items-center">
          <div>JS Live</div>
          <div>
            <select onChange={(e) => setLanguage(e.target.value)} defaultValue={'js'} className='w-38 px-1 bg-gray-800 text-white'>
              <option value="js">JavaScript</option>
              <option value="php">PHP</option>
            </select>
          </div>
        </div>
        <div className="flex-1">
          <CodeMirror
            value={code}
            height="100%"
            className='h-full'
            theme={aura}
            extensions={[javascript(), php()]}
            onChange={onChange}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-4 text-right font-bold text-lg border-b border-gray-700">
          <button
            onClick={() => runCode(code, language)}
            className="bg-green-600 hover:bg-green-700 px-4 py-1 text-sm cursor-pointer rounded-sm font-semibold"
          >
            Run
          </button>
        </div>
        <pre className="flex-1 select-all p-2 px-4 overflow-auto bg-gray-800 text-sm font-[monospace]">{output}</pre>
      </div>
      <div className='md:col-span-2 w-full bg-gray-900 py-1 text-white text-center text-xs'>
        &copy; <a target="_blank" href="https://github.com/mhs003">Monzurul Hasan</a>
      </div>
    </div>
  );
}
