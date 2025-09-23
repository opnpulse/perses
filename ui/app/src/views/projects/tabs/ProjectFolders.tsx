import { IconButton, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Card, CardProps, Box, Accordion, AccordionSummary, Stack, AccordionDetails } from '@mui/material';
import { ReactElement, useState } from 'react';
import { useFolderList, FolderWithDashboards } from '../../../model/folder-client';
import { useIsEphemeralDashboardEnabled, useIsReadonly } from '../../../context/Config';
import { ChevronDown, DeleteOutline } from 'mdi-material-ui';
import FolderIcon from 'mdi-material-ui/Folder';

import { DashboardList } from '../../../components/DashboardList/DashboardList';
import { useHasPermission } from '../../../context/Authorization';

interface FolderAccordionProps {
  folder: FolderWithDashboards;
}

export function FolderAccordion({ folder }: FolderAccordionProps): ReactElement {
  const isEphemeralDashboardEnabled = useIsEphemeralDashboardEnabled();
  //const hasPermission = useHasPermission('delete', folder.metadata.name, 'Project');
  const hasPermission = true;
  const isReadonly = useIsReadonly();
  const [isDeleteProjectDialogOpen, setIsDeleteProjectDialogOpen] = useState<boolean>(false);

  function openDeleteProjectConfirmDialog($event: MouseEvent): void {
    $event.stopPropagation(); // Preventing the accordion to toggle when we click on the button
    setIsDeleteProjectDialogOpen(true);
  }

  return (
    <Accordion TransitionProps={{ unmountOnExit: true }}>
      <AccordionSummary expandIcon={<ChevronDown />}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
          <Stack direction="row" alignItems="center" gap={1}>
            <FolderIcon sx={{ margin: 1 }} />
            <Link component={RouterLink} to={`/folders/${folder.metadata.name}`} variant="h3" underline="hover">
              {folder.metadata.name}
            </Link>
          </Stack>
          {hasPermission && (
            <IconButton
              component="div"
              onClick={(event: MouseEvent) => openDeleteProjectConfirmDialog(event)}
              disabled={isReadonly}
            >
              <DeleteOutline />
            </IconButton>
          )}
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ padding: 0 }}>
        <DashboardList
          dashboardList={folder.dashboards || []}
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

interface ProjectFoldersProps extends CardProps {
  projectName: string;
  hideToolbar?: boolean;
}

export function ProjectFolders({ projectName, hideToolbar, ...props }: ProjectFoldersProps): ReactElement {
  const { data: folders = [], isLoading } = useFolderList({ project: projectName });

  return (
    <Card {...props}>
      <Box>{!isLoading && folders.map((folder) => <FolderAccordion key={folder.metadata.name} folder={folder} />)}</Box>
    </Card>
  );
}
