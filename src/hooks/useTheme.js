// hooks/useTheme.js
import { useSelector, useDispatch } from 'react-redux';
import { selectTheme, toggleTheme, setTheme } from '@/store/slices/uiSlice';
import { useEffect } from 'react';

export function useTheme() {
  const dispatch = useDispatch();
  const theme    = useSelector(selectTheme);

  // Sync CSS class on mount and when theme changes
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  return {
    theme,
    isDark:  theme === 'dark',
    isLight: theme === 'light',
    toggle:  () => dispatch(toggleTheme()),
    setDark: () => dispatch(setTheme('dark')),
    setLight:() => dispatch(setTheme('light')),
  };
}