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

import { MouseEvent, ReactElement, useState } from 'react';
import {
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Collapse,
  List,
  ListItemButton,
  ListItemText,
  Box,
} from '@mui/material';
import AccountCircle from 'mdi-material-ui/AccountCircle';
import AccountBox from 'mdi-material-ui/AccountBox';
import Logout from 'mdi-material-ui/Logout';
import ExpandLess from 'mdi-material-ui/ChevronUp';
import ExpandMore from 'mdi-material-ui/ChevronDown';
import { Link as RouterLink } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import { useActiveUser } from '../../model/auth/auth-client';
import { ProfileRoute } from '../../model/route';
import { useIsDelegatedAuthnProviderEnabled } from '../../context/Config';
import { PERSES_APP_CONFIG } from '../../config';
import { ThemeSwitch } from './ThemeSwitch';
import { activeOrganization } from '../../constants/auth-token';
import { Typography } from '@mui/material';

export function AccountMenu(): ReactElement {
  const owner = useActiveUser();
  const isDelegatedAuthnProviderEnabled = useIsDelegatedAuthnProviderEnabled();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openSwitch, setOpenSwitch] = useState(false);
  const [cookies, setCookie] = useCookies([activeOrganization]);

  const accounts = [
    { id: 'perses', name: 'perses', type: 'Personal Account' },
    { id: 'appscode1', name: 'appscode1', type: 'Organization' },
  ];

  const handleMenu = (event: MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = (): void => {
    setAnchorEl(null);
  };
  const handleToggleSwitch = (): void => {
    setOpenSwitch(!openSwitch);
  };
  const handleSwitchAccount = (accountId: string): void => {
    setCookie(activeOrganization, accountId, { path: '/' });
    setAnchorEl(null);
  };
  const currentAccount = accounts.find((acc) => acc.id === owner);

  return (
    <>
      <IconButton
        aria-label="Account menu"
        aria-controls="menu-account-list-appbar"
        aria-haspopup="true"
        color="inherit"
        onClick={handleMenu}
      >
        <AccountCircle />
      </IconButton>
      <Menu
        id="menu-account-list-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        keepMounted
        open={anchorEl !== null}
        onClose={handleCloseMenu}
      >
        <MenuItem>
          <ListItemIcon>
            <AccountCircle />
          </ListItemIcon>
          <Box display="flex" flexDirection="column">
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {owner}
            </Typography>
            {currentAccount && (
              <Typography variant="body2" color="text.secondary">
                {currentAccount.type}
              </Typography>
            )}
          </Box>
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleToggleSwitch}>
          <ListItemIcon>
            <AccountBox />
          </ListItemIcon>
          Switch Account
          {openSwitch ? <ExpandLess /> : <ExpandMore />}
        </MenuItem>

        <Collapse in={openSwitch} timeout="auto" unmountOnExit>
          <List disablePadding>
            {accounts.map((acc) => (
              <ListItemButton key={acc.id} selected={owner === acc.id} onClick={() => handleSwitchAccount(acc.id)}>
                <ListItemIcon>
                  <AccountCircle />
                </ListItemIcon>
                <ListItemText primary={acc.name} secondary={acc.type} />
              </ListItemButton>
            ))}
          </List>
        </Collapse>

        <Divider />
        <ThemeSwitch isAuthEnabled />
        <MenuItem component={RouterLink} to={ProfileRoute}>
          <ListItemIcon>
            <AccountBox />
          </ListItemIcon>
          Profile
        </MenuItem>
        {/* Since perses doesn't have control over delegated authn providers, don't show the
          logout button when one is enabled */}
        {!isDelegatedAuthnProviderEnabled && (
          <MenuItem component="a" href={`${PERSES_APP_CONFIG.api_prefix}/api/auth/logout`}>
            <ListItemIcon>
              <Logout />
            </ListItemIcon>
            Logout
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
