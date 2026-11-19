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

// Product tag next to the logo, tinted with the branding primary color like the sibling AppsCode UIs.
function ObserveLabel(): ReactElement {
  return (
    <Box
      sx={{
        fontSize: '12px',
        lineHeight: '20px',
        px: 1,
        fontWeight: 600,
        letterSpacing: '0.06em',
        color: 'primary.main',
        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
        borderRadius: '6px',
      }}
    >
      OBSERVE
    </Box>
  );
}

export default ObserveLabel;
