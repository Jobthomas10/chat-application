import { createTheme } from '@mui/material/styles';

export const getTheme = (mode) => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#818cf8' : '#4f46e5', // Indigo
        light: isDark ? '#a5b4fc' : '#6366f1',
        dark: isDark ? '#4f46e5' : '#3730a3',
      },
      secondary: {
        main: isDark ? '#22d3ee' : '#0891b2', // Cyan
        light: isDark ? '#67e8f9' : '#06b6d4',
        dark: isDark ? '#0891b2' : '#0e7490',
      },
      background: {
        default: isDark ? '#0f172a' : '#f8fafc', // slate-900 / slate-50
        paper: isDark ? '#1e293b' : '#ffffff', // slate-800 / white
        chat: isDark ? '#0b0f19' : '#f1f5f9', // custom chat container background
      },
      text: {
        primary: isDark ? '#f8fafc' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#475569',
      },
      divider: isDark ? '#334155' : '#e2e8f0', // slate-700 / slate-200
    },
    typography: {
      fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 500 },
      body1: { fontSize: '0.95rem', lineHeight: 1.5 },
      body2: { fontSize: '0.875rem', lineHeight: 1.43 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          containedPrimary: {
            background: isDark 
              ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' 
              : 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
            '&:hover': {
              background: isDark 
                ? 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)' 
                : 'linear-gradient(135deg, #3730a3 0%, #2e2882 100%)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          elevation1: {
            boxShadow: isDark 
              ? '0 4px 6px -1px rgb(0 0 0 / 0.2), 0 2px 4px -2px rgb(0 0 0 / 0.2)' 
              : '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
            border: `1px solid ${isDark ? '#334155' : '#f1f5f9'}`,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? '#475569' : '#cbd5e1',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: '1.5px',
            },
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: isDark ? '#334155 #0f172a' : '#cbd5e1 #f8fafc',
            '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
              width: 8,
              height: 8,
            },
            '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
              background: isDark ? '#0f172a' : '#f8fafc',
            },
            '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
              backgroundColor: isDark ? '#334155' : '#cbd5e1',
              borderRadius: 4,
              border: `2px solid ${isDark ? '#0f172a' : '#f8fafc'}`,
            },
            '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
              backgroundColor: isDark ? '#475569' : '#94a3b8',
            },
          },
        },
      },
    },
  });
};
