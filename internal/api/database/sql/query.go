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

package databasesql

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/huandu/go-sqlbuilder"
	databaseModel "github.com/perses/perses/internal/api/database/model"
	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/internal/api/interface/v1/datasource"
	"github.com/perses/perses/internal/api/interface/v1/ephemeraldashboard"
	"github.com/perses/perses/internal/api/interface/v1/folder"
	"github.com/perses/perses/internal/api/interface/v1/globaldatasource"
	"github.com/perses/perses/internal/api/interface/v1/globalrole"
	"github.com/perses/perses/internal/api/interface/v1/globalrolebinding"
	"github.com/perses/perses/internal/api/interface/v1/globalsecret"
	"github.com/perses/perses/internal/api/interface/v1/globalvariable"
	"github.com/perses/perses/internal/api/interface/v1/project"
	"github.com/perses/perses/internal/api/interface/v1/role"
	"github.com/perses/perses/internal/api/interface/v1/rolebinding"
	"github.com/perses/perses/internal/api/interface/v1/secret"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/interface/v1/variable"
	modelAPI "github.com/perses/perses/pkg/model/api"
	modelV1 "github.com/perses/perses/pkg/model/api/v1"
)

func generateProjectResourceInsertQuery(tableName string, id string, rowJSONDoc []byte, metadata *modelV1.ProjectMetadata) (string, []any) {
	return sqlbuilder.NewInsertBuilder().
		InsertInto(tableName).
		Cols(colID, colName, colProject, colDoc).
		Values(id, metadata.Name, metadata.Project, rowJSONDoc).
		Build()
}

func generateResourceInsertQuery(tableName string, id string, rowJSONDoc []byte, metadata *modelV1.Metadata) (string, []any) {
	return sqlbuilder.NewInsertBuilder().
		InsertInto(tableName).
		Cols(colID, colName, colDoc).
		Values(id, metadata.Name, rowJSONDoc).
		Build()
}

func (d *DAO) generateInsertQuery(entity modelAPI.Entity) (string, []interface{}, error) {
	//id, tableName, idErr := d.getIDAndTableName(modelV1.Kind(entity.GetKind()), entity.GetMetadata())
	//if idErr != nil {
	//	return "", nil, idErr
	//}

	tableName := d.generateCompleteTableName(getTableName(modelV1.Kind(entity.GetKind())))

	rowJSONDoc, unmarshalErr := json.Marshal(entity)
	if unmarshalErr != nil {
		return "", nil, unmarshalErr
	}

	//var getErr error
	//_, query, getErr := d.get(modelV1.Kind(entity.GetKind()), entity.GetMetadata())
	//if getErr != nil {
	//	return "", nil, err
	//}
	//
	//defer query.Close() //nolint:errcheck
	//if query.Next() {
	//	var obj modelAPI.Entity
	//	var rowJSONDoc string
	//	if scanErr := query.Scan(&rowJSONDoc); scanErr != nil {
	//		return "", nil, err
	//	}
	//	if err = json.Unmarshal([]byte(rowJSONDoc), obj); err != nil {
	//		return "", nil, err
	//	}
	//}

	projectID := entity.GetMetadata().GetProjectID()
	if entity.GetMetadata().GetProject() != "" && projectID == 0 {
		var err error
		projectMetadata := modelV1.NewMetadata(entity.GetMetadata().GetProject())
		projectMetadata.UserID = entity.GetMetadata().GetUserID()
		projectID, err = d.GetProjectID(projectMetadata)
		if err != nil {
			return "", nil, err
		}
	}
	fmt.Printf("projectID: %d\n", projectID)
	switch entity.GetKind() {
	case string(modelV1.KindUser):
		userType := entity.GetMetadata().GetUserType()
		if userType == "" {
			userType = "user"
		}
		sql, args := sqlbuilder.PostgreSQL.NewInsertBuilder().
			InsertInto(tableName).
			Cols(colName, colType, colDoc).
			Values(entity.GetMetadata().GetName(), userType, rowJSONDoc).
			Build()
		return sql, args, nil

	case string(modelV1.KindProject):
		sql, args := sqlbuilder.PostgreSQL.NewInsertBuilder().
			InsertInto(tableName).
			Cols(colUserID, colName, colDoc).
			Values(entity.GetMetadata().GetUserID(), entity.GetMetadata().GetName(), rowJSONDoc).
			Build()
		return sql, args, nil

	case string(modelV1.KindFolder):
		sql, args := sqlbuilder.PostgreSQL.NewInsertBuilder().
			InsertInto(tableName).
			Cols(colProjectID, colName, colDoc).
			Values(projectID, entity.GetMetadata().GetName(), rowJSONDoc).
			Build()
		return sql, args, nil

	case string(modelV1.KindDashboard):
		sql, args := sqlbuilder.PostgreSQL.NewInsertBuilder().
			InsertInto(tableName).
			Cols(colFolderID, colName, colDoc).
			Values(entity.GetMetadata().GetFolderID(), entity.GetMetadata().GetName(), rowJSONDoc).
			Build()
		return sql, args, nil

	case string(modelV1.KindDatasource):
		sql, args := sqlbuilder.PostgreSQL.NewInsertBuilder().
			InsertInto(tableName).
			Cols(colProjectID, colName, colDoc).
			Values(projectID, entity.GetMetadata().GetName(), rowJSONDoc).
			Build()
		return sql, args, nil

	case string(modelV1.KindSecret):
		sql, args := sqlbuilder.PostgreSQL.NewInsertBuilder().
			InsertInto(tableName).
			Cols(colProjectID, colName, colDoc).
			Values(projectID, entity.GetMetadata().GetName(), rowJSONDoc).
			Build()
		return sql, args, nil

	case string(modelV1.KindVariable):
		sql, args := sqlbuilder.PostgreSQL.NewInsertBuilder().
			InsertInto(tableName).
			Cols(colProjectID, colName, colDoc).
			Values(projectID, entity.GetMetadata().GetName(), rowJSONDoc).
			Build()
		return sql, args, nil

	default:
		return "", nil, fmt.Errorf("unsupported metadata type for kind %s", entity.GetKind())
	}
}

func (d *DAO) generateUpdateQuery(entity modelAPI.Entity) (string, []interface{}, error) {
	//tableName, tableErr := getTableName(modelV1.Kind(entity.GetKind()))
	//if tableErr != nil {
	//	return "", nil, tableErr
	//}

	tableName := d.generateCompleteTableName(getTableName(modelV1.Kind(entity.GetKind())))

	//id, tableName, idErr := d.getIDAndTableName(modelV1.Kind(entity.GetKind()), entity.GetMetadata())
	//if idErr != nil {
	//	return "", nil, idErr
	//}

	id, rows, idErr := d.get(modelV1.Kind(entity.GetKind()), entity.GetMetadata())
	defer rows.Close()
	if idErr != nil {
		return "", nil, idErr
	}
	rowJSONDoc, unmarshalErr := json.Marshal(entity)
	if unmarshalErr != nil {
		return "", nil, unmarshalErr
	}
	builder := sqlbuilder.PostgreSQL.NewUpdateBuilder().Update(tableName)
	builder.Where(builder.Equal(colID, id))
	builder.Set(builder.Assign(colDoc, rowJSONDoc))
	sql, args := builder.Build()
	return sql, args, nil
}

// escapeLikePattern escapes the LIKE metacharacters ('%' and '_') and the
// escape character itself ('\') in s so they are matched literally. This keeps
// the SQL backend's name-prefix filter consistent with the file backend, which
// uses a literal strings.HasPrefix. MySQL uses '\' as the default LIKE escape
// character, so no explicit ESCAPE clause is required.
func escapeLikePattern(s string) string {
	replacer := strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)
	return replacer.Replace(s)
}

func (d *DAO) generateSelectQuery(tableName string, project string, name string) (string, []any) {
	p := project
	n := name
	if !d.CaseSensitive {
		p = strings.ToLower(p)
		n = strings.ToLower(n)
	}
	queryBuilder := sqlbuilder.PostgreSQL.NewSelectBuilder().
		Select(colDoc).
		From(tableName)
	if len(n) > 0 {
		queryBuilder.Where(queryBuilder.Like(colName, fmt.Sprintf("%s%%", escapeLikePattern(n))))
	}
	if len(p) > 0 {
		queryBuilder.Where(queryBuilder.Equal(colProject, p))
	}
	return queryBuilder.Build()
}

func (d *DAO) generateSelectQueryForProject(tableName string, userID int64) (string, []any) {
	queryBuilder := sqlbuilder.PostgreSQL.NewSelectBuilder().
		Select(colDoc).
		From(tableName)

	if userID != 0 {
		queryBuilder.Where(queryBuilder.Equal(colUserID, userID))
	} else {
		return "", nil
	}

	return queryBuilder.Build()
}

func (d *DAO) generateSelectQueryForFolder(tableName string, name string, folderID int64) (string, []any) {
	n := name
	if !d.CaseSensitive {
		n = strings.ToLower(n)
	}
	queryBuilder := sqlbuilder.PostgreSQL.NewSelectBuilder().
		Select(colDoc).
		From(tableName)
	if len(n) > 0 {
		queryBuilder.Where(queryBuilder.Like(colName, fmt.Sprintf("%s%%", n)))
	}
	if folderID != 0 {
		queryBuilder.Where(queryBuilder.Equal(colFolderID, folderID))
	}
	return queryBuilder.Build()
}

func (d *DAO) generateSelectQueryWithUserID(tableName string, project string, name string, userID int64) (string, []any) {
	p := project
	n := name
	u := userID
	if !d.CaseSensitive {
		p = strings.ToLower(p)
		n = strings.ToLower(n)
	}
	queryBuilder := sqlbuilder.PostgreSQL.NewSelectBuilder().
		Select(colDoc).
		From(tableName)
	if len(n) > 0 {
		queryBuilder.Where(queryBuilder.Like(colName, fmt.Sprintf("%s%%", n)))
	}
	if len(p) > 0 {
		metadata := modelV1.NewMetadata(p)
		// ensure this project belongs to this user
		if u != 0 {
			metadata.UserID = u
		}
		fmt.Printf("generateSelectQueryWithUserID metadata: %+v\n", metadata)
		projectID, rows, err := d.get(modelV1.KindProject, metadata)
		defer rows.Close()
		if err != nil {
			fmt.Errorf("failed to get project by name: ProjectName: %s, UserID: %d, err: %+v\n", p, u, err)
			return "", nil
		}

		if projectID == 0 {
			fmt.Errorf("failed to get project by name for user: ProjectName: %s, UserID: %d err: %+v\n", p, u, err)

		}

		queryBuilder.Where(queryBuilder.Equal(colProjectID, projectID))
	}

	sql, _ := queryBuilder.Build()
	fmt.Printf("sql: %s\n", sql)
	return queryBuilder.Build()
}

func (d *DAO) generateSelectQueryWithUserIDForDashboards(project string, name string, userID int64) (string, []any) {
	p := project
	n := name
	u := userID
	if !d.CaseSensitive {
		p = strings.ToLower(p)
		n = strings.ToLower(n)
	}

	projectID := int64(0)
	if len(p) > 0 {
		var err error
		metadata := modelV1.NewMetadata(p)
		// ensure this project belongs to this user
		if u != 0 {
			metadata.UserID = u
		}
		pId, rows, err := d.get(modelV1.KindProject, metadata)
		defer rows.Close()
		if err != nil {
			fmt.Printf("failed to get project by name: ProjectName: %s, UserID: %d, err: %+v\n", p, u, err)
			return "", nil
		}

		if pId == 0 {
			fmt.Printf("failed to get project by name for user: ProjectName: %s, UserID: %d\n", p, u)
			return "", nil
		}
		projectID = pId
	}

	// Step 1: Get all folders for this project
	folderQuery := sqlbuilder.PostgreSQL.NewSelectBuilder().
		Select(colID).
		From(d.generateCompleteTableName(tableFolder))
	folderQuery.Where(folderQuery.Equal(colProjectID, projectID))

	q, args := folderQuery.Build()
	rows, runQueryErr := d.DB.Query(q, args...)
	if runQueryErr != nil {
		fmt.Printf("failed to run folder query: %s, err: %+v\n", q, runQueryErr)
		return "", nil
	}
	defer rows.Close()

	folderIDs := make([]int64, 0)
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			fmt.Printf("failed to scan folder row: %+v\n", err)
			continue
		}
		folderIDs = append(folderIDs, id)
	}

	// Step 2: Build dashboard query
	queryBuilder := sqlbuilder.PostgreSQL.NewSelectBuilder().
		Select(colDoc).
		From(d.generateCompleteTableName(tableDashboard))

	if len(n) > 0 {
		queryBuilder.Where(queryBuilder.Like(colName, fmt.Sprintf("%s%%", n)))
	}

	if len(folderIDs) > 0 {
		queryBuilder.Where(queryBuilder.In(colFolderID, sqlbuilder.List(folderIDs)))
	} else {
		// no folders, nothing to return
		return "", nil
	}

	sql, args := queryBuilder.Build()
	fmt.Printf("sql: %s args: %v\n", sql, args)
	return sql, args
}

func (d *DAO) generateSelectAllOrgsOfAUserQuery(name string) (string, []any) {
	n := name
	if !d.CaseSensitive {
		n = strings.ToLower(n)
	}

	userID, _, err := d.GetIDAndType(modelV1.NewMetadata(n))
	if err != nil {
		return "", nil
	}

	//userIDStr := strconv.FormatInt(userID, 10) // convert int64 -> string

	orgAlias := "org"
	teamAlias := "t"
	tmAlias := "tm"

	queryBuilder := sqlbuilder.PostgreSQL.NewSelectBuilder().
		Select(orgAlias+"."+colDoc).
		From(d.generateCompleteTableName(tableUser)+" "+orgAlias).
		Join(d.generateCompleteTableName(tableTeam)+" "+teamAlias,
			orgAlias+".id = "+teamAlias+".org_id").
		Join(d.generateCompleteTableName(tableTeamMember)+" "+tmAlias,
			teamAlias+".id = "+tmAlias+".team_id")

	queryBuilder.Where(queryBuilder.Equal(tmAlias+".user_id", userID)).
		Where(queryBuilder.Equal(orgAlias+"."+colType, "org"))

	query, args := queryBuilder.Build()
	fmt.Printf("query: %s\n", query)
	return query, args
}

func (d *DAO) buildQuery(query databaseModel.Query) (string, []any, error) {
	var sqlQuery string
	var args []any
	switch qt := query.(type) {
	case *dashboard.Query:
		if qt.FolderID != 0 {
			sqlQuery, args = d.generateSelectQueryForFolder(d.generateCompleteTableName(tableDashboard), qt.NamePrefix, qt.FolderID)
		} else if qt.UserID != 0 {
			sqlQuery, args = d.generateSelectQueryWithUserIDForDashboards(qt.Project, qt.NamePrefix, qt.UserID)
		} else {
			sqlQuery, args = d.generateSelectQuery(d.generateCompleteTableName(tableDashboard), qt.Project, qt.NamePrefix)
		}
	case *datasource.Query:
		if qt.UserID != 0 {
			sqlQuery, args = d.generateSelectQueryWithUserID(d.generateCompleteTableName(tableDatasource), qt.Project, qt.NamePrefix, qt.UserID)
		} else {
			sqlQuery, args = d.generateSelectQuery(d.generateCompleteTableName(tableDatasource), qt.Project, qt.NamePrefix)
		}
	case *ephemeraldashboard.Query:
		sqlQuery, args = d.generateSelectQuery(d.generateCompleteTableName(tableEphemeralDashboard), qt.Project, qt.NamePrefix)
	case *folder.Query:
		if qt.UserID != 0 {
			sqlQuery, args = d.generateSelectQueryWithUserID(d.generateCompleteTableName(tableFolder), qt.Project, qt.NamePrefix, qt.UserID)
		} else {
			sqlQuery, args = d.generateSelectQuery(d.generateCompleteTableName(tableFolder), qt.Project, qt.NamePrefix)
		}
	case *globaldatasource.Query:
		sqlQuery, args = d.generateSelectQuery(d.generateCompleteTableName(tableGlobalDatasource), "", qt.NamePrefix)
	case *globalrole.Query:
		sqlQuery, args = d.generateSelectQuery(d.generateCompleteTableName(tableGlobalRole), "", qt.NamePrefix)
	case *globalrolebinding.Query:
		sqlQuery, args = d.generateSelectQuery(d.generateCompleteTableName(tableGlobalRoleBinding), "", qt.NamePrefix)
	case *globalsecret.Query:
		sqlQuery, args = d.generateSelectQuery(d.generateCompleteTableName(tableGlobalSecret), "", qt.NamePrefix)
	case *globalvariable.Query:
		sqlQuery, args = d.generateSelectQuery(d.generateCompleteTableName(tableGlobalVariable), "", qt.NamePrefix)
	case *project.Query:
		sqlQuery, args = d.generateSelectQueryForProject(d.generateCompleteTableName(tableProject), qt.UserID)
	case *role.Query:
		sqlQuery, args = d.generateSelectQuery(d.generateCompleteTableName(tableRole), qt.Project, qt.NamePrefix)
	case *rolebinding.Query:
		sqlQuery, args = d.generateSelectQuery(d.generateCompleteTableName(tableRoleBinding), qt.Project, qt.NamePrefix)
	case *secret.Query:
		if qt.UserID != 0 {
			sqlQuery, args = d.generateSelectQueryWithUserID(d.generateCompleteTableName(tableSecret), qt.Project, qt.NamePrefix, qt.UserID)
		} else {
			sqlQuery, args = d.generateSelectQuery(d.generateCompleteTableName(tableSecret), qt.Project, qt.NamePrefix)
		}
	case *user.Query:
		if qt.AllOrgs {
			sqlQuery, args = d.generateSelectAllOrgsOfAUserQuery(qt.NamePrefix)
		} else {
			sqlQuery, args = d.generateSelectQuery(d.generateCompleteTableName(tableUser), "", qt.NamePrefix)
		}
	case *variable.Query:
		if qt.UserID != 0 && qt.Project != "" {
			sqlQuery, args = d.generateSelectQueryWithUserID(d.generateCompleteTableName(tableVariable), qt.Project, qt.NamePrefix, qt.UserID)
		} else {
			sqlQuery, args = d.generateSelectQuery(d.generateCompleteTableName(tableVariable), qt.Project, qt.NamePrefix)
		}
	default:
		return "", nil, fmt.Errorf("this type of query '%T' is not managed", qt)
	}
	return sqlQuery, args, nil
}

func (d *DAO) generateDeleteQuery(tableName string, project string, name string) (string, []any) {
	p := project
	n := name
	if !d.CaseSensitive {
		p = strings.ToLower(p)
		n = strings.ToLower(n)
	}

	queryBuilder := sqlbuilder.PostgreSQL.NewDeleteBuilder().
		DeleteFrom(tableName)
	if len(n) > 0 {
		queryBuilder.Where(queryBuilder.Like(colName, fmt.Sprintf("%s%%", escapeLikePattern(n))))
	}
	if len(p) > 0 {
		queryBuilder.Where(queryBuilder.Equal(colProject, p))
	}
	return queryBuilder.Build()
}

func (d *DAO) buildDeleteQuery(query databaseModel.Query) (string, []any, error) {
	var sqlQuery string
	var args []any
	switch qt := query.(type) {
	case *dashboard.Query:
		sqlQuery, args = d.generateDeleteQuery(d.generateCompleteTableName(tableDashboard), qt.Project, qt.NamePrefix)
	case *datasource.Query:
		sqlQuery, args = d.generateDeleteQuery(d.generateCompleteTableName(tableDatasource), qt.Project, qt.NamePrefix)
	case *ephemeraldashboard.Query:
		sqlQuery, args = d.generateDeleteQuery(d.generateCompleteTableName(tableEphemeralDashboard), qt.Project, qt.NamePrefix)
	case *folder.Query:
		sqlQuery, args = d.generateDeleteQuery(d.generateCompleteTableName(tableFolder), qt.Project, qt.NamePrefix)
	case *globaldatasource.Query:
		sqlQuery, args = d.generateDeleteQuery(d.generateCompleteTableName(tableGlobalDatasource), "", qt.NamePrefix)
	case *globalrole.Query:
		sqlQuery, args = d.generateDeleteQuery(d.generateCompleteTableName(tableGlobalRole), "", qt.NamePrefix)
	case *globalrolebinding.Query:
		sqlQuery, args = d.generateDeleteQuery(d.generateCompleteTableName(tableGlobalRoleBinding), "", qt.NamePrefix)
	case *globalsecret.Query:
		sqlQuery, args = d.generateDeleteQuery(d.generateCompleteTableName(tableGlobalSecret), "", qt.NamePrefix)
	case *globalvariable.Query:
		sqlQuery, args = d.generateDeleteQuery(d.generateCompleteTableName(tableGlobalVariable), "", qt.NamePrefix)
	case *project.Query:
		sqlQuery, args = d.generateDeleteQuery(d.generateCompleteTableName(tableProject), "", qt.NamePrefix)
	case *role.Query:
		sqlQuery, args = d.generateDeleteQuery(d.generateCompleteTableName(tableRole), qt.Project, qt.NamePrefix)
	case *rolebinding.Query:
		sqlQuery, args = d.generateDeleteQuery(d.generateCompleteTableName(tableRoleBinding), qt.Project, qt.NamePrefix)
	case *secret.Query:
		sqlQuery, args = d.generateDeleteQuery(d.generateCompleteTableName(tableSecret), qt.Project, qt.NamePrefix)
	case *user.Query:
		sqlQuery, args = d.generateDeleteQuery(d.generateCompleteTableName(tableUser), "", qt.NamePrefix)
	case *variable.Query:
		sqlQuery, args = d.generateDeleteQuery(d.generateCompleteTableName(tableVariable), qt.Project, qt.NamePrefix)
	default:
		return "", nil, fmt.Errorf("this type of query '%T' is not managed", qt)
	}
	return sqlQuery, args, nil
}
