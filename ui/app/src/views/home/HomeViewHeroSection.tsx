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

import { Box, Button, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ReactElement } from 'react';
import ChartBoxOutline from 'mdi-material-ui/ChartBoxOutline';
import PlusIcon from 'mdi-material-ui/Plus';
import UploadIcon from 'mdi-material-ui/Upload';
import { Link as RouterLink } from 'react-router-dom';
import { ProjectResource } from '@perses-dev/client';
import { CRUDButton } from '../../components/CRUDButton/CRUDButton';
import { ImportRoute } from '../../model/route';
import { useInformation } from '../../context/Config';
import { useActiveUser } from '../../model/auth/auth-client';
import { acCardSx, acPrimaryGradient } from './ac-tokens';

interface HomeViewHeroSectionProps {
  userProjects: ProjectResource[];
  onAddProjectClick: () => void;
  onAddDashboardClick: () => void;
}

// The landing page's overview header, matching cluster-ui's: at a glance it says where you are
// (the area and the organisation), what the page is for, and what you can do from it.
export function HomeViewHeroSection({
  userProjects,
  onAddProjectClick,
  onAddDashboardClick,
}: HomeViewHeroSectionProps): ReactElement {
  const information = useInformation();
  const org = useActiveUser();
  const canCreateDashboards = userProjects.length > 0;

  return (
    <Box
      component="header"
      data-testid="home-hero"
      sx={{
        overflow: 'hidden',
        ...acCardSx('16px'),
      }}
    >
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          alignItems: { xs: 'flex-start', lg: 'center' },
          justifyContent: 'space-between',
          gap: 2.5,
          p: { xs: 2.5, lg: 3 },
          background: acPrimaryGradient,
        }}
      >
        {/* Faded watermark in the bottom-right corner */}
        <ChartBoxOutline
          aria-hidden="true"
          sx={{
            position: 'absolute',
            right: -24,
            bottom: -48,
            fontSize: 176,
            color: (theme) => alpha(theme.palette.primary.main, 0.05),
            pointerEvents: 'none',
          }}
        />

        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
          <Box
            aria-hidden="true"
            sx={{
              display: { xs: 'none', sm: 'flex' },
              width: 56,
              height: 56,
              flexShrink: 0,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '16px',
              color: 'common.white',
              background: (theme) =>
                `linear-gradient(to bottom right, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.7)})`,
              boxShadow: (theme) => `0 8px 20px -8px ${theme.palette.primary.main}`,
            }}
          >
            <ChartBoxOutline sx={{ fontSize: 28 }} />
          </Box>

          {information ? (
            <Box
              sx={{ minWidth: 0, lineHeight: 1.5, '& *': { marginTop: 0 } }}
              dangerouslySetInnerHTML={{ __html: information }}
            />
          ) : (
            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="p"
                sx={{
                  m: 0,
                  mb: 0.5,
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  columnGap: 1,
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'primary.main',
                }}
              >
                Observability
                {org && (
                  <>
                    <Box component="span" aria-hidden="true" sx={{ color: 'text.secondary' }}>
                      ·
                    </Box>
                    <Box
                      component="span"
                      sx={{ color: 'text.secondary', letterSpacing: 'normal', textTransform: 'none' }}
                    >
                      {org}
                    </Box>
                  </>
                )}
              </Typography>
              <Typography
                component="h1"
                sx={{ m: 0, fontSize: { xs: 24, sm: 30 }, lineHeight: 1.2, fontWeight: 700, letterSpacing: '-0.01em' }}
              >
                Monitor your projects and dashboards
              </Typography>
              <Typography sx={{ m: 0, mt: 0.5, maxWidth: 640, fontSize: 15, color: 'text.secondary' }}>
                {canCreateDashboards
                  ? 'Every project in this organisation. Open one to explore its dashboards, or start a new one.'
                  : 'Create your first project to start building dashboards and importing existing ones.'}
              </Typography>
            </Box>
          )}
        </Box>

        <Stack
          direction="row"
          sx={{
            position: 'relative',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 1.5,
            flexShrink: 0,
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            component={RouterLink}
            to={ImportRoute}
            disabled={!canCreateDashboards}
            sx={{ px: 2.5, py: 1, borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
          >
            Import dashboard
          </Button>
          <CRUDButton
            action="create"
            scope="Project"
            variant="outlined"
            startIcon={<PlusIcon />}
            onClick={onAddProjectClick}
            sx={{ px: 2.5, py: 1, borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
          >
            Create project
          </CRUDButton>
          <Button
            variant="contained"
            startIcon={<PlusIcon />}
            onClick={onAddDashboardClick}
            disabled={!canCreateDashboards}
            disableElevation
            sx={{ px: 2.5, py: 1, borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontSize: 16 }}
          >
            Create dashboard
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
