import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Modular Input Component
const Input = ({ 
  type, 
  placeholder, 
  value, 
  onChange, 
  autoFocus 
}: {
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
}) => (
  <input
    type={type}
    autoFocus={autoFocus}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className="
      w-full px-4 py-3 rounded-lg
      bg-white/5 border border-white/10
      text-white text-sm
      placeholder:text-white/30
      outline-none
      focus:border-white/30 focus:bg-white/[0.07]
      transition-all duration-200
    "
  />
);

// Modular Button Component
const Button = ({ 
  children, 
  disabled, 
  type = 'button',
  variant = 'primary',
  onClick
}: {
  children: React.ReactNode;
  disabled?: boolean;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}) => {
  const baseStyles = `
    w-full py-3 rounded-xl
    text-sm font-semibold
    transition-all duration-200
    disabled:opacity-40
    disabled:cursor-not-allowed
  `;
  
  const variantStyles = variant === 'primary'
    ? 'bg-white text-black hover:bg-white/90'
    : 'bg-white/5 text-white border border-white/10 hover:bg-white/10';

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles}`}
    >
      {children}
    </button>
  );
};

// Modular Error Alert
const ErrorAlert = ({ message }: { message: string }) => (
  <div className="
    px-4 py-3 rounded-lg
    bg-red-500/10 border border-red-500/20
    text-sm text-red-400
  ">
    {message}
  </div>
);

// Modular Header
const AuthHeader = ({ mode }: { mode: 'signin' | 'signup' }) => (
  <div className="space-y-2">
    <h2 className="text-2xl font-semibold text-white">
      {mode === 'signin' ? 'Welcome back' : 'Get started'}
    </h2>
    <p className="text-sm text-white/50 leading-relaxed">
      {mode === 'signin'
        ? 'Sign in to continue where you left off.'
        : 'Create an account to start building with focus.'}
    </p>
  </div>
);

// Modular Footer Toggle
const AuthToggle = ({ 
  mode, 
  onSwitch 
}: { 
  mode: 'signin' | 'signup'; 
  onSwitch: (mode: 'signin' | 'signup') => void;
}) => (
  <p className="text-xs text-white/40 text-center">
    {mode === 'signin' ? (
      <>
        New to Kylo?{' '}
        <button
          type="button"
          onClick={() => onSwitch('signup')}
          className="text-white/70 underline underline-offset-2 hover:text-white transition-colors"
        >
          Create an account
        </button>
      </>
    ) : (
      <>
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => onSwitch('signin')}
          className="text-white/70 underline underline-offset-2 hover:text-white transition-colors"
        >
          Sign in
        </button>
      </>
    )}
  </p>
);

// Claude Logo SVG
const ClaudeLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
    <path d="M17.5 12.5c-1.5 3.5-4 5.5-7.5 5.5-4 0-7-3-7-7s3-7 7-7c3.5 0 6 2 7.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="10" cy="11" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

// OpenAI Logo SVG
const OpenAILogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
  </svg>
);

// Google Gemini Logo
const GeminiLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.82 8 12 11.82 4.18 8 12 4.18zM4 9.47l7 3.5v7.86l-7-3.5V9.47zm16 0v7.86l-7 3.5v-7.86l7-3.5z"/>
  </svg>
);

// Anthropic A Logo
const AnthropicLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M14.5 3h3l6.5 18h-3.5l-1.5-4.5h-7L10.5 21H7L13.5 3h1zm.5 3.5L12.5 13h4.5l-2.5-6.5z"/>
  </svg>
);

// Mistral Logo
const MistralLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.82L18.09 8 12 11.18 5.91 8 12 4.82zM4 9.82l7 3.5v6.86l-7-3.5V9.82zm16 0v6.86l-7 3.5v-6.86l7-3.5z"/>
    <rect x="10" y="10" width="4" height="6" rx="1"/>
  </svg>
);

// AI Brand Logo Component
const AIBrandLogo = ({ 
  children, 
  label, 
  delay 
}: { 
  children: React.ReactNode; 
  label: string;
  delay: number;
}) => (
  <div 
    className="group relative flex flex-col items-center gap-2"
    style={{ animationDelay: `${delay}s` }}
  >
    <div className="
      w-12 h-12 rounded-full
      bg-white/5 border border-white/10
      flex items-center justify-center
      text-white/60
      group-hover:bg-white/10 group-hover:border-white/20 group-hover:text-white/90
      group-hover:scale-110
      transition-all duration-300
      p-2.5
    ">
      {children}
    </div>
    <span className="text-[10px] text-white/30 group-hover:text-white/50 transition-colors">
      {label}
    </span>
  </div>
);

// Rotating AI Brands Showcase
const AIBrandsShowcase = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const brands = [
    { logo: <ClaudeLogo />, label: 'Claude' },
    { logo: <OpenAILogo />, label: 'OpenAI' },
    { logo: <GeminiLogo />, label: 'Gemini' },
    { logo: <AnthropicLogo />, label: 'Anthropic' },
    { logo: <MistralLogo />, label: 'Mistral' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % brands.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="py-8 px-6 sm:px-8">
      <div className="text-center mb-6">
        <p className="text-xs text-white/40">Powered by leading AI models</p>
      </div>
      
      <div className="flex items-center justify-center gap-4 overflow-hidden">
        {brands.map((brand, index) => (
          <div
            key={index}
            className={`
              transition-all duration-500
              ${index === currentIndex 
                ? 'opacity-100 scale-100' 
                : 'opacity-40 scale-90'
              }
            `}
          >
            <AIBrandLogo delay={index * 0.1} label={brand.label}>
              {brand.logo}
            </AIBrandLogo>
          </div>
        ))}
      </div>
      
      {/* Indicator dots */}
      <div className="flex justify-center gap-1.5 mt-6">
        {brands.map((_, index) => (
          <div
            key={index}
            className={`
              w-1 h-1 rounded-full transition-all duration-300
              ${index === currentIndex 
                ? 'bg-white/60 w-4' 
                : 'bg-white/20'
              }
            `}
          />
        ))}
      </div>
    </div>
  );
};

// Main Auth Screen Component
export const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim() && password.trim() && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    const { error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  const switchMode = (next: 'signin' | 'signup') => {
    setMode(next);
    setError(null);
    setPassword('');
  };

  return (
    <div className="h-full w-full bg-[#0B0D10] flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 gap-6">
      <div className="w-full max-w-[440px]">
        <form
          onSubmit={handleSubmit}
          className="
            w-full
            bg-[#0B0D10]/95
            backdrop-blur-xl
            border border-white/10
            rounded-2xl
            shadow-2xl
            overflow-hidden
          "
        >
          {/* App Branding */}
          <div className="px-6 sm:px-8 py-5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-[#EDEDED] tracking-tight">Kylo</h1>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
            </div>
            <p className="text-xs text-white/40 mt-1">
              Your personal execution layer
            </p>
          </div>

          {/* Auth Form Body */}
          <div className="px-6 sm:px-8 py-8 space-y-6">
            <AuthHeader mode={mode} />

            {/* Input Fields */}
            <div className="space-y-3">
              <Input
                type="email"
                autoFocus
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Error Message */}
            {error && <ErrorAlert message={error} />}
          </div>

          {/* Footer Actions */}
          <div className="px-6 sm:px-8 pb-6 space-y-4">
            <Button
              type="submit"
              disabled={!canSubmit}
              variant="primary"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                      fill="none"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Please wait…
                </span>
              ) : (
                mode === 'signin' ? 'Sign in' : 'Sign up & get started'
              )}
            </Button>

            <AuthToggle mode={mode} onSwitch={switchMode} />
          </div>

          {/* App Footer */}
          <div className="px-6 sm:px-8 py-4 border-t border-white/5 text-xs text-white/30 text-center">
            Kylo · Private preview
          </div>
        </form>
      </div>

      {/* AI Brands Showcase - Outside the form box */}
      <div className="w-full max-w-[440px]">
        <AIBrandsShowcase />
      </div>
    </div>
  );
};