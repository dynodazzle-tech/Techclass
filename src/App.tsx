/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';

import { HomePage } from './pages/HomePage';
import { CoursesPage } from './pages/CoursesPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { TestsPage } from './pages/TestsPage';
import { TestEnginePage } from './pages/TestEnginePage';
import { TestResultPage } from './pages/TestResultPage';
import { LibraryPage } from './pages/LibraryPage';
import { ReaderPage } from './pages/ReaderPage';
import { PricingPage } from './pages/PricingPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { AuthPage } from './pages/AuthPages';
import { StaticPage } from './pages/StaticPages';

function RouterApp() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || '/');

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (path !== currentPath) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo(0, 0);
    }
  };

  // Route matching
  const renderRoute = () => {
    // Exact routes
    if (currentPath === '/' || currentPath === '') {
      return <HomePage navigate={navigate} />;
    }
    if (currentPath === '/courses') {
      return <CoursesPage navigate={navigate} />;
    }
    if (currentPath.startsWith('/course/')) {
      const courseId = currentPath.replace('/course/', '');
      return <CourseDetailPage courseId={courseId} navigate={navigate} />;
    }
    if (currentPath === '/tests') {
      return <TestsPage navigate={navigate} />;
    }
    if (currentPath.startsWith('/test/') && currentPath.includes('/result')) {
      const pathOnly = currentPath.split('?')[0];
      const parts = pathOnly.split('/');
      const testId = parts[2] || '';
      let queryAttemptId: string | undefined;
      try {
        const url = new URL(window.location.href);
        queryAttemptId = url.searchParams.get('attemptId') || undefined;
      } catch (e) {}
      const pathAttemptId = parts[4] || undefined;
      return <TestResultPage testId={testId} attemptId={queryAttemptId || pathAttemptId} navigate={navigate} />;
    }
    if (currentPath.startsWith('/attempt/') || currentPath.startsWith('/result/')) {
      const parts = currentPath.split('?')[0].split('/');
      const attemptId = parts[2];
      return <TestResultPage testId="" attemptId={attemptId} navigate={navigate} />;
    }
    if (currentPath.startsWith('/test/')) {
      const testId = currentPath.replace('/test/', '');
      return <TestEnginePage testId={testId} navigate={navigate} />;
    }
    if (currentPath === '/library') {
      return <LibraryPage navigate={navigate} />;
    }
    if (currentPath.startsWith('/reader/')) {
      const pdfId = currentPath.replace('/reader/', '');
      return <ReaderPage pdfId={pdfId} navigate={navigate} />;
    }
    if (currentPath === '/pricing') {
      return <PricingPage navigate={navigate} />;
    }
    if (currentPath === '/dashboard') {
      return <DashboardPage navigate={navigate} />;
    }
    if (currentPath === '/admin') {
      return <AdminPage navigate={navigate} />;
    }
    if (currentPath === '/login') {
      return <AuthPage mode="LOGIN" navigate={navigate} />;
    }
    if (currentPath === '/register') {
      return <AuthPage mode="REGISTER" navigate={navigate} />;
    }
    if (currentPath === '/forgot-password') {
      return <AuthPage mode="FORGOT" navigate={navigate} />;
    }
    if (currentPath === '/about') {
      return <StaticPage page="ABOUT" navigate={navigate} />;
    }
    if (currentPath === '/contact') {
      return <StaticPage page="CONTACT" navigate={navigate} />;
    }
    if (currentPath === '/terms') {
      return <StaticPage page="TERMS" navigate={navigate} />;
    }
    if (currentPath === '/privacy') {
      return <StaticPage page="PRIVACY" navigate={navigate} />;
    }
    if (currentPath === '/refund-policy') {
      return <StaticPage page="REFUND" navigate={navigate} />;
    }

    // Default fallback to HomePage
    return <HomePage navigate={navigate} />;
  };

  // Full-screen focused pages (test engine & document reader have their own dedicated toolbars)
  const isFullScreenMode = currentPath.startsWith('/test/') && !currentPath.includes('/result') || currentPath.startsWith('/reader/');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {!isFullScreenMode && <Header currentPath={currentPath} navigate={navigate} />}
      <main className="flex-1 flex flex-col">
        {renderRoute()}
      </main>
      {!isFullScreenMode && <Footer navigate={navigate} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <RouterApp />
      </LanguageProvider>
    </AuthProvider>
  );
}
