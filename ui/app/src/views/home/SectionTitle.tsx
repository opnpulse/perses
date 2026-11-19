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

import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ReactElement, ReactNode } from 'react';

interface SectionTitleProps {
  icon: ReactNode;
  title: string;
}

// The heading of a landing-page card: a soft primary icon tile next to the title, as in cluster-ui.
export function SectionTitle({ icon, title }: SectionTitleProps): ReactElement {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Box
        aria-hidden="true"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          flexShrink: 0,
          borderRadius: '10px',
          color: 'primary.main',
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
          '& .MuiSvgIcon-root': { fontSize: 18 },
        }}
      >
        {icon}
      </Box>
      <Typography component="h2" sx={{ fontSize: 17, fontWeight: 600, lineHeight: '24px' }}>
        {title}
      </Typography>
    </Box>
  );
}
