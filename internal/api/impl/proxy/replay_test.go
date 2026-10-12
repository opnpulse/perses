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

package proxy

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMakeBodyReplayable(t *testing.T) {
	t.Run("small body is replayable", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader("query=up"))
		require.NoError(t, makeBodyReplayable(req))
		require.NotNil(t, req.GetBody)
		first, _ := io.ReadAll(req.Body)
		second, _ := req.GetBody()
		again, _ := io.ReadAll(second)
		assert.Equal(t, "query=up", string(first))
		assert.Equal(t, "query=up", string(again))
	})
	t.Run("no body untouched", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		require.NoError(t, makeBodyReplayable(req))
		assert.Nil(t, req.GetBody)
	})
	t.Run("too big body stays streamed", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader("x"))
		req.ContentLength = maxReplayableBodySize + 1
		require.NoError(t, makeBodyReplayable(req))
		assert.Nil(t, req.GetBody)
	})
	t.Run("unknown size stays streamed", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader("x"))
		req.ContentLength = -1
		require.NoError(t, makeBodyReplayable(req))
		assert.Nil(t, req.GetBody)
	})
}
