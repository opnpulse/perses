// Copyright 2024 The Perses Authors
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

import { ReactElement, useCallback, useMemo, useState, MouseEvent } from 'react';
import { IconButton, Popover, Box, Typography, Tooltip, SvgIcon, SvgIconProps } from '@mui/material';
import Check from 'mdi-material-ui/Check';
import { useCookies } from 'react-cookie';

const APP_SWITCHER_LABEL = 'AppsCode apps';

// Lucide "Grip" icon, the app-switcher trigger used by cluster-ui / kubedb-ui (AcAppSwitcher).
// Drawn inline so Perses doesn't need the lucide package for one icon.
const GRIP_DOTS = [5, 12, 19].flatMap((cy) => [5, 12, 19].map((cx) => ({ cx, cy })));
function GripIcon(props: SvgIconProps): ReactElement {
  return (
    <SvgIcon
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {GRIP_DOTS.map(({ cx, cy }) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1} />
      ))}
    </SvgIcon>
  );
}

export interface AppDrawerProps {
  currentApp?: string;
  baseUrl?: string;
  activeOrganization?: string;
  rootDomain?: string;
  activeOrgType?: number;
  showBilling?: boolean;
}

const DEFAULT_APPS = [
  {
    name: 'id',
    icon_url: 'https://cdn.appscode.com/images/products/platform/platform.svg',
    title: 'Platform',
    port: '8080',
    sub_title: 'Manage your platform & accounts',
  },
  {
    name: 'db',
    icon_url: 'https://cdn.appscode.com/images/products/kubedb/kubedb-512x512_1.svg',
    title: 'KubeDB',
    port: '5996',
    sub_title: 'Manage your databases',
  },
  {
    name: 'grafana',
    icon_url: 'https://cdn.appscode.com/images/products/others/logos/grafana.svg',
    title: 'Grafana',
    port: '3005',
    sub_title: 'Analyze your activities',
  },
  {
    name: 'observe',
    icon_url: 'https://cdn.appscode.com/images/products/observe/logos/observe.png',
    title: 'Observe',
    port: '8080',
    sub_title: 'Observe your activities',
  },
  {
    name: 'selfhost',
    icon_url: 'https://cdn.appscode.com/images/products/selfhost/logos/selfhost.svg',
    title: 'SelfHost',
    port: '5993',
    sub_title: 'Host AppsCode on your own cluster',
  },
  {
    name: 'billing',
    icon_url: 'https://cdn.appscode.com/images/products/billing/logos/billing.svg',
    title: 'Billing',
    port: '5995',
    sub_title: 'Manage your contracts, licenses & billings',
  },
  {
    name: 'learn',
    icon_url: 'https://cdn.appscode.com/images/products/learn/logos/learn.svg',
    title: 'Learn',
    port: '5988',
    sub_title: 'Be an Expert in Cloud Native technologies',
  },
];

export function AppDrawer(props: AppDrawerProps): ReactElement {
  const {
    currentApp = 'observe',
    baseUrl = window.location.origin,
    activeOrganization = '',
    rootDomain = window.location.hostname,
    activeOrgType = 0,
    showBilling = false,
  } = props;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [, setCookie] = useCookies(['gorg']);

  const handleOpen = (event: MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (): void => {
    setAnchorEl(null);
  };

  const appList = useMemo(() => {
    const list = [...DEFAULT_APPS];
    if (activeOrgType !== 3) {
      list.splice(1, 0, {
        name: 'console',
        icon_url: 'https://cdn.appscode.com/images/products/console/console_512x512.svg',
        title: 'Console',
        port: '5990',
        sub_title: 'Manage your kubernetes clusters',
      });
    }
    return list;
  }, [activeOrgType]);

  const getUrl = useCallback(
    (product: (typeof DEFAULT_APPS)[0]): string => {
      if (baseUrl.includes('bb.test')) {
        return `http://bb.test:${product.port}/${product.name}/`;
      }
      if (baseUrl.includes('localhost')) {
        return `http://localhost:${product.port}/${product.name}/`;
      }
      return `${baseUrl}/${product.name}/`;
    },
    [baseUrl]
  );

  const isSelfHosted = useMemo(() => {
    const list = ['https://appscode.ninja', 'https://appscode.com', 'http://bb.test:8080'];
    return !list.includes(baseUrl);
  }, [baseUrl]);

  // Like the design-system AcAppSwitcher, the current app stays in the grid (marked with a check)
  // so people can see where they are; clicking it just closes the panel.
  const filteredAppList = useMemo(() => {
    return appList
      .filter((app) => {
        if (app.name === currentApp) return true;
        if (app.name === 'billing' && showBilling) return true;
        const selfHostList = ['billing', 'selfhost', 'learn'];
        if (isSelfHosted && selfHostList.includes(app.name)) return false;
        return true;
      })
      .map((app) => ({
        ...app,
        url: getUrl(app),
      }));
  }, [appList, currentApp, isSelfHosted, getUrl, showBilling]);

  const handleClick = (event: MouseEvent<HTMLElement>, name: string): void => {
    if (name === currentApp) {
      event.preventDefault();
    } else if (name === 'grafana') {
      setCookie('gorg', activeOrganization, { domain: rootDomain, path: '/' });
    }
    handleClose();
  };

  const open = Boolean(anchorEl);

  // Layout and styling mirror AcAppSwitcher from @ac-design/design-system (used by cluster-ui and kubedb-ui).
  return (
    <>
      <Tooltip title={APP_SWITCHER_LABEL}>
        <IconButton
          onClick={handleOpen}
          aria-label={APP_SWITCHER_LABEL}
          aria-haspopup="dialog"
          aria-expanded={open}
          sx={{
            width: 38,
            height: 38,
            borderRadius: '10px',
            border: '1px solid transparent',
            color: open ? 'text.primary' : 'text.secondary',
            backgroundColor: open ? 'action.hover' : undefined,
            '&:hover': { borderColor: 'divider', backgroundColor: 'action.hover', color: 'text.primary' },
          }}
        >
          <GripIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Tooltip>
      <Popover
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            role: 'dialog',
            'aria-label': APP_SWITCHER_LABEL,
            sx: {
              mt: '6px',
              width: 340,
              maxWidth: 'calc(100vw - 16px)',
              p: 1,
              borderRadius: '14px',
              border: 1,
              borderColor: 'divider',
              backgroundImage: 'none',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
            },
          },
        }}
      >
        <Typography
          component="p"
          sx={{
            px: 1.5,
            pt: 1,
            pb: 1,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'text.secondary',
          }}
        >
          {APP_SWITCHER_LABEL}
        </Typography>
        <Box
          component="ul"
          role="list"
          sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.5, m: 0, p: 0 }}
        >
          {filteredAppList.map((app) => {
            const isCurrent = app.name === currentApp;
            return (
              <Box component="li" key={app.name} sx={{ listStyle: 'none' }}>
                <Box
                  component="a"
                  href={app.url}
                  title={app.sub_title}
                  aria-current={isCurrent ? 'page' : undefined}
                  onClick={(event: MouseEvent<HTMLElement>) => handleClick(event, app.name)}
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    height: '100%',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                    borderRadius: '8px',
                    px: 0.75,
                    pt: 1.5,
                    pb: 1.25,
                    textAlign: 'center',
                    textDecoration: 'none',
                    color: 'text.primary',
                    outline: 'none',
                    transition: 'background-color 200ms',
                    backgroundColor: isCurrent ? 'action.selected' : undefined,
                    '&:hover': { backgroundColor: isCurrent ? 'action.selected' : 'action.hover' },
                    '&:hover .app-icon': { transform: 'translateY(-1px)' },
                    '&:focus-visible': { boxShadow: (theme) => `inset 0 0 0 2px ${theme.palette.primary.main}` },
                  }}
                >
                  <Box
                    className="app-icon"
                    aria-hidden="true"
                    sx={{
                      display: 'inline-flex',
                      width: 40,
                      height: 40,
                      flexShrink: 0,
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      borderRadius: '10px',
                      border: 1,
                      borderColor: 'divider',
                      backgroundColor: 'background.paper',
                      transition: 'transform 200ms',
                    }}
                  >
                    <Box
                      component="img"
                      src={app.icon_url}
                      alt=""
                      sx={{ width: 28, height: 28, objectFit: 'contain' }}
                    />
                  </Box>
                  <Typography
                    noWrap
                    sx={{ width: '100%', fontSize: 12, fontWeight: 500, lineHeight: '16px', color: 'text.primary' }}
                  >
                    {app.title}
                  </Typography>
                  {isCurrent && (
                    <Box
                      aria-hidden="true"
                      sx={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        display: 'inline-flex',
                        width: 16,
                        height: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                        color: 'primary.contrastText',
                      }}
                    >
                      <Check sx={{ fontSize: 11 }} />
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Popover>
    </>
  );
}
