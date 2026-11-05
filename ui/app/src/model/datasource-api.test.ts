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

import { buildProxyUrl } from './datasource-api';

interface TestData {
  input: {
    owner?: string;
    project?: string;
    dashboard?: string;
    name: string;
  };
  expected: string;
}

describe('buildProxyUrl', () => {
  test.each([
    {
      title: 'should build global datasource proxy url',
      input: { owner: 'orgA', name: 'datasourceA' },
      expected: '/proxy/owners/orgA/globaldatasources/datasourceA',
    },
    {
      title: 'should build project datasource proxy url',
      input: { owner: 'orgA', project: 'projectA', name: 'datasourceA' },
      expected: '/proxy/owners/orgA/projects/projectA/datasources/datasourceA',
    },
    {
      title: 'should build dashboard datasource proxy url',
      input: { owner: 'orgA', project: 'projectA', dashboard: 'dashboardA', name: 'datasourceA' },
      expected: '/proxy/owners/orgA/projects/projectA/dashboards/dashboardA/datasources/datasourceA',
    },
  ])('$title', (data: TestData) => {
    expect(buildProxyUrl(data.input)).toEqual(data.expected);
  });
});
