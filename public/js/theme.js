/**
 * AutoBuyCars - Theme Manager (Dark & Light Mode)
 * Mendukung deteksi sistem operasi (prefers-color-scheme), 
 * persistensi localStorage, dan sinkronisasi instan ke seluruh komponen UI.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'theme';

  function getPreferredTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    updateToggleIcons(isDark);
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme, isDark } }));
  }

  function updateToggleIcons(isDark) {
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.setAttribute('aria-label', isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap');
      btn.setAttribute('title', isDark ? 'Mode Terang' : 'Mode Gelap');

      const sunIcon = btn.querySelector('[data-theme-icon="sun"]');
      const moonIcon = btn.querySelector('[data-theme-icon="moon"]');
      const textLabel = btn.querySelector('[data-theme-text]');

      if (sunIcon && moonIcon) {
        if (isDark) {
          sunIcon.classList.remove('hidden');
          moonIcon.classList.add('hidden');
        } else {
          sunIcon.classList.add('hidden');
          moonIcon.classList.remove('hidden');
        }
      }

      if (textLabel) {
        textLabel.textContent = isDark ? 'Mode Terang' : 'Mode Gelap';
      }
    });
  }

  function toggleTheme() {
    const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  // Inisialisasi awal saat load
  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme);

  // Pasang event listener saat DOM siap
  document.addEventListener('DOMContentLoaded', () => {
    updateToggleIcons(document.documentElement.classList.contains('dark'));

    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.removeEventListener('click', toggleTheme);
      btn.addEventListener('click', toggleTheme);
    });
  });

  // Dengarkan perubahan prefers-color-scheme dari OS jika user belum memilih manual
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });

  // Ekspos ke global
  window.Theme = {
    get: getPreferredTheme,
    set: (t) => {
      localStorage.setItem(STORAGE_KEY, t);
      applyTheme(t);
    },
    toggle: toggleTheme,
    isDark: () => document.documentElement.classList.contains('dark'),
  };
})();
