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

package native

import (
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/perses/perses/internal/api/crypto"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/accesstoken"
	"github.com/perses/perses/internal/api/interface/v1/globalrole"
	"github.com/perses/perses/internal/api/interface/v1/globalrolebinding"
	"github.com/perses/perses/internal/api/interface/v1/role"
	"github.com/perses/perses/internal/api/interface/v1/rolebinding"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/utils"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	v1Role "github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/sirupsen/logrus"
)

// AceUser represents logged in b3 user in the system
type AceUser struct {
	// the user's id
	ID int64 `json:"id"`
	// the user's username
	UserName string `json:"login"`
	// the user's full name
	FullName string `json:"full_name"`
	// swagger:strfmt email
	Email string `json:"email"`
	// URL to the user's avatar
	AvatarURL string `json:"avatar_url"`
	// User locale
	Language string `json:"language"`
	// Is the user an administrator
	IsAdmin bool `json:"is_admin"`
	// swagger:strfmt date-time
	LastLogin time.Time `json:"last_login,omitempty"`
	// swagger:strfmt date-time
	Created time.Time `json:"created,omitempty"`
	// Is user restricted
	Restricted bool `json:"restricted"`
	// Is user active
	IsActive bool `json:"active"`
	// Is user login prohibited
	ProhibitLogin bool `json:"prohibit_login"`
	// the user's location
	Location string `json:"location"`
	// the user's website
	Website string `json:"website"`
	// the user's description
	Description string `json:"description"`
}

const prodDomain = "appscode.com"

func New(userDAO user.DAO, accessTokenDAO accesstoken.DAO, roleDAO role.DAO, roleBindingDAO rolebinding.DAO,
	globalRoleDAO globalrole.DAO, globalRoleBindingDAO globalrolebinding.DAO, conf config.Config) (*native, error) {
	key, err := hex.DecodeString(string(conf.Security.EncryptionKey))
	if err != nil {
		return nil, err
	}
	return &native{
		cache:                &cache{},
		userDAO:              userDAO,
		accessTokenDAO:       accessTokenDAO,
		roleDAO:              roleDAO,
		roleBindingDAO:       roleBindingDAO,
		globalRoleDAO:        globalRoleDAO,
		globalRoleBindingDAO: globalRoleBindingDAO,
		guestPermissions:     conf.Security.Authorization.Provider.Native.GuestPermissions,
		accessKey:            key,
	}, err
}

// native is expecting a JWT token to extract the user information and validate its permissions.
type native struct {
	// The key used to sign the JWT token, it is expected to be the same as the one used in the crypto package.
	accessKey []byte
	// cache is used to store in memory the permissions of all users.
	cache                *cache
	userDAO              user.DAO
	accessTokenDAO       accesstoken.DAO
	roleDAO              role.DAO
	roleBindingDAO       rolebinding.DAO
	globalRoleDAO        globalrole.DAO
	globalRoleBindingDAO globalrolebinding.DAO
	guestPermissions     []*v1Role.Permission
	// mutex is used to protect the cache from concurrent access.
	mutex sync.RWMutex
}

func (n *native) IsEnabled() bool {
	return true
}

func (n *native) IsNativeAuthz() bool {
	return true
}

func (n *native) GetUser(ctx echo.Context) (any, error) {
	// Context can be nil when the function is called outside the request context.
	// For example, the provisioning service is calling every service without any context.
	if ctx == nil {
		return nil, nil // No context provided, cannot retrieve user
	}
	// Verify if it is an anonymous endpoint
	if utils.IsAnonymous(ctx) {
		return nil, nil
	}
	// At this point, we are sure that the context is not nil and the user is not anonymous.
	// The user is expected to be set in the context by the middleware.
	//token, ok := ctx.Get("user").(*jwt.Token) // by default token is stored under `user` key
	//if !ok {
	//	return nil, apiInterface.UnauthorizedError
	//}

	usr, ok := ctx.Get("perses-user").(*v1.User)
	if !ok {
		return nil, apiInterface.UnauthorizedError
	}
	if usr == nil {
		return nil, errors.New("user not found in context")
	}
	return usr, nil
}

func (n *native) GetUsername(ctx echo.Context) (string, error) {
	usr, err := n.GetUser(ctx)
	if err != nil {
		return "", err
	}
	if usr == nil {
		return "", nil // No user found in the context, this is an anonymous endpoint
	}
	return usr.(*v1.User).Metadata.Name, nil
}

func (n *native) GetProviderInfo(_ echo.Context) (crypto.ProviderInfo, error) {
	// The native provider here resolves an actual *v1.User from an ACE cookie or access token
	// rather than decoding provider metadata from a JWT, so there is no provider info to report.
	return crypto.ProviderInfo{}, nil
}

func (n *native) GetPublicUser(ctx echo.Context) (*v1.PublicUser, error) {
	username, err := n.GetUsername(ctx)
	if err != nil {
		return nil, err
	}

	user, err := n.userDAO.Get(username)
	if err != nil {
		return nil, err
	}

	return v1.NewPublicUser(user), nil
}

// Middleware2 attaches AceUser into echo.Context and rejects if not authenticated
func (n *native) Middleware(skipper middleware.Skipper) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if skipper != nil && skipper(c) {
				return next(c)
			}

			var persesUser *v1.User
			user, err := loginWithAceCookie(c.Request())
			fmt.Println("user++++++++++++++++: %+v", user)
			if err != nil || user == nil {
				persesUser, err = loginWithAccessToken(c, n.accessTokenDAO, n.userDAO)
				if err != nil {
					return c.JSON(http.StatusUnauthorized, map[string]string{
						"error": "unauthorized",
					})
				}
				c.Set("perses-user", persesUser)

			} else {
				persesUser, err = n.userDAO.Get(user.UserName)
				fmt.Println("fsbhfds+++++ %+v", persesUser)
				if err != nil {
					return c.JSON(http.StatusUnauthorized, map[string]string{
						"error": "unauthorized",
					})
				}
				c.Set("perses-user", persesUser)
			}

			if strings.HasPrefix(persesUser.Metadata.Name, v1.OrgSystemUserPrefix) {
				orgName := strings.TrimPrefix(persesUser.Metadata.Name, v1.OrgSystemUserPrefix)
				persesOrg, err := n.userDAO.Get(orgName)
				if err != nil {
					return c.JSON(http.StatusBadRequest, map[string]string{
						"error": err.Error(),
					})
				}
				c.Set("perses-org", persesOrg)
			}

			if c.Param("owner") != "" {
				owner, err := n.userDAO.Get(c.Param("owner"))
				if err != nil {
					return c.JSON(http.StatusBadRequest, map[string]string{
						"error": err.Error(),
					})
				}

				if persesUser.Metadata.Name != owner.Metadata.Name {
					// checking owners params
					found := false
					orgs, err := n.userDAO.GetAllOrganizationsOfAnUser(persesUser.Metadata.Name)
					if err != nil {
						return c.JSON(http.StatusBadRequest, map[string]string{
							"error": err.Error(),
						})
					}
					for _, org := range orgs {
						if org.Metadata.Name == owner.Metadata.Name {
							found = true
							break
						}
					}
					if !found {
						return c.JSON(http.StatusUnauthorized, map[string]string{
							"error": "unauthorized",
						})
					}
				}
				c.Set("owner", owner)
			}

			return next(c)
		}
	}
}

//func (n *native) Middleware(skipper middleware.Skipper) echo.MiddlewareFunc {
//	jwtMiddlewareConfig := echojwt.Config{
//		Skipper: skipper,
//		BeforeFunc: func(c echo.Context) {
//			// Merge the JWT cookies if they exist to create the token,
//			// and then set the header Authorization with the complete token.
//			payloadCookie, err := c.Cookie(crypto.CookieKeyJWTPayload)
//			if errors.Is(err, http.ErrNoCookie) {
//				logrus.Tracef("cookie %q not found", crypto.CookieKeyJWTPayload)
//				return
//			}
//			signatureCookie, err := c.Cookie(crypto.CookieKeyJWTSignature)
//			if errors.Is(err, http.ErrNoCookie) {
//				logrus.Tracef("cookie %q not found", crypto.CookieKeyJWTSignature)
//				return
//			}
//			c.Request().Header.Set("Authorization", fmt.Sprintf("Bearer %s.%s", payloadCookie.Value, signatureCookie.Value))
//		},
//		NewClaimsFunc: func(_ echo.Context) jwt.Claims {
//			return &jwt.RegisteredClaims{}
//		},
//		SigningMethod: jwt.SigningMethodHS512.Name,
//		SigningKey:    n.accessKey,
//	}
//	return echojwt.WithConfig(jwtMiddlewareConfig)
//}

func loginWithAceCookie(req *http.Request) (*AceUser, error) {
	apiUrl, ok := os.LookupEnv("PLATFORM_APISERVER_DOMAIN")
	if !ok {
		apiUrl = BaseURL(req.Host, false)
	}
	apiUrl = strings.TrimSuffix(apiUrl, "/")

	// Build request to Ace API
	upReq, err := http.NewRequest("GET", fmt.Sprintf("%v/api/v1/user", apiUrl), nil)
	if err != nil {
		return nil, err
	}

	// Copy cookies
	for _, cookie := range req.Cookies() {
		upReq.AddCookie(cookie)
	}

	// Copy headers + CSRF
	upReq.Header = req.Header.Clone()
	if csrf, err := req.Cookie("_csrf"); err == nil {
		upReq.Header.Set("X-Csrf-Token", csrf.Value)
	}

	client := &http.Client{}
	resp, err := client.Do(upReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Ace API returned status %d", resp.StatusCode)
	}

	var user AceUser
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, err
	}

	return &user, nil
}

func BaseURL(host string, production bool) string {
	baseDomain := getHost(host)
	if production {
		return fmt.Sprintf("https://%s", baseDomain)
	}
	return fmt.Sprintf("http://%v:3003", baseDomain)
}

func getHost(host string) string {
	addr, _ := SplitHostPortDefault(host, prodDomain, "")
	return addr.Host
}

func (n *native) GetUserProjects(ctx echo.Context, requestAction v1Role.Action, requestScope v1Role.Scope) ([]string, error) {
	if listHasPermission(n.guestPermissions, requestAction, requestScope) {
		return []string{v1.WildcardProject}, nil
	}

	username, err := n.GetUsername(ctx)
	if err != nil {
		return nil, err
	}
	if username == "" {
		// This method should not be called if the endpoint is anonymous or the username is not found.
		logrus.Error("failed to get username from context to list the user projects")
		return nil, apiInterface.InternalError
	}
	n.mutex.RLock()
	defer n.mutex.RUnlock()
	projectPermission := n.cache.permissions[username]
	if globalPermissions, ok := projectPermission[v1.WildcardProject]; ok && listHasPermission(globalPermissions, requestAction, requestScope) {
		return []string{v1.WildcardProject}, nil
	}

	var projects []string
	for project, permList := range projectPermission {
		if project != v1.WildcardProject && listHasPermission(permList, requestAction, requestScope) {
			projects = append(projects, project)
		}
	}
	return projects, nil
}

func (n *native) HasPermission(ctx echo.Context, requestAction v1Role.Action, requestProject string, requestScope v1Role.Scope) bool {
	// If the context is nil, it means the function is called internally without a request context.
	// And in this case, we assume we want to bypass the authorization check.
	if ctx == nil {
		return true
	}
	if utils.IsAnonymous(ctx) {
		// If the endpoint is anonymous, we allow the request to pass through.
		return true
	}
	username, err := n.GetUsername(ctx)
	if err != nil {
		logrus.WithError(err).Error("failed to get username from context to check the user permissions")
		return false // If we cannot get the username, we cannot check the permissions
	}
	if username == "" {
		// At this point, as the endpoint is not anonymous, we should have a username in the context.
		// If we don't, it means something went wrong, and we cannot check the permissions.
		logrus.Error("no username found in the context, this should not happen in a native RBAC implementation")
		return false // No username found, cannot check permissions
	}
	// Checking default permissions
	if ok := listHasPermission(n.guestPermissions, requestAction, requestScope); ok {
		return true
	}
	// Checking cached permissions
	n.mutex.RLock()
	defer n.mutex.RUnlock()
	return n.cache.hasPermission(username, requestAction, requestProject, requestScope)
}

// For native auth, creating a project requires a global permission.
func (n *native) HasCreateProjectPermission(ctx echo.Context, projectName string) bool {
	return n.HasPermission(ctx, v1Role.CreateAction, v1.WildcardProject, v1Role.ProjectScope)
}

func (n *native) GetPermissions(ctx echo.Context) (map[string][]*v1Role.Permission, error) {
	n.mutex.RLock()
	defer n.mutex.RUnlock()
	username, err := n.GetUsername(ctx)
	if err != nil {
		return nil, err
	}
	if username == "" {
		// This use case should not happen.
		logrus.Error("No username found in the context, this should not happen in a native RBAC implementation")
		return nil, apiInterface.InternalError
	}
	userPermissions := make(map[string][]*v1Role.Permission)
	userPermissions[v1.WildcardProject] = n.guestPermissions
	for project, projectPermissions := range n.cache.permissions[username] {
		userPermissions[project] = append(userPermissions[project], projectPermissions...)
	}
	return userPermissions, nil
}

func (n *native) RefreshPermissions() error {
	permissions, err := n.loadAllPermissions()
	if err != nil {
		return err
	}
	n.mutex.Lock()
	n.cache.permissions = permissions
	n.mutex.Unlock()
	return nil
}

// loadAllPermissions is loading all permissions for all users.
func (n *native) loadAllPermissions() (usersPermissions, error) {
	users, err := n.userDAO.List(&user.Query{})
	if err != nil {
		return nil, err
	}
	roles, err := n.roleDAO.List(&role.Query{})
	if err != nil {
		return nil, err
	}
	globalRoles, err := n.globalRoleDAO.List(&globalrole.Query{})
	if err != nil {
		return nil, err
	}
	roleBindings, err := n.roleBindingDAO.List(&rolebinding.Query{})
	if err != nil {
		return nil, err
	}
	globalRoleBindings, err := n.globalRoleBindingDAO.List(&globalrolebinding.Query{})
	if err != nil {
		return nil, err
	}

	// Build cache
	permissionBuild := make(usersPermissions)
	for _, usr := range users {
		for _, globalRoleBinding := range globalRoleBindings {
			if globalRoleBinding.Spec.Has(v1.KindUser, usr.Metadata.Name) {
				globalRole := findGlobalRole(globalRoles, globalRoleBinding.Spec.Role)
				if globalRole == nil {
					logrus.Warningf("global role %q listed in the global role binding %q does not exist", globalRoleBinding.Spec.Role, globalRoleBinding.Metadata.Name)
					continue
				}
				globalRolePermissions := globalRole.Spec.Permissions
				for i := range globalRolePermissions {
					permissionBuild.addEntry(usr.Metadata.Name, v1.WildcardProject, &globalRolePermissions[i])
				}
			}
		}
	}

	for _, usr := range users {
		for _, roleBinding := range roleBindings {
			if roleBinding.Spec.Has(v1.KindUser, usr.Metadata.Name) {
				projectRole := findRole(roles, roleBinding.Metadata.Project, roleBinding.Spec.Role)
				if projectRole == nil {
					logrus.Warningf("role %q listed in the role binding %s/%s does not exist", roleBinding.Spec.Role, roleBinding.Metadata.Project, roleBinding.Metadata.Name)
					continue
				}
				rolePermissions := projectRole.Spec.Permissions
				for i := range rolePermissions {
					permissionBuild.addEntry(usr.Metadata.Name, roleBinding.Metadata.Project, &rolePermissions[i])
				}
			}
		}
	}
	return permissionBuild, nil
}

func loginWithAccessToken(ctx echo.Context, accessTokenDAO accesstoken.DAO, userDAO user.DAO) (*v1.User, error) {
	err := ctx.Request().ParseForm()
	if err != nil {
		return nil, err
	}
	tokenSHA := ctx.Request().Form.Get("token")
	if len(tokenSHA) == 0 {
		tokenSHA = ctx.Request().Form.Get("access_token")
	}
	if len(tokenSHA) == 0 {
		// Well, check with header again.
		auHead := ctx.Request().Header.Get("Authorization")
		if len(auHead) > 0 {
			auths := strings.Fields(auHead)
			if len(auths) == 2 && (auths[0] == "token" || strings.ToLower(auths[0]) == "bearer") {
				tokenSHA = auths[1]
			}
		}
	}

	if len(tokenSHA) > 0 {
		if strings.Contains(tokenSHA, ".") {
			return nil, apiInterface.UnauthorizedError
		}

		t, err := accessTokenDAO.Get(tokenSHA)
		if err != nil {
			return nil, err
		}

		fmt.Printf("loginWithAccessToken: %+v\n", t)

		user, err := userDAO.GetByID(t.UID)
		if err != nil {
			return nil, err
		}

		fmt.Printf("user: %+v\n", user)

		return user, nil
	}
	return nil, apiInterface.UnauthorizedError
}
