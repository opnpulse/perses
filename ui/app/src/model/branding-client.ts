// Copyright 2025 The Perses Authors
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

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { fetchJson, StatusError } from '@perses-dev/client';

const resource = '/api/v1/branding';

export interface Branding {
  appName?: string;
  favicons?: {
    favicon16x16?: string;
    favicon32x32?: string;
    favicon96x96?: string;
    favicon196X196?: string;
  };
  logo?: string;
  primaryColor?: string;
  runMode?: string;
  showAppTag?: boolean;
  isOfflineInstaller?: boolean;
}

type BrandingOptions = Omit<UseQueryOptions<Branding, StatusError>, 'queryKey' | 'queryFn'>;

export function useBranding(options?: BrandingOptions): UseQueryResult<Branding, StatusError> {
  return useQuery<Branding, StatusError>({
    queryKey: [resource],
    queryFn: () => {
      return fetchBranding();
    },
    ...options,
  });
}

export function useBrandingFromCache(): Branding | undefined {
  const { data } = useQuery<Branding, StatusError>({
    queryKey: [resource],
    queryFn: fetchBranding,
    enabled: false,
  });
  return data;
}

export function fetchBranding(): Promise<Branding> {
  return fetchJson<Branding>(platformURL(resource));
}

/**
 * URL of a platform (b3) API. Those live at the root (no Perses API prefix). In local dev on a bb.test
 * host the platform accounts server runs on :3003, mirroring getServerDomain("3003") in ui-modules.
 * b3 only allows CORS from *.bb.test origins, so open Perses at http://bb.test:<port> (not localhost).
 */
export function platformURL(path: string): string {
  const { protocol, hostname, origin } = window.location;
  if (hostname === 'bb.test' || hostname.endsWith('.bb.test')) {
    return `${protocol}//${hostname}:3003${path}`;
  }
  return origin + path;
}
