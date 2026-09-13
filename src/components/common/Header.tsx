import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { SupportedLanguage } from '../../types';
import {
  BookOpen,
  GraduationCap,
  FileText,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Crown,
  Bell,
  ChevronDown,
  Sparkles,
  PhoneCall,
  Database
} from 'lucide-react';

interface HeaderProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPath, navigate }) => {
  const { user, logout, settings } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/courses', label: t('nav.courses') },
    { path: '/tests', label: t('nav.tests') },
    { path: '/library', label: t('nav.library') },
    { path: '/pricing', label: t('nav.pricing') },
    { path: '/about', label: t('nav.about') }
  ];

  const handleNav = (p: string) => {
    navigate(p);
    setMobileMenuOpen(false);
  };

  const isPaid = user?.membership_status === 'ACTIVE' || user?.role === 'PAID_STUDENT';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80">
      {/* Top micro announcement bar */}
      <div className="bg-gradient-to-r from-slate-950 via-cyan-950/40 to-slate-950 border-b border-cyan-900/30 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 text-slate-300">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              DynoDazzle EdTech
            </span>
            <button
              onClick={() => navigate('/admin')}
              className="hidden sm:inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
              title="Supabase Backend: Connected (Project ID: nuvxtpwgdlzeqsdnbnpx)"
            >
              <Database className="w-3 h-3 text-emerald-400" />
              <span>Supabase: nuvxtpwgdlzeqsdnbnpx</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>
            <span className="hidden lg:inline text-slate-400">
              Digital Classroom for UPSC, MPSC & SSC
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Language Selector */}
            <div className="relative">
              <button
                id="lang-select-button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center space-x-1 text-[11px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800"
              >
                <span>{language === 'en' ? 'English' : language === 'hi' ? 'हिन्दी' : 'मराठी'}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-1 w-28 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-xs">
                  <button
                    onClick={() => { setLanguage('en'); setLangDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-800 ${language === 'en' ? 'text-cyan-400 font-bold' : 'text-slate-300'}`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => { setLanguage('hi'); setLangDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-800 ${language === 'hi' ? 'text-cyan-400 font-bold' : 'text-slate-300'}`}
                  >
                    हिन्दी
                  </button>
                  <button
                    onClick={() => { setLanguage('mr'); setLangDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-800 ${language === 'mr' ? 'text-cyan-400 font-bold' : 'text-slate-300'}`}
                  >
                    मराठी
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNav('/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white">TECH<span className="text-cyan-400">CLASS</span></span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Gov Prep
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wide">A DynoDazzle Platform</p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const active = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => handleNav(link.path)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    active
                      ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* User & Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-2">
                {/* Admin button if admin */}
                {isAdmin && (
                  <button
                    onClick={() => handleNav('/admin')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin Panel</span>
                  </button>
                )}

                {/* Dashboard button */}
                <button
                  onClick={() => handleNav('/dashboard')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition shadow-sm ${
                    isPaid
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20'
                  }`}
                >
                  {isPaid ? <Crown className="w-4 h-4 text-emerald-400" /> : <UserIcon className="w-4 h-4 text-cyan-400" />}
                  <span>{user.student_id}</span>
                </button>

                {/* Logout */}
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleNav('/login')}
                  className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-900 transition"
                >
                  {t('nav.login')}
                </button>
                <button
                  onClick={() => handleNav('/register')}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold transition shadow-md shadow-cyan-500/20"
                >
                  {t('nav.register')}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center space-x-2">
            {user && (
              <button
                onClick={() => handleNav('/dashboard')}
                className="px-2.5 py-1 rounded bg-slate-900 text-cyan-300 border border-slate-800 text-xs font-mono"
              >
                {user.student_id}
              </button>
            )}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 pt-2 pb-6 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-base font-medium ${
                  currentPath === link.path ? 'bg-cyan-950/40 text-cyan-400 font-semibold' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                {link.label}
              </button>
            ))}
            {user && (
              <>
                <button
                  onClick={() => handleNav('/dashboard')}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-base font-medium text-emerald-300 hover:bg-slate-900 flex items-center space-x-2"
                >
                  <Crown className="w-4 h-4" />
                  <span>Student Dashboard ({user.student_id})</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleNav('/admin')}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-base font-medium text-amber-300 hover:bg-slate-900 flex items-center space-x-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin Command Center</span>
                  </button>
                )}
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-base font-medium text-red-400 hover:bg-slate-900 flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('nav.logout')}</span>
                </button>
              </>
            )}
          </div>

          {!user && (
            <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
              <button
                onClick={() => handleNav('/login')}
                className="w-full py-2.5 text-center text-sm font-semibold rounded-lg bg-slate-900 text-slate-200 border border-slate-800"
              >
                {t('nav.login')}
              </button>
              <button
                onClick={() => handleNav('/register')}
                className="w-full py-2.5 text-center text-sm font-semibold rounded-lg bg-cyan-500 text-slate-950"
              >
                {t('nav.register')}
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
