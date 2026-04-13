// src/hooks/useTheme.js
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme, setTheme, selectTheme } from '@/store/slices/uiSlice';

export function useTheme() {
  const dispatch = useDispatch();
  const theme    = useSelector(selectTheme);

  // Sync DOM class on mount and whenever theme changes
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  return {
    theme,
    isDark:   theme === 'dark',
    isLight:  theme === 'light',
    toggle:   () => dispatch(toggleTheme()),
    setDark:  () => dispatch(setTheme('dark')),
    setLight: () => dispatch(setTheme('light')),
  };
}