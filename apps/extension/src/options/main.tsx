import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/index.css';

function OptionsApp() {
  return (
    <div className="min-h-screen bg-surface-base p-8">
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent-primary/20 flex items-center justify-center animate-pulse-glow">
            <span className="text-lg font-bold text-gradient-primary">N</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Neuro-Nav Settings</h1>
            <p className="text-xs text-text-tertiary">The Developer's Micro-OS</p>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">General</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-primary">Auto-Pruning</p>
                <p className="text-xs text-text-tertiary">Clean history older than 30 days</p>
              </div>
              <label className="relative inline-flex cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 bg-surface-hover rounded-full peer peer-checked:bg-accent-primary transition-colors peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-primary">Retention Period</p>
                <p className="text-xs text-text-tertiary">Days to keep history data</p>
              </div>
              <input type="number" defaultValue={30} min={1} max={365} className="w-16 bg-surface-overlay border border-border-subtle rounded-md px-2 py-1 text-sm text-text-primary text-center outline-none focus:border-accent-primary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OptionsApp />
  </StrictMode>
);
