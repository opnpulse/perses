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

import { intlFormatDistance } from 'date-fns';

/**
 * Formats a date as a human-readable relative time string (e.g. "2 hours ago").
 * Returns `null` if no date is provided.
 */
export function formatRelativeTime(value: Date | undefined): string | null {
  if (!value) return null;
  return intlFormatDistance(value, new Date());
}

/**
 * Formats a date as a UTC string (e.g. for use in tooltips or accessible cell descriptions).
 * Returns an empty string if no date is provided.
 */
export function formatAbsoluteTime(value: Date | undefined): string {
  return value?.toUTCString() ?? '';
}
