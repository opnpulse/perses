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

import { Box, ButtonBase, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ReactElement } from 'react';
import ArrowRight from 'mdi-material-ui/ArrowRight';
import Check from 'mdi-material-ui/Check';
import Plus from 'mdi-material-ui/Plus';
import { useIsReadonly } from '../../context/Config';
import { GlobalProject, useHasPermission } from '../../context/Authorization';
import { acPrimaryGradient, acTokens } from './ac-tokens';

interface AddProjectCardProps {
  onClick: () => void;
  /** The empty list's version: spans the whole grid and centres its content. */
  large?: boolean;
}

const WAYS = ['Folders & dashboards', 'Datasources', 'Variables & secrets'];

// The last tile of the project grid, like cluster-ui's add-cluster tile: it invites the next
// project, says what a project holds, and leads to one action.
// Hidden when the user can't create projects, since a tile that does nothing only adds noise.
export function AddProjectCard({ onClick, large = false }: AddProjectCardProps): ReactElement | null {
  const isReadonly = useIsReadonly();
  const canCreate = useHasPermission('create', GlobalProject, 'Project');
  if (isReadonly || !canCreate) {
    return null;
  }

  return (
    <ButtonBase
      onClick={onClick}
      data-testid="add-project-tile"
      sx={{
        gridColumn: large ? '1 / -1' : undefined,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: large ? 'center' : 'stretch',
        justifyContent: 'space-between',
        textAlign: large ? 'center' : 'left',
        p: 2,
        py: large ? 5 : 2,
        borderRadius: '14px',
        border: '1px solid',
        borderColor: (theme) => alpha(theme.palette.primary.main, 0.25),
        background: acPrimaryGradient,
        transition: 'transform 200ms, border-color 200ms, box-shadow 200ms',
        '&:hover': {
          transform: 'translateY(-2px)',
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.5),
          boxShadow: (theme) => acTokens(theme).shadowCard,
        },
        '&:hover .add-project-plus': { transform: 'scale(1.05)' },
        '&:hover .add-project-arrow': { transform: 'translateX(4px)' },
        '&.Mui-disabled': { opacity: 0.5 },
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
          '&:hover': { transform: 'none' },
        },
      }}
    >
      {/* Soft glow top-right and a faded plus bottom-right */}
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 160,
          height: 160,
          borderRadius: '50%',
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <Plus
        aria-hidden="true"
        sx={{
          position: 'absolute',
          right: -20,
          bottom: -24,
          fontSize: 128,
          color: (theme) => alpha(theme.palette.primary.main, 0.05),
          pointerEvents: 'none',
        }}
      />

      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: large ? 'center' : 'stretch',
          width: '100%',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: large ? 2 : 1.5,
            flexDirection: large ? 'column-reverse' : 'row',
            alignItems: large ? 'center' : 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: large ? 24 : 18, lineHeight: large ? 1.3 : '24px' }}>
            {large ? 'Create your first project' : 'Create a new project'}
          </Typography>
          <Box
            aria-hidden="true"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: large ? 40 : 32,
              height: large ? 40 : 32,
              flexShrink: 0,
              borderRadius: '10px',
              color: 'primary.main',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
            }}
          >
            <Plus sx={{ fontSize: large ? 20 : 16 }} />
          </Box>
        </Box>
        <Typography sx={{ mt: 0.5, maxWidth: 440, fontSize: 15, color: 'text.secondary' }}>
          Group the dashboards a team or service needs, with their own data and settings.
        </Typography>
        <Box
          sx={{
            mt: 1.25,
            display: 'flex',
            flexWrap: 'wrap',
            columnGap: 1.5,
            rowGap: 0.5,
            justifyContent: large ? 'center' : 'flex-start',
          }}
        >
          {WAYS.map((way) => (
            <Box
              key={way}
              component="span"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 12, color: 'text.secondary' }}
            >
              <Check aria-hidden="true" sx={{ fontSize: 14, color: 'primary.main' }} />
              {way}
            </Box>
          ))}
        </Box>
      </Box>

      <Box
        sx={{
          position: 'relative',
          mt: large ? 3 : 1.75,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontSize: 15,
          fontWeight: 600,
          color: 'primary.main',
        }}
      >
        <Box
          aria-hidden="true"
          className="add-project-plus"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            color: 'common.white',
            transition: 'transform 200ms',
          }}
        >
          <Plus sx={{ fontSize: 16 }} />
        </Box>
        Create project
        <ArrowRight
          aria-hidden="true"
          className="add-project-arrow"
          sx={{ fontSize: 16, transition: 'transform 200ms' }}
        />
      </Box>
    </ButtonBase>
  );
}
