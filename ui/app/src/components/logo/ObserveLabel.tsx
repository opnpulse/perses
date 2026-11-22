// Copyright 2023 The Perses Authors
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

import { ReactElement } from 'react';
import { alpha, Box } from '@mui/material';
import { acPrimaryStrong } from '../../utils/ac-tokens';

// Product tag next to the logo, matching the design system's AcProductTag (the "CONSOLE" tag in cluster-ui):
// h-5 rounded-6 border border-primary/25 bg-primary/10 px-1.5 text-sm font-semibold tracking-wide
// text-primary-strong uppercase.
function ObserveLabel(): ReactElement {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        height: 20,
        flexShrink: 0,
        alignItems: 'center',
        px: '6px',
        borderRadius: '6px',
        border: '1px solid',
        borderColor: (theme) => alpha(theme.palette.primary.main, 0.25),
        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
        color: (theme) => acPrimaryStrong(theme),
        fontSize: '11px',
        lineHeight: 1,
        fontWeight: 600,
        letterSpacing: '0.025em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      Observe
    </Box>
  );
}

export default ObserveLabel;
