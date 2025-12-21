import { Rule22 } from "./Rule22";
import { ThemeSwitcher } from "./ThemeSwitcher";

function App() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-white px-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="absolute right-4 top-4">
        <ThemeSwitcher />
      </div>

      <h1 className="text-3xl font-semibold tracking-tight">Rule 22</h1>

      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/30">
        <Rule22 />
      </div>
    </div>
  );
}

export default App;
