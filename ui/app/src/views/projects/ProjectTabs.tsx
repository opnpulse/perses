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

import { AccordionDetails, AccordionSummary, Box, Link, Stack } from '@mui/material';
import { ReactElement, SyntheticEvent, useCallback, useMemo, useState } from 'react';
import ViewDashboardIcon from 'mdi-material-ui/ViewDashboard';
import CodeJsonIcon from 'mdi-material-ui/CodeJson';
import DatabaseIcon from 'mdi-material-ui/Database';
import FolderIcon from 'mdi-material-ui/Folder';
import ShieldIcon from 'mdi-material-ui/Shield';
import ShieldAccountIcon from 'mdi-material-ui/ShieldAccount';
import KeyIcon from 'mdi-material-ui/Key';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { getResourceDisplayName, getResourceExtendedDisplayName, useSnackbar } from '@perses-dev/components';
import {
  DatasourceResource,
  VariableResource,
  RoleResource,
  RoleBindingResource,
  SecretResource,
  DashboardResource,
} from '@perses-dev/client';
import { DashboardSelector, DashboardSpec } from '@perses-dev/spec';
import { CRUDButton, CRUDButtonProps } from '../../components/CRUDButton/CRUDButton';
import { CreateDashboardDialog, CreateFolderDialog } from '../../components/dialogs';
import { VariableDrawer } from '../../components/variable/VariableDrawer';
import { DatasourceDrawer } from '../../components/datasource/DatasourceDrawer';
import { useCreateDatasourceMutation, useDatasourceList } from '../../model/datasource-client';
import { useCreateVariableMutation, useVariableList } from '../../model/variable-client';
import {
  useIsAuthEnabled,
  useIsEphemeralDashboardEnabled,
  useIsProjectDatasourceEnabled,
  useIsProjectVariableEnabled,
  useIsReadonly,
} from '../../context/Config';
import { MenuTab, MenuTabs, TabLabel, TabPanel } from '../../components/tabs';
import { useCreateRoleBindingMutation } from '../../model/rolebinding-client';
import { useCreateRoleMutation, useRoleList } from '../../model/role-client';
import { RoleDrawer } from '../../components/roles/RoleDrawer';
import { RoleBindingDrawer } from '../../components/rolebindings/RoleBindingDrawer';
import { useIsMobileSize } from '../../utils/browser-size';
import { SecretDrawer } from '../../components/secrets/SecretDrawer';
import { useCreateSecretMutation, useSecretList } from '../../model/secret-client';
import { useEphemeralDashboardList } from '../../model/ephemeral-dashboard-client';
import { useHasPermission } from '../../context/Authorization';
import { useDashboardList } from '../../model/dashboard-client';
import { ProjectDashboards } from './tabs/ProjectDashboards';
import { ProjectEphemeralDashboards } from './tabs/ProjectEphemeralDashboards';
import { ProjectVariables } from './tabs/ProjectVariables';
import { ProjectDatasources } from './tabs/ProjectDatasources';
import { ProjectSecrets } from './tabs/ProjectSecrets';
import { ProjectRoles } from './tabs/ProjectRoles';
import { ProjectRoleBindings } from './tabs/ProjectRoleBindings';
import { Accordion } from '@mui/material';
import { ChevronDown } from 'mdi-material-ui';
import { DashboardList } from '../../components/DashboardList/DashboardList';

const foldersTabIndex = 'folders';
const dashboardsTabIndex = 'dashboards';
const ephemeralDashboardsTabIndex = 'ephemeraldashboards';
const datasourcesTabIndex = 'datasources';
const rolesTabIndex = 'roles';
const roleBindingsTabIndex = 'rolesbindings';
const secretsTabIndex = 'secrets';
const variablesTabIndex = 'variables';

interface TabButtonProps extends CRUDButtonProps {
  index: string;
  projectName: string;
}

function TabButton({ index, projectName, ...props }: TabButtonProps): ReactElement {
  const navigate = useNavigate();
  const { successSnackbar, exceptionSnackbar } = useSnackbar();

  const createDatasourceMutation = useCreateDatasourceMutation(projectName);
  const createRoleMutation = useCreateRoleMutation(projectName);
  const createRoleBindingMutation = useCreateRoleBindingMutation(projectName);
  const createSecretMutation = useCreateSecretMutation(projectName);
  const createVariableMutation = useCreateVariableMutation(projectName);

  const [isCreateDashboardDialogOpened, setCreateDashboardDialogOpened] = useState(false);
  const [isCreateFolderDialogOpened, setCreateFolderDialogOpen] = useState(false);
  const [isDatasourceDrawerOpened, setDatasourceDrawerOpened] = useState(false);
  const [isRoleDrawerOpened, setRoleDrawerOpened] = useState(false);
  const [isRoleBindingDrawerOpened, setRoleBindingDrawerOpened] = useState(false);
  const [isSecretDrawerOpened, setSecretDrawerOpened] = useState(false);
  const [isVariableDrawerOpened, setVariableDrawerOpened] = useState(false);

  const isReadonly = useIsReadonly();
  const isEphemeralDashboardEnabled = useIsEphemeralDashboardEnabled();

  const handleDashboardCreation = (dashboardSelector: DashboardSelector): void => {
    navigate(`/projects/${dashboardSelector.project}/dashboard/new`, {
      state: { name: dashboardSelector.dashboard, tags: dashboardSelector.tags },
    });
  };

  const { data } = useRoleList(projectName);
  const roleSuggestions = useMemo(() => {
    return (data ?? []).map((role) => role.metadata.name);
  }, [data]);

  const handleDatasourceCreation = useCallback(
    (datasource: DatasourceResource) => {
      createDatasourceMutation.mutate(datasource, {
        onSuccess: (createdDatasource: DatasourceResource) => {
          successSnackbar(`Datasource ${getResourceDisplayName(createdDatasource)} has been successfully created`);
          setDatasourceDrawerOpened(false);
        },
        onError: (err) => {
          exceptionSnackbar(err);
          throw err;
        },
      });
    },
    [exceptionSnackbar, successSnackbar, createDatasourceMutation]
  );

  const handleRoleCreation = useCallback(
    (role: RoleResource) => {
      createRoleMutation.mutate(role, {
        onSuccess: (createdRole: RoleResource) => {
          successSnackbar(`Role ${createdRole.metadata.name} has been successfully created`);
          setRoleDrawerOpened(false);
        },
        onError: (err) => {
          exceptionSnackbar(err);
          throw err;
        },
      });
    },
    [exceptionSnackbar, successSnackbar, createRoleMutation]
  );

  const handleRoleBindingCreation = useCallback(
    (roleBinding: RoleBindingResource) => {
      createRoleBindingMutation.mutate(roleBinding, {
        onSuccess: (createdRoleBinding: RoleBindingResource) => {
          successSnackbar(`RoleBinding ${createdRoleBinding.metadata.name} has been successfully created`);
          setRoleBindingDrawerOpened(false);
        },
        onError: (err) => {
          exceptionSnackbar(err);
          throw err;
        },
      });
    },
    [exceptionSnackbar, successSnackbar, createRoleBindingMutation]
  );

  const handleSecretCreation = useCallback(
    (secret: SecretResource) => {
      createSecretMutation.mutate(secret, {
        onSuccess: (createdSecret: SecretResource) => {
          successSnackbar(`Secret ${createdSecret.metadata.name} has been successfully created`);
          setSecretDrawerOpened(false);
        },
        onError: (err) => {
          exceptionSnackbar(err);
          throw err;
        },
      });
    },
    [exceptionSnackbar, successSnackbar, createSecretMutation]
  );

  const handleVariableCreation = useCallback(
    (variable: VariableResource) => {
      createVariableMutation.mutate(variable, {
        onSuccess: (updatedVariable: VariableResource) => {
          successSnackbar(`Variable ${getResourceExtendedDisplayName(updatedVariable)} has been successfully created`);
          setVariableDrawerOpened(false);
        },
        onError: (err) => {
          exceptionSnackbar(err);
          throw err;
        },
      });
    },
    [exceptionSnackbar, successSnackbar, createVariableMutation]
  );

  switch (index) {
    case foldersTabIndex:
      return (
        <>
          <CRUDButton
            action="create"
            scope="Folder"
            project={projectName}
            variant="contained"
            onClick={() => setCreateFolderDialogOpen(true)}
            {...props}
          >
            Add Folder
          </CRUDButton>
          <CreateFolderDialog
            projectName={projectName}
            open={isCreateFolderDialogOpened}
            onClose={() => setCreateFolderDialogOpen(false)}
          />
        </>
      );
    case dashboardsTabIndex:
      return (
        <>
          <CRUDButton
            action="create"
            scope="Dashboard"
            project={projectName}
            variant="contained"
            onClick={() => setCreateDashboardDialogOpened(true)}
            {...props}
          >
            Add Dashboard
          </CRUDButton>
          <CreateDashboardDialog
            open={isCreateDashboardDialogOpened}
            projects={[{ kind: 'Project', metadata: { name: projectName }, spec: {} }]}
            hideProjectSelect={true}
            onClose={() => setCreateDashboardDialogOpened(false)}
            onSuccess={handleDashboardCreation}
            isEphemeralDashboardEnabled={isEphemeralDashboardEnabled}
          />
        </>
      );
    case datasourcesTabIndex:
      return (
        <>
          <CRUDButton
            action="create"
            scope="Datasource"
            project={projectName}
            variant="contained"
            onClick={() => setDatasourceDrawerOpened(true)}
            {...props}
          >
            Add Datasource
          </CRUDButton>
          <DatasourceDrawer
            datasource={{
              kind: 'Datasource',
              metadata: {
                name: 'NewDatasource',
                project: projectName,
              },
              spec: {
                default: false,
                plugin: {
                  // TODO: find a way to avoid assuming that the PrometheusDatasource plugin is installed
                  kind: 'PrometheusDatasource',
                  spec: {},
                },
              },
            }}
            isOpen={isDatasourceDrawerOpened}
            action="create"
            isReadonly={isReadonly}
            onSave={handleDatasourceCreation}
            onClose={() => setDatasourceDrawerOpened(false)}
          />
        </>
      );
    case rolesTabIndex:
      return (
        <>
          <CRUDButton
            action="create"
            scope="Role"
            project={projectName}
            variant="contained"
            onClick={() => setRoleDrawerOpened(true)}
            {...props}
          >
            Add Role
          </CRUDButton>
          <RoleDrawer
            role={{
              kind: 'Role',
              metadata: {
                name: 'NewRole',
                project: projectName,
              },
              spec: {
                permissions: [],
              },
            }}
            isOpen={isRoleDrawerOpened}
            action="create"
            isReadonly={isReadonly}
            onSave={handleRoleCreation}
            onClose={() => setRoleDrawerOpened(false)}
          />
        </>
      );
    case roleBindingsTabIndex:
      return (
        <>
          <CRUDButton
            action="create"
            scope="RoleBinding"
            project={projectName}
            variant="contained"
            onClick={() => setRoleBindingDrawerOpened(true)}
            {...props}
          >
            Add Role Binding
          </CRUDButton>
          <RoleBindingDrawer
            roleBinding={{
              kind: 'RoleBinding',
              metadata: {
                name: 'NewRoleBinding',
                project: projectName,
              },
              spec: {
                role: '',
                subjects: [],
              },
            }}
            roleSuggestions={roleSuggestions}
            isOpen={isRoleBindingDrawerOpened}
            action="create"
            isReadonly={isReadonly}
            onSave={handleRoleBindingCreation}
            onClose={() => setRoleBindingDrawerOpened(false)}
          />
        </>
      );
    case secretsTabIndex:
      return (
        <>
          <CRUDButton
            action="create"
            scope="Secret"
            project={projectName}
            variant="contained"
            onClick={() => setSecretDrawerOpened(true)}
            {...props}
          >
            Add Secret
          </CRUDButton>
          <SecretDrawer
            secret={{
              kind: 'Secret',
              metadata: {
                name: 'NewSecret',
                project: projectName,
              },
              spec: {},
            }}
            isOpen={isSecretDrawerOpened}
            action="create"
            isReadonly={isReadonly}
            onSave={handleSecretCreation}
            onClose={() => setSecretDrawerOpened(false)}
          />
        </>
      );
    case variablesTabIndex:
      return (
        <>
          <CRUDButton
            action="create"
            scope="Variable"
            project={projectName}
            variant="contained"
            onClick={() => setVariableDrawerOpened(true)}
            {...props}
          >
            Add Variable
          </CRUDButton>
          <VariableDrawer
            variable={{
              kind: 'Variable',
              metadata: {
                name: 'NewVariable',
                project: projectName,
              },
              spec: {
                kind: 'TextVariable',
                spec: {
                  name: 'NewVariable',
                  value: '',
                },
              },
            }}
            isOpen={isVariableDrawerOpened}
            action="create"
            isReadonly={isReadonly}
            onSave={handleVariableCreation}
            onClose={() => setVariableDrawerOpened(false)}
          />
        </>
      );
    default:
      return <></>;
  }
}

function a11yProps(index: string): Record<string, unknown> {
  return {
    id: `project-tab-${index}`,
    'aria-controls': `project-tabpanel-${index}`,
  };
}

interface FolderAccordionProps {
  folderName: string;
  dashboards: DashboardResource[];
}

export function FolderAccordion({ folderName, dashboards }: FolderAccordionProps): ReactElement {
  const isEphemeralDashboardEnabled = useIsEphemeralDashboardEnabled();

  return (
    <Accordion TransitionProps={{ unmountOnExit: true }}>
      <AccordionSummary expandIcon={<ChevronDown />}>
        <Stack direction="row" alignItems="center" gap={1}>
          <FolderIcon sx={{ margin: 1 }} />
          <Link component={RouterLink} to={`/folders/${folderName}`} variant="h3" underline="hover">
            {folderName}
          </Link>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ padding: 0 }}>
        <DashboardList
          dashboardList={dashboards}
          hideToolbar={true}
          initialState={{
            pagination: { paginationModel: { pageSize: 25, page: 0 } },
            columns: { columnVisibilityModel: { id: false, project: false, version: false } },
          }}
          isEphemeralDashboardEnabled={isEphemeralDashboardEnabled}
        />
      </AccordionDetails>
    </Accordion>
  );
}

interface DashboardVariableTabsProps {
  projectName: string;
  initialTab?: string;
}

export function ProjectTabs(props: DashboardVariableTabsProps): ReactElement {
  const { projectName, initialTab } = props;
  const { tab } = useParams();
  const isAuthEnabled = useIsAuthEnabled();
  const isProjectDatasourceEnabled = useIsProjectDatasourceEnabled();
  const isProjectVariableEnabled = useIsProjectVariableEnabled();

  const navigate = useNavigate();
  const isMobileSize = useIsMobileSize();
  const isEphemeralDashboardEnabled = useIsEphemeralDashboardEnabled();
  const { data } = useEphemeralDashboardList(projectName);
  const hasEphemeralDashboards = (data ?? []).length > 0;

  // Fetch counts for tab badges
  const { data: dashboards } = useDashboardList({ project: projectName, metadataOnly: true });
  const { data: variables } = useVariableList(projectName);
  const { data: datasources } = useDatasourceList({ project: projectName });
  const { data: secrets } = useSecretList(projectName);

  const [value, setValue] = useState((initialTab ?? foldersTabIndex).toLowerCase());

  const hasDashboardReadPermission = useHasPermission('read', projectName, 'Dashboard');
  const hasDatasourceReadPermission = useHasPermission('read', projectName, 'Datasource');
  const hasEphemeralDashboardReadPermission = useHasPermission('read', projectName, 'EphemeralDashboard');
  const hasRoleReadPermission = useHasPermission('read', projectName, 'Role');
  const hasRoleBindingReadPermission = useHasPermission('read', projectName, 'RoleBinding');
  const hasSecretReadPermission = useHasPermission('read', projectName, 'Secret');
  const hasVariableReadPermission = useHasPermission('read', projectName, 'Variable');

  // Temporary dummy folder data
  const folders: FolderAccordionProps[] = [
    {
      folderName: 'Monitoring',
      dashboards: [
        {
          kind: 'Dashboard',
          metadata: {
            name: 'r',
            createdAt: '2025-07-29T04:17:20.048160094Z',
            updatedAt: '2025-07-29T05:10:57.783015516Z',
            version: 7,
            project: 'd1',
          },
          spec: {} as DashboardSpec,
        },
      ],
    },
    {
      folderName: 'Business Metrics',
      dashboards: [
        {
          kind: 'Dashboard',
          metadata: {
            name: 'r',
            createdAt: '2025-07-29T04:17:20.048160094Z',
            updatedAt: '2025-07-29T05:10:57.783015516Z',
            version: 7,
            project: 'd1',
          },
          spec: {} as DashboardSpec,
        },
      ],
    },
  ];

  const handleChange = (event: SyntheticEvent, newTabIndex: string): void => {
    setValue(newTabIndex);
    navigate(`/projects/${projectName}/${newTabIndex}`);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          bgcolor: 'background.paper',
          borderRadius: '8px 8px 0 0',
          border: '1px solid',
          borderColor: 'divider',
          borderBottom: 'none',
          px: 1,
        }}
      >
        <MenuTabs
          value={value}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="Project tabs"
        >
          <MenuTab
            label="Folders"
            icon={<FolderIcon />}
            iconPosition="start"
            {...a11yProps(foldersTabIndex)}
            value={foldersTabIndex}
            disabled={!hasDashboardReadPermission}
          />
          <MenuTab
            label={<TabLabel label="Dashboards" count={dashboards?.length} />}
            icon={<ViewDashboardIcon />}
            iconPosition="start"
            {...a11yProps(dashboardsTabIndex)}
            value={dashboardsTabIndex}
            disabled={!hasDashboardReadPermission}
          />
          {(hasEphemeralDashboards || tab === ephemeralDashboardsTabIndex) && (
            <MenuTab
              label="Ephemeral Dashboards"
              icon={<ViewDashboardIcon />}
              iconPosition="start"
              {...a11yProps(ephemeralDashboardsTabIndex)}
              value={ephemeralDashboardsTabIndex}
              disabled={!hasEphemeralDashboardReadPermission}
            />
          )}
          {isProjectVariableEnabled && (
            <MenuTab
              label={<TabLabel label="Variables" count={variables?.length} />}
              icon={<CodeJsonIcon />}
              iconPosition="start"
              {...a11yProps(variablesTabIndex)}
              value={variablesTabIndex}
              disabled={!hasVariableReadPermission}
            />
          )}
          {isProjectDatasourceEnabled && (
            <MenuTab
              label={<TabLabel label="Datasources" count={datasources?.length} />}
              icon={<DatabaseIcon />}
              iconPosition="start"
              {...a11yProps(datasourcesTabIndex)}
              value={datasourcesTabIndex}
              disabled={!hasDatasourceReadPermission}
            />
          )}
          <MenuTab
            label={<TabLabel label="Secrets" count={secrets?.length} />}
            icon={<KeyIcon />}
            iconPosition="start"
            {...a11yProps(secretsTabIndex)}
            value={secretsTabIndex}
            disabled={!hasSecretReadPermission}
          />
        </MenuTabs>
        {!isMobileSize && <TabButton index={value} projectName={projectName} />}
      </Stack>
      <TabPanel value={value} index={foldersTabIndex} sx={{ marginTop: isMobileSize ? 1 : 2 }}>
        {/* Instead of ProjectDashboards, render folder accordion list */}
        <Box>
          {folders.map((folder) => (
            <FolderAccordion key={folder.folderName} folderName={folder.folderName} dashboards={folder.dashboards} />
          ))}
        </Box>
      </TabPanel>

      {isMobileSize && <TabButton index={value} projectName={projectName} fullWidth sx={{ marginTop: 0.5 }} />}
      <TabPanel value={value} idPrefix="project" index={dashboardsTabIndex} sx={{ marginTop: 0 }}>
        <ProjectDashboards projectName={projectName} id="main-dashboard-list" />
      </TabPanel>
      {isEphemeralDashboardEnabled && hasEphemeralDashboards && (
        <TabPanel value={value} idPrefix="project" index={ephemeralDashboardsTabIndex} sx={{ marginTop: 0 }}>
          <ProjectEphemeralDashboards projectName={projectName} id="project-ephemeral-dashboard-list" />
        </TabPanel>
      )}
      {isProjectVariableEnabled && (
        <TabPanel value={value} idPrefix="project" index={variablesTabIndex} sx={{ marginTop: 0 }}>
          <ProjectVariables projectName={projectName} id="project-variable-list" />
        </TabPanel>
      )}
      {isProjectDatasourceEnabled && (
        <TabPanel value={value} idPrefix="project" index={datasourcesTabIndex} sx={{ marginTop: 0 }}>
          <ProjectDatasources projectName={projectName} id="project-datasource-list" />
        </TabPanel>
      )}
      <TabPanel value={value} idPrefix="project" index={secretsTabIndex} sx={{ marginTop: 0 }}>
        <ProjectSecrets projectName={projectName} id="project-secret-list" />
      </TabPanel>
      {isAuthEnabled && (
        <>
          <TabPanel value={value} idPrefix="project" index={rolesTabIndex} sx={{ marginTop: 0 }}>
            <ProjectRoles projectName={projectName} id="project-role-list" />
          </TabPanel>
          <TabPanel value={value} idPrefix="project" index={roleBindingsTabIndex} sx={{ marginTop: 0 }}>
            <ProjectRoleBindings projectName={projectName} id="project-rolebinding-list" />
          </TabPanel>
        </>
      )}
    </Box>
  );
}
