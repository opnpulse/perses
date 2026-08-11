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

import { useMutation, UseMutationResult, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { fetchJson, FolderResource, DashboardResource, StatusError } from '@perses-dev/client';
import buildURL from './url-builder';
import { HTTPHeader, HTTPMethodDELETE, HTTPMethodGET, HTTPMethodPOST, HTTPMethodPUT } from './http';
import { useActiveUser } from './auth/auth-client';

export const resource: string = 'folders' as const;

export interface FolderWithDashboards extends FolderResource {
  dashboards: DashboardResource[];
  spec: any;
}

export interface FolderListOptions {
  project?: string;
}

/**
 * Returns the list of folders (with embedded dashboards), optionally filtered by project.
 */
export function useFolderList(options: FolderListOptions): UseQueryResult<FolderWithDashboards[], StatusError> {
  const owner = useActiveUser();
  return useQuery<FolderWithDashboards[], StatusError>({
    queryKey: [resource, options.project],
    queryFn: () => getFolders(owner, options.project),
  });
}

/**
 * Returns a mutation that creates a folder and invalidates the folder list cache.
 */
export function useCreateFolderMutation(
  onSuccess?: (data: FolderResource, variables: FolderResource) => Promise<unknown> | unknown
): UseMutationResult<FolderResource, StatusError, FolderResource> {
  const queryClient = useQueryClient();
  const owner = useActiveUser();

  return useMutation<FolderResource, StatusError, FolderResource>({
    mutationKey: [resource],
    mutationFn: (folder) => createFolder(owner, folder),
    onSuccess,
    onSettled: () => queryClient.invalidateQueries({ queryKey: [resource] }),
  });
}

/**
 * Returns a mutation that updates a folder and invalidates the folder list cache.
 */
export function useUpdateFolderMutation(): UseMutationResult<FolderResource, StatusError, FolderResource> {
  const queryClient = useQueryClient();
  const owner = useActiveUser();

  return useMutation<FolderResource, StatusError, FolderResource>({
    mutationKey: [resource],
    mutationFn: (folder: FolderResource) => updateFolder(owner, folder),
    onSuccess: (entity: FolderResource) => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: [resource, entity.metadata.project] }),
        queryClient.invalidateQueries({ queryKey: [resource] }),
      ]);
    },
  });
}

/**
 * Returns a mutation that deletes a folder and invalidates the folder list cache.
 */
export function useDeleteFolderMutation(): UseMutationResult<FolderResource, StatusError, FolderResource> {
  const queryClient = useQueryClient();
  const owner = useActiveUser();

  return useMutation<FolderResource, StatusError, FolderResource>({
    mutationKey: [resource],
    mutationFn: async (entity: FolderResource) => {
      await deleteFolder(owner, entity);
      return entity;
    },
    onSuccess: (entity: FolderResource) => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: [resource, entity.metadata.project] }),
        queryClient.invalidateQueries({ queryKey: [resource] }),
      ]);
    },
  });
}

function createFolder(owner: string | undefined, entity: FolderResource): Promise<FolderResource> {
  const url = buildURL({ resource: resource, project: entity.metadata.project, owner });
  return fetchJson<FolderResource>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

function getFolders(owner: string | undefined, project?: string): Promise<FolderWithDashboards[]> {
  const url = buildURL({ resource: resource, project, owner });
  return fetchJson<FolderWithDashboards[]>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

function updateFolder(owner: string | undefined, entity: FolderResource): Promise<FolderResource> {
  const url = buildURL({ resource: resource, project: entity.metadata.project, name: entity.metadata.name, owner });
  return fetchJson<FolderResource>(url, {
    method: HTTPMethodPUT,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

function deleteFolder(owner: string | undefined, entity: FolderResource): Promise<Response> {
  const url = buildURL({ resource: resource, project: entity.metadata.project, name: entity.metadata.name, owner });
  return fetch(url, {
    method: HTTPMethodDELETE,
    headers: HTTPHeader,
  });
}
