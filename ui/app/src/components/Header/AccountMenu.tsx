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

import { MouseEvent, ReactElement, ReactNode, useMemo, useState } from 'react';
import { Avatar, Box, ButtonBase, Divider, Menu, MenuItem, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import AccountOutline from 'mdi-material-ui/AccountOutline';
import CheckCircleOutline from 'mdi-material-ui/CheckCircleOutline';
import ChevronDown from 'mdi-material-ui/ChevronDown';
import Logout from 'mdi-material-ui/Logout';
import WeatherNight from 'mdi-material-ui/WeatherNight';
import WhiteBalanceSunny from 'mdi-material-ui/WhiteBalanceSunny';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import { useSnackbar } from '@perses-dev/components';
import { BaseUser, useActiveUser, useOrganizationList, useUserApi } from '../../model/auth/auth-client';
import { LoginUrl, LogoutUrl, ProfileRoute } from '../../model/route';
import { HTTPHeader, HTTPMethodGET } from '../../model/http';
import { PERSES_APP_CONFIG } from '../../config';
import { activeOrganization } from '../../constants/auth-token';
import { useDarkMode } from '../../context/DarkMode';

type AccountType = 'user' | 'org';

interface Account {
  name: string;
  displayName: string;
  type: AccountType;
}

function toAccount(entity: BaseUser, type: AccountType): Account {
  const name = entity.metadata?.name ?? '';
  return { name, displayName: entity.spec?.firstName || name, type };
}

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? '') : '';
  return (first + last).toUpperCase();
}

function getAccountKind(type: AccountType): string {
  return type === 'user' ? 'Personal account' : 'Organization';
}

function AccountAvatar({ account, size }: { account: Account; size: number }): ReactElement {
  const theme = useTheme();
  const color = account.type === 'user' ? theme.palette.primary : theme.palette.info;
  return (
    <Avatar
      variant="circular"
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        fontWeight: 600,
        bgcolor: alpha(color.main, 0.12),
        color: theme.palette.mode === 'dark' ? color.light : color.dark,
        boxShadow: `inset 0 0 0 1px ${alpha(color.main, 0.25)}`,
      }}
    >
      {getInitials(account.displayName)}
    </Avatar>
  );
}

function SectionLabel({ children }: { children: ReactNode }): ReactElement {
  return (
    <Typography
      sx={{
        px: 1.5,
        pt: 1,
        pb: 0.75,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: 'text.secondary',
      }}
    >
      {children}
    </Typography>
  );
}

function AccountText({
  primary,
  secondary,
  bold,
}: {
  primary: string;
  secondary: string;
  bold?: boolean;
}): ReactElement {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, lineHeight: 1.25 }}>
      <Typography noWrap sx={{ fontSize: 15, fontWeight: bold ? 600 : 500, color: 'text.primary' }}>
        {primary}
      </Typography>
      <Typography noWrap sx={{ fontSize: 12, color: 'text.secondary' }}>
        {secondary}
      </Typography>
    </Box>
  );
}

const menuItemSx = {
  minHeight: 40,
  gap: 1.25,
  borderRadius: '8px',
  px: 1.5,
  py: 1,
  fontSize: 15,
  fontWeight: 500,
  '& > svg': { fontSize: 18, color: 'text.secondary' },
} as const;

export function AccountMenu(): ReactElement {
  const theme = useTheme();
  const owner = useActiveUser();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isDarkModeEnabled, setDarkMode } = useDarkMode();
  const { exceptionSnackbar } = useSnackbar();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [, setCookie, removeCookie] = useCookies([activeOrganization]);
  const { data: user } = useUserApi();
  const { data: orgs } = useOrganizationList(user?.metadata?.name);

  const basePath = PERSES_APP_CONFIG.api_prefix;
  const open = anchorEl !== null;

  const userAccount = useMemo(() => (user ? toAccount(user, 'user') : undefined), [user]);
  const accounts = useMemo(() => {
    const orgAccounts = orgs?.map((org) => toAccount(org, 'org')) ?? [];
    return userAccount ? [userAccount, ...orgAccounts] : orgAccounts;
  }, [userAccount, orgs]);

  const currentAccount: Account | undefined =
    accounts.find((acc) => acc.name === owner) ??
    (owner ? { name: owner, displayName: owner, type: owner === userAccount?.name ? 'user' : 'org' } : undefined);
  const otherAccounts = accounts.filter((acc) => acc.name !== currentAccount?.name);

  const handleOpen = (event: MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = (): void => {
    setAnchorEl(null);
  };

  const handleSwitchAccount = (accountId: string): void => {
    // The platform stores activeOrganization on the root domain. Drop any host-only copy left by older
    // versions (it shadows the shared one on reload), then overwrite the shared cookie itself.
    removeCookie(activeOrganization, { path: '/' });
    setCookie(activeOrganization, accountId, { path: '/', domain: window.location.hostname });
    setAnchorEl(null);
    if (pathname !== basePath) {
      navigate('/');
    }
  };

  const handleThemeChange = (): void => {
    try {
      setDarkMode(!isDarkModeEnabled);
    } catch (e) {
      exceptionSnackbar(e);
    }
  };

  const handleLogout = async (): Promise<void> => {
    await fetch(LogoutUrl, {
      method: HTTPMethodGET,
      headers: HTTPHeader,
    });
    window.location.href = LoginUrl;
  };

  const currentTone = currentAccount?.type === 'org' ? theme.palette.info.main : theme.palette.primary.main;
  const profileName = userAccount?.displayName ?? owner ?? '';
  const profileHandle = userAccount?.name ?? owner ?? '';

  return (
    <>
      <ButtonBase
        id="account-menu-trigger"
        aria-label={
          currentAccount
            ? `${currentAccount.displayName}, ${getAccountKind(currentAccount.type)}, account menu`
            : 'Account menu'
        }
        aria-controls={open ? 'menu-account-list-appbar' : undefined}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleOpen}
        sx={{
          gap: 1,
          p: 1,
          px: { md: 2 },
          borderRadius: '10px',
          border: '1px solid',
          borderColor: open ? 'divider' : 'transparent',
          bgcolor: open ? 'action.hover' : 'transparent',
          transition: 'background-color 200ms, border-color 200ms',
          '&:hover': { borderColor: 'divider', bgcolor: 'action.hover' },
          '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
        }}
      >
        {currentAccount && (
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              alignItems: 'flex-end',
              minWidth: 0,
              lineHeight: 1.2,
            }}
          >
            <Typography noWrap sx={{ maxWidth: 144, fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
              {currentAccount.displayName}
            </Typography>
            <Typography noWrap sx={{ maxWidth: 144, fontSize: 12, color: 'text.secondary' }}>
              {getAccountKind(currentAccount.type)}
            </Typography>
          </Box>
        )}
        {currentAccount ? (
          <AccountAvatar account={currentAccount} size={36} />
        ) : (
          <Avatar sx={{ width: 36, height: 36 }}>
            <AccountOutline />
          </Avatar>
        )}
        <ChevronDown
          sx={{
            display: { xs: 'none', sm: 'block' },
            fontSize: 18,
            color: 'text.secondary',
            transition: 'transform 200ms',
            transform: open ? 'rotate(180deg)' : 'none',
          }}
        />
      </ButtonBase>
      <Menu
        id="menu-account-list-appbar"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        MenuListProps={{ 'aria-labelledby': 'account-menu-trigger', sx: { p: 0 } }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              mt: 0.75,
              width: 288,
              maxWidth: 'calc(100vw - 16px)',
              p: 0.5,
              borderRadius: '14px',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.25)',
            },
          },
        }}
      >
        {/* Profile header */}
        <MenuItem
          component={RouterLink}
          to={ProfileRoute}
          onClick={handleClose}
          sx={{ gap: 1.5, borderRadius: '8px', px: 1.5, py: 1.25 }}
        >
          <AccountAvatar account={{ name: profileHandle, displayName: profileName, type: 'user' }} size={40} />
          <AccountText primary={profileName} secondary={profileHandle ? `@${profileHandle}` : ''} />
        </MenuItem>

        {/* Current account */}
        {currentAccount && <Divider sx={{ my: 0.5 }} />}
        {currentAccount && (
          <Box sx={{ px: 0.5, pb: 0.5 }}>
            <SectionLabel>Current account</SectionLabel>
            <Box
              aria-current="true"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                px: 1.5,
                py: 1,
                borderRadius: '10px',
                border: '1px solid',
                borderColor: alpha(currentTone, 0.4),
                bgcolor: alpha(currentTone, 0.08),
              }}
            >
              <AccountAvatar account={currentAccount} size={32} />
              <AccountText primary={currentAccount.displayName} secondary={getAccountKind(currentAccount.type)} bold />
              <CheckCircleOutline sx={{ fontSize: 22, color: currentTone }} aria-label="Current account" />
            </Box>
          </Box>
        )}

        {/* Switch to */}
        {otherAccounts.length > 0 && <SectionLabel>Switch to</SectionLabel>}
        {otherAccounts.map((acc) => (
          <MenuItem
            key={acc.name}
            onClick={() => handleSwitchAccount(acc.name)}
            sx={{ gap: 1.25, borderRadius: '8px', px: 1.5, py: 1, mx: 0.5 }}
          >
            <AccountAvatar account={acc} size={32} />
            <AccountText
              primary={acc.displayName}
              secondary={acc.type === 'user' ? getAccountKind(acc.type) : `${getAccountKind(acc.type)} · @${acc.name}`}
            />
          </MenuItem>
        ))}

        <Divider sx={{ my: 0.5 }} />

        {/* Actions */}
        <MenuItem onClick={handleThemeChange} sx={menuItemSx}>
          {isDarkModeEnabled ? <WhiteBalanceSunny /> : <WeatherNight />}
          {isDarkModeEnabled ? 'Light mode' : 'Dark mode'}
        </MenuItem>
        <MenuItem component={RouterLink} to={ProfileRoute} onClick={handleClose} sx={menuItemSx}>
          <AccountOutline />
          Your profile
        </MenuItem>
        <MenuItem
          onClick={handleLogout}
          sx={{ ...menuItemSx, color: 'error.main', '& > svg': { fontSize: 18, color: 'error.main' } }}
        >
          <Logout />
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
}
