import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Mail, 
  Lock, 
  Check, 
  ShieldCheck, 
  User as UserIcon, 
  Eye, 
  EyeOff,
  ArrowRight,
  Building,
  KeyRound,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useVault } from '../context/VaultContext.tsx';
import { Role } from '../types/index.ts';

interface SignInViewProps {
  initialMode?: 'signin' | 'signup';
}

export const SignInView: React.FC<SignInViewProps> = () => {
  const { 
    loginWithEmail, 
    registerUser, 
    authViewMode, 
    setAuthViewMode,
    signupSuccessNotice,
    setSignupSuccessNotice,
    prefillEmail
  } = useVault();
  const mode = authViewMode;
  const setMode = setAuthViewMode;

  // Sign In state - clean empty slate
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Sync prefill email if coming from registration
  useEffect(() => {
    if (prefillEmail) {
      setLoginEmail(prefillEmail);
    }
  }, [prefillEmail]);

  // Sign Up state - clean empty slate
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [department, setDepartment] = useState('Core Infrastructure');
  const [selectedRole, setSelectedRole] = useState<Role>('owner');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeAuditPolicy, setAgreeAuditPolicy] = useState(true);
  const [signupError, setSignupError] = useState('');
  const [loginError, setLoginError] = useState('');

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'Enter password', color: 'bg-slate-200' };
    if (pwd.length < 6) return { score: 1, label: 'Weak (min 6 chars)', color: 'bg-rose-500' };
    let score = 2;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    if (pwd.length >= 10) score += 1;

    if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score <= 4) return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
    return { score: 4, label: 'Enterprise Grade', color: 'bg-blue-600' };
  };

  const strength = getPasswordStrength(signupPassword);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail.trim()) {
      setLoginError('Please enter your work email address');
      return;
    }
    if (!loginPassword) {
      setLoginError('Please enter your master password');
      return;
    }

    const result = await loginWithEmail(loginEmail, loginPassword);
    if (!result.success) {
      if (result.error === 'not_found') {
        setLoginError('No account found with this email. New users must first Sign Up before signing in.');
      } else if (result.error === 'invalid_password') {
        setLoginError('Incorrect password. Please verify your master password and try again.');
      } else {
        setLoginError(result.message || 'Unable to sign in. Please verify your credentials or sign up.');
      }
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    if (!name.trim()) {
      setSignupError('Please enter your full name');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setSignupError('Please enter a valid work email address');
      return;
    }
    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters');
      return;
    }
    if (signupPassword !== confirmPassword) {
      setSignupError('Passwords do not match');
      return;
    }
    if (!agreeAuditPolicy) {
      setSignupError('You must acknowledge the immutable audit logging policy');
      return;
    }

    const result = await registerUser({
      name: name.trim(),
      email: signupEmail.trim(),
      role: selectedRole,
      department: department,
      password: signupPassword
    });

    if (!result.success) {
      setSignupError(result.message || 'Unable to register user.');
    } else {
      setSignupPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-slate-900/95 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-slate-800/40">
        
        {/* Left Side: Brand Banner matching screenshot */}
        <div className="relative bg-gradient-to-b from-sky-950 via-slate-950 to-blue-950 p-8 sm:p-10 text-white flex flex-col justify-between overflow-hidden">
          {/* Cybernetic background glow & circuit lines */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Brand Lockup */}
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center mb-6 shadow-xl shadow-sky-500/30">
              <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <rect x="9" y="11" width="6" height="5" rx="1" />
                <path d="M10 11V9a2 2 0 1 1 4 0v2" />
              </svg>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              TrustVault
            </h2>
            <p className="text-slate-300 text-sm font-medium leading-relaxed max-w-xs">
              {mode === 'signin' 
                ? 'Secure Document Sharing with a Real Audit Trail' 
                : 'Zero-Trust Workspace Enrollment with Hardware Hash Verification'}
            </p>
          </div>

          {/* Core Feature Checkmarks matching screenshot */}
          <div className="relative z-10 my-6 sm:my-8 space-y-3.5">
            <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-slate-200">
              <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-400/30">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
              <span>Role-Based Access</span>
            </div>

            <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-slate-200">
              <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-400/30">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
              <span>Granular Permissions</span>
            </div>

            <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-slate-200">
              <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-400/30">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
              <span>Complete Audit Log</span>
            </div>

            <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-slate-200">
              <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-400/30">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
              <span>Enterprise-Grade Security</span>
            </div>
          </div>

          {/* Cyber Shield Circuit Motif at Bottom matching screenshot */}
          <div className="relative z-10 flex items-center justify-center pt-2">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-sky-500/20 animate-pulse" />
              <div className="w-16 h-16 rounded-full bg-sky-950/60 border border-sky-500/40 flex items-center justify-center shadow-inner">
                <Shield className="w-8 h-8 text-sky-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form View (Sign In OR Sign Up) */}
        <div className="p-6 sm:p-10 flex flex-col justify-between bg-white overflow-y-auto max-h-[92vh]">
          <div>
            {/* Top Switcher Segmented Control */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* MODE: SIGN IN */}
            {mode === 'signin' ? (
              <div>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                    Sign In
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Access your secure workspace
                  </p>
                </div>

                {/* Account creation success banner */}
                {signupSuccessNotice && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-emerald-950 leading-snug">{signupSuccessNotice}</p>
                    </div>
                  </div>
                )}

                {/* Login error banner with direct Sign Up CTA */}
                {loginError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium space-y-2 animate-in fade-in">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <p className="leading-snug">{loginError}</p>
                    </div>
                    {loginError.includes('Sign Up') && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSignupError('');
                            setLoginError('');
                            setSignupEmail(loginEmail);
                            setMode('signup');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                        >
                          <span>Enroll New Account (Sign Up)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Remember me & Forgot password */}
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <span>Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => alert('Password reset verification link sent to your registered address.')}
                      className="text-blue-600 hover:text-blue-700 font-medium hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Login Button matching screenshot */}
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                  >
                    <span>Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* 'or' quick role buttons matching screenshot */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-slate-400 font-medium">or</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('harshavdugga@gmail.com');
                      setLoginPassword('Harsha@1122');
                      setLoginError('');
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('owner@trustvault.internal');
                      setLoginPassword('Owner@TrustVault2026!');
                      setLoginError('');
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer shadow-2xs"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Owner</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('viewer@trustvault.internal');
                      setLoginPassword('Viewer@TrustVault2026!');
                      setLoginError('');
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-purple-600" />
                    <span>Viewer</span>
                  </button>
                </div>

                {/* Switch link */}
                <div className="mt-5 text-center text-xs text-slate-500">
                  Don't have an enterprise account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            ) : (
              /* MODE: SIGN UP */
              <div>
                <div className="text-center mb-5">
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                    Create Account
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enroll your secure identity in the TrustVault cluster
                  </p>
                </div>

                {signupError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium space-y-2 animate-in fade-in">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <p className="leading-snug">{signupError}</p>
                    </div>
                    {signupError.includes('already registered') && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setLoginEmail(signupEmail);
                            setLoginError('');
                            setSignupError('');
                            setMode('signin');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                        >
                          <span>Go to Login</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Work Email Address */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Work Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="Enter your work email address"
                        className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Department / Organization
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="w-4 h-4 text-slate-400" />
                      </div>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <option value="Core Infrastructure">Core Infrastructure</option>
                        <option value="Product Operations">Product Operations</option>
                        <option value="Financial Auditing">Financial Auditing</option>
                        <option value="InfoSec & Security">InfoSec &amp; Security</option>
                        <option value="Legal & Compliance">Legal &amp; Compliance</option>
                        <option value="Executive Engineering">Executive Engineering</option>
                      </select>
                    </div>
                  </div>

                  {/* Role Clearance Selection (Owner & Viewer only) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Select Role Clearance
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedRole('owner')}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                          selectedRole === 'owner'
                            ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold text-slate-900">Owner</span>
                          {selectedRole === 'owner' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          Full control: Upload files &amp; set access only by your choice
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRole('viewer')}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                          selectedRole === 'viewer'
                            ? 'border-purple-500 bg-purple-50/60 ring-2 ring-purple-500/20'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold text-slate-900">Viewer</span>
                          {selectedRole === 'viewer' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          Auditor: Can only access documents explicitly chosen by owner
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Password & Confirm */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Master Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full pr-8 pl-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(prev => !prev)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full px-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Password strength bar */}
                  {signupPassword && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Entropy: <strong className="text-slate-800">{strength.label}</strong></span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${strength.color} transition-all duration-300`}
                          style={{ width: `${(strength.score / 4) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Checkbox: Audit Trail Agreement */}
                  <label className="flex items-start gap-2 pt-1 text-xs text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreeAuditPolicy}
                      onChange={(e) => setAgreeAuditPolicy(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-[11px] leading-snug">
                      I agree to the <strong className="text-slate-900">Enterprise Security Policy</strong> and acknowledge that all session actions are recorded in the immutable audit ledger.
                    </span>
                  </label>

                  {/* Create Account Button */}
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer pt-2"
                  >
                    <span>Create Secure Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Switch link */}
                <div className="mt-4 text-center text-xs text-slate-500">
                  Already enrolled?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer matching screenshot */}
          <div className="text-center pt-6 text-[11px] text-slate-400">
            TrustVault © 2026 · Zero-Trust Cryptographic Core
          </div>
        </div>
      </div>
    </div>
  );
};
