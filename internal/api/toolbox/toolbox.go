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

package toolbox

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/authorization"
	databaseModel "github.com/perses/perses/internal/api/database/model"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/utils"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/sirupsen/logrus"
)

func ExtractParameters(ctx echo.Context, caseSensitive bool) apiInterface.Parameters {
	project := utils.GetProjectParameter(ctx)
	name := utils.GetNameParameter(ctx)
	owner := utils.GetOwnerParameter(ctx)
	folder := utils.GetFolderParameter(ctx)
	if !caseSensitive {
		project = strings.ToLower(project)
		name = strings.ToLower(name)
	}
	return apiInterface.Parameters{
		Project: project,
		Name:    name,
		Owner:   owner,
		Folder:  folder,
	}
}

func isJSONContentType(ctx echo.Context) bool {
	contentType := ctx.Request().Header.Get(echo.HeaderContentType)
	if len(contentType) == 0 {
		return false
	}
	return strings.Contains(contentType, echo.MIMEApplicationJSON)
}

// Toolbox is an interface that defines the different methods that can be used in the different endpoint of the API.
// This is a way to align the code of the different endpoints.
type Toolbox[T api.Entity, K databaseModel.Query] interface {
	Create(ctx echo.Context, entity T) error
	Update(ctx echo.Context, entity T) error
	Delete(ctx echo.Context) error
	Get(ctx echo.Context) error
	List(ctx echo.Context, q K) error
}

func New[T api.Entity, K api.Entity, V databaseModel.Query](service apiInterface.Service[T, K, V], authz authorization.Authorization, kind v1.Kind, caseSensitive bool, dao ...databaseModel.DAO) Toolbox[T, V] {
	t := &toolbox[T, K, V]{
		service:       service,
		authz:         authz,
		kind:          kind,
		caseSensitive: caseSensitive,
	}
	if len(dao) > 0 {
		t.dao = dao[0]
	}
	return t
}

type toolbox[T api.Entity, K api.Entity, V databaseModel.Query] struct {
	Toolbox[T, V]
	service       apiInterface.Service[T, K, V]
	authz         authorization.Authorization
	kind          v1.Kind
	caseSensitive bool
	dao           databaseModel.DAO
}

// checkPermissionList will verify only the permission for the List method. As you can see, scope is hardcoded.
// Use the generic checkPermission for any other purpose
func (t *toolbox[T, K, V]) checkPermissionList(ctx echo.Context, parameters apiInterface.Parameters, scope *role.Scope) error {
	if !t.authz.IsEnabled() {
		return nil
	}
	projectName := parameters.Project
	if role.IsGlobalScope(*scope) {
		if ok := t.authz.HasPermission(ctx, role.ReadAction, v1.WildcardProject, *scope); !ok {
			return apiInterface.HandleForbiddenError(fmt.Sprintf("missing '%s' global permission for '%s' kind", role.ReadAction, *scope))
		}
		return nil
	}
	if *scope == role.ProjectScope {
		projectName = parameters.Name
	}
	if len(projectName) == 0 {
		// In this particular context, the user would like to get every resource to every project he has access to.
		return nil
	}
	if ok := t.authz.HasPermission(ctx, role.ReadAction, projectName, *scope); !ok {
		return apiInterface.HandleForbiddenError(fmt.Sprintf("missing '%s' permission in '%s' project for '%s' kind", role.ReadAction, projectName, *scope))
	}
	return nil
}

func (t *toolbox[T, K, V]) checkPermission(ctx echo.Context, entity api.Entity, parameters apiInterface.Parameters, action role.Action) error {
	if !t.authz.IsEnabled() {
		return nil
	}
	scope, err := role.GetScope(string(t.kind))
	if err != nil {
		return err
	}
	if role.IsGlobalScope(*scope) {
		if ok := t.authz.HasPermission(ctx, action, v1.WildcardProject, *scope); !ok {
			return apiInterface.HandleForbiddenError(fmt.Sprintf("missing '%s' global permission for '%s' kind", action, *scope))
		}
		return nil
	}

	// For ProjectScope, the project name is the resource name itself.
	// For other scoped resources, it comes from the project URL parameter or the entity metadata.
	projectName := parameters.Project
	if *scope == role.ProjectScope {
		projectName = parameters.Name
		if len(projectName) == 0 && entity != nil {
			projectName = entity.GetMetadata().GetName()
		}
	} else if len(projectName) == 0 && entity != nil {
		projectName = utils.GetMetadataProject(entity.GetMetadata())
	}

	// Project creation permission is handled separately as the check differs between authorization providers.
	if *scope == role.ProjectScope && action == role.CreateAction {
		if ok := t.authz.HasCreateProjectPermission(ctx, projectName); !ok {
			return apiInterface.HandleForbiddenError(fmt.Sprintf("missing '%s' permission for '%s' kind", action, *scope))
		}
		return nil
	}

	if ok := t.authz.HasPermission(ctx, action, projectName, *scope); !ok {
		return apiInterface.HandleForbiddenError(fmt.Sprintf("missing '%s' permission in '%s' project for '%s' kind", action, projectName, *scope))
	}
	return nil
}

func (t *toolbox[T, K, V]) Create(ctx echo.Context, entity T) error {
	if err := t.bind(ctx, entity); err != nil {
		return err
	}

	parameters := ExtractParameters(ctx, t.caseSensitive)
	//if err := t.checkPermission(ctx, entity, parameters, role.CreateAction); err != nil {
	//	return err
	//}
	//

	if err := t.setValuesToEntity(ctx, &parameters, entity); err != nil {
		return err
	}

	newEntity, err := t.service.Create(ctx, entity)
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, newEntity)
}

func (t *toolbox[T, K, V]) Update(ctx echo.Context, entity T) error {
	if err := t.bind(ctx, entity); err != nil {
		return err
	}
	parameters := ExtractParameters(ctx, t.caseSensitive)
	//if err := t.checkPermission(ctx, entity, parameters, role.UpdateAction); err != nil {
	//	return err
	//}

	if err := t.setValuesToEntity(ctx, &parameters, entity); err != nil {
		return err
	}
	if err := t.setValuesToParameters(ctx, &parameters); err != nil {
		return err
	}

	newEntity, err := t.service.Update(ctx, entity, parameters)
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, newEntity)
}

func (t *toolbox[T, K, V]) Delete(ctx echo.Context) error {
	parameters := ExtractParameters(ctx, t.caseSensitive)
	//if err := t.checkPermission(ctx, nil, parameters, role.DeleteAction); err != nil {
	//	return err
	//}

	if err := t.setValuesToParameters(ctx, &parameters); err != nil {
		return err
	}
	if err := t.service.Delete(ctx, parameters); err != nil {
		return err
	}
	return ctx.NoContent(http.StatusNoContent)
}

func (t *toolbox[T, K, V]) Get(ctx echo.Context) error {
	parameters := ExtractParameters(ctx, t.caseSensitive)
	//if err := t.checkPermission(ctx, nil, parameters, role.ReadAction); err != nil {
	//	return err
	//}

	if err := t.setValuesToParameters(ctx, &parameters); err != nil {
		return err
	}

	entity, err := t.service.Get(parameters)
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, entity)
}

func (t *toolbox[T, K, V]) List(ctx echo.Context, query V) error {
	if err := ctx.Bind(query); err != nil {
		return apiInterface.HandleBadRequestError(err.Error())
	}
	parameters := ExtractParameters(ctx, t.caseSensitive)

	if err := t.setValuesToParameters(ctx, &parameters); err != nil {
		return err
	}

	list, listErr := t.list(ctx, parameters, query)
	if listErr != nil {
		return listErr
	}

	return ctx.JSON(http.StatusOK, list)
}

func (t *toolbox[T, K, V]) bind(ctx echo.Context, entity api.Entity) error {
	if !isJSONContentType(ctx) {
		return apiInterface.UnsupportedMediaType
	}
	if err := ctx.Bind(entity); err != nil {
		return apiInterface.HandleBadRequestError(err.Error())
	}
	entity.GetMetadata().Flatten(t.caseSensitive)
	if err := t.validateMetadata(ctx, entity.GetMetadata()); err != nil {
		return apiInterface.HandleBadRequestError(err.Error())
	}
	return nil
}

func (t *toolbox[T, K, V]) validateMetadata(ctx echo.Context, metadata api.Metadata) error {
	switch met := metadata.(type) {
	case *v1.Metadata:
		return t.validateMetadataVersusParameter(ctx, utils.ParamName, &met.Name)
	case *v1.ProjectMetadata:
		if err := t.validateMetadataVersusParameter(ctx, utils.ParamProject, &met.Project); err != nil {
			return err
		}
		return t.validateMetadataVersusParameter(ctx, utils.ParamName, &met.Name)
	}
	return nil
}

// validateMetadataVersusParameter is the generic method used to validate provided metadata against the parameters in the context
//   - If the parameter in the context is empty, no checks are performed => OK
//   - Else
//   - If metadata value is empty, it is overridden with the context value => OK
//   - Else
//   - If the values are not matching return an error => KO
//   - Else => OK
func (t *toolbox[T, K, V]) validateMetadataVersusParameter(ctx echo.Context, paramName string, metadataValue *string) error {
	paramValue := ctx.Param(paramName)
	if !t.caseSensitive {
		paramValue = strings.ToLower(paramValue)
	}
	if len(paramValue) > 0 {
		if len(*metadataValue) <= 0 {
			logrus.Debugf("overridden empty metadata value with %s parameter value '%s'", paramName, paramValue)
			*metadataValue = paramValue
		} else {
			if *metadataValue != paramValue {
				return fmt.Errorf("%s parameter value '%s' does not match provided metadata value '%s'", paramName, paramValue, *metadataValue)
			}
		}
	}
	return nil
}

func (t *toolbox[T, K, V]) getUserIDAndType(ctx echo.Context) (int64, string, error) {
	owner, ok := ctx.Get("owner").(*v1.User)
	if ok {
		userID, userType, err := t.dao.GetIDAndType(v1.NewMetadata(owner.Metadata.Name))
		if err != nil {
			return 0, "", err
		}

		return userID, userType, nil
	}

	persesOrg, ok := ctx.Get("perses-org").(*v1.User)
	if ok {
		userID, userType, err := t.dao.GetIDAndType(v1.NewMetadata(persesOrg.Metadata.Name))
		if err != nil {
			return 0, "", err
		}

		return userID, userType, nil
	}

	persesUser, ok := ctx.Get("perses-user").(*v1.User)
	if ok {
		userID, userType, err := t.dao.GetIDAndType(v1.NewMetadata(persesUser.Metadata.Name))
		if err != nil {
			return 0, "", err
		}

		return userID, userType, nil
	}

	// Extract user ID from JWT token
	token, ok := ctx.Get("user").(*jwt.Token)
	if !ok {
		return 0, "", apiInterface.UnauthorizedError
	}

	claims, ok := token.Claims.(*jwt.RegisteredClaims)
	if !ok {
		return 0, "", apiInterface.UnauthorizedError
	}

	// Get username from the "sub" claim
	login := claims.Subject
	if login == "" {
		return 0, "", apiInterface.UnauthorizedError
	}

	if t.dao == nil {
		return 0, "", apiInterface.BadRequestError
	}
	userID, userType, err := t.dao.GetIDAndType(v1.NewMetadata(login))
	if err != nil {
		return 0, "", err
	}

	if userID == 0 {
		return 0, "", apiInterface.UnauthorizedError
	}

	return userID, userType, nil
}

func (t *toolbox[T, K, V]) getOwnerID(ctx echo.Context) (int64, error) {
	_, _, err := t.getUserIDAndType(ctx)
	if err != nil {
		return 0, err
	}

	return 0, nil
}

func (t *toolbox[T, K, V]) setValuesToEntity(ctx echo.Context, parameters *apiInterface.Parameters, entity T) error {
	if entity.GetKind() != string(v1.KindUser) {
		userID, _, err := t.getUserIDAndType(ctx)
		if err != nil {
			return err
		}
		if meta := entity.GetMetadata(); meta != nil {
			entity.SetUserID(userID)
			parameters.UserID = userID
		}
	}

	if parameters.Project != "" {
		projectMetadata := v1.NewMetadata(parameters.Project)
		userID, _, err := t.getUserIDAndType(ctx)
		if err != nil {
			return err
		}

		projectMetadata.UserID = userID
		projectID, err := t.dao.GetProjectID(projectMetadata)
		if err != nil {
			return err
		}
		entity.SetProjectID(projectID)
		parameters.ProjectID = projectID

		if parameters.Folder != "" {
			folderMetadata := v1.NewMetadata(parameters.Folder)
			folderMetadata.ProjectID = projectID
			folderID, err := t.dao.GetFolderID(folderMetadata)
			if err != nil {
				return err
			}
			entity.SetFolderID(folderID)
		}
	}
	return nil
}

func (t *toolbox[T, K, V]) setValuesToParameters(ctx echo.Context, parameters *apiInterface.Parameters) error {
	userID, _, err := t.getUserIDAndType(ctx)
	if err != nil {
		return err
	}
	parameters.UserID = userID

	if parameters.Project != "" {
		projectMetadata := v1.NewMetadata(parameters.Project)
		projectMetadata.UserID = userID

		projectID, err := t.dao.GetProjectID(projectMetadata)
		if err != nil {
			return err
		}
		parameters.ProjectID = projectID

		if parameters.Folder != "" {
			folderMetadata := v1.NewMetadata(parameters.Folder)
			folderMetadata.ProjectID = projectID
			folderID, err := t.dao.GetFolderID(folderMetadata)
			if err != nil {
				return err
			}
			parameters.FolderID = folderID
		}
	}
	return nil
}
