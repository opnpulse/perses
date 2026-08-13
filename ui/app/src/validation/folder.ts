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

import { z } from 'zod';
import { useMemo } from 'react';
import { useFolderList } from '../model/folder-client';
import { generateMetadataName } from '../utils/metadata';

export const createFolderDialogValidationSchema = z.object({
  selectedDashboards: z.array(
    z.object({
      name: z.string(),
      label: z.string(),
    })
  ),
  name: z.string().min(1, 'Name is required'),
});

export type CreateFolderValidationType = z.infer<typeof createFolderDialogValidationSchema>;

export interface FolderValidationSchema {
  schema?: z.ZodSchema;
  isSchemaLoading: boolean;
  hasSchemaError: boolean;
}

/**
 * Returns a validation schema for the Create Folder dialog.
 * Extends {@link createFolderDialogValidationSchema} with a project-scoped name uniqueness check.
 *
 * @param projectName - The project to scope the uniqueness check to.
 */
export function useFolderValidationSchema(projectName?: string): FolderValidationSchema {
  const { data: folders, isLoading: isFoldersLoading, isError } = useFolderList({ project: projectName });
  return useMemo((): FolderValidationSchema => {
    if (isFoldersLoading)
      return {
        schema: undefined,
        isSchemaLoading: true,
        hasSchemaError: false,
      };

    if (isError) {
      return {
        hasSchemaError: true,
        isSchemaLoading: false,
        schema: undefined,
      };
    }

    if (!folders?.length)
      return { schema: createFolderDialogValidationSchema, isSchemaLoading: false, hasSchemaError: false };

    const refinedSchema = createFolderDialogValidationSchema.refine(
      (schema) => {
        return !(folders ?? []).some((folder) => {
          return (
            folder.metadata.project.toLowerCase() === (projectName ?? '').toLowerCase() &&
            folder.metadata.name.toLowerCase() === generateMetadataName(schema.name.toLowerCase())
          );
        });
      },
      (schema) => ({
        message: `Folder name '${schema.name}' already exists in '${projectName}' project!`,
        path: ['name'],
      })
    );

    return { schema: refinedSchema, isSchemaLoading: false, hasSchemaError: false };
  }, [folders, isFoldersLoading, isError, projectName]);
}
