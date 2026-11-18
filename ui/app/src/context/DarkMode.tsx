// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, { createContext, ReactElement, useContext, useEffect, useMemo } from 'react';
import { createTheme, CssBaseline, Theme, ThemeProvider, useMediaQuery } from '@mui/material';
import {
  ChartsProvider,
  generateChartsTheme,
  PersesChartsTheme,
  getTheme,
  useLocalStorage,
} from '@perses-dev/components';
import { TOGGLE_THEME_EVENT } from '@openpulse/shared/dashboards/src/keyboard-shortcuts/events';
import { useBranding } from '../model/branding-client';

// app specific echarts option overrides, empty since perses uses default
// https://apache.github.io/echarts-handbook/en/concepts/style/#theme
const ECHARTS_THEME_OVERRIDES = {};

const DARK_MODE_PREFERENCE_KEY = 'PERSES_ENABLE_DARK_MODE';

// AppsCode brand green, used by kubedb-ui when the branding API doesn't provide a primary color.
const DEFAULT_BRAND_PRIMARY_COLOR = '#00994A';

interface DarkModeContext {
  isDarkModeEnabled: boolean;
  setDarkMode: (pref: boolean) => void;
}

export const DarkModeContext = createContext<DarkModeContext | undefined>(undefined);

/**
 * Acts as theme provider for MUI and allows switching to dark mode.
 */
export function DarkModeContextProvider(props: { children: React.ReactNode }): ReactElement {
  const browserPrefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const [isDarkModeEnabled, setDarkMode] = useLocalStorage<boolean>(DARK_MODE_PREFERENCE_KEY, browserPrefersDarkMode);

  useEffect(() => {
    const handleToggleTheme = (): void => {
      setDarkMode(!isDarkModeEnabled);
    };

    window.addEventListener(TOGGLE_THEME_EVENT, handleToggleTheme);
    return (): void => {
      window.removeEventListener(TOGGLE_THEME_EVENT, handleToggleTheme);
    };
  }, [isDarkModeEnabled, setDarkMode]);

  // store the dark mode preference in local storage
  const darkModeContext: DarkModeContext = useMemo(
    () => ({
      isDarkModeEnabled,
      setDarkMode,
    }),
    [isDarkModeEnabled, setDarkMode]
  );

  // The platform branding API decides the primary color, the same way cluster-ui and kubedb-ui do.
  const { data: branding } = useBranding();
  const brandPrimaryColor = branding?.primaryColor || DEFAULT_BRAND_PRIMARY_COLOR;

  const theme = useMemo(
    () => withBrandPrimaryColor(getTheme(isDarkModeEnabled ? 'dark' : 'light'), brandPrimaryColor),
    [isDarkModeEnabled, brandPrimaryColor]
  );
  const chartsTheme: PersesChartsTheme = useMemo(() => {
    return generateChartsTheme(theme, { echartsTheme: ECHARTS_THEME_OVERRIDES });
  }, [theme]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme={true} />
      <ChartsProvider chartsTheme={chartsTheme} enablePinning={true}>
        <DarkModeContext.Provider value={darkModeContext}>{props.children}</DarkModeContext.Provider>
      </ChartsProvider>
    </ThemeProvider>
  );
}

/**
 * Overrides the primary (and info, which Perses aliases to primary) palette with the branding color.
 * Falls back to the default Perses palette when the color is missing or not parseable.
 */
function withBrandPrimaryColor(baseTheme: Theme, primaryColor?: string): Theme {
  if (!primaryColor) {
    return baseTheme;
  }
  try {
    const brand = baseTheme.palette.augmentColor({ color: { main: primaryColor } });
    return createTheme(baseTheme, { palette: { primary: brand, info: brand } });
  } catch {
    return baseTheme;
  }
}

export function useDarkMode(): DarkModeContext {
  const ctx = useContext(DarkModeContext);
  if (ctx === undefined) {
    throw new Error('No DarkModeContext found. Did you forget a Provider?');
  }
  return ctx;
}
