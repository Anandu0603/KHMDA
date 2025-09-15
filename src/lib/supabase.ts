import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const displayError = (title: string, message: string, currentValue?: string) => {
  document.body.innerHTML = `<div style="padding: 2rem; font-family: sans-serif; background-color: #fef2f2; color: #991b1b; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; border: 4px solid #f87171;">
    <div style="max-width: 600px;">
      <h2 style="font-size: 1.5rem; margin-bottom: 1rem; font-weight: bold;">${title}</h2>
      <p style="margin-bottom: 1.5rem;">${message}</p>
      ${currentValue !== undefined ? `<p style="margin-bottom: 1.5rem; font-family: monospace; background-color: #fee2e2; padding: 0.5rem; border-radius: 0.25rem;"><b>Current value:</b> ${currentValue || 'Not Found'}</p>` : ''}
      <div style="background-color: #fffbeb; border: 1px solid #fde68a; padding: 1rem; border-radius: 0.5rem; color: #92400e;">
        <h3 style="font-weight: bold; margin-bottom: 0.5rem;">Action Required</h3>
        <p>After adding or changing values in the <code>.env</code> file, you <strong>must restart the development server</strong> for the changes to apply.</p>
      </div>
    </div>
  </div>`;
};

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  const errorMessage = 
    'VITE_SUPABASE_URL is missing or invalid in your .env file. ' +
    'It must be a complete URL starting with "https://".';
  
  displayError('Supabase Configuration Error', errorMessage, supabaseUrl);
  throw new Error('Configuration Error: ' + errorMessage);
}

if (!supabaseAnonKey) {
  const errorMessage = 'VITE_SUPABASE_ANON_KEY is missing in your .env file.';
  displayError('Supabase Configuration Error', errorMessage);
  throw new Error('Configuration Error: ' + errorMessage);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
