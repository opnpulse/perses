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

import { ReactElement, SVGProps } from 'react';

interface PersesLogoProps extends SVGProps<SVGSVGElement> {
  title?: string;
}

function WhitePersesLogo(props: PersesLogoProps): ReactElement {
  const { title = 'Observe Logo' } = props;
  return (
    <svg width="130" height="32" viewBox="0 0 367 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <title id="perses-banner-title">{title}</title>
      <rect width="367" height="120" />

      <text x="115" y="80" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="60" fill="white">
        OBSERVE
      </text>

      <path
        d="M66.625 24H24.375C20.8542 24 18 26.8542 18 30.375C18 33.8958 20.8542 36.75 24.375 36.75H66.625C70.1458 36.75 73 33.8958 73 30.375C73 26.8542 70.1458 24 66.625 24Z"
        fill="white"
      />
      <path
        d="M86.625 44.75H44.375C40.8542 44.75 38 47.6042 38 51.125C38 54.6458 40.8542 57.5 44.375 57.5H86.625C90.1458 57.5 93 54.6458 93 51.125C93 47.6042 90.1458 44.75 86.625 44.75Z"
        fill="white"
      />
      <path
        d="M66.625 65.5H24.375C20.8542 65.5 18 68.3542 18 71.875C18 75.3958 20.8542 78.25 24.375 78.25H66.625C70.1458 78.25 73 75.3958 73 71.875C73 68.3542 70.1458 65.5 66.625 65.5Z"
        fill="white"
      />
      <path
        d="M31.625 86.25H24.375C20.8542 86.25 18 89.1042 18 92.625C18 96.1458 20.8542 99 24.375 99H31.625C35.1458 99 38 96.1458 38 92.625C38 89.1042 35.1458 86.25 31.625 86.25Z"
        fill="white"
      />
    </svg>
  );
}

export default WhitePersesLogo;
