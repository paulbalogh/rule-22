import { Rule22 } from "./Rule22";
import { ThemeSwitcher } from "./ThemeSwitcher";

function App() {
  const repoUrl = "https://github.com/paulbalogh/rule-22";
  return (
    <div className="flex min-h-dvh flex-col bg-white p-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <main className="flex flex-1 flex-col items-center justify-center gap-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Elementary cellular automata
        </h1>

        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/30">
          <Rule22 />
        </div>
      </main>

      <footer className="py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <div className="text-center">
            <span>Created by Paul Balogh</span>
            <span className="mx-2 text-slate-300 dark:text-slate-700">•</span>
            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-slate-600 underline-offset-4 hover:underline dark:text-slate-300"
            >
              GitHub repository
            </a>
          </div>

          <ThemeSwitcher />
        </div>
      </footer>
    </div>
  );
}

export default App;
