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

import { Theme } from '@mui/material';
import { alpha } from '@mui/material/styles';

// Surface, border and shadow values from the AppsCode design system (@ac-design/design-system),
// so the navbar and landing-page cards match cluster-ui and kubedb-ui. Perses' own `background.paper` is a bluish grey
// (#F0F1F6) in light mode, which makes tinted cards look darker than the design system's white.
const tokens = {
  light: {
    surface: '#ffffff',
    border: '#ebebeb',
    shadowXs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    shadowCard: '0 2px 4px rgb(15 23 42 / 0.04), 0 12px 24px -6px rgb(15 23 42 / 0.1)',
  },
  dark: {
    surface: '#171717',
    border: '#2e2f2f',
    shadowXs: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    shadowCard: '0 2px 4px rgb(0 0 0 / 0.3), 0 12px 24px -6px rgb(0 0 0 / 0.5)',
  },
};

export type AcTokens = (typeof tokens)['light'];

export function acTokens(theme: Theme): AcTokens {
  return theme.palette.mode === 'dark' ? tokens.dark : tokens.light;
}

/** The design system's `bg-linear-to-br from-primary/10 via-surface to-surface`. */
export function acPrimaryGradient(theme: Theme): string {
  const { surface } = acTokens(theme);
  return `linear-gradient(to bottom right, ${alpha(theme.palette.primary.main, 0.1)}, ${surface} 50%, ${surface})`;
}

export interface AcCardSx {
  bgcolor: (theme: Theme) => string;
  backgroundImage: 'none';
  border: '1px solid';
  borderColor: (theme: Theme) => string;
  borderRadius: string;
  boxShadow: 'none';
}

/** A plain design-system card: white surface, light border, rounded corners. */
export function acCardSx(radius: string = '16px'): AcCardSx {
  return {
    bgcolor: (theme: Theme) => acTokens(theme).surface,
    backgroundImage: 'none',
    border: '1px solid',
    borderColor: (theme: Theme) => acTokens(theme).border,
    borderRadius: radius,
    boxShadow: 'none',
  };
}
