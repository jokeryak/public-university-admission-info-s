import React from 'react';
import { User } from 'firebase/auth';
import { FileSpreadsheet, LogOut, CheckCircle2, Globe2 } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  lang: 'bn' | 'en';
  onToggleLang: () => void;
  activeSheetUrl?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogin,
  onLogout,
  isLoggingIn,
  lang,
  onToggleLang,
  activeSheetUrl,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight">
                {lang === 'bn' ? 'ভর্তি সার্কুলার টু শিট' : 'Admission Circular Sync'}
              </span>
              <span className="text-xs text-slate-500 hidden sm:inline">
                {lang === 'bn' ? 'অ্যাডমিশন ডেট ও ফি এক্সট্রাক্টর' : 'AI University Circular & Fee Extractor'}
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation & Status Indicators */}
          <div className="hidden md:flex items-center gap-5 text-sm text-slate-600">
            {activeSheetUrl && (
              <a
                href={activeSheetUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-emerald-800 hover:text-emerald-950 font-medium transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'গুগল শিট সংযুক্ত' : 'Google Sheet Connected'}</span>
              </a>
            )}

            <button
              onClick={onToggleLang}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              title="Change Language"
            >
              <Globe2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>
          </div>

          {/* Zone 3: Authentication & Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full border border-slate-300 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-semibold text-xs">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-medium text-slate-800 max-w-[130px] truncate hidden sm:inline">
                    {user.displayName || user.email}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  title={lang === 'bn' ? 'সাইন আউট করুন' : 'Sign out'}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                disabled={isLoggingIn}
                className="gsi-material-button"
                title={lang === 'bn' ? 'গুগল অ্যাকাউন্ট দিয়ে সাইন ইন করুন' : 'Sign in with Google'}
              >
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span>
                    {isLoggingIn
                      ? lang === 'bn' ? 'সংযোগ হচ্ছে...' : 'Connecting...'
                      : lang === 'bn' ? 'গুগল দিয়ে সাইন ইন' : 'Sign in with Google'}
                  </span>
                </div>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
