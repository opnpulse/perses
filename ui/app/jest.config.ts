/** @jest-config-loader ts-node */
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

// Force ts-node: on Node >= 22.18 Jest would otherwise load this file through Node's native type
// stripping as ESM, which cannot resolve the extensionless '../jest.shared' import nor `__dirname`.
import shared from '../jest.shared';

export default shared;
