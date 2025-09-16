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

package dashboard

import (
	"encoding/json"

	databaseModel "github.com/perses/perses/internal/api/database/model"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type Query struct {
	databaseModel.Query
	// NamePrefix is a prefix of the Dashboard.metadata.name that is used to filter the Dashboard list.
	// It can be empty in case you want to return the full list of dashboards available.
	NamePrefix string `query:"name"`
	// Project is the exact name of the project.
	// The value can come from the path of the URL or from the query parameter
	Project      string `param:"project" query:"project"`
	MetadataOnly bool   `query:"metadata_only"`
	Folder       string `param:"folder" query:"folder"`

	UserID    int64 `param:"user" query:"user"`
	FolderID  int64 `param:"folderID" query:"folderID"`
	ProjectID int64 `param:"projectID" query:"projectID"`

	WithFolderName string `query:"with_folder_name"`
}

func (q *Query) SetFolderID(folderID int64) {
	q.FolderID = folderID
}

func (q *Query) GetMetadataOnlyQueryParam() bool {
	return q.MetadataOnly
}

func (q *Query) IsRawQueryAllowed() bool {
	return false
}

func (q *Query) IsRawMetadataQueryAllowed() bool {
	return false
}

func (q *Query) SetUserID(userID int64) {
	q.UserID = userID
}

func (q *Query) SetProjectID(projectID int64) {
	q.ProjectID = projectID
}

func (q *Query) GetProjectQueryParam() string {
	return q.Project
}

func (q *Query) SetProjectQueryParam(project string) {
	q.Project = project
}

type DAO interface {
	Create(entity *v1.Dashboard) error
	Update(entity *v1.Dashboard) error
	Delete(projectID, folderID int64, name string) error
	DeleteAll(project string) error
	Get(projectID, folderID int64, name string) (*v1.Dashboard, error)
	List(q *Query) ([]*v1.Dashboard, error)
	RawList(q *Query) ([]json.RawMessage, error)
	MetadataList(q *Query) ([]api.Entity, error)
	RawMetadataList(q *Query) ([]json.RawMessage, error)
}

type Service interface {
	apiInterface.Service[*v1.Dashboard, *v1.Dashboard, *Query]
	Validate(entity *v1.Dashboard) error
}
